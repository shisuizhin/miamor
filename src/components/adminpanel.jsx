import React, { useState, useEffect, useRef, useCallback } from 'react';
import './adminpanel.css';
import { supabase } from '../supabaseClient';

const PASSCODE = '0831'; 

const SECTIONS = ['Memories', 'How It Begun', 'Things We Love', 'Love Notes', 'Bucket List'];

const BUCKET = 'memory-photos'; 

// Map section names to Supabase table names
const TABLE_MAP = {
  'Memories':       'memories',
  'How It Begun':   'howitbegun',
  'Things We Love': 'thingswelove',
  'Love Notes':     'lovenotes',
  'Bucket List':    'bucketlist',
};

function sectionIcon(s) {
  switch (s) {
    case 'Memories':       return '📸';
    case 'How It Begun':   return '🌹';
    case 'Things We Love': return '💕';
    case 'Love Notes':     return '✉️';
    case 'Bucket List':    return '✨';
    default:               return '♥';
  }
}

export default function AdminPanel({ onClose }) {
  const [phase, setPhase] = useState('lock');
  const [input, setInput] = useState('');
  const [activeSection, setActiveSection] = useState('Memories');
  const [shake, setShake] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', date: '', extra: '', completed: false });
  const [showForm, setShowForm] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef();

  // ── Fetch entries when section changes ──
  useEffect(() => {
    if (phase !== 'dashboard') return;
    fetchEntries();
  }, [activeSection, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchEntries = useCallback(async () => {
    setLoadingEntries(true);
    const table = TABLE_MAP[activeSection];
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;

      // For Memories, also fetch photos
      if (activeSection === 'Memories') {
        const withPhotos = await Promise.all(data.map(async (mem) => {
          const { data: photos } = await supabase
            .from('memory-photos')
            .select('*')
            .eq('memory_id', mem.id);

          const photosWithUrls = (photos || []).map(p => ({
            id: p.id,
            name: p.file_path,
            src: supabase.storage.from(BUCKET).getPublicUrl(p.file_path).data.publicUrl,
          }));

          return { ...mem, photos: photosWithUrls };
        }));
        setEntries(withPhotos);
      } else {
        setEntries(data);
      }
    } catch (err) {
      console.error('Error fetching entries:', err);
    } finally {
      setLoadingEntries(false);
    }
  }, [activeSection, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Passcode ──
  const handlePasscode = (digit) => {
    const next = input + digit;
    setInput(next);
    if (next.length === PASSCODE.length) {
      if (next === PASSCODE) {
        setPhase('dashboard');
        setInput('');
      } else {
        setShake(true);
        setTimeout(() => {
          setPhase('wrong');
          setInput('');
          setShake(false);
        }, 600);
      }
    }
  };

  const handleDelete = () => setInput(prev => prev.slice(0, -1));

  // ── Photo handling ──
  const handleFiles = (files) => {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    setPhotoFiles(prev => [...prev, ...imageFiles]);

    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreviews(prev => [...prev, { id: Date.now() + Math.random(), src: e.target.result, name: file.name }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileInput = (e) => handleFiles(e.target.files);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const removePhoto = (index) => {
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // ── Save entry to Supabase ──
  const handleAddEntry = async () => {
    if (!form.title.trim()) return;
    setSaving(true);

    try {
      const table = TABLE_MAP[activeSection];

      // Insert the main entry
      const hasExtra = ["Memories", "Things We Love", "Bucket List"].includes(activeSection);
      const { data: inserted, error: insertError } = await supabase
        .from(table)
        .insert([{
          title: form.title,
          description: form.description || null,
          date: form.date || null,
          ...(hasExtra && { extra: form.extra || null }),
          ...(activeSection === "Bucket List" && { completed: form.completed }),
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      // Upload photos for Memories
      if (activeSection === 'Memories' && photoFiles.length > 0) {
        setUploading(true);
        await Promise.all(photoFiles.map(async (file) => {
          const filePath = `${inserted.id}/${Date.now()}-${file.name}`;

          const { error: uploadError } = await supabase
            .storage
            .from(BUCKET)
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          await supabase
            .from('memory-photos')
            .insert([{ memory_id: inserted.id, file_path: filePath }]);
        }));
        setUploading(false);
      }

      // Refresh entries
      await fetchEntries();
      resetForm();
    } catch (err) {
      console.error('Error saving entry:', err);
      alert('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete entry ──
  const handleRemove = async (id) => {
    const table = TABLE_MAP[activeSection];
    try {
      // For memories, also delete photos
      if (activeSection === 'Memories') {
        const { data: photos } = await supabase
          .from('memory-photos')
          .select('file_path')
          .eq('memory_id', id);

        if (photos && photos.length > 0) {
          await supabase.storage.from(BUCKET).remove(photos.map(p => p.file_path));
          await supabase.from('memory-photos').delete().eq('memory_id', id);
        }
      }

      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;

      setEntries(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error('Error deleting entry:', err);
      alert('Could not delete entry. Please try again.');
    }
  };

  const resetForm = () => {
    setForm({ title: '', description: '', date: '', extra: '', completed: false });
    setPhotoFiles([]);
    setPhotoPreviews([]);
    setShowForm(false);
  };

  // ── LOCK SCREEN ──
  if (phase === 'lock' || phase === 'wrong') {
    return (
      <div className="ap-overlay">
        <div className={`ap-lock-card ${shake ? 'ap-shake' : ''}`}>
          <div className="ap-lock-top">
            <span className="ap-lock-icon">♥</span>
            <h2 className="ap-lock-title">Admin Access</h2>
            <p className="ap-lock-sub">
              {phase === 'wrong'
                ? <span className="ap-wrong-msg">Who are you? 👀<br /><small>That's not right. Try again.</small></span>
                : 'Enter your passcode to continue.'}
            </p>
          </div>

          <div className="ap-dots">
            {Array.from({ length: PASSCODE.length }).map((_, i) => (
              <div key={i} className={`ap-dot ${i < input.length ? 'filled' : ''}`} />
            ))}
          </div>

          <div className="ap-keypad">
            {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((k, i) => (
              k === '' ? <div key={i} /> :
              k === '⌫' ? (
                <button key={i} className="ap-key ap-key-del" onClick={handleDelete}>⌫</button>
              ) : (
                <button key={i} className="ap-key" onClick={() => handlePasscode(String(k))}>{k}</button>
              )
            ))}
          </div>

          <button className="ap-leave-btn" onClick={onClose}>Leave ↩</button>
        </div>
      </div>
    );
  }

  // ── DASHBOARD ──
  return (
    <div className="ap-overlay">
      <div className="ap-dashboard">

        {/* Sidebar */}
        <div className="ap-sidebar">
          <div className="ap-sidebar-top">
            <span className="ap-sidebar-logo">♥ miamor</span>
            <span className="ap-sidebar-role">Admin</span>
          </div>
          <nav className="ap-nav">
            {SECTIONS.map(s => (
              <button
                key={s}
                className={`ap-nav-item ${activeSection === s ? 'active' : ''}`}
                onClick={() => { setActiveSection(s); resetForm(); }}
              >
                <span className="ap-nav-icon">{sectionIcon(s)}</span>
                {s}
                {entries.length > 0 && activeSection === s && (
                  <span className="ap-nav-badge">{entries.length}</span>
                )}
              </button>
            ))}
          </nav>
          <button className="ap-logout-btn" onClick={() => { setPhase('lock'); setInput(''); }}>
            ↩ Lock
          </button>
        </div>

        {/* Main */}
        <div className="ap-main">
          <div className="ap-main-header">
            <div>
              <h2 className="ap-main-title">{activeSection}</h2>
              <p className="ap-main-count">{entries.length} entr{entries.length === 1 ? 'y' : 'ies'}</p>
            </div>
            {!showForm && (
              <button className="ap-add-btn" onClick={() => setShowForm(true)}>+ Add Entry</button>
            )}
          </div>

          {/* Add Form */}
          {showForm && (
            <div className="ap-form-card">
              <h3 className="ap-form-title">New Entry — {activeSection}</h3>
              <div className="ap-form-grid">
                <div className="ap-field">
                  <label>Title *</label>
                  <input
                    className="ap-input"
                    placeholder="Title..."
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                  />
                </div>
                <div className="ap-field">
                  <label>Date</label>
                  <input
                    className="ap-input"
                    type="date"
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                  />
                </div>
                <div className="ap-field ap-field-full">
                  <label>Description</label>
                  <textarea
                    className="ap-input ap-textarea"
                    placeholder="Write something..."
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                  />
                </div>

                {(activeSection === 'Things We Love' || activeSection === 'Bucket List' || activeSection === 'Memories') && (
                  <div className="ap-field">
                    <label>{activeSection === 'Bucket List' ? 'Category' : activeSection === 'Memories' ? 'Tag' : 'Tag'}</label>
                    <input
                      className="ap-input"
                      placeholder={activeSection === 'Bucket List' ? 'e.g. Travel' : activeSection === 'Memories' ? 'e.g. Dates' : 'e.g. Food'}
                      value={form.extra}
                      onChange={e => setForm({ ...form, extra: e.target.value })}
                    />
                  </div>
                )}

                {activeSection === 'Bucket List' && (
                  <div className="ap-field">
                    <label>
                      <input
                        type="checkbox"
                        checked={form.completed}
                        onChange={e => setForm({ ...form, completed: e.target.checked })}
                        style={{ marginRight: 8 }}
                      />
                      Mark as completed
                    </label>
                  </div>
                )}

                {/* Photo Upload — Memories only */}
                {activeSection === 'Memories' && (
                  <div className="ap-field ap-field-full">
                    <label>Photos</label>
                    <div
                      className={`ap-dropzone ${dragOver ? 'dragover' : ''} ${uploading ? 'uploading' : ''}`}
                      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => !uploading && fileInputRef.current.click()}
                    >
                      <span className="ap-dropzone-icon">{uploading ? '⏳' : '📸'}</span>
                      <span className="ap-dropzone-text">
                        {uploading ? 'Uploading...' : 'Click or drag & drop photos here'}
                      </span>
                      <span className="ap-dropzone-hint">JPG, PNG, WEBP supported</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        style={{ display: 'none' }}
                        onChange={handleFileInput}
                      />
                    </div>
                    {photoPreviews.length > 0 && (
                      <div className="ap-photo-previews">
                        {photoPreviews.map((photo, index) => (
                          <div key={photo.id} className="ap-photo-thumb">
                            <img src={photo.src} alt={photo.name} />
                            <button className="ap-photo-remove" onClick={() => removePhoto(index)}>×</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="ap-form-actions">
                <button className="ap-btn-primary" onClick={handleAddEntry} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Entry ♥'}
                </button>
                <button className="ap-btn-ghost" onClick={resetForm} disabled={saving}>Cancel</button>
              </div>
            </div>
          )}

          {/* Entries */}
          {loadingEntries ? (
            <div className="ap-empty"><p>Loading...</p></div>
          ) : entries.length === 0 && !showForm ? (
            <div className="ap-empty">
              <span className="ap-empty-icon">{sectionIcon(activeSection)}</span>
              <p>No entries yet. Add your first one!</p>
            </div>
          ) : (
            <div className="ap-entries">
              {entries.map(item => (
                <div key={item.id} className="ap-entry-card">
                  <div className="ap-entry-body">
                    <span className="ap-entry-title">{item.title}</span>
                    {item.date && <span className="ap-entry-date">{item.date}</span>}
                    {item.description && <p className="ap-entry-desc">{item.description}</p>}
                    {item.extra && <span className="ap-entry-tag">{item.extra}</span>}
                    {item.completed && <span className="ap-entry-tag">✓ Done</span>}
                    {item.photos && item.photos.length > 0 && (
                      <div className="ap-entry-photos">
                        {item.photos.map(photo => (
                          <img key={photo.id} src={photo.src} alt={photo.name} className="ap-entry-photo" />
                        ))}
                      </div>
                    )}
                  </div>
                  <button className="ap-remove-btn" onClick={() => handleRemove(item.id)}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

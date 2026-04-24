import React, { useState, useEffect } from 'react';
import './memories.css';
import { supabase } from '../supabaseClient';

const START_DATE = new Date('2023-11-28T00:00:00');

const getTimeTogether = () => {
  const now = new Date();
  const diff = now - START_DATE;
  const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24));
  let years  = now.getFullYear() - START_DATE.getFullYear();
  let months = now.getMonth()    - START_DATE.getMonth();
  let days   = now.getDate()     - START_DATE.getDate();
  if (days < 0) { months -= 1; const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0); days += prevMonth.getDate(); }
  if (months < 0) { years -= 1; months += 12; }
  return { years, months, days, hours: now.getHours(), minutes: now.getMinutes(), seconds: now.getSeconds(), totalDays };
};

const BUCKET = 'memory-photos';

const Memories = () => {
  const [time, setTime] = useState(getTimeTogether());

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTime(getTimeTogether()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchMemories = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: memoriesData, error: memoriesError } = await supabase
          .from('memories')
          .select('*')
          .order('date', { ascending: false });

        if (memoriesError) throw memoriesError;

        const memoriesWithPhotos = await Promise.all(
          memoriesData.map(async (memory) => {
            const { data: photosData, error: photosError } = await supabase
              .from('memory-photos')
              .select('*')
              .eq('memory_id', memory.id);

            if (photosError) {
              console.error('Error fetching photos for memory', memory.id, photosError);
              return { ...memory, photos: [] };
            }

            const photos = photosData.map((photo) => {
              const { data } = supabase
                .storage
                .from(BUCKET)
                .getPublicUrl(photo.file_path);

              return {
                id: photo.id,
                src: data.publicUrl,
                name: photo.file_path,
              };
            });

            return { ...memory, photos };
          })
        );

        setEntries(memoriesWithPhotos);
      } catch (err) {
        console.error('Error fetching memories:', err);
        setError('Could not load memories. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchMemories();
  }, []);

  const openModal = (entry) => {
    setSelectedEntry(entry);
    setActivePhotoIndex(0);
  };

  const closeModal = () => {
    setSelectedEntry(null);
    setActivePhotoIndex(0);
  };

  const units = [
    { label: 'Years',   value: time.years },
    { label: 'Months',  value: time.months },
    { label: 'Days',    value: time.days },
    { label: 'Hours',   value: String(time.hours).padStart(2, '0') },
    { label: 'Minutes', value: String(time.minutes).padStart(2, '0') },
    { label: 'Seconds', value: String(time.seconds).padStart(2, '0') },
  ];

  return (
    <div className="mem-page" id="memories">

      {/* Hero Header */}
      <div className="mem-hero">
        <div className="mem-hero-decor left"><span>✦</span><span>✦</span><span>✦</span></div>
        <div className="mem-hero-content">
          <p className="mem-eyebrow">our moments</p>
          <h1 className="mem-title">Memories</h1>
          <div className="mem-divider">
            <span className="mem-divider-line" />
            <span className="mem-divider-heart">♥</span>
            <span className="mem-divider-line" />
          </div>
        </div>
        <div className="mem-hero-decor right"><span>✦</span><span>✦</span><span>✦</span></div>
      </div>

      {/* Love Counter */}
      <div className="mem-counter-section">
        <p className="mem-counter-since">together since November 28, 2023</p>
        <p className="mem-counter-days">{time.totalDays.toLocaleString()} days &nbsp;♥</p>
        <div className="mem-counter-grid">
          {units.map(({ label, value }) => (
            <div className="mem-counter-card" key={label}>
              <span className="mem-counter-value">{value}</span>
              <span className="mem-counter-unit">{label}</span>
            </div>
          ))}
        </div>
      </div>


      {/* Loading State */}
      {loading && (
        <div className="mem-grid-wrapper">
          <div className="mem-grid">
            {[{ size: 'tall' }, { size: 'normal' }, { size: 'normal' }, { size: 'tall' }, { size: 'normal' }, { size: 'wide' }].map((card, i) => (
              <div className={`mem-card ${card.size}`} key={i} style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="mem-card-img-placeholder"><span className="mem-card-img-icon">✦</span></div>
                <div className="mem-card-body">
                  <div className="mem-skeleton date" />
                  <div className="mem-skeleton title" />
                  <div className="mem-skeleton text" />
                  <div className="mem-skeleton text short" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="mem-empty-state">
          <div className="mem-empty-icon">✦</div>
          <h2 className="mem-empty-title">Something went wrong</h2>
          <p className="mem-empty-text">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && entries.length === 0 && (
        <div className="mem-empty-state">
          <div className="mem-empty-icon">♥</div>
        </div>
      )}

      {/* Memories Grid */}
      {!loading && !error && entries.length > 0 && (
        <div className="mem-grid-wrapper">
          <div className="mem-grid">
            {entries.map((entry, i) => (
              <div
                className="mem-card normal"
                key={entry.id}
                style={{ animationDelay: `${i * 0.08}s`, cursor: 'pointer' }}
                onClick={() => openModal(entry)}
              >
                {entry.photos && entry.photos.length > 0 ? (
                  <div className="mem-card-img">
                    <img src={entry.photos[0].src} alt={entry.title} />
                    {entry.photos.length > 1 && (
                      <span className="mem-card-photo-count">+{entry.photos.length - 1}</span>
                    )}
                  </div>
                ) : (
                  <div className="mem-card-img-placeholder"><span className="mem-card-img-icon">✦</span></div>
                )}
                <div className="mem-card-body">
                  {entry.date && <span className="mem-card-date">{entry.date}</span>}
                  <h3 className="mem-card-title">{entry.title}</h3>
                  {entry.description && <p className="mem-card-text">{entry.description}</p>}
                  {entry.extra && <span className="mem-card-tag">{entry.extra}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mem-bottom-decor"><span>✦</span><span>♥</span><span>✦</span></div>

      {/* ── Modal ── */}
      {selectedEntry && (
        <div className="mem-modal-overlay" onClick={closeModal}>
          <div className="mem-modal" onClick={e => e.stopPropagation()}>
            <button className="mem-modal-close" onClick={closeModal}>✕</button>

            {/* Main photo */}
            {selectedEntry.photos && selectedEntry.photos.length > 0 && (
              <div className="mem-modal-img-wrap">
                <img
                  src={selectedEntry.photos[activePhotoIndex].src}
                  alt={selectedEntry.title}
                  className="mem-modal-img"
                />
              </div>
            )}

            {/* Thumbnail strip if multiple photos */}
            {selectedEntry.photos && selectedEntry.photos.length > 1 && (
              <div className="mem-modal-thumbs">
                {selectedEntry.photos.map((photo, idx) => (
                  <img
                    key={photo.id}
                    src={photo.src}
                    alt={photo.name}
                    className={`mem-modal-thumb ${idx === activePhotoIndex ? 'active' : ''}`}
                    onClick={() => setActivePhotoIndex(idx)}
                  />
                ))}
              </div>
            )}

            <div className="mem-modal-body">
              {selectedEntry.date && <span className="mem-card-date">{selectedEntry.date}</span>}
              <h3 className="mem-modal-title">{selectedEntry.title}</h3>
              {selectedEntry.description && (
                <p className="mem-modal-desc">{selectedEntry.description}</p>
              )}
              {selectedEntry.extra && <span className="mem-card-tag">{selectedEntry.extra}</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Memories;

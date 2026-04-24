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

// ─── Supabase Storage bucket name ────────────────────────────────────────────
const BUCKET = 'memory-photos'; // 👈 change this to your actual bucket name

const Memories = () => {
  const [time, setTime] = useState(getTimeTogether());
  const [activeFilter, setActiveFilter] = useState('All');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ─── Live clock ────────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => setTime(getTimeTogether()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ─── Fetch memories + photos from Supabase ─────────────────────────────────
  useEffect(() => {
    const fetchMemories = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1. Fetch all memories
        const { data: memoriesData, error: memoriesError } = await supabase
          .from('memories')           // 👈 your table name
          .select('*')
          .order('date', { ascending: false });

        if (memoriesError) throw memoriesError;

        // 2. For each memory, fetch its photos from memory-photos table
        const memoriesWithPhotos = await Promise.all(
          memoriesData.map(async (memory) => {
            const { data: photosData, error: photosError } = await supabase
              .from('memory-photos')  // 👈 your photos table name
              .select('*')
              .eq('memory_id', memory.id);

            if (photosError) {
              console.error('Error fetching photos for memory', memory.id, photosError);
              return { ...memory, photos: [] };
            }

            // 3. Get public URLs from Supabase Storage
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

  const units = [
    { label: 'Years',   value: time.years },
    { label: 'Months',  value: time.months },
    { label: 'Days',    value: time.days },
    { label: 'Hours',   value: String(time.hours).padStart(2, '0') },
    { label: 'Minutes', value: String(time.minutes).padStart(2, '0') },
    { label: 'Seconds', value: String(time.seconds).padStart(2, '0') },
  ];

  const filtered = activeFilter === 'All'
    ? entries
    : entries.filter(e => e.extra === activeFilter);

  return (
    <div className="mem-page" id="memories">

      {/* Hero Header */}
      <div className="mem-hero">
        <div className="mem-hero-decor left"><span>✦</span><span>✦</span><span>✦</span></div>
        <div className="mem-hero-content">
          <p className="mem-eyebrow">our moments</p>
          <h1 className="mem-title">Memories</h1>
          <p className="mem-subtitle">A collection of the little and big moments that made us, us.</p>
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
        <p className="mem-counter-days">{time.totalDays.toLocaleString()} days of us &nbsp;♥</p>
        <div className="mem-counter-grid">
          {units.map(({ label, value }) => (
            <div className="mem-counter-card" key={label}>
              <span className="mem-counter-value">{value}</span>
              <span className="mem-counter-unit">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mem-filter-bar">
        {['All', 'Dates', 'Trips', 'Firsts', 'Everyday'].map((tag) => (
          <button
            key={tag}
            className={`mem-filter-btn ${activeFilter === tag ? 'active' : ''}`}
            onClick={() => setActiveFilter(tag)}
          >
            {tag}
          </button>
        ))}
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
          <h2 className="mem-empty-title">Memories are on their way...</h2>
          <p className="mem-empty-text">
            This is where every photo, every laugh, every adventure will live.<br />
            Just for the two of us.
          </p>
        </div>
      )}

      {/* Memories Grid */}
      {!loading && !error && entries.length > 0 && (
        <div className="mem-grid-wrapper">
          <div className="mem-grid">
            {filtered.map((entry, i) => (
              <div className="mem-card normal" key={entry.id} style={{ animationDelay: `${i * 0.08}s` }}>
                {entry.photos && entry.photos.length > 0 ? (
                  <div className="mem-card-img">
                    <img src={entry.photos[0].src} alt={entry.title} />
                  </div>
                ) : (
                  <div className="mem-card-img-placeholder"><span className="mem-card-img-icon">✦</span></div>
                )}
                <div className="mem-card-body">
                  {entry.date && <span className="mem-card-date">{entry.date}</span>}
                  <h3 className="mem-card-title">{entry.title}</h3>
                  {entry.description && <p className="mem-card-text">{entry.description}</p>}
                  {entry.extra && <span className="mem-card-tag">{entry.extra}</span>}
                  {entry.photos && entry.photos.length > 1 && (
                    <div className="mem-card-extra-photos">
                      {entry.photos.slice(1).map(photo => (
                        <img key={photo.id} src={photo.src} alt={photo.name} className="mem-card-extra-photo" />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mem-bottom-decor"><span>✦</span><span>♥</span><span>✦</span></div>
    </div>
  );
};

export default Memories;
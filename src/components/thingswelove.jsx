import React, { useState, useEffect } from 'react';
import './thingswelove.css';
import { supabase } from '../supabaseClient';

const ThingsWeLove = () => {
  const [entries, setEntries] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const categories = ['All', 'Food', 'Places', 'Songs', 'Movies', 'Habits'];

  useEffect(() => {
    const fetchThings = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('thingswelove')          
          .select('*')
          .order('id', { ascending: false });

        if (error) throw error;
        setEntries(data);
      } catch (err) {
        console.error('Error fetching things we love:', err);
        setError('Could not load our favorites. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchThings();
  }, []);

  const filtered = activeFilter === 'All'
    ? entries
    : entries.filter(e => e.extra === activeFilter);

  return (
    <div className="twl-page" id="things-we-love">

      {/* Hero Header */}
      <div className="twl-hero">
        <div className="twl-hero-decor left"><span>✦</span><span>✦</span><span>✦</span></div>
        <div className="twl-hero-content">
          
          <h1 className="twl-title">Things We Love</h1>
          <p className="twl-subtitle"></p>
          <div className="twl-divider">
            <span className="twl-divider-line" />
            <span className="twl-divider-heart">♥</span>
            <span className="twl-divider-line" />
          </div>
        </div>
        <div className="twl-hero-decor right"><span>✦</span><span>✦</span><span>✦</span></div>
      </div>

      {/* Category Filter */}
      <div className="twl-filter-bar">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`twl-filter-btn ${activeFilter === cat ? 'active' : ''}`}
            onClick={() => setActiveFilter(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <>
          <div className="twl-grid-wrapper">
            <div className="twl-grid">
              {[{ label: 'Food' }, { label: 'Places' }, { label: 'Songs' }, { label: 'Movies' }, { label: 'Habits' }, { label: 'More' }].map((item, i) => (
                <div className="twl-card" key={i} style={{ animationDelay: `${i * 0.07}s` }}>
                  <div className="twl-card-body">
                    <div className="twl-card-cat">{item.label}</div>
                    <div className="twl-skeleton title" />
                    <div className="twl-skeleton text" />
                    <div className="twl-skeleton text short" />
                  </div>
                  <div className="twl-card-heart">♥</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="twl-empty-state">
          <div className="twl-empty-icon">✦</div>
          <h2 className="twl-empty-title">Something went wrong</h2>
          <p className="twl-empty-text">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && entries.length === 0 && (
        <div className="twl-empty-state">
          <div className="twl-empty-icon">♥</div>
          <h2 className="twl-empty-title">...</h2>
          <p className="twl-empty-text">Everything we love will live right here.</p>
        </div>
      )}

      {/* Entries */}
      {!loading && !error && entries.length > 0 && (
        <div className="twl-grid-wrapper">
          <div className="twl-grid">
            {filtered.map((entry, i) => (
              <div className="twl-card" key={entry.id} style={{ animationDelay: `${i * 0.07}s` }}>
                <div className="twl-card-body">
                  {entry.extra && <div className="twl-card-cat">{entry.extra}</div>}
                  <h3 className="twl-card-title">{entry.title}</h3>
                  {entry.description && <p className="twl-card-text">{entry.description}</p>}
                  {entry.date && <span className="twl-card-date">{entry.date}</span>}
                </div>
                <div className="twl-card-heart">♥</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="twl-bottom-decor"><span>✦</span><span>♥</span><span>✦</span></div>
    </div>
  );
};

export default ThingsWeLove;

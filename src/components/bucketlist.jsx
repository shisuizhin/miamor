import React, { useState, useEffect } from 'react';
import './bucketlist.css';
import { supabase } from '../supabaseClient';

export default function BucketList() {
  const [entries, setEntries] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBucketList = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('bucketlist')            // 👈 your table name
          .select('*')
          .order('id', { ascending: false });

        if (error) throw error;
        setEntries(data);
      } catch (err) {
        console.error('Error fetching bucket list:', err);
        setError('Could not load bucket list. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchBucketList();
  }, []);

  const filtered = activeFilter === 'All'
    ? entries
    : entries.filter(e => e.extra === activeFilter);

  const completed = entries.filter(e => e.completed).length;

  return (
    <section className="bl-section" id="bucket-list">

      {/* Hero */}
      <div className="bl-hero">
        <span className="bl-label">OUR DREAMS</span>
        <h1 className="bl-title">Bucket List</h1>
        <p className="bl-subtitle">Adventures we want to live together.</p>
        <div className="bl-divider"><span>♥</span></div>
      </div>

      {/* Stats Row */}
      <div className="bl-stats">
        <div className="bl-stat">
          <span className="bl-stat-num">{entries.length}</span>
          <span className="bl-stat-label">Dreams</span>
        </div>
        <div className="bl-stat-heart">♥</div>
        <div className="bl-stat">
          <span className="bl-stat-num">{completed}</span>
          <span className="bl-stat-label">Achieved</span>
        </div>
        <div className="bl-stat-heart">♥</div>
        <div className="bl-stat">
          <span className="bl-stat-num">{entries.length - completed}</span>
          <span className="bl-stat-label">Remaining</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bl-controls">
        <div className="bl-filters">
          {['All', 'Adventure', 'Travel', 'Romance', 'Food', 'Milestone'].map((cat) => (
            <button
              key={cat}
              className={`bl-filter-btn ${activeFilter === cat ? 'active' : ''}`}
              onClick={() => setActiveFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bl-grid">
          {[0,1,2,3,4,5].map((i) => (
            <div className="bl-card" key={i} style={{ animationDelay: `${i * 0.07}s` }}>
              <div className="bl-card-body">
                <div className="bl-skeleton category" />
                <div className="bl-skeleton title" />
                <div className="bl-skeleton text" />
                <div className="bl-skeleton text short" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="bl-empty">
          <h3 className="bl-empty-title">Something went wrong</h3>
          <p className="bl-empty-text">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && entries.length === 0 && (
        <div className="bl-empty">
          <div className="bl-empty-petals">
            <span>🌸</span><span>✨</span><span>🌸</span>
          </div>
          
        </div>
      )}

      {/* Entries */}
      {!loading && !error && entries.length > 0 && (
        <div className="bl-grid">
          {filtered.map((entry, i) => (
            <div className="bl-card" key={entry.id} style={{ animationDelay: `${i * 0.07}s` }}>
              <div className="bl-card-body">
                {entry.extra && <span className="bl-card-category">{entry.extra}</span>}
                <h3 className="bl-card-title">{entry.title}</h3>
                {entry.description && <p className="bl-card-desc">{entry.description}</p>}
                {entry.date && <span className="bl-card-date">{entry.date}</span>}
                {entry.completed && <span className="bl-card-done">✓ Done</span>}
              </div>
            </div>
          ))}
        </div>
      )}

    </section>
  );
}

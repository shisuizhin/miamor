import React, { useState, useEffect } from 'react';
import './howitbegun.css';
import { supabase } from '../supabaseClient';

const HowItBegun = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStory = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('howitbegun')            // 👈 your table name
          .select('*')
          .order('date', { ascending: true });

        if (error) throw error;
        setEntries(data);
      } catch (err) {
        console.error('Error fetching story entries:', err);
        setError('Could not load our story. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchStory();
  }, []);

  return (
    <div className="hib-page" id="how-it-begun">

      {/* Hero Header */}
      <div className="hib-hero">
        <div className="hib-hero-decor left"><span>✦</span><span>✦</span><span>✦</span></div>
        <div className="hib-hero-content">
          <p className="hib-eyebrow">our story</p>
          <h1 className="hib-title">How It Begun</h1>
          <p className="hib-subtitle">Every love story is beautiful — but ours is our favorite.</p>
          <div className="hib-divider">
            <span className="hib-divider-line" />
            <span className="hib-divider-heart">♥</span>
            <span className="hib-divider-line" />
          </div>
        </div>
        <div className="hib-hero-decor right"><span>✦</span><span>✦</span><span>✦</span></div>
      </div>

      {/* Timeline */}
      <div className="hib-timeline-wrapper">
        <div className="hib-timeline-line" />

        {/* Loading State */}
        {loading && (
          [1, 2, 3].map((i) => (
            <div className={`hib-entry ${i % 2 === 0 ? 'right' : 'left'}`} key={i}>
              <div className="hib-entry-dot"><span>♥</span></div>
              <div className="hib-card empty">
                <div className="hib-card-inner">
                  <div className="hib-card-date-placeholder" />
                  <div className="hib-card-title-placeholder" />
                  <div className="hib-card-text-placeholder" />
                  <div className="hib-card-text-placeholder short" />
                </div>
              </div>
            </div>
          ))
        )}

        {/* Entries */}
        {!loading && !error && entries.map((entry, i) => (
          <div className={`hib-entry ${i % 2 === 0 ? 'left' : 'right'}`} key={entry.id}>
            <div className="hib-entry-dot"><span>♥</span></div>
            <div className="hib-card">
              <div className="hib-card-inner">
                {entry.date && <div className="hib-card-date">{entry.date}</div>}
                <div className="hib-card-title">{entry.title}</div>
                {entry.description && <div className="hib-card-text">{entry.description}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Error State */}
      {!loading && error && (
        <div className="hib-empty-state">
          <div className="hib-empty-icon">✦</div>
          <h2 className="hib-empty-title">Something went wrong</h2>
          <p className="hib-empty-text">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && entries.length === 0 && (
        <div className="hib-empty-state">
          <div className="hib-empty-icon">♥</div>
          <h2 className="hib-empty-title">Our story is being written...</h2>
          <p className="hib-empty-text">
            This is where our journey will live — every moment, every memory, every beginning.<br />Coming soon.
          </p>
        </div>
      )}

      <div className="hib-bottom-decor"><span>✦</span><span>♥</span><span>✦</span></div>
    </div>
  );
};

export default HowItBegun;
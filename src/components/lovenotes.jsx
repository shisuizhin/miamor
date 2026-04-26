import React, { useState, useEffect } from 'react';
import './lovenotes.css';
import { supabase } from '../supabaseClient';

const LoveNote = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNotes = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('lovenotes')             // 👈 your table name
          .select('*')
          .order('date', { ascending: false });

        if (error) throw error;
        setEntries(data);
      } catch (err) {
        console.error('Error fetching love notes:', err);
        setError('Could not load love notes. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, []);

  const featured = entries[0] || null;
  const rest = entries.slice(1);

  return (
    <div className="ln-page" id="love-notes">

      {/* Hero Header */}
      <div className="ln-hero">
        <div className="ln-hero-decor left"><span>✦</span><span>✦</span><span>✦</span></div>
        <div className="ln-hero-content">
          <p className="ln-eyebrow">written with love</p>
          <h1 className="ln-title">Love Notes</h1>
          
          <div className="ln-divider">
            <span className="ln-divider-line" />
            <span className="ln-divider-heart">♥</span>
            <span className="ln-divider-line" />
          </div>
        </div>
        <div className="ln-hero-decor right"><span>✦</span><span>✦</span><span>✦</span></div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="ln-notes-wrapper">
          <div className="ln-note featured">
            <div className="ln-note-tag">✦ &nbsp;Featured Note</div>
            <div className="ln-note-inner">
              <div className="ln-quote-mark">"</div>
              <div className="ln-skeleton ln-sk-line long" />
              <div className="ln-skeleton ln-sk-line" />
              <div className="ln-skeleton ln-sk-line medium" />
              <div className="ln-skeleton ln-sk-line" />
              <div className="ln-skeleton ln-sk-line short" />
              <div className="ln-note-footer">
                <div className="ln-skeleton ln-sk-author" />
                <div className="ln-skeleton ln-sk-date" />
              </div>
            </div>
          </div>
          <div className="ln-notes-grid">
            {[0,1,2,3,4,5].map((i) => (
              <div className="ln-note small" key={i} style={{ animationDelay: `${i * 0.07}s` }}>
                <div className="ln-note-ribbon" />
                <div className="ln-note-inner">
                  <div className="ln-quote-mark small">"</div>
                  <div className="ln-skeleton ln-sk-line" />
                  <div className="ln-skeleton ln-sk-line medium" />
                  <div className="ln-skeleton ln-sk-line short" />
                  <div className="ln-note-footer">
                    <div className="ln-skeleton ln-sk-author small" />
                    <div className="ln-skeleton ln-sk-date" />
                  </div>
                </div>
                <div className="ln-note-heart">♥</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="ln-empty-state">
          <div className="ln-empty-icon">✦</div>
          <h2 className="ln-empty-title">Something went wrong</h2>
          <p className="ln-empty-text">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && entries.length === 0 && (
        <div className="ln-empty-state">
          <div className="ln-empty-icon">♥</div>
          
          
        </div>
      )}

      {/* Entries */}
      {!loading && !error && entries.length > 0 && (
        <div className="ln-notes-wrapper">
          {featured && (
            <div className="ln-note featured">
              <div className="ln-note-tag">✦ &nbsp;Featured Note</div>
              <div className="ln-note-inner">
                <div className="ln-quote-mark">"</div>
                <p className="ln-note-text">{featured.description || featured.title}</p>
                <div className="ln-note-footer">
                  <span className="ln-note-author">{featured.title}</span>
                  {featured.date && <span className="ln-note-date">{featured.date}</span>}
                </div>
              </div>
            </div>
          )}
          {rest.length > 0 && (
            <div className="ln-notes-grid">
              {rest.map((entry, i) => (
                <div className="ln-note small" key={entry.id} style={{ animationDelay: `${i * 0.07}s` }}>
                  <div className="ln-note-ribbon" />
                  <div className="ln-note-inner">
                    <div className="ln-quote-mark small">"</div>
                    <p className="ln-note-text small">{entry.description || entry.title}</p>
                    <div className="ln-note-footer">
                      <span className="ln-note-author">{entry.title}</span>
                      {entry.date && <span className="ln-note-date">{entry.date}</span>}
                    </div>
                  </div>
                  <div className="ln-note-heart">♥</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="ln-bottom-decor"><span>✦</span><span>♥</span><span>✦</span></div>
    </div>
  );
};

export default LoveNote;

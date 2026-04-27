import React, { useState, useEffect, useRef, useCallback } from 'react';
import './howitbegun.css';
import { supabase } from '../supabaseClient';

const HowItBegun = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [started, setStarted] = useState(false);

  const leverRef = useRef(null);
  const railFillRef = useRef(null);
  const sceneRef = useRef(null);
  const entryRefs = useRef([]);
  const openSet = useRef(new Set());
  const dragging = useRef(false);
  const leverY = useRef(0);
  const dragStartClientY = useRef(0);
  const dragStartLeverY = useRef(0);
  const dragStartScrollY = useRef(0);
  const animFrameRef = useRef(null);
  const scrollLoopRef = useRef(null);
  const lastClientY = useRef(0);

  useEffect(() => {
    const fetchStory = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('howitbegun')
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

  const getMaxY = useCallback(() => {
    const refs = entryRefs.current.filter(Boolean);
    if (refs.length === 0) {
      if (!sceneRef.current) return 0;
      return sceneRef.current.scrollHeight - 44;
    }
    const last = refs[refs.length - 1];
    // Stop the lever at the bottom of the last entry (relative to the scene)
    return last.offsetTop + last.offsetHeight - 22;
  }, []);

  const applyLever = useCallback((y) => {
    const clamped = Math.max(0, Math.min(y, getMaxY()));
    leverY.current = clamped;

    // transform is GPU-composited — no layout reflow, smooth on Android
    if (leverRef.current) leverRef.current.style.transform = `translateY(${clamped}px)`;
    if (railFillRef.current) railFillRef.current.style.height = (clamped + 22) + 'px';

    entryRefs.current.forEach((entry, i) => {
      if (!entry) return;
      const threshold = entry.offsetTop + entry.offsetHeight * 0.15;
      const passed = (clamped + 22) >= threshold;

      if (passed && !openSet.current.has(i)) {
        openSet.current.add(i);
        entry.classList.add('hib-lit');
        entry.classList.remove('hib-closing');
        void entry.querySelector('.hib-card-folder')?.offsetWidth;
        entry.classList.add('hib-open');
      } else if (!passed && openSet.current.has(i)) {
        openSet.current.delete(i);
        entry.classList.remove('hib-open');
        entry.classList.remove('hib-lit');
        entry.classList.add('hib-closing');
        setTimeout(() => entry.classList.remove('hib-closing'), 520);
      }
    });
  }, [getMaxY]);

  const startScrollLoop = useCallback(() => {
    const MARGIN = 100;
    const MAX_SPEED = 18;

    const loop = () => {
      if (!dragging.current) return;

      const viewH = window.innerHeight;
      const y = lastClientY.current;
      let speed = 0;

      if (y > viewH - MARGIN) {
        speed = Math.round(((y - (viewH - MARGIN)) / MARGIN) * MAX_SPEED);
      } else if (y < MARGIN) {
        speed = -Math.round(((MARGIN - y) / MARGIN) * MAX_SPEED);
      }

      if (speed !== 0) {
        window.scrollBy({ top: speed, behavior: 'instant' });
        const dy = lastClientY.current - dragStartClientY.current;
        const dScroll = window.scrollY - dragStartScrollY.current;
        applyLever(dragStartLeverY.current + dy + dScroll);
      }

      scrollLoopRef.current = requestAnimationFrame(loop);
    };

    cancelAnimationFrame(scrollLoopRef.current);
    scrollLoopRef.current = requestAnimationFrame(loop);
  }, [applyLever]);

  const onMouseDown = useCallback((e) => {
    dragging.current = true;
    dragStartClientY.current = e.clientY;
    dragStartLeverY.current = leverY.current;
    dragStartScrollY.current = window.scrollY;
    startScrollLoop();
    e.preventDefault();
  }, [startScrollLoop]);

  const onTouchStart = useCallback((e) => {
    dragging.current = true;
    dragStartClientY.current = e.touches[0].clientY;
    dragStartLeverY.current = leverY.current;
    dragStartScrollY.current = window.scrollY;
    startScrollLoop();
  }, [startScrollLoop]);

  const onMouseMove = useCallback((e) => {
    if (!dragging.current) return;
    lastClientY.current = e.clientY;
    cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(() => {
      const dy = e.clientY - dragStartClientY.current;
      const dScroll = window.scrollY - dragStartScrollY.current;
      applyLever(dragStartLeverY.current + dy + dScroll);
    });
  }, [applyLever]);

  const onTouchMove = useCallback((e) => {
    if (!dragging.current) return;
    // Prevent native scroll so Android doesn't fight us for the gesture
    e.preventDefault();
    const touch = e.touches[0];
    lastClientY.current = touch.clientY;
    cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(() => {
      const dy = touch.clientY - dragStartClientY.current;
      const dScroll = window.scrollY - dragStartScrollY.current;
      applyLever(dragStartLeverY.current + dy + dScroll);
    });
  }, [applyLever]);

  const onDragEnd = useCallback(() => {
    dragging.current = false;
    cancelAnimationFrame(scrollLoopRef.current);
  }, []);

  useEffect(() => {
    if (!started) return;
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('mouseup', onDragEnd);
    document.addEventListener('touchend', onDragEnd);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('mouseup', onDragEnd);
      document.removeEventListener('touchend', onDragEnd);
    };
  }, [started, onMouseMove, onTouchMove, onDragEnd]);

  const handleStart = () => {
    setStarted(true);
    setTimeout(() => applyLever(0), 80);
  };

  return (
    <div className="hib-page" id="how-it-begun">

      {/* Hero */}
      <div className="hib-hero">
        <div className="hib-hero-decor left"><span>✦</span><span>✦</span><span>✦</span></div>
        <div className="hib-hero-content">
          <p className="hib-eyebrow">our story</p>
          <h1 className="hib-title">How It Begun</h1>
         
          <div className="hib-divider">
            <span className="hib-divider-line" />
            <span className="hib-divider-heart">♥</span>
            <span className="hib-divider-line" />
          </div>
        </div>
        <div className="hib-hero-decor right"><span>✦</span><span>✦</span><span>✦</span></div>
      </div>

      {/* Start Button */}
      {!started && !loading && !error && entries.length > 0 && (
        <div className="hib-start-zone">
          <button className="hib-start-btn" onClick={handleStart}>
             ♥
          </button>
          <span className="hib-start-hint">Click me!</span>
        </div>
      )}

      {/* Loading skeletons — no lever */}
      {loading && (
        <div className="hib-timeline-wrapper">
          <div className="hib-timeline-line" />
          {[1, 2, 3].map((i) => (
            <div className={`hib-entry ${i % 2 === 0 ? 'right' : 'left'}`} key={i}>
              <div className="hib-entry-dot"><span>♥</span></div>
              <div className="hib-card hib-card--skeleton">
                <div className="hib-card-inner">
                  <div className="hib-card-date-placeholder" />
                  <div className="hib-card-title-placeholder" />
                  <div className="hib-card-text-placeholder" />
                  <div className="hib-card-text-placeholder short" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Scene with lever + entries */}
      {!loading && !error && entries.length > 0 && started && (
        <div className="hib-scene" ref={sceneRef}>
          <div className="hib-rail-track" />
          <div className="hib-rail-fill" ref={railFillRef} />

          {/* Draggable lever */}
          {/* NOTE for CSS: .hib-lever-wrap must have `top: 0` (not removed), position: absolute.
              We now move it via transform: translateY(...) instead of style.top for GPU smoothness. */}
          <div
            className="hib-lever-wrap"
            ref={leverRef}
            style={{ willChange: 'transform', touchAction: 'none' }}
          >
            <div
              className="hib-lever-btn"
              onMouseDown={onMouseDown}
              onTouchStart={onTouchStart}
              style={{ touchAction: 'none' }}
            >
              <div className="hib-lever-ring" />
              ♥
            </div>
            <span className="hib-drag-hint">drag me</span>
          </div>

          {/* Timeline entries */}
          <div className="hib-entries">
            {entries.map((entry, i) => (
              <div
                className={`hib-entry ${i % 2 === 0 ? 'left' : 'right'}`}
                key={entry.id}
                ref={el => entryRefs.current[i] = el}
                data-idx={i}
              >
                <div className="hib-entry-dot"><span>♥</span></div>
                <div className="hib-card-stage">
                  <div className="hib-card-folder">
                    <div className="hib-card-crease" />
                    <div className="hib-card-inner">
                      {entry.date && (
                        <div className="hib-card-date">{entry.date}</div>
                      )}
                      <div className="hib-card-title">{entry.title}</div>
                      {entry.description && (
                        <div className="hib-card-text">{entry.description}</div>
                      )}
                      {entry.tag && (
                        <div className="hib-card-tag">{entry.tag}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="hib-empty-state">
          <div className="hib-empty-icon">✦</div>
          <h2 className="hib-empty-title">Something went wrong</h2>
          <p className="hib-empty-text">{error}</p>
        </div>
      )}

      {/* Empty */}
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

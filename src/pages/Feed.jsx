// src/pages/Feed.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import VideoPlayer from '../components/VideoPlayer';
import { fetchVideos } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

const SORT_OPTIONS = ['trending', 'latest', 'oldest'];

export default function Feed() {
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [sort, setSort] = useState('trending');
  const [showSort, setShowSort] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const containerRef = useRef(null);
  const observerRef = useRef(null);

  const load = useCallback(async (sortBy, pageNum, reset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const data = await fetchVideos(sortBy, pageNum);
      if (reset) setVideos(data);
      else setVideos(prev => [...prev, ...data]);
      if (data.length < 10) setHasMore(false);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [loading]);

  useEffect(() => {
    setPage(0); setHasMore(true);
    load(sort, 0, true);
  }, [sort]); // eslint-disable-line

  // IntersectionObserver for active video detection
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const items = container.querySelectorAll('.video-slide');
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const idx = parseInt(entry.target.dataset.idx);
          setActiveIdx(idx);
          // Infinite scroll trigger
          if (idx >= videos.length - 3 && hasMore && !loading) {
            const nextPage = page + 1;
            setPage(nextPage);
            load(sort, nextPage);
          }
        }
      });
    }, { threshold: 0.7, root: container });
    items.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [videos, sort, page, hasMore, loading, load]);

  return (
    <div style={styles.wrap}>
      {/* Sort Dropdown Button */}
      <button style={styles.sortBtn} onClick={() => setShowSort(s => !s)}>
        <span style={styles.sortIcon}>⌄</span>
        <span style={styles.sortLabel}>{sort.charAt(0).toUpperCase() + sort.slice(1)}</span>
      </button>

      {/* Sort Bottom Sheet */}
      {showSort && (
        <div style={styles.sortSheet} onClick={() => setShowSort(false)}>
          <div style={styles.sortCard} onClick={e => e.stopPropagation()}>
            <div style={styles.sortHandle} />
            <p style={styles.sortTitle}>Sort Videos</p>
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt}
                style={{ ...styles.sortOption, color: sort === opt ? '#ff416c' : '#ccc' }}
                onClick={() => { setSort(opt); setShowSort(false); }}
              >
                {opt === 'trending' && '🔥 '}{opt === 'latest' && '✨ '}{opt === 'oldest' && '📅 '}
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
                {sort === opt && <span style={styles.sortCheck}>✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Video Feed */}
      <div ref={containerRef} style={styles.feed}>
        {videos.length === 0 && !loading && (
          <div style={styles.empty}>
            <p style={{ color: '#555', textAlign: 'center', marginTop: '40vh' }}>No videos yet.</p>
          </div>
        )}
        {videos.map((v, i) => (
          <div key={v.id} data-idx={i} className="video-slide" style={styles.slide}>
            <VideoPlayer video={v} userId={user?.id} isActive={activeIdx === i} />
          </div>
        ))}
        {loading && (
          <div style={styles.loader}>
            <div style={styles.spinner} />
          </div>
        )}
      </div>

      {/* Banner Ad — Replace with your ad network tag */}
      <div style={styles.bannerAd}>
        <span style={{ color: '#444', fontSize: '11px' }}>[ Banner Ad — paste your ad tag here ]</span>
      </div>
    </div>
  );
}

const styles = {
  wrap: { position: 'fixed', inset: 0, background: '#000' },
  sortBtn: {
    position: 'fixed', top: '16px', left: '16px', zIndex: 50,
    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px',
    color: '#fff', padding: '8px 14px', display: 'flex', alignItems: 'center',
    gap: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600
  },
  sortIcon: { fontSize: '16px' },
  sortLabel: {},
  sortSheet: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200,
    display: 'flex', alignItems: 'flex-end'
  },
  sortCard: {
    width: '100%', background: '#111', borderRadius: '20px 20px 0 0',
    padding: '16px 0 32px'
  },
  sortHandle: {
    width: '36px', height: '4px', background: '#333', borderRadius: '2px',
    margin: '0 auto 16px'
  },
  sortTitle: { color: '#888', fontSize: '12px', fontWeight: 600, letterSpacing: '1px', textAlign: 'center', margin: '0 0 12px' },
  sortOption: {
    display: 'flex', alignItems: 'center', width: '100%', padding: '16px 28px',
    background: 'none', border: 'none', fontSize: '16px', fontWeight: 600,
    cursor: 'pointer', textAlign: 'left'
  },
  sortCheck: { marginLeft: 'auto', color: '#ff416c' },
  feed: {
    width: '100%', height: 'calc(100% - 68px)', overflowY: 'scroll',
    scrollSnapType: 'y mandatory', scrollBehavior: 'smooth',
    WebkitOverflowScrolling: 'touch'
  },
  slide: {
    width: '100%', height: 'calc(100vh - 68px)',
    scrollSnapAlign: 'start', flexShrink: 0, position: 'relative'
  },
  loader: {
    height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  spinner: {
    width: '28px', height: '28px', border: '2px solid #222',
    borderTop: '2px solid #ff416c', borderRadius: '50%',
    animation: 'spin 0.8s linear infinite'
  },
  empty: { height: '80vh' },
  bannerAd: {
    position: 'fixed', bottom: '68px', left: 0, right: 0,
    height: '50px', background: 'rgba(0,0,0,0.8)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderTop: '1px solid #1a1a1a', zIndex: 40
  }
};

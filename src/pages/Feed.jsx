// src/pages/Feed.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import VideoPlayer from '../components/VideoPlayer';
import { fetchVideos } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

function ExoClickBanner() {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || el.dataset.loaded) return;
    el.dataset.loaded = 'true';

    // Script 1 — ad provider
    const s1 = document.createElement('script');
    s1.src = 'https://a.magsrv.com/ad-provider.js';
    s1.async = true;
    s1.type = 'application/javascript';

    // ins tag
    const ins = document.createElement('ins');
    ins.className = 'eas6a97888e2';
    ins.setAttribute('data-zoneid', '5932584');

    // Script 2 — serve call
    const s2 = document.createElement('script');
    s2.text = '(AdProvider = window.AdProvider || []).push({"serve": {}});';

    el.appendChild(s1);
    el.appendChild(ins);
    el.appendChild(s2);
  }, []);

  return <div ref={ref} />;
}

const SORT_OPTIONS = [
  { key: 'trending', label: 'Trending', emoji: '🔥' },
  { key: 'latest',   label: 'Latest',   emoji: '✨' },
  { key: 'oldest',   label: 'Oldest',   emoji: '📅' },
];

// Sort chevron SVG
const ChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M6 9l6 6 6-6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

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
  const loadingRef = useRef(false);

  const load = useCallback(async (sortBy, pageNum, reset = false) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const data = await fetchVideos(sortBy, pageNum);
      if (reset) setVideos(data);
      else setVideos(prev => [...prev, ...data]);
      if (data.length < 10) setHasMore(false);
    } catch (e) { console.error(e); }
    setLoading(false);
    loadingRef.current = false;
  }, []);

  // On sort change: reset, load, scroll to top
  useEffect(() => {
    setPage(0); setHasMore(true); setActiveIdx(0);
    load(sort, 0, true);
    if (containerRef.current) containerRef.current.scrollTop = 0;
  }, [sort]); // eslint-disable-line

  // IntersectionObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const items = container.querySelectorAll('.video-slide');
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const idx = parseInt(entry.target.dataset.idx);
          setActiveIdx(idx);
          if (idx >= videos.length - 3 && hasMore && !loadingRef.current) {
            const nextPage = page + 1;
            setPage(nextPage);
            load(sort, nextPage);
          }
        }
      });
    }, { threshold: 0.7, root: container });
    items.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [videos, sort, page, hasMore, load]);

  return (
    <div style={styles.wrap}>
      {/* Sort Button — fixed, aligned */}
      <button style={styles.sortBtn} onClick={() => setShowSort(s => !s)}>
        <ChevronDown />
        <span style={styles.sortLabel}>
          {SORT_OPTIONS.find(o => o.key === sort)?.label}
        </span>
      </button>

      {/* Sort Bottom Sheet */}
      {showSort && (
        <div style={styles.sortSheet} onClick={() => setShowSort(false)}>
          <div style={styles.sortCard} onClick={e => e.stopPropagation()}>
            <div style={styles.sortHandle} />
            <p style={styles.sortTitle}>SORT VIDEOS</p>
            {SORT_OPTIONS.map(opt => {
              const active = sort === opt.key;
              return (
                <button key={opt.key} style={styles.sortOption}
                  onClick={() => { setSort(opt.key); setShowSort(false); }}>
                  <span style={styles.sortEmoji}>{opt.emoji}</span>
                  <span style={{ ...styles.sortOptionLabel, color: active ? '#1a6bff' : '#ccc' }}>
                    {opt.label}
                  </span>
                  {active && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 'auto' }}>
                      <path d="M5 12l5 5L20 7" stroke="#1a6bff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Video Feed */}
      <div ref={containerRef} style={styles.feed}>
        {videos.length === 0 && !loading && (
          <div style={styles.emptyWrap}>
            <p style={styles.emptyText}>No videos yet.</p>
          </div>
        )}
        {videos.map((v, i) => (
          <div key={v.id} data-idx={i} className="video-slide" style={styles.slide}>
            <VideoPlayer video={v} userId={user?.id} isActive={activeIdx === i} />
          </div>
        ))}
        {loading && (
          <div style={styles.loader}><div style={styles.spinner} /></div>
        )}
      </div>

{/* Banner Ad */}
      <div style={styles.bannerAd}>
        <ExoClickBanner />
      </div>
    </div>
  );
}

const styles = {
  wrap: { position: 'fixed', inset: 0, background: '#050508' },
  sortBtn: {
    position: 'fixed', top: '14px', left: '14px', zIndex: 50,
    background: 'rgba(26,107,255,0.15)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(26,107,255,0.3)',
    borderRadius: '20px', color: '#fff',
    padding: '8px 14px 8px 10px',
    display: 'flex', alignItems: 'center', gap: '6px',
    cursor: 'pointer', fontSize: '13px', fontWeight: 700,
    fontFamily: "'Syne',sans-serif",
    WebkitTapHighlightColor: 'transparent'
  },
  sortLabel: { lineHeight: 1, paddingTop: '1px' },
  sortSheet: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,5,0.75)', zIndex: 200,
    display: 'flex', alignItems: 'flex-end',
    backdropFilter: 'blur(4px)'
  },
  sortCard: {
    width: '100%',
    background: 'rgba(8,12,24,0.97)',
    backdropFilter: 'blur(24px)',
    borderRadius: '24px 24px 0 0',
    padding: '14px 0 36px',
    border: '1px solid rgba(26,107,255,0.15)',
    borderBottom: 'none'
  },
  sortHandle: {
    width: '36px', height: '4px',
    background: 'rgba(26,107,255,0.4)', borderRadius: '2px',
    margin: '0 auto 20px'
  },
  sortTitle: {
    color: 'rgba(26,107,255,0.7)', fontSize: '11px', fontWeight: 800,
    letterSpacing: '2px', textAlign: 'center', margin: '0 0 8px',
    fontFamily: "'Syne',sans-serif"
  },
  sortOption: {
    display: 'flex', alignItems: 'center', width: '100%',
    padding: '15px 28px', background: 'none', border: 'none',
    cursor: 'pointer', fontFamily: "'Syne',sans-serif"
  },
  sortEmoji: { fontSize: '20px', marginRight: '14px', width: '24px', textAlign: 'center' },
  sortOptionLabel: { fontSize: '16px', fontWeight: 700 },
  feed: {
    width: '100%', height: 'calc(100% - 118px)',
    overflowY: 'scroll', scrollSnapType: 'y mandatory',
    scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch'
  },
  slide: {
    width: '100%', height: 'calc(100vh - 118px)',
    scrollSnapAlign: 'start', flexShrink: 0, position: 'relative'
  },
  loader: { height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  spinner: {
    width: '28px', height: '28px',
    border: '2px solid rgba(26,107,255,0.15)',
    borderTop: '2px solid #1a6bff',
    borderRadius: '50%', animation: 'spin 0.8s linear infinite'
  },
  emptyWrap: { height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#333', fontSize: '15px', fontFamily: "'Syne',sans-serif" },
  bannerAd: {
    position: 'fixed', bottom: '68px', left: 0, right: 0,
    height: '50px', background: 'rgba(5,5,10,0.95)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderTop: '1px solid rgba(26,107,255,0.1)', zIndex: 40
  }
};

// src/pages/Feed.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import VideoPlayer from '../components/VideoPlayer';
import { fetchEpornerVideos } from '../lib/eporner';
import { useAuth } from '../hooks/useAuth';

// ── Adsterra Banner ────────────────────────────────────────────────────────────
function AdsterraBanner() {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const timer = setTimeout(() => {
      const el = ref.current;
      if (!el || el.dataset.loaded) return;
      el.dataset.loaded = 'true';
      window.atOptions = {
        key: '6088494202eb2287cc5144d18f71f3ab',
        format: 'iframe', height: 50, width: 320, params: {}
      };
      const s = document.createElement('script');
      s.type = 'text/javascript'; s.async = true;
      s.src = 'https://www.topcreativeformat.com/6088494202eb2287cc5144d18f71f3ab/invoke.js';
      s.onerror = () => {
        const s2 = document.createElement('script');
        s2.type = 'text/javascript'; s2.async = true;
        s2.src = 'https://syndication.realsrv.com/6088494202eb2287cc5144d18f71f3ab/invoke.js';
        el.appendChild(s2);
      };
      el.appendChild(s);
    }, 800);
    return () => clearTimeout(timer);
  }, []);
  return <div ref={ref} style={{ width: '320px', height: '50px', overflow: 'hidden', display: 'block' }} />;
}

// ── SVG icons ─────────────────────────────────────────────────────────────────
const ChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M6 9l6 6 6-6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <circle cx="11" cy="11" r="7" stroke="rgba(255,255,255,0.9)" strokeWidth="2"/>
    <path d="M16.5 16.5L21 21" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M18 6L6 18M6 6l12 12" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

const SORT_OPTIONS = [
  { key: 'trending', label: 'Trending', emoji: '🔥' },
  { key: 'latest',   label: 'Latest',   emoji: '✨' },
  { key: 'oldest',   label: 'Oldest',   emoji: '📅' },
];

export default function Feed() {
  const { user } = useAuth();
  const [videos, setVideos]       = useState([]);
  const [sort, setSort]           = useState('trending');
  const [showSort, setShowSort]   = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [page, setPage]           = useState(0);
  const [loading, setLoading]     = useState(false);
  const [hasMore, setHasMore]     = useState(true);
  // Search state
  const [showSearch, setShowSearch] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef  = useRef(null);
  const loadingRef    = useRef(false);
  const searchInputRef = useRef(null);

  // ── fetch from eporner ─────────────────────────────────────────────────────
  const load = useCallback(async (sortBy, pageNum, query, reset = false) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const { videos: data, hasMore: more } = await fetchEpornerVideos({
        sort: sortBy, page: pageNum, query
      });
      if (reset) setVideos(data);
      else setVideos(prev => [...prev, ...data]);
      setHasMore(more);
    } catch (e) { console.error('Feed load error:', e); }
    setLoading(false);
    loadingRef.current = false;
  }, []);

  // Reset + reload on sort or query change
  useEffect(() => {
    setPage(0); setHasMore(true); setActiveIdx(0);
    load(sort, 0, searchQuery, true);
    if (containerRef.current) containerRef.current.scrollTop = 0;
  }, [sort, searchQuery]); // eslint-disable-line

  // IntersectionObserver for active detection + infinite scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const items = container.querySelectorAll('.video-slide');
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const idx = parseInt(entry.target.dataset.idx);
          setActiveIdx(idx);
          // Trigger next page load when near end
          if (idx >= videos.length - 2 && hasMore && !loadingRef.current) {
            const next = page + 1;
            setPage(next);
            load(sort, next, searchQuery);
          }
        }
      });
    }, { threshold: 0.7, root: container });
    items.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [videos, sort, page, hasMore, searchQuery, load]);

  // Focus search input when opened
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [showSearch]);

  const handleSearch = () => {
    const q = searchInput.trim();
    setSearchQuery(q);
    setShowSearch(false);
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setShowSearch(false);
  };

  return (
    <div style={styles.wrap}>

      {/* ── Top bar: Sort (left) + Search (right) ─────────────────────────── */}
      <div style={styles.topRow}>
        <button style={styles.sortBtn} onClick={() => setShowSort(s => !s)}>
          <ChevronDown />
          <span style={styles.sortLabel}>
            {searchQuery
              ? `"${searchQuery.slice(0,12)}${searchQuery.length>12?'…':'"}"`
              : SORT_OPTIONS.find(o => o.key === sort)?.label
            }
          </span>
        </button>

        <button style={styles.searchBtn} onClick={() => setShowSearch(true)}>
          <SearchIcon />
        </button>
      </div>

      {/* ── Sort bottom sheet ─────────────────────────────────────────────── */}
      {showSort && (
        <div style={styles.sheet} onClick={() => setShowSort(false)}>
          <div style={styles.sheetCard} onClick={e => e.stopPropagation()}>
            <div style={styles.sheetHandle} />
            <p style={styles.sheetTitle}>SORT VIDEOS</p>
            {SORT_OPTIONS.map(opt => {
              const active = sort === opt.key && !searchQuery;
              return (
                <button key={opt.key} style={styles.sheetOption}
                  onClick={() => { setSort(opt.key); setSearchQuery(''); setSearchInput(''); setShowSort(false); }}>
                  <span style={styles.sheetEmoji}>{opt.emoji}</span>
                  <span style={{ ...styles.sheetLabel, color: active ? '#1a6bff' : '#ccc' }}>
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

      {/* ── Search overlay ────────────────────────────────────────────────── */}
      {showSearch && (
        <div style={styles.searchOverlay} onClick={() => setShowSearch(false)}>
          <div style={styles.searchBox} onClick={e => e.stopPropagation()}>
            <div style={styles.searchInputRow}>
              <SearchIcon />
              <input
                ref={searchInputRef}
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSearch(); if (e.key === 'Escape') setShowSearch(false); }}
                placeholder="Search videos..."
                style={styles.searchInput}
              />
              {searchInput ? (
                <button onClick={() => setSearchInput('')} style={styles.iconBtn}><CloseIcon /></button>
              ) : null}
            </div>
            <div style={styles.searchActions}>
              <button onClick={() => setShowSearch(false)} style={styles.cancelBtn}>Cancel</button>
              <button onClick={handleSearch} style={styles.goBtn}>Search</button>
            </div>
            {searchQuery && (
              <button onClick={clearSearch} style={styles.clearQueryBtn}>
                ✕ Clear: "{searchQuery}"
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Video feed ────────────────────────────────────────────────────── */}
      <div ref={containerRef} style={styles.feed}>
        {videos.length === 0 && !loading && (
          <div style={styles.emptyWrap}>
            <p style={styles.emptyText}>
              {searchQuery ? `No results for "${searchQuery}"` : 'Loading videos…'}
            </p>
          </div>
        )}

        {videos.map((v, i) => (
          <div key={`${v.id}-${i}`} data-idx={i} className="video-slide" style={styles.slide}>
            <VideoPlayer video={v} userId={user?.id} isActive={activeIdx === i} />
          </div>
        ))}

        {/* Loading indicator between pages — classy circular */}
        {loading && (
          <div style={styles.loaderWrap}>
            <div style={styles.loaderRing}>
              <div style={styles.loaderInner} />
            </div>
            <p style={styles.loaderText}>{videos.length > 0 ? 'Loading more…' : 'Loading…'}</p>
          </div>
        )}

        {/* End of results */}
        {!hasMore && videos.length > 0 && !loading && (
          <div style={styles.endWrap}>
            <div style={styles.endLine} />
            <p style={styles.endText}>You've seen it all</p>
            <div style={styles.endLine} />
          </div>
        )}
      </div>

      {/* ── Banner Ad ─────────────────────────────────────────────────────── */}
      <div style={styles.bannerAd}>
        <AdsterraBanner />
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const glass = {
  background: 'rgba(26,107,255,0.12)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(26,107,255,0.25)',
};

const styles = {
  wrap: { position: 'fixed', inset: 0, background: '#050508' },

  topRow: {
    position: 'fixed', top: '14px', left: '14px', right: '14px',
    zIndex: 50, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
  },

  sortBtn: {
    ...glass, borderRadius: '20px', color: '#fff',
    padding: '8px 14px 8px 10px',
    display: 'flex', alignItems: 'center', gap: '6px',
    cursor: 'pointer', fontSize: '13px', fontWeight: 700,
    fontFamily: "'Syne',sans-serif",
    WebkitTapHighlightColor: 'transparent'
  },
  sortLabel: { lineHeight: 1 },

  searchBtn: {
    ...glass, borderRadius: '50%',
    width: '40px', height: '40px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', WebkitTapHighlightColor: 'transparent'
  },

  // Sort sheet
  sheet: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,5,0.75)',
    zIndex: 200, display: 'flex', alignItems: 'flex-end',
    backdropFilter: 'blur(4px)'
  },
  sheetCard: {
    width: '100%', background: 'rgba(8,12,24,0.97)',
    backdropFilter: 'blur(24px)', borderRadius: '24px 24px 0 0',
    padding: '14px 0 36px',
    border: '1px solid rgba(26,107,255,0.15)', borderBottom: 'none'
  },
  sheetHandle: {
    width: '36px', height: '4px',
    background: 'rgba(26,107,255,0.4)', borderRadius: '2px',
    margin: '0 auto 20px'
  },
  sheetTitle: {
    color: 'rgba(26,107,255,0.7)', fontSize: '11px', fontWeight: 800,
    letterSpacing: '2px', textAlign: 'center', margin: '0 0 8px',
    fontFamily: "'Syne',sans-serif"
  },
  sheetOption: {
    display: 'flex', alignItems: 'center', width: '100%',
    padding: '15px 28px', background: 'none', border: 'none',
    cursor: 'pointer', fontFamily: "'Syne',sans-serif"
  },
  sheetEmoji: { fontSize: '20px', marginRight: '14px', width: '24px', textAlign: 'center' },
  sheetLabel: { fontSize: '16px', fontWeight: 700 },

  // Search overlay
  searchOverlay: {
    position: 'fixed', inset: 0, zIndex: 300,
    background: 'rgba(0,0,8,0.8)', backdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'flex-start', paddingTop: '60px',
  },
  searchBox: {
    width: 'calc(100% - 32px)', margin: '0 16px',
    background: 'rgba(8,14,30,0.96)',
    border: '1px solid rgba(26,107,255,0.25)',
    borderRadius: '20px', padding: '16px',
    backdropFilter: 'blur(24px)',
    boxShadow: '0 8px 40px rgba(26,107,255,0.15)',
  },
  searchInputRow: {
    display: 'flex', alignItems: 'center', gap: '10px',
    background: 'rgba(26,107,255,0.08)',
    border: '1px solid rgba(26,107,255,0.2)',
    borderRadius: '12px', padding: '10px 14px'
  },
  searchInput: {
    flex: 1, background: 'none', border: 'none', outline: 'none',
    color: '#fff', fontSize: '16px', fontFamily: "'Syne',sans-serif",
    fontWeight: 600
  },
  iconBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', padding: 0
  },
  searchActions: {
    display: 'flex', gap: '10px', marginTop: '12px'
  },
  cancelBtn: {
    flex: 1, padding: '11px', background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
    color: '#888', fontSize: '14px', fontWeight: 700,
    cursor: 'pointer', fontFamily: "'Syne',sans-serif"
  },
  goBtn: {
    flex: 2, padding: '11px',
    background: 'linear-gradient(135deg, #1a6bff, #0044cc)',
    border: 'none', borderRadius: '10px', color: '#fff',
    fontSize: '14px', fontWeight: 700, cursor: 'pointer',
    fontFamily: "'Syne',sans-serif",
    boxShadow: '0 4px 16px rgba(26,107,255,0.35)'
  },
  clearQueryBtn: {
    width: '100%', marginTop: '10px', padding: '8px',
    background: 'rgba(255,60,60,0.08)', border: '1px solid rgba(255,60,60,0.15)',
    borderRadius: '8px', color: '#ff6b6b', fontSize: '12px',
    fontWeight: 700, cursor: 'pointer', fontFamily: "'Syne',sans-serif"
  },

  // Feed
  feed: {
    width: '100%', height: 'calc(100% - 118px)',
    overflowY: 'scroll', scrollSnapType: 'y mandatory',
    scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch'
  },
  slide: {
    width: '100%', height: 'calc(100vh - 118px)',
    scrollSnapAlign: 'start', flexShrink: 0, position: 'relative'
  },

  // Classy loader
  loaderWrap: {
    height: '120px', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: '14px',
    scrollSnapAlign: 'start'
  },
  loaderRing: {
    width: '48px', height: '48px', borderRadius: '50%',
    background: 'rgba(26,107,255,0.08)',
    border: '1px solid rgba(26,107,255,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 0 20px rgba(26,107,255,0.15)',
    position: 'relative'
  },
  loaderInner: {
    position: 'absolute', inset: '4px', borderRadius: '50%',
    border: '2px solid rgba(26,107,255,0.1)',
    borderTop: '2px solid #1a6bff',
    animation: 'spin 0.9s cubic-bezier(0.4,0,0.2,1) infinite'
  },
  loaderText: {
    color: 'rgba(26,107,255,0.5)', fontSize: '11px',
    fontWeight: 700, letterSpacing: '1px',
    fontFamily: "'Syne',sans-serif"
  },

  // End of feed
  endWrap: {
    height: '80px', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    gap: '12px', padding: '0 24px'
  },
  endLine: { flex: 1, height: '1px', background: 'rgba(26,107,255,0.15)' },
  endText: { color: '#333', fontSize: '11px', fontWeight: 700, fontFamily: "'Syne',sans-serif", whiteSpace: 'nowrap' },

  emptyWrap: { height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#444', fontSize: '15px', fontFamily: "'Syne',sans-serif", textAlign: 'center', padding: '0 32px' },

  bannerAd: {
    position: 'fixed', bottom: '68px', left: 0, right: 0,
    height: '50px', background: '#000',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderTop: '1px solid #111', borderBottom: '1px solid #111',
    zIndex: 40, overflow: 'hidden'
  }
};

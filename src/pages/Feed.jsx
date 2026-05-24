// src/pages/Feed.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import VideoPlayer from '../components/VideoPlayer';
import { fetchEpornerVideos } from '../lib/eporner';
import { useAuth } from '../hooks/useAuth';

// ── Adsterra Banner ───────────────────────────────────────────────────────────
function AdsterraBanner() {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const timer = setTimeout(() => {
      const el = ref.current;
      if (!el || el.dataset.loaded) return;
      el.dataset.loaded = 'true';
      window.atOptions = { key: '6088494202eb2287cc5144d18f71f3ab', format: 'iframe', height: 50, width: 320, params: {} };
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

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const ChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M6 9l6 6 6-6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const SearchIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="11" cy="11" r="7" stroke="rgba(255,255,255,0.9)" strokeWidth="2"/>
    <path d="M16.5 16.5L21 21" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M18 6L6 18M6 6l12 12" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);
const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M19 12H5M5 12l7-7M5 12l7 7" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const PlayIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="rgba(255,255,255,0.95)">
    <path d="M8 5v14l11-7z"/>
  </svg>
);

const SORT_OPTIONS = [
  { key: 'trending', label: 'Trending', emoji: '\uD83D\uDD25' },
  { key: 'latest',   label: 'Latest',   emoji: '\u2728' },
  { key: 'oldest',   label: 'Oldest',   emoji: '\uD83D\uDCC5' },
];

// ── Search Grid Card ──────────────────────────────────────────────────────────
function GridCard({ video, onPlay }) {
  const [imgErr, setImgErr] = useState(false);
  const dur = video.duration
    ? `${Math.floor(video.duration/60)}:${String(video.duration%60).padStart(2,'0')}`
    : '';
  const views = video.view_count >= 1000000
    ? (video.view_count/1000000).toFixed(1)+'M'
    : video.view_count >= 1000
    ? (video.view_count/1000).toFixed(1)+'K'
    : String(video.view_count||0);

  return (
    <div style={gc.card} onClick={() => onPlay(video)}>
      <div style={gc.thumb}>
        {video.thumbnail_url && !imgErr
          ? <img src={video.thumbnail_url} alt={video.title} style={gc.img} loading="lazy" onError={() => setImgErr(true)} />
          : <div style={gc.imgFallback}><PlayIcon /></div>
        }
        {dur && <span style={gc.dur}>{dur}</span>}
        <div style={gc.playOverlay}><div style={gc.playBtn}><PlayIcon /></div></div>
      </div>
      <div style={gc.info}>
        <p style={gc.title}>{video.title}</p>
        <p style={gc.meta}>{views} views</p>
      </div>
    </div>
  );
}

const gc = {
  card: {
    cursor: 'pointer', borderRadius: '12px', overflow: 'hidden',
    background: 'rgba(26,107,255,0.04)',
    border: '1px solid rgba(26,107,255,0.08)',
    transition: 'border-color 0.2s, transform 0.15s',
    WebkitTapHighlightColor: 'transparent',
    position: 'relative'
  },
  thumb: { aspectRatio: '16/9', background: '#0a0e1a', position: 'relative', overflow: 'hidden' },
  img: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  imgFallback: {
    width: '100%', height: '100%', display: 'flex',
    alignItems: 'center', justifyContent: 'center', background: '#0d1425'
  },
  dur: {
    position: 'absolute', bottom: '5px', right: '6px',
    background: 'rgba(0,0,0,0.75)', color: '#fff',
    fontSize: '10px', fontWeight: 700, padding: '2px 5px',
    borderRadius: '4px', fontFamily: "'Syne',sans-serif"
  },
  playOverlay: {
    position: 'absolute', inset: 0,
    background: 'rgba(26,107,255,0.0)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.2s', opacity: 0,
  },
  playBtn: {
    width: '44px', height: '44px', borderRadius: '50%',
    background: 'rgba(26,107,255,0.85)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backdropFilter: 'blur(8px)',
    boxShadow: '0 0 20px rgba(26,107,255,0.5)'
  },
  info: { padding: '8px 10px 10px' },
  title: {
    color: '#ddd', fontSize: '12px', fontWeight: 700, margin: '0 0 3px',
    lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical', overflow: 'hidden',
    fontFamily: "'Syne',sans-serif"
  },
  meta: { color: '#444', fontSize: '11px', margin: 0, fontFamily: "'Syne',sans-serif" }
};

// ── Main Feed ─────────────────────────────────────────────────────────────────
export default function Feed() {
  const { user } = useAuth();

  // Feed state
  const [videos, setVideos]       = useState([]);
  const [sort, setSort]           = useState('trending');
  const [showSort, setShowSort]   = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [page, setPage]           = useState(0);
  const [loading, setLoading]     = useState(false);
  const [hasMore, setHasMore]     = useState(true);

  // Search state
  const [showSearch, setShowSearch]   = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState(''); // committed query
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchPage, setSearchPage]   = useState(0);
  const [searchHasMore, setSearchHasMore] = useState(true);

  // Search grid vs reel mode
  // null = feed mode, array index = reel mode starting from that video
  const [reelStartIdx, setReelStartIdx] = useState(null);

  const containerRef   = useRef(null);
  const reelRef        = useRef(null);
  const loadingRef     = useRef(false);
  const searchInputRef = useRef(null);

  // ── Load feed videos ───────────────────────────────────────────────────────
  const load = useCallback(async (sortBy, pageNum, reset = false) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const { videos: data, hasMore: more } = await fetchEpornerVideos({ sort: sortBy, page: pageNum, query: '' });
      if (reset) setVideos(data);
      else setVideos(prev => [...prev, ...data]);
      setHasMore(more);
    } catch(e) { console.error(e); }
    setLoading(false);
    loadingRef.current = false;
  }, []);

  useEffect(() => {
    setPage(0); setHasMore(true); setActiveIdx(0);
    load(sort, 0, true);
    if (containerRef.current) containerRef.current.scrollTop = 0;
  }, [sort]); // eslint-disable-line

  // ── Load search results ────────────────────────────────────────────────────
  const loadSearch = useCallback(async (query, pageNum, reset = false) => {
    if (!query.trim()) return;
    setSearchLoading(true);
    try {
      const { videos: data, hasMore: more } = await fetchEpornerVideos({ sort: 'top-rated', page: pageNum, query });
      if (reset) setSearchResults(data);
      else setSearchResults(prev => [...prev, ...data]);
      setSearchHasMore(more);
    } catch(e) { console.error(e); }
    setSearchLoading(false);
  }, []);

  useEffect(() => {
    if (searchQuery) {
      setSearchPage(0); setSearchHasMore(true); setReelStartIdx(null);
      loadSearch(searchQuery, 0, true);
    }
  }, [searchQuery]); // eslint-disable-line

  // ── Feed IntersectionObserver ──────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container || searchQuery) return;
    const items = container.querySelectorAll('.video-slide');
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const idx = parseInt(entry.target.dataset.idx);
          setActiveIdx(idx);
          if (idx >= videos.length - 2 && hasMore && !loadingRef.current) {
            const next = page + 1;
            setPage(next);
            load(sort, next);
          }
        }
      });
    }, { threshold: 0.7, root: container });
    items.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [videos, sort, page, hasMore, load, searchQuery]);

  // ── Search reel IntersectionObserver ──────────────────────────────────────
  useEffect(() => {
    const container = reelRef.current;
    if (!container || reelStartIdx === null) return;
    const items = container.querySelectorAll('.search-reel-slide');
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const idx = parseInt(entry.target.dataset.idx);
          setActiveIdx(idx);
          if (idx >= searchResults.length - 2 && searchHasMore && !loadingRef.current) {
            const next = searchPage + 1;
            setSearchPage(next);
            loadSearch(searchQuery, next);
          }
        }
      });
    }, { threshold: 0.7, root: container });
    items.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [searchResults, reelStartIdx, searchPage, searchHasMore, searchQuery, loadSearch]);

  // Focus search input when overlay opens
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [showSearch]);

  const handleSearchSubmit = () => {
    const q = searchInput.trim();
    if (!q) return;
    setSearchQuery(q);
    setShowSearch(false);
  };

  const handleGridPlay = (video) => {
    const idx = searchResults.findIndex(v => v.id === video.id);
    setReelStartIdx(idx >= 0 ? idx : 0);
    setActiveIdx(idx >= 0 ? idx : 0);
    // scroll reel to correct position after render
    setTimeout(() => {
      if (reelRef.current) {
        const slide = reelRef.current.querySelector(`.search-reel-slide[data-idx="${idx >= 0 ? idx : 0}"]`);
        if (slide) slide.scrollIntoView({ behavior: 'instant' });
      }
    }, 50);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchInput('');
    setSearchResults([]);
    setReelStartIdx(null);
  };

  // Is search grid visible?
  const showGrid = searchQuery && reelStartIdx === null;
  // Is search reel visible?
  const showSearchReel = searchQuery && reelStartIdx !== null;
  // Is main feed visible?
  const showFeed = !searchQuery;

  return (
    <div style={styles.wrap}>

      {/* ── Top controls bar ─────────────────────────────────────────────── */}
      <div style={styles.topRow}>
        {/* Left: sort button OR back button in search reel */}
        {showSearchReel ? (
          <button style={styles.backBtn} onClick={() => setReelStartIdx(null)}>
            <BackIcon />
            <span style={styles.backLabel}>Results</span>
          </button>
        ) : showGrid ? (
          <button style={styles.backBtn} onClick={clearSearch}>
            <BackIcon />
            <span style={styles.backLabel}>Feed</span>
          </button>
        ) : (
          <button style={styles.sortBtn} onClick={() => setShowSort(s => !s)}>
            <ChevronDown />
            <span style={styles.sortLabel}>{SORT_OPTIONS.find(o => o.key === sort)?.label}</span>
          </button>
        )}

        {/* Right: search button */}
        <button style={styles.searchBtn} onClick={() => setShowSearch(true)}>
          <SearchIcon size={20} />
        </button>
      </div>

      {/* ── Sort bottom sheet ─────────────────────────────────────────────── */}
      {showSort && (
        <div style={styles.sheet} onClick={() => setShowSort(false)}>
          <div style={styles.sheetCard} onClick={e => e.stopPropagation()}>
            <div style={styles.sheetHandle} />
            <p style={styles.sheetTitle}>SORT VIDEOS</p>
            {SORT_OPTIONS.map(opt => {
              const active = sort === opt.key;
              return (
                <button key={opt.key} style={styles.sheetOption}
                  onClick={() => { setSort(opt.key); setShowSort(false); }}>
                  <span style={styles.sheetEmoji}>{opt.emoji}</span>
                  <span style={{ ...styles.sheetLabel, color: active ? '#1a6bff' : '#ccc' }}>{opt.label}</span>
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
              <SearchIcon size={18} />
              <input
                ref={searchInputRef}
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSearchSubmit(); if (e.key === 'Escape') setShowSearch(false); }}
                placeholder="Search videos..."
                style={styles.searchInput}
              />
              {searchInput && (
                <button onClick={() => setSearchInput('')} style={styles.iconBtn}><CloseIcon /></button>
              )}
            </div>
            <div style={styles.searchActions}>
              <button onClick={() => setShowSearch(false)} style={styles.cancelBtn}>Cancel</button>
              <button onClick={handleSearchSubmit} style={styles.goBtn}>Search</button>
            </div>
            {searchQuery && (
              <button onClick={() => { clearSearch(); setShowSearch(false); }} style={styles.clearQueryBtn}>
                Clear current: "{searchQuery}"
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── MAIN FEED (no search) ─────────────────────────────────────────── */}
      {showFeed && (
        <div ref={containerRef} style={styles.feed}>
          {videos.length === 0 && !loading && (
            <div style={styles.emptyWrap}><p style={styles.emptyText}>Loading videos…</p></div>
          )}
          {videos.map((v, i) => (
            <div key={`feed-${v.id}-${i}`} data-idx={i} className="video-slide" style={styles.slide}>
              <VideoPlayer video={v} userId={user?.id} isActive={activeIdx === i} />
            </div>
          ))}
          {loading && <Loader />}
          {!hasMore && videos.length > 0 && !loading && <EndMarker />}
        </div>
      )}

      {/* ── SEARCH GRID ──────────────────────────────────────────────────── */}
      {showGrid && (
        <div style={styles.gridWrap}>
          <div style={styles.gridHeader}>
            <p style={styles.gridHeading}>Results for</p>
            <p style={styles.gridQuery}>"{searchQuery}"</p>
            <p style={styles.gridCount}>{searchResults.length} videos found</p>
          </div>
          {searchLoading && searchResults.length === 0 && (
            <div style={styles.emptyWrap}><Loader /></div>
          )}
          <div style={styles.grid}>
            {searchResults.map((v, i) => (
              <GridCard key={`grid-${v.id}-${i}`} video={v} onPlay={handleGridPlay} />
            ))}
          </div>
          {searchLoading && searchResults.length > 0 && <Loader />}
          {!searchHasMore && searchResults.length > 0 && !searchLoading && <EndMarker />}
          {/* Load more on scroll */}
          <div style={{ height: '1px' }} ref={el => {
            if (!el) return;
            const obs = new IntersectionObserver(([entry]) => {
              if (entry.isIntersecting && searchHasMore && !searchLoading) {
                const next = searchPage + 1;
                setSearchPage(next);
                loadSearch(searchQuery, next);
              }
            });
            obs.observe(el);
            return () => obs.disconnect();
          }} />
        </div>
      )}

      {/* ── SEARCH REEL (after tapping a grid video) ─────────────────────── */}
      {showSearchReel && (
        <div ref={reelRef} style={styles.feed}>
          {searchResults.map((v, i) => (
            <div key={`sreel-${v.id}-${i}`} data-idx={i} className="search-reel-slide" style={styles.slide}>
              <VideoPlayer video={v} userId={user?.id} isActive={activeIdx === i} />
            </div>
          ))}
          {searchLoading && <Loader />}
          {!searchHasMore && searchResults.length > 0 && !searchLoading && <EndMarker />}
        </div>
      )}

      {/* ── Banner Ad ────────────────────────────────────────────────────── */}
      <div style={styles.bannerAd}>
        <AdsterraBanner />
      </div>
    </div>
  );
}

// ── Shared UI helpers ─────────────────────────────────────────────────────────
function Loader() {
  return (
    <div style={{ height: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
      <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(26,107,255,0.08)', border: '1px solid rgba(26,107,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', boxShadow: '0 0 20px rgba(26,107,255,0.12)' }}>
        <div style={{ position: 'absolute', inset: '4px', borderRadius: '50%', border: '2px solid rgba(26,107,255,0.1)', borderTop: '2px solid #1a6bff', animation: 'spin 0.9s cubic-bezier(0.4,0,0.2,1) infinite' }} />
      </div>
      <p style={{ color: 'rgba(26,107,255,0.45)', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', fontFamily: "'Syne',sans-serif", margin: 0 }}>Loading…</p>
    </div>
  );
}
function EndMarker() {
  return (
    <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '0 24px' }}>
      <div style={{ flex: 1, height: '1px', background: 'rgba(26,107,255,0.12)' }} />
      <p style={{ color: '#2a2a3a', fontSize: '11px', fontWeight: 700, fontFamily: "'Syne',sans-serif", whiteSpace: 'nowrap', margin: 0 }}>You've seen it all</p>
      <div style={{ flex: 1, height: '1px', background: 'rgba(26,107,255,0.12)' }} />
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

  backBtn: {
    ...glass, borderRadius: '20px', color: '#fff',
    padding: '8px 14px 8px 10px',
    display: 'flex', alignItems: 'center', gap: '8px',
    cursor: 'pointer', fontFamily: "'Syne',sans-serif",
    WebkitTapHighlightColor: 'transparent'
  },
  backLabel: { fontSize: '13px', fontWeight: 700, lineHeight: 1 },

  searchBtn: {
    ...glass, borderRadius: '50%',
    width: '40px', height: '40px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', flexShrink: 0,
    WebkitTapHighlightColor: 'transparent'
  },

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

  searchOverlay: {
    position: 'fixed', inset: 0, zIndex: 300,
    background: 'rgba(0,0,8,0.85)', backdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'flex-start', paddingTop: '60px',
  },
  searchBox: {
    width: 'calc(100% - 32px)', margin: '0 16px',
    background: 'rgba(8,14,30,0.97)',
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
    color: '#fff', fontSize: '16px', fontFamily: "'Syne',sans-serif", fontWeight: 600
  },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 },
  searchActions: { display: 'flex', gap: '10px', marginTop: '12px' },
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
    background: 'rgba(255,60,60,0.06)', border: '1px solid rgba(255,60,60,0.12)',
    borderRadius: '8px', color: '#ff6b6b', fontSize: '12px',
    fontWeight: 700, cursor: 'pointer', fontFamily: "'Syne',sans-serif"
  },

  feed: {
    width: '100%', height: 'calc(100% - 118px)',
    overflowY: 'scroll', scrollSnapType: 'y mandatory',
    WebkitOverflowScrolling: 'touch',
    marginTop: 0
  },
  slide: {
    width: '100%', height: 'calc(100vh - 118px)',
    scrollSnapAlign: 'start', flexShrink: 0, position: 'relative'
  },

  gridWrap: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: '118px',
    overflowY: 'auto', paddingTop: '64px', paddingBottom: '16px',
    WebkitOverflowScrolling: 'touch'
  },
  gridHeader: { padding: '0 16px 16px' },
  gridHeading: { color: '#555', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', margin: '0 0 2px', fontFamily: "'Syne',sans-serif", textTransform: 'uppercase' },
  gridQuery: { color: '#fff', fontSize: '20px', fontWeight: 800, margin: '0 0 4px', fontFamily: "'Syne',sans-serif" },
  gridCount: { color: '#444', fontSize: '12px', margin: 0, fontFamily: "'Syne',sans-serif" },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px', padding: '0 14px'
  },

  emptyWrap: { height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#444', fontSize: '15px', fontFamily: "'Syne',sans-serif" },

  bannerAd: {
    position: 'fixed', bottom: '68px', left: 0, right: 0,
    height: '50px', background: '#000',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderTop: '1px solid #111', borderBottom: '1px solid #111',
    zIndex: 40, overflow: 'hidden'
  }
};

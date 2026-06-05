import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchEpornerBatch } from '../lib/eporner';

const SORTS = [
  { key: 'trending', label: 'Trending' },
  { key: 'latest', label: 'Latest' },
  { key: 'oldest', label: 'Oldest' }
];

export default function Videos() {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [sort, setSort] = useState('trending');
  const [query, setQuery] = useState('');
  const [input, setInput] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const seen = useRef(new Set());

  const load = async (pageNum, reset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const { videos: data, nextPage, hasMore: more } = await fetchEpornerBatch({
        sort,
        query,
        page: pageNum,
        pages: 3
      });
      const fresh = data.filter(v => !seen.current.has(v.id));
      fresh.forEach(v => seen.current.add(v.id));
      setVideos(prev => reset ? fresh : [...prev, ...fresh]);
      setPage(nextPage - 1);
      setHasMore(more && data.length > 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    seen.current = new Set();
    setVideos([]);
    setPage(0);
    setHasMore(true);
    load(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, query]);

  const submit = (e) => {
    e.preventDefault();
    setQuery(input.trim());
  };

  return (
    <main style={s.wrap}>
      <div style={s.header}>
        <h1 style={s.title}>Videos</h1>
        <form onSubmit={submit} style={s.search}>
          <input value={input} onChange={e => setInput(e.target.value)} placeholder="Search videos" style={s.input} />
          <button style={s.searchBtn}>Search</button>
        </form>
        <div style={s.sorts}>
          {SORTS.map(opt => (
            <button key={opt.key} onClick={() => setSort(opt.key)} style={{ ...s.sortBtn, ...(sort === opt.key ? s.sortActive : {}) }}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <section style={s.grid}>
        {videos.map(video => <VideoCard key={video.id} video={video} onClick={() => navigate(`/videos/${video.id}`)} />)}
      </section>

      {loading && <Loader />}
      {!loading && videos.length === 0 && <p style={s.empty}>No videos found.</p>}

      <div style={s.pager}>
        <button disabled={page <= 2 || loading} onClick={() => {
          const prev = Math.max(0, page - 5);
          seen.current = new Set();
          setVideos([]);
          load(prev, true);
        }} style={s.pageBtn}>Previous</button>
        <span style={s.pageText}>Page {Math.floor(page / 3) + 1}</span>
        <button disabled={!hasMore || loading} onClick={() => load(page + 1, false)} style={s.pageBtn}>Next</button>
      </div>
    </main>
  );
}

export function VideoCard({ video, onClick, compact = false }) {
  const duration = video.duration ? `${Math.floor(video.duration / 60)}:${String(video.duration % 60).padStart(2, '0')}` : '';
  const views = (video.view_count || 0).toLocaleString();

  return (
    <article onClick={onClick} style={compact ? s.compactCard : s.card}>
      <div style={compact ? s.compactThumb : s.thumb}>
        {video.thumbnail_url ? <img src={video.thumbnail_url} alt={video.title} style={s.img} loading="lazy" /> : <div style={s.fallback}>Play</div>}
        {duration && <span style={s.duration}>{duration}</span>}
      </div>
      <div style={compact ? s.compactInfo : s.info}>
        <h2 style={compact ? s.compactTitle : s.cardTitle}>{video.title}</h2>
        <p style={s.meta}>{views} views</p>
      </div>
    </article>
  );
}

export function Loader() {
  return <div style={s.loader}><div style={s.spinner} /></div>;
}

const glass = {
  background: 'rgba(26,107,255,0.1)',
  border: '1px solid rgba(26,107,255,0.24)',
  backdropFilter: 'blur(16px)'
};

const s = {
  wrap: { minHeight: '100vh', background: '#050508', color: '#fff', fontFamily: "'Syne',sans-serif", padding: '22px 16px 92px' },
  header: { display: 'grid', gap: '14px', maxWidth: '1200px', margin: '0 auto 18px' },
  title: { margin: 0, fontSize: '28px', fontWeight: 800 },
  search: { display: 'flex', gap: '8px', ...glass, borderRadius: '12px', padding: '8px' },
  input: { flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '15px', fontFamily: "'Syne',sans-serif" },
  searchBtn: { border: 'none', borderRadius: '8px', background: '#1a6bff', color: '#fff', fontWeight: 800, padding: '9px 13px', cursor: 'pointer', fontFamily: "'Syne',sans-serif" },
  sorts: { display: 'flex', gap: '8px', overflowX: 'auto' },
  sortBtn: { ...glass, color: '#8fb5ff', borderRadius: '20px', padding: '8px 13px', fontWeight: 800, border: '1px solid rgba(26,107,255,0.2)', cursor: 'pointer', fontFamily: "'Syne',sans-serif" },
  sortActive: { background: '#1a6bff', color: '#fff' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '18px', maxWidth: '1200px', margin: '0 auto' },
  card: { cursor: 'pointer' },
  thumb: { aspectRatio: '16/9', background: '#0a0f1d', borderRadius: '8px', overflow: 'hidden', position: 'relative' },
  img: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  fallback: { height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7aabff' },
  duration: { position: 'absolute', right: '6px', bottom: '6px', background: 'rgba(0,0,0,0.78)', borderRadius: '4px', padding: '3px 5px', fontSize: '11px', fontWeight: 800 },
  info: { paddingTop: '9px' },
  cardTitle: { margin: '0 0 5px', color: '#f5f7ff', fontSize: '14px', lineHeight: 1.35, fontWeight: 800, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  meta: { margin: 0, color: '#71809d', fontSize: '12px' },
  pager: { maxWidth: '1200px', margin: '28px auto 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' },
  pageBtn: { ...glass, color: '#fff', borderRadius: '8px', padding: '10px 14px', fontWeight: 800, cursor: 'pointer', fontFamily: "'Syne',sans-serif" },
  pageText: { color: '#7aabff', fontSize: '13px', fontWeight: 800 },
  loader: { display: 'flex', justifyContent: 'center', padding: '34px' },
  spinner: { width: '34px', height: '34px', borderRadius: '50%', border: '2px solid rgba(26,107,255,0.16)', borderTopColor: '#1a6bff', animation: 'spin 0.8s linear infinite' },
  empty: { textAlign: 'center', color: '#71809d', marginTop: '70px' },
  compactCard: { display: 'grid', gridTemplateColumns: '138px 1fr', gap: '10px', cursor: 'pointer' },
  compactThumb: { aspectRatio: '16/9', background: '#0a0f1d', borderRadius: '8px', overflow: 'hidden', position: 'relative' },
  compactInfo: { minWidth: 0 },
  compactTitle: { margin: '0 0 5px', color: '#f5f7ff', fontSize: '13px', lineHeight: 1.3, fontWeight: 800, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }
};

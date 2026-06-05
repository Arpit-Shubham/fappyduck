import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { fetchEpornerBatch, fetchEpornerVideo, fetchSimilarVideos } from '../lib/eporner';
import { addToHistory, fetchComments, postComment, isLiked, toggleLike } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Loader, VideoCard } from './Videos';

export default function VideoWatch() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const routedVideo = location.state?.video || null;
  const [video, setVideo] = useState(routedVideo);
  const [similar, setSimilar] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [search, setSearch] = useState('');
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [similarPage, setSimilarPage] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function loadVideo() {
      setLoading(true);
      try {
        const current = routedVideo?.id === id ? routedVideo : await fetchEpornerVideo(id);
        if (cancelled) return;
        setVideo(current);
        setLikeCount(current.like_count || 0);
        fetchComments(id).then(data => !cancelled && setComments(data));
        if (user?.id) {
          isLiked(id, user.id).then(v => !cancelled && setLiked(v));
          addToHistory(id, user.id, current);
        }
        const related = await fetchSimilarVideos(current, 0);
        if (!cancelled) {
          const clean = (related.videos || []).filter(v => v.id !== id);
          setSimilar(clean);
          if (clean.length === 0) {
            const backup = await fetchEpornerBatch({ sort: 'trending', page: 0, pages: 4 });
            if (!cancelled) setSimilar(backup.videos.filter(v => v.id !== id));
          }
        }
      } catch {
        const fallback = await fetchEpornerBatch({ sort: 'trending', page: 0, pages: 4 });
        if (!cancelled) {
          const found = fallback.videos.find(v => v.id === id) || fallback.videos[0] || null;
          setVideo(found);
          setSimilar(fallback.videos.filter(v => v.id !== found?.id));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadVideo();
    return () => { cancelled = true; };
  }, [id, user?.id, routedVideo]);

  const submitSearch = async (e) => {
    e.preventDefault();
    const q = search.trim();
    if (!q) return navigate('/videos');
    setLoading(true);
    const result = await fetchEpornerBatch({ query: q, sort: 'trending', page: 0, pages: 4 });
    setSimilar(result.videos.filter(v => v.id !== id));
    setLoading(false);
  };

  const post = async () => {
    if (!user?.id) return alert('Sign in to comment');
    if (!commentText.trim()) return;
    const saved = await postComment(id, user.id, commentText.trim()).catch(() => null);
    if (saved) setComments(prev => [saved, ...prev]);
    setCommentText('');
  };

  const like = async () => {
    if (!user?.id) return alert('Please sign in to like videos.');
    const result = await toggleLike(id, user.id);
    setLiked(result.liked);
    setLikeCount(result.likeCount);
  };

  const loadMoreSimilar = async () => {
    if (!video) return;
    const next = similarPage + 2;
    const result = await fetchSimilarVideos(video, next);
    const seen = new Set(similar.map(v => v.id));
    setSimilar(prev => [...prev, ...result.videos.filter(v => v.id !== id && !seen.has(v.id))]);
    setSimilarPage(next);
  };

  if (loading && !video) return <div style={s.wrap}><Loader /></div>;
  if (!video) return <div style={s.wrap}><p style={s.empty}>Video could not be loaded.</p></div>;

  return (
    <main style={s.wrap}>
      <style>{`@media (max-width: 900px){.watch-layout{grid-template-columns:1fr!important}.watch-side{padding-top:8px}}`}</style>
      <form onSubmit={submitSearch} style={s.searchPane}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search videos" style={s.searchInput} />
        <button style={s.searchBtn}>Search</button>
      </form>

      <div className="watch-layout" style={s.layout}>
        <section style={s.main}>
          <div style={s.playerBox}>
            <iframe
              src={`${video.embed_url}?autoplay=1`}
              title={video.title}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              frameBorder="0"
              scrolling="no"
              style={s.iframe}
            />
          </div>

          <h1 style={s.title}>{video.title}</h1>
          <div style={s.actions}>
            <span style={s.meta}>{(video.view_count || 0).toLocaleString()} views</span>
            <button onClick={like} style={{ ...s.actionBtn, ...(liked ? s.activeBtn : {}) }}>{liked ? 'Liked' : 'Like'} {likeCount ? likeCount : ''}</button>
            <button onClick={() => navigator.clipboard.writeText(window.location.href)} style={s.actionBtn}>Share</button>
            <button onClick={() => navigate(`/reels/${video.id}`)} style={s.primaryBtn}>Reel View</button>
          </div>

          {video.tags?.length > 0 && (
            <div style={s.tags}>
              {video.tags.slice(0, 10).map(tag => (
                <button key={tag} onClick={() => { setSearch(tag); }} style={s.tag}>#{tag}</button>
              ))}
            </div>
          )}

          <section style={s.comments}>
            <h2 style={s.sectionTitle}>Comments</h2>
            <div style={s.commentInput}>
              <input value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => e.key === 'Enter' && post()} placeholder="Add a comment..." style={s.commentField} />
              <button onClick={post} style={s.searchBtn}>Comment</button>
            </div>
            {comments.length === 0 && <p style={s.emptySmall}>No comments yet.</p>}
            {comments.map((c, i) => (
              <div key={c.id || i} style={s.comment}>
                <div style={s.avatar}>{(c.profiles?.username || 'U')[0].toUpperCase()}</div>
                <div>
                  <strong style={s.user}>{c.profiles?.username || 'User'}</strong>
                  <p style={s.commentText}>{c.text}</p>
                </div>
              </div>
            ))}
          </section>
        </section>

        <aside className="watch-side" style={s.side}>
          <h2 style={s.sectionTitle}>Similar videos</h2>
          <div style={s.similarList}>
            {similar.map(v => <VideoCard key={v.id} video={v} compact onClick={() => navigate(`/videos/${v.id}`, { state: { video: v } })} />)}
          </div>
          <button onClick={loadMoreSimilar} style={s.moreBtn}>More similar videos</button>
        </aside>
      </div>
      <div style={s.bannerAd}><AdsterraBanner /></div>
    </main>
  );
}

function AdsterraBanner() {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || el.dataset.loaded) return;
    el.dataset.loaded = 'true';
    window.atOptions = { key: 'c5831a750d0ec46ab4e86855aa45bdc1', format: 'iframe', height: 50, width: 320, params: {} };
    const s = document.createElement('script');
    s.type = 'text/javascript';
    s.async = true;
    s.src = 'https://scarleterror.com/c5831a750d0ec46ab4e86855aa45bdc1/invoke.js';
    el.appendChild(s);
  }, []);
  return <div ref={ref} style={{ width: '320px', height: '50px', overflow: 'hidden' }} />;
}

const glass = {
  background: 'rgba(26,107,255,0.1)',
  border: '1px solid rgba(26,107,255,0.24)',
  backdropFilter: 'blur(16px)'
};

const s = {
  wrap: { minHeight: '100dvh', height: 'auto', overflowY: 'auto', background: '#050508', color: '#fff', fontFamily: "'Syne',sans-serif", padding: '14px 14px 142px' },
  searchPane: { ...glass, maxWidth: '1200px', margin: '0 auto 16px', borderRadius: '12px', padding: '8px', display: 'flex', gap: '8px', position: 'sticky', top: 0, zIndex: 5 },
  searchInput: { flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '15px', fontFamily: "'Syne',sans-serif" },
  searchBtn: { border: 'none', borderRadius: '8px', background: '#1a6bff', color: '#fff', fontWeight: 800, padding: '9px 13px', cursor: 'pointer', fontFamily: "'Syne',sans-serif" },
  layout: { maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: '22px' },
  main: { minWidth: 0 },
  playerBox: { aspectRatio: '16/9', background: '#000', borderRadius: '8px', overflow: 'hidden' },
  iframe: { width: '100%', height: '100%', border: 'none', display: 'block' },
  title: { margin: '14px 0 10px', fontSize: '20px', lineHeight: 1.3, fontWeight: 800 },
  actions: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '9px', marginBottom: '10px' },
  meta: { color: '#8797b7', fontSize: '13px', marginRight: 'auto' },
  actionBtn: { ...glass, color: '#fff', borderRadius: '20px', padding: '8px 13px', fontWeight: 800, cursor: 'pointer', fontFamily: "'Syne',sans-serif" },
  activeBtn: { background: 'rgba(255,59,107,0.2)', borderColor: 'rgba(255,59,107,0.4)' },
  primaryBtn: { border: 'none', background: '#1a6bff', color: '#fff', borderRadius: '20px', padding: '9px 14px', fontWeight: 800, cursor: 'pointer', fontFamily: "'Syne',sans-serif" },
  tags: { display: 'flex', flexWrap: 'wrap', gap: '8px', margin: '12px 0 18px' },
  tag: { ...glass, color: '#8fb5ff', borderRadius: '18px', padding: '7px 11px', fontWeight: 800, cursor: 'pointer', fontFamily: "'Syne',sans-serif" },
  comments: { borderTop: '1px solid rgba(26,107,255,0.15)', paddingTop: '16px' },
  sectionTitle: { margin: '0 0 12px', fontSize: '15px', fontWeight: 800 },
  commentInput: { display: 'flex', gap: '8px', marginBottom: '16px' },
  commentField: { flex: 1, minWidth: 0, ...glass, borderRadius: '10px', color: '#fff', outline: 'none', padding: '10px 12px', fontFamily: "'Syne',sans-serif" },
  comment: { display: 'flex', gap: '10px', marginBottom: '15px' },
  avatar: { width: '34px', height: '34px', borderRadius: '50%', background: '#1a6bff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 },
  user: { color: '#8fb5ff', fontSize: '12px' },
  commentText: { margin: '3px 0 0', color: '#d8deee', fontSize: '13px', lineHeight: 1.45 },
  side: { minWidth: 0 },
  similarList: { display: 'grid', gap: '12px' },
  moreBtn: { width: '100%', marginTop: '15px', ...glass, color: '#fff', borderRadius: '8px', padding: '11px', fontWeight: 800, cursor: 'pointer', fontFamily: "'Syne',sans-serif" },
  empty: { color: '#8797b7', textAlign: 'center', marginTop: '80px' },
  emptySmall: { color: '#71809d', fontSize: '13px' },
  bannerAd: { position: 'fixed', bottom: '68px', left: 0, right: 0, height: '50px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', borderTop: '1px solid #111', borderBottom: '1px solid #111', zIndex: 40, overflow: 'hidden' }
};

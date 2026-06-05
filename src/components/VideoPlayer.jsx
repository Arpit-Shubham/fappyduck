// src/components/VideoPlayer.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toggleLike, isLiked, addToHistory, fetchComments, postComment } from '../lib/supabase';

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const HeartIcon = ({ filled }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <path d="M12 21C12 21 3 15.5 3 9a5 5 0 019-3 5 5 0 019 3c0 6.5-9 12-9 12z"
      fill={filled ? '#ff3b6b' : 'none'} stroke={filled ? '#ff3b6b' : 'rgba(255,255,255,0.9)'}
      strokeWidth="1.8" strokeLinejoin="round"/>
  </svg>
);
const CommentIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
      stroke="rgba(255,255,255,0.9)" strokeWidth="1.8" strokeLinejoin="round"/>
  </svg>
);
const ShareIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <circle cx="18" cy="5" r="3" stroke="rgba(255,255,255,0.9)" strokeWidth="1.8"/>
    <circle cx="6" cy="12" r="3" stroke="rgba(255,255,255,0.9)" strokeWidth="1.8"/>
    <circle cx="18" cy="19" r="3" stroke="rgba(255,255,255,0.9)" strokeWidth="1.8"/>
    <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" stroke="rgba(255,255,255,0.9)" strokeWidth="1.8"/>
  </svg>
);
const EyeIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="rgba(255,255,255,0.9)" strokeWidth="1.8"/>
    <circle cx="12" cy="12" r="3" stroke="rgba(255,255,255,0.9)" strokeWidth="1.8"/>
  </svg>
);
const TagIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"
      stroke="rgba(255,255,255,0.9)" strokeWidth="1.8" strokeLinejoin="round"/>
    <circle cx="7" cy="7" r="1.5" fill="rgba(255,255,255,0.9)"/>
  </svg>
);
const FullscreenIcon = ({ active }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    {active
      ? <path d="M8 3v5H3M16 3v5h5M8 21v-5H3M16 21v-5h5"
          stroke="rgba(255,255,255,0.9)" strokeWidth="1.8" strokeLinecap="round"/>
      : <path d="M8 3H5a2 2 0 00-2 2v3M16 3h3a2 2 0 012 2v3M8 21H5a2 2 0 01-2-2v-3M16 21h3a2 2 0 002-2v-3"
          stroke="rgba(255,255,255,0.9)" strokeWidth="1.8" strokeLinecap="round"/>
    }
  </svg>
);
const DuckLogo = () => (
  <svg width="22" height="22" viewBox="0 0 40 40" fill="none">
    <ellipse cx="20" cy="26" rx="13" ry="9" fill="#fff" opacity="0.9"/>
    <circle cx="26" cy="15" r="8" fill="#fff" opacity="0.9"/>
    <ellipse cx="33" cy="17" rx="5" ry="3" fill="#ddd" opacity="0.9"/>
    <circle cx="29" cy="13" r="1.5" fill="#111"/>
    <path d="M34 16.5c1.5 0 3 .5 3 1.5s-1.5 1-3 1" fill="#f5c842" opacity="0.9"/>
  </svg>
);

// ── Adsterra Preroll ──────────────────────────────────────────────────────────
function AdsterraPreroll() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || el.dataset.loaded) return;
    el.dataset.loaded = 'true';
    const s1 = document.createElement('script');
    s1.type = 'text/javascript';
    s1.text = `atOptions={'key':'c5831a750d0ec46ab4e86855aa45bdc1','format':'iframe','height':50,'width':320,'params':{}};`;
    const s2 = document.createElement('script');
    s2.type = 'text/javascript'; s2.async = true;
    s2.src = 'https://scarleterror.com/c5831a750d0ec46ab4e86855aa45bdc1/invoke.js';
    el.appendChild(s1); el.appendChild(s2);
  }, []);
  return <div ref={ref} style={{ width: '320px', height: '50px', margin: '10px auto 0', borderRadius: '6px', overflow: 'hidden' }} />;
}

// ── Main VideoPlayer ──────────────────────────────────────────────────────────
export default function VideoPlayer({ video, userId, isActive, onTagSearch, feedRef }) {
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const [liked, setLiked]               = useState(false);
  const [likeCount, setLikeCount]       = useState(video.like_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments]         = useState([]);
  const [commentText, setCommentText]   = useState('');
  const [adShown, setAdShown]           = useState(false);
  const [adCountdown, setAdCountdown]   = useState(5);
  const [showAd, setShowAd]             = useState(false);
  const [showTags, setShowTags]         = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const adTriggered = useRef(false);
  const engageTimer = useRef(null);
  const viewTracked = useRef(false);
  const tags        = Array.isArray(video.tags) ? video.tags : [];

  // ── Reset when video changes ──────────────────────────────────────────────
  useEffect(() => {
    adTriggered.current = false;
    viewTracked.current = false;
    setAdShown(false); setShowAd(false);
  }, [video.id]);

  // ── Active / inactive ─────────────────────────────────────────────────────
  useEffect(() => {
    if (isActive) {
      adTriggered.current = false;
      // 3s engagement → show ad once
      if (!adShown) {
        clearTimeout(engageTimer.current);
        engageTimer.current = setTimeout(() => {
          if (!adTriggered.current) {
            adTriggered.current = true;
            setShowAd(false);
          }
        }, 3000);
      }
      // Track view after 5s
      if (!viewTracked.current) {
        setTimeout(() => {
          if (!viewTracked.current) {
            viewTracked.current = true;
            if (userId) addToHistory(video.id, userId, {
              title: video.title, thumbnail_url: video.thumbnail_url,
              duration: video.duration, embed_url: video.embed_url
            });
          }
        }, 5000);
      }
    } else {
      clearTimeout(engageTimer.current);
      setShowAd(false); setShowTags(false); setShowComments(false);
    }
    return () => clearTimeout(engageTimer.current);
  }, [isActive]); // eslint-disable-line

  // ── Ad countdown ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!showAd) return;
    setAdCountdown(5);
    const iv = setInterval(() => {
      setAdCountdown(p => {
        if (p <= 1) { clearInterval(iv); setShowAd(false); setAdShown(true); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [showAd]);

  // ── Fullscreen listener ───────────────────────────────────────────────────
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // ── Like state ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (userId) isLiked(video.id, userId).then(setLiked);
  }, [video.id, userId]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleLike = async () => {
    if (!userId) { alert('Please sign in to like videos.'); return; }
    const result = await toggleLike(video.id, userId);
    setLiked(result.liked); setLikeCount(result.likeCount);
  };

  const handleComments = async () => {
    setShowComments(true);
    const data = await fetchComments(video.id).catch(() => []);
    setComments(data);
  };

  const handlePost = async () => {
    if (!userId) { alert('Sign in to comment'); return; }
    if (!commentText.trim()) return;
    const c = await postComment(video.id, userId, commentText.trim()).catch(() => null);
    if (c) setComments(prev => [c, ...prev]);
    setCommentText('');
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/reels/${video.id}`;
    if (navigator.share) await navigator.share({ title: video.title, url });
    else { await navigator.clipboard.writeText(url); alert('Link copied!'); }
  };

  // Fullscreen the FEED container so reel scrolling works in fullscreen
  const handleFullscreen = async () => {
    const el = feedRef?.current || containerRef.current;
    if (!document.fullscreenElement) {
      try { await el.requestFullscreen(); } catch {
        try { await containerRef.current.requestFullscreen(); } catch {}
      }
    } else {
      try { await document.exitFullscreen(); } catch {}
    }
  };

  const handleTagClick = (tag) => {
    setShowTags(false);
    if (onTagSearch) onTagSearch(tag);
  };

  const formatCount = n => n >= 1000000 ? (n/1000000).toFixed(1)+'M' : n >= 1000 ? (n/1000).toFixed(1)+'K' : String(n||0);
  const formatDate  = d => { try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return ''; } };
  const embedSrc    = isActive
    ? `${video.embed_url}?autoplay=1&mute=0&loop=1`
    : '';

  return (
    <div ref={containerRef} style={st.container}>
      <style>{`@keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}.sheet-anim{animation:sheetUp 0.25s ease}`}</style>

      {/* ── eporner iframe ───────────────────────────────────────────────── */}
      <iframe
        src={embedSrc}
        style={st.iframe}
        allowFullScreen
        allow="autoplay; fullscreen; picture-in-picture"
        title={video.title}
        scrolling="no"
        frameBorder="0"
      />

      {/* Thumbnail when inactive */}
      {!isActive && video.thumbnail_url && (
        <div style={st.thumbWrap}>
          <img src={video.thumbnail_url} alt={video.title} style={st.thumbImg} />
        </div>
      )}

      {/* Pre-roll ad */}
      {showAd && (
        <div style={st.adOverlay}>
          <div style={st.adBox}>
            <p style={st.adLabel}>ADVERTISEMENT</p>
            <AdsterraPreroll />
          </div>
          <div style={st.adTimer}>Ad ends in {adCountdown}s</div>
        </div>
      )}

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div style={st.topBar}>
        <div style={st.brandRow}>
          <DuckLogo />
          <span style={st.brandText}>FappyDuck</span>
        </div>
        <div style={st.topActions}>
          <button onClick={() => navigate(`/videos/${video.id}`)} style={st.watchBtn} title="Classic video view">
            Watch
          </button>
          <button onClick={handleFullscreen} style={st.topBtn} title="Fullscreen">
            <FullscreenIcon active={isFullscreen} />
          </button>
        </div>
      </div>

      {/* ── Bottom info ──────────────────────────────────────────────────── */}
      <div style={st.bottomArea}>
        <p style={st.title}>{video.title}</p>
        <p style={st.date}>{formatDate(video.created_at)}</p>
      </div>

      {/* ── Right actions ─────────────────────────────────────────────────── */}
      <div style={st.actions}>
        <Btn icon={<HeartIcon filled={liked} />}  label={formatCount(likeCount)} onClick={handleLike}              active={liked}  color="#ff3b6b" />
        <Btn icon={<CommentIcon />}               label="Comment"                onClick={handleComments}           color="#1a6bff" />
        <Btn icon={<ShareIcon />}                 label="Share"                  onClick={handleShare}              color="#1a6bff" />
        {tags.length > 0 && (
          <Btn icon={<TagIcon />}                 label="Tags"                   onClick={() => setShowTags(true)}  color="#1a6bff" />
        )}
        <Btn icon={<EyeIcon />} label={formatCount(video.view_count || 0)} color="#888" />
      </div>

      {/* ── Tags sheet ───────────────────────────────────────────────────── */}
      {showTags && (
        <Sheet onClose={() => setShowTags(false)} title="TAGS">
          <div style={st.tagsList}>
            {tags.map((tag, i) => (
              <button key={i} style={st.tagPill} onClick={() => handleTagClick(tag)}>#{tag}</button>
            ))}
          </div>
          <p style={st.tagHint}>Tap a tag to browse related videos</p>
        </Sheet>
      )}

      {/* ── Comments sheet ───────────────────────────────────────────────── */}
      {showComments && (
        <Sheet onClose={() => setShowComments(false)} title="COMMENTS" tall>
          <div style={st.commentsList}>
            {comments.length === 0 && <p style={st.noComments}>No comments yet. Be first!</p>}
            {comments.map((c, i) => (
              <div key={c.id || i} style={st.comment}>
                <div style={st.cAvatar}>{(c.profiles?.username||'U')[0].toUpperCase()}</div>
                <div>
                  <span style={st.cUser}>{c.profiles?.username||'User'}</span>
                  <span style={st.cText}>{c.text}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={st.cInput}>
            <input value={commentText} onChange={e => setCommentText(e.target.value)}
              placeholder="Add a comment..." style={st.cField}
              onKeyDown={e => e.key === 'Enter' && handlePost()} />
            <button onClick={handlePost} style={st.sendBtn}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </Sheet>
      )}
    </div>
  );
}

function Sheet({ onClose, title, children, tall }) {
  return (
    <div style={st.sheetBackdrop} onClick={onClose}>
      <div className="sheet-anim" style={{ ...st.sheetCard, ...(tall ? { height: '65%' } : {}) }}
        onClick={e => e.stopPropagation()}>
        <div style={st.sheetHandle} />
        <div style={st.sheetHdr}>
          <p style={st.sheetTitle}>{title}</p>
          <button onClick={onClose} style={st.sheetX}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="#888" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Btn({ icon, label, onClick, active, color }) {
  return (
    <button onClick={onClick} style={st.actionBtn}>
      <div style={{ ...st.actionCircle, boxShadow: active ? `0 0 16px ${color}55` : 'none' }}>{icon}</div>
      {label && <span style={{ ...st.actionLabel, color: active ? color : 'rgba(255,255,255,0.85)' }}>{label}</span>}
    </button>
  );
}

const glassBtn = {
  background: 'rgba(255,255,255,0.09)', backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '8px', padding: '6px 8px', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center'
};

const st = {
  container:  { position: 'relative', width: '100%', height: '100%', background: '#000', overflow: 'hidden' },
  iframe:     { width: '100%', height: '100%', border: 'none', display: 'block' },
  thumbWrap:  { position: 'absolute', inset: 0, zIndex: 2 },
  thumbImg:   { width: '100%', height: '100%', objectFit: 'cover' },
  adOverlay:  { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.93)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  adBox:      { width: '90%', maxWidth: '360px', background: '#0a1020', border: '1px solid rgba(26,107,255,0.25)', borderRadius: '16px', padding: '22px 20px', textAlign: 'center' },
  adLabel:    { color: '#1a6bff', fontSize: '10px', fontWeight: 800, letterSpacing: '2px', margin: '0 0 10px', fontFamily: "'Syne',sans-serif" },
  adTimer:    { marginTop: '18px', color: '#999', fontSize: '13px', background: 'rgba(26,107,255,0.12)', border: '1px solid rgba(26,107,255,0.25)', padding: '6px 18px', borderRadius: '20px', fontFamily: "'Syne',sans-serif" },
  topBar:     { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '52px 14px 12px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 100%)' },
  brandRow:   { display: 'flex', alignItems: 'center', gap: '7px' },
  brandText:  { color: '#fff', fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '15px', textShadow: '0 0 20px rgba(26,107,255,0.5)' },
  topActions: { display: 'flex', alignItems: 'center', gap: '8px' },
  watchBtn:   { ...glassBtn, color: '#fff', fontSize: '12px', fontWeight: 800, fontFamily: "'Syne',sans-serif", padding: '7px 11px' },
  topBtn:     { ...glassBtn },
  bottomArea: { position: 'absolute', bottom: '80px', left: 0, right: '72px', zIndex: 3, padding: '0 14px 10px', background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)' },
  title:      { color: '#fff', fontSize: '14px', fontWeight: 700, margin: '0 0 3px', lineHeight: 1.35, textShadow: '0 1px 6px rgba(0,0,0,0.9)' },
  date:       { color: 'rgba(255,255,255,0.45)', fontSize: '11px', margin: 0 },
  actions:    { position: 'absolute', right: '10px', bottom: '120px', display: 'flex', flexDirection: 'column', gap: '14px', zIndex: 3, alignItems: 'center' },
  actionBtn:  { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', padding: 0, WebkitTapHighlightColor: 'transparent' },
  actionCircle: { width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.09)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.13)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'box-shadow 0.2s' },
  actionLabel:  { fontSize: '11px', fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.9)', fontFamily: "'Syne',sans-serif" },
  sheetBackdrop: { position: 'absolute', inset: 0, zIndex: 20, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end' },
  sheetCard:  { width: '100%', background: 'rgba(7,11,22,0.97)', backdropFilter: 'blur(24px)', borderRadius: '22px 22px 0 0', border: '1px solid rgba(26,107,255,0.14)', borderBottom: 'none', display: 'flex', flexDirection: 'column', paddingBottom: '20px' },
  sheetHandle: { width: '38px', height: '4px', background: 'rgba(26,107,255,0.38)', borderRadius: '2px', margin: '14px auto 0' },
  sheetHdr:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px 6px' },
  sheetTitle: { color: 'rgba(26,107,255,0.75)', fontSize: '11px', fontWeight: 800, letterSpacing: '2px', margin: 0, fontFamily: "'Syne',sans-serif" },
  sheetX:     { background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' },
  tagsList:   { display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '8px 16px 4px', overflowY: 'auto', maxHeight: '260px' },
  tagPill:    { background: 'rgba(26,107,255,0.1)', border: '1px solid rgba(26,107,255,0.28)', borderRadius: '20px', color: '#7aabff', fontSize: '13px', fontWeight: 600, padding: '6px 14px', cursor: 'pointer', fontFamily: "'Syne',sans-serif", WebkitTapHighlightColor: 'transparent' },
  tagHint:    { color: '#333', fontSize: '11px', textAlign: 'center', margin: '10px 0 0', fontFamily: "'Syne',sans-serif" },
  commentsList: { flex: 1, overflowY: 'auto', padding: '8px 16px' },
  noComments: { color: '#444', textAlign: 'center', marginTop: '30px', fontSize: '14px', fontFamily: "'Syne',sans-serif" },
  comment:    { marginBottom: '14px', display: 'flex', gap: '10px', alignItems: 'flex-start' },
  cAvatar:    { width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#1a6bff,#0044cc)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 800 },
  cUser:      { color: '#1a6bff', fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '2px', fontFamily: "'Syne',sans-serif" },
  cText:      { color: '#ccc', fontSize: '13px', lineHeight: 1.4, display: 'block' },
  cInput:     { display: 'flex', gap: '10px', padding: '10px 16px', borderTop: '1px solid rgba(26,107,255,0.1)', alignItems: 'center' },
  cField:     { flex: 1, background: 'rgba(26,107,255,0.07)', border: '1px solid rgba(26,107,255,0.2)', borderRadius: '20px', color: '#fff', padding: '10px 16px', fontSize: '14px', outline: 'none', fontFamily: "'Syne',sans-serif" },
  sendBtn:    { width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg,#1a6bff,#0044cc)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(26,107,255,0.45)' },
};

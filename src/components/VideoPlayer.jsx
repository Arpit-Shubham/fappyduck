// src/components/VideoPlayer.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { toggleLike, isLiked, addToHistory, fetchComments, postComment, incrementView } from '../lib/supabase';

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const HeartIcon = ({ filled }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <path d="M12 21C12 21 3 15.5 3 9a5 5 0 019-3 5 5 0 019 3c0 6.5-9 12-9 12z"
      fill={filled ? '#ff3b6b' : 'none'}
      stroke={filled ? '#ff3b6b' : 'rgba(255,255,255,0.9)'}
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
const FitIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="rgba(255,255,255,0.85)" strokeWidth="1.8"/>
    <path d="M8 3v3H3M16 3v3h5M8 21v-3H3M16 21v-3h5" stroke="rgba(255,255,255,0.85)" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);
const FullscreenIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M8 3H5a2 2 0 00-2 2v3M16 3h3a2 2 0 012 2v3M8 21H5a2 2 0 01-2-2v-3M16 21h3a2 2 0 002-2v-3"
      stroke="rgba(255,255,255,0.9)" strokeWidth="1.8" strokeLinecap="round"/>
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

const FIT_MODES  = ['cover', 'contain', 'fill'];
const FIT_LABELS = { cover: 'Best Fit', contain: 'Full View', fill: 'Stretch' };


// ── Adsterra preroll ──────────────────────────────────────────────────────────
function AdsterraPreroll() {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || el.dataset.loaded) return;
    el.dataset.loaded = 'true';
    const s1 = document.createElement('script');
    s1.type = 'text/javascript';
    s1.text = `atOptions={'key':'6088494202eb2287cc5144d18f71f3ab','format':'iframe','height':50,'width':320,'params':{}};`;
    const s2 = document.createElement('script');
    s2.type = 'text/javascript';
    s2.src = 'https://www.topcreativeformat.com/6088494202eb2287cc5144d18f71f3ab/invoke.js';
    el.appendChild(s1); el.appendChild(s2);
  }, []);
  return <div ref={ref} style={{ width: '320px', height: '50px', margin: '10px auto 0', borderRadius: '6px', overflow: 'hidden' }} />;
}

export default function VideoPlayer({ video, userId, isActive }) {
  const videoRef     = useRef(null);
  const iframeRef    = useRef(null);
  const containerRef = useRef(null);
  const hlsRef       = useRef(null);

  const [liked, setLiked]             = useState(false);
  const [likeCount, setLikeCount]     = useState(video.like_count || 0);
  const [viewCount, setViewCount]     = useState(video.view_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments]       = useState([]);
  const [commentText, setCommentText] = useState('');
  const [playing, setPlaying]         = useState(false);
  const [adShown, setAdShown]         = useState(false);
  const [adCountdown, setAdCountdown] = useState(5);
  const [showAd, setShowAd]           = useState(false);
  const [progress, setProgress]       = useState(0);
  const [duration, setDuration]       = useState(0);
  const [seeking, setSeeking]         = useState(false);
  const [fitMode, setFitMode]         = useState(0);
  const [fitPopup, setFitPopup]       = useState('');
  const [skipAnim, setSkipAnim]       = useState('');
  const [speedActive, setSpeedActive] = useState(false);

  const viewTracked    = useRef(false);
  const tapTimer       = useRef(null);
  const tapCount       = useRef(0);
  const holdTimer      = useRef(null);
  const seekBarRef     = useRef(null);
  const fitPopupTimer  = useRef(null);

  // Is this an eporner embed video?
  const isEmbed = !!video.is_embed;

  // ── HLS / direct video loader (non-embed only) ────────────────────────────
  useEffect(() => {
    if (isEmbed) return;
    const vid = videoRef.current;
    if (!vid || !video.stream_url) return;
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    if (video.stream_url.includes('.m3u8') && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true, startLevel: -1 });
      hls.loadSource(video.stream_url);
      hls.attachMedia(vid);
      hlsRef.current = hls;
    } else {
      vid.src = video.stream_url;
    }
    return () => { if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; } };
  }, [video.stream_url, isEmbed]);

  // ── Play / pause ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (isActive) {
      if (!adShown) { setShowAd(true); return; }
      if (!isEmbed) videoRef.current?.play().catch(() => {});
      setPlaying(true);
    } else {
      if (!isEmbed) videoRef.current?.pause();
      setPlaying(false); setShowAd(false);
    }
  }, [isActive, adShown, isEmbed]);

  // ── Ad countdown ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!showAd) return;
    setAdCountdown(5);
    const iv = setInterval(() => {
      setAdCountdown(p => {
        if (p <= 1) {
          clearInterval(iv);
          setShowAd(false); setAdShown(true);
          if (!isEmbed) videoRef.current?.play().catch(() => {});
          setPlaying(true);
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [showAd, isEmbed]);

  // ── View tracking ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isActive || !playing || viewTracked.current) return;
    const t = setTimeout(async () => {
      viewTracked.current = true;
      if (!isEmbed) {
        const newCount = await incrementView(video.id);
        if (newCount !== null) setViewCount(newCount);
      }
      if (userId) addToHistory(video.id, userId, {
        title: video.title,
        thumbnail_url: video.thumbnail_url,
        duration: video.duration,
        view_count: video.view_count,
        embed_url: video.embed_url
      });
    }, 5000);
    return () => clearTimeout(t);
  }, [isActive, playing, video.id, userId, isEmbed]);

  // ── Like state ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (userId) isLiked(video.id, userId).then(setLiked);
  }, [video.id, userId, isEmbed]);

  // ── Seekbar progress ─────────────────────────────────────────────────────
  useEffect(() => {
    if (isEmbed) return;
    const vid = videoRef.current;
    if (!vid) return;
    const update = () => {
      if (!seeking && vid.duration) {
        setProgress(vid.currentTime / vid.duration);
        setDuration(vid.duration);
      }
    };
    const onLoaded = () => setDuration(vid.duration || 0);
    vid.addEventListener('timeupdate', update);
    vid.addEventListener('loadedmetadata', onLoaded);
    return () => { vid.removeEventListener('timeupdate', update); vid.removeEventListener('loadedmetadata', onLoaded); };
  }, [seeking, isEmbed]);

  // ── Fullscreen ────────────────────────────────────────────────────────────
  useEffect(() => {
    const onChange = () => {};
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const handleLike = async () => {
    if (!userId) { alert('Please sign in to like videos.'); return; }
    if (isEmbed) { setLiked(l => !l); setLikeCount(c => liked ? c - 1 : c + 1); return; }
    const result = await toggleLike(video.id, userId);
    setLiked(result.liked); setLikeCount(result.likeCount);
  };

  const handleComments = async () => {
    setShowComments(true);
    if (!isEmbed) {
      const data = await fetchComments(video.id);
      setComments(data);
    }
  };

  const handlePost = async () => {
    if (!userId) { alert('Sign in to comment'); return; }
    if (!commentText.trim()) return;
    if (isEmbed) {
      setComments(prev => [{ id: Date.now(), text: commentText, profiles: { username: 'You' } }, ...prev]);
      setCommentText(''); return;
    }
    const c = await postComment(video.id, userId, commentText.trim());
    setComments(prev => [c, ...prev]); setCommentText('');
  };

  const handleShare = async () => {
    const url = isEmbed ? video.embed_url : `${window.location.origin}/v/${video.id}`;
    if (navigator.share) await navigator.share({ title: video.title, url });
    else { await navigator.clipboard.writeText(url); alert('Link copied!'); }
  };

  const handleFitToggle = () => {
    if (isEmbed) return; // fit doesn't apply to iframes
    const next = (fitMode + 1) % FIT_MODES.length;
    setFitMode(next);
    setFitPopup(FIT_LABELS[FIT_MODES[next]]);
    if (fitPopupTimer.current) clearTimeout(fitPopupTimer.current);
    fitPopupTimer.current = setTimeout(() => setFitPopup(''), 1500);
  };

  const handleFullscreen = async () => {
    const el = containerRef.current;
    if (!document.fullscreenElement) {
      try { await el.requestFullscreen(); } catch (e) {}
    } else {
      try { await document.exitFullscreen(); } catch (e) {}
    }
  };

  const handleSeekClick = useCallback((e) => {
    if (isEmbed) return;
    const bar = seekBarRef.current;
    const vid = videoRef.current;
    if (!bar || !vid || !vid.duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    vid.currentTime = ratio * vid.duration;
    setProgress(ratio);
  }, [isEmbed]);

  const handleVideoTap = useCallback((e) => {
    if (showAd || showComments || isEmbed) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.touches?.[0]?.clientX ?? e.clientX) - rect.left;
    const side = x < rect.width / 2 ? 'left' : 'right';
    tapCount.current += 1;
    clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => {
      if (tapCount.current === 1) {
        const vid = videoRef.current;
        if (!vid) return;
        if (playing) { vid.pause(); setPlaying(false); }
        else { vid.play(); setPlaying(true); }
      } else {
        const vid = videoRef.current;
        if (!vid) return;
        const delta = side === 'right' ? 10 : -10;
        vid.currentTime = Math.max(0, Math.min(vid.duration || 0, vid.currentTime + delta));
        setSkipAnim(delta > 0 ? '+10s' : '-10s');
        setTimeout(() => setSkipAnim(''), 700);
      }
      tapCount.current = 0;
    }, 250);
  }, [playing, showAd, showComments, isEmbed]);

  const handleTouchStart = useCallback((e) => {
    if (isEmbed) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.touches[0].clientX - rect.left;
    if (x < rect.width / 2) {
      holdTimer.current = setTimeout(() => {
        if (videoRef.current) videoRef.current.playbackRate = 2;
        setSpeedActive(true);
      }, 200);
    }
  }, [isEmbed]);

  const handleTouchEnd = useCallback(() => {
    clearTimeout(holdTimer.current);
    if (speedActive) {
      if (videoRef.current) videoRef.current.playbackRate = 1;
      setSpeedActive(false);
    }
  }, [speedActive]);

  const formatCount = n => n >= 1000000 ? (n/1000000).toFixed(1)+'M' : n >= 1000 ? (n/1000).toFixed(1)+'K' : String(n || 0);
  const formatDate  = d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formatTime  = s => isNaN(s) ? '0:00' : `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;

  const currentObjectFit = FIT_MODES[fitMode];

  // Build eporner embed URL with autoplay when active
  const embedSrc = video.embed_url
    ? `${video.embed_url}?autoplay=${isActive && adShown ? 1 : 0}&mute=0`
    : '';

  return (
    <div ref={containerRef} style={styles.container}>
      <style>{`
        @keyframes skipFade { 0%{opacity:1;transform:scale(1.2)} 100%{opacity:0;transform:scale(0.9)} }
        @keyframes popupFade { 0%{opacity:1;transform:translateY(0)} 80%{opacity:1} 100%{opacity:0;transform:translateY(-8px)} }
        .skip-anim { animation: skipFade 0.7s ease forwards; }
        .fit-popup { animation: popupFade 1.5s ease forwards; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:14px; height:14px; border-radius:50%; background:#fff; cursor:pointer; box-shadow:0 0 6px rgba(26,107,255,0.8); }
        input[type=range]::-webkit-slider-runnable-track { height:3px; border-radius:2px; }
        input[type=range] { -webkit-appearance:none; width:100%; height:3px; outline:none; cursor:pointer; background: linear-gradient(to right, #fff ${(progress*100).toFixed(1)}%, rgba(255,255,255,0.25) ${(progress*100).toFixed(1)}%); }
      `}</style>

      {/* ── Video: iframe for eporner, native video otherwise ─────────────── */}
      {isEmbed ? (
        <iframe
          ref={iframeRef}
          src={isActive && adShown ? embedSrc : ''}
          style={styles.iframe}
          allowFullScreen
          allow="autoplay; fullscreen"
          title={video.title}
          scrolling="no"
          frameBorder="0"
        />
      ) : (
        <video
          ref={videoRef}
          style={{ ...styles.video, objectFit: currentObjectFit }}
          loop playsInline
          poster={video.thumbnail_url}
          onClick={handleVideoTap}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        />
      )}

      {/* Thumbnail shown before ad finishes for embed videos */}
      {isEmbed && !adShown && (
        <div style={styles.thumbOverlay}>
          {video.thumbnail_url && (
            <img src={video.thumbnail_url} alt={video.title} style={styles.thumbImg} />
          )}
        </div>
      )}

      {/* Pause overlay (non-embed only) */}
      {!isEmbed && !playing && !showAd && (
        <div style={styles.pauseOverlay} onClick={handleVideoTap}>
          <div style={styles.playCircle}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
      )}

      {/* Speed badge */}
      {speedActive && <div style={styles.speedBadge}>⚡ 2x</div>}

      {/* Skip animation */}
      {skipAnim && (
        <div className="skip-anim" style={{
          ...styles.skipAnim,
          left: skipAnim === '-10s' ? '15%' : 'auto',
          right: skipAnim === '+10s' ? '15%' : 'auto',
        }}>{skipAnim}</div>
      )}

      {/* Fit popup */}
      {fitPopup && <div className="fit-popup" style={styles.fitPopup}>{fitPopup}</div>}

      {/* Pre-roll Ad overlay */}
      {showAd && (
        <div style={styles.adOverlay}>
          <div style={styles.adBox}>
            <p style={styles.adLabel}>ADVERTISEMENT</p>
            <AdsterraPreroll />
          </div>
          <div style={styles.adTimer}>Ad ends in {adCountdown}s</div>
        </div>
      )}

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div style={styles.topBar}>
        <div style={styles.brandRow}>
          <DuckLogo />
          <span style={styles.brandText}>FappyDuck</span>
        </div>
        <div style={styles.topActions}>
          {!isEmbed && (
            <button onClick={handleFitToggle} style={styles.topBtn} title="Change fit">
              <FitIcon />
            </button>
          )}
          <button onClick={handleFullscreen} style={styles.topBtn} title="Fullscreen">
            <FullscreenIcon />
          </button>
        </div>
      </div>

      {/* ── Bottom info + seekbar ────────────────────────────────────────── */}
      <div style={styles.bottomArea}>
        <p style={styles.title}>{video.title}</p>
        <p style={styles.date}>{formatDate(video.created_at)}</p>
        {!isEmbed && (
          <div style={styles.seekRow}>
            <span style={styles.timeLabel}>{formatTime(duration * progress)}</span>
            <div style={styles.seekTrack} ref={seekBarRef} onClick={handleSeekClick}>
              <input
                type="range" min="0" max="1" step="0.001"
                value={progress}
                onChange={e => {
                  const v = parseFloat(e.target.value);
                  setProgress(v);
                  if (videoRef.current?.duration) videoRef.current.currentTime = v * videoRef.current.duration;
                }}
                onMouseDown={() => setSeeking(true)}
                onMouseUp={() => setSeeking(false)}
                onTouchStart={() => setSeeking(true)}
                onTouchEnd={() => setSeeking(false)}
                style={styles.seekInput}
              />
            </div>
            <span style={styles.timeLabel}>{formatTime(duration)}</span>
          </div>
        )}
      </div>

      {/* ── Right actions ─────────────────────────────────────────────────── */}
      <div style={styles.actions}>
        <ActionBtn icon={<HeartIcon filled={liked} />} label={formatCount(likeCount)} onClick={handleLike} active={liked} color="#ff3b6b" />
        <ActionBtn icon={<CommentIcon />} label="Comment" onClick={handleComments} color="#1a6bff" />
        <ActionBtn icon={<ShareIcon />} label="Share" onClick={handleShare} color="#1a6bff" />
        <ActionBtn icon={<EyeIcon />} label={formatCount(viewCount)} color="#aaa" />
      </div>

      {/* ── Comments sheet ───────────────────────────────────────────────── */}
      {showComments && (
        <div style={styles.commentsSheet}>
          <div style={styles.commentsHeader}>
            <span style={styles.commentsTitle}>Comments</span>
            <button onClick={() => setShowComments(false)} style={styles.closeBtn}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="#888" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          <div style={styles.commentsList}>
            {comments.length === 0 && <p style={styles.noComments}>No comments yet. Be first!</p>}
            {comments.map((c, i) => (
              <div key={c.id || i} style={styles.comment}>
                <div style={styles.commentAvatar}>{(c.profiles?.username || 'U')[0].toUpperCase()}</div>
                <div>
                  <span style={styles.commentUser}>{c.profiles?.username || 'User'}</span>
                  <span style={styles.commentText}>{c.text}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={styles.commentInput}>
            <input value={commentText} onChange={e => setCommentText(e.target.value)}
              placeholder="Add a comment..." style={styles.commentField}
              onKeyDown={e => e.key === 'Enter' && handlePost()} />
            <button onClick={handlePost} style={styles.sendBtn}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionBtn({ icon, label, onClick, active, color }) {
  return (
    <button onClick={onClick} style={styles.actionBtn}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: active ? `0 0 16px ${color}66` : 'none',
        transition: 'all 0.2s ease'
      }}>{icon}</div>
      <span style={{ ...styles.actionLabel, color: active ? color : 'rgba(255,255,255,0.85)' }}>{label}</span>
    </button>
  );
}

const glassBtn = {
  background: 'rgba(255,255,255,0.08)',
  backdropFilter: 'blur(8px)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px', padding: '6px 8px',
  cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center'
};

const styles = {
  container: { position: 'relative', width: '100%', height: '100%', background: '#050508', overflow: 'hidden' },
  video:     { width: '100%', height: '100%', display: 'block' },
  iframe:    { width: '100%', height: '100%', border: 'none', display: 'block', background: '#000' },
  thumbOverlay: { position: 'absolute', inset: 0, zIndex: 2 },
  thumbImg:  { width: '100%', height: '100%', objectFit: 'cover' },
  pauseOverlay: {
    position: 'absolute', inset: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2
  },
  playCircle: {
    width: '72px', height: '72px', borderRadius: '50%',
    background: 'rgba(26,107,255,0.25)', backdropFilter: 'blur(8px)',
    border: '1px solid rgba(26,107,255,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 0 30px rgba(26,107,255,0.4)'
  },
  speedBadge: {
    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
    background: 'rgba(26,107,255,0.85)', color: '#fff',
    padding: '8px 18px', borderRadius: '20px', fontSize: '16px', fontWeight: 800,
    backdropFilter: 'blur(8px)', zIndex: 5
  },
  skipAnim: {
    position: 'absolute', top: '45%', color: '#fff',
    fontSize: '22px', fontWeight: 800,
    textShadow: '0 0 20px rgba(26,107,255,0.8)',
    zIndex: 5, pointerEvents: 'none'
  },
  fitPopup: {
    position: 'absolute', top: '72px', left: '50%', transform: 'translateX(-50%)',
    background: 'rgba(26,107,255,0.85)', color: '#fff', backdropFilter: 'blur(8px)',
    padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
    letterSpacing: '0.5px', zIndex: 10, pointerEvents: 'none'
  },
  adOverlay: {
    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.92)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10
  },
  adBox: {
    width: '90%', maxWidth: '380px', background: '#0d1a2e',
    border: '1px solid rgba(26,107,255,0.3)', borderRadius: '16px',
    padding: '24px 20px', textAlign: 'center'
  },
  adLabel: { color: '#1a6bff', fontSize: '10px', fontWeight: 800, letterSpacing: '2px', margin: '0 0 8px' },
  adTimer: {
    marginTop: '20px', color: '#aaa', fontSize: '13px',
    background: 'rgba(26,107,255,0.15)', border: '1px solid rgba(26,107,255,0.3)',
    padding: '6px 18px', borderRadius: '20px'
  },
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 4,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '52px 14px 10px',
    background: 'linear-gradient(to bottom, rgba(5,5,10,0.75) 0%, transparent 100%)'
  },
  brandRow: { display: 'flex', alignItems: 'center', gap: '6px' },
  brandText: {
    color: '#fff', fontFamily: "'Syne',sans-serif", fontWeight: 800,
    fontSize: '15px', textShadow: '0 0 20px rgba(26,107,255,0.6)'
  },
  topActions: { display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 },
  topBtn: { ...glassBtn },
  bottomArea: {
    position: 'absolute', bottom: '56px', left: 0, right: '76px', zIndex: 3,
    padding: '0 14px 10px',
    background: 'linear-gradient(to top, rgba(5,5,10,0.8) 0%, transparent 100%)'
  },
  title: { color: '#fff', fontSize: '14px', fontWeight: 700, margin: '0 0 3px', textShadow: '0 1px 6px rgba(0,0,0,0.9)', lineHeight: 1.3 },
  date:  { color: 'rgba(255,255,255,0.5)', fontSize: '11px', margin: '0 0 10px' },
  seekRow:   { display: 'flex', alignItems: 'center', gap: '8px' },
  seekTrack: { flex: 1, display: 'flex', alignItems: 'center' },
  seekInput: { width: '100%', margin: 0 },
  timeLabel: { color: 'rgba(255,255,255,0.6)', fontSize: '10px', fontWeight: 600, minWidth: '32px', textAlign: 'center' },
  actions: {
    position: 'absolute', right: '10px', bottom: '120px',
    display: 'flex', flexDirection: 'column', gap: '14px', zIndex: 3, alignItems: 'center'
  },
  actionBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', padding: 0,
    WebkitTapHighlightColor: 'transparent'
  },
  actionLabel: { fontSize: '11px', fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.9)' },
  commentsSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '65%',
    background: 'rgba(8,12,24,0.96)', backdropFilter: 'blur(20px)',
    borderRadius: '20px 20px 0 0', zIndex: 20,
    border: '1px solid rgba(26,107,255,0.15)',
    display: 'flex', flexDirection: 'column'
  },
  commentsHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 20px', borderBottom: '1px solid rgba(26,107,255,0.1)'
  },
  commentsTitle: { color: '#fff', fontWeight: 800, fontSize: '16px', fontFamily: "'Syne',sans-serif" },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' },
  commentsList: { flex: 1, overflowY: 'auto', padding: '12px 16px' },
  noComments: { color: '#444', textAlign: 'center', marginTop: '30px', fontSize: '14px' },
  comment: { marginBottom: '16px', display: 'flex', gap: '10px', alignItems: 'flex-start' },
  commentAvatar: {
    width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
    background: 'linear-gradient(135deg, #1a6bff, #0044cc)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontSize: '12px', fontWeight: 800
  },
  commentUser: { color: '#1a6bff', fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '2px' },
  commentText: { color: '#ccc', fontSize: '13px', lineHeight: 1.4, display: 'block' },
  commentInput: {
    display: 'flex', gap: '10px', padding: '12px 16px',
    borderTop: '1px solid rgba(26,107,255,0.1)', alignItems: 'center'
  },
  commentField: {
    flex: 1, background: 'rgba(26,107,255,0.08)', border: '1px solid rgba(26,107,255,0.2)',
    borderRadius: '20px', color: '#fff', padding: '10px 16px', fontSize: '14px', outline: 'none'
  },
  sendBtn: {
    width: '40px', height: '40px', borderRadius: '50%',
    background: 'linear-gradient(135deg, #1a6bff, #0044cc)',
    border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 0 12px rgba(26,107,255,0.5)'
  }
};

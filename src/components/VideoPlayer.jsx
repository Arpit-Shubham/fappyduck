// src/components/VideoPlayer.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { toggleLike, isLiked, addToHistory, fetchComments, postComment, incrementView } from '../lib/supabase';

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
const FitIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="rgba(255,255,255,0.85)" strokeWidth="1.8"/>
    <path d="M8 3v3H3M16 3v3h5M8 21v-3H3M16 21v-3h5" stroke="rgba(255,255,255,0.85)" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);
const FullscreenIcon = ({ active }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    {active
      ? <path d="M8 3v5H3M16 3v5h5M8 21v-5H3M16 21v-5h5" stroke="rgba(255,255,255,0.9)" strokeWidth="1.8" strokeLinecap="round"/>
      : <path d="M8 3H5a2 2 0 00-2 2v3M16 3h3a2 2 0 012 2v3M8 21H5a2 2 0 01-2-2v-3M16 21h3a2 2 0 002-2v-3" stroke="rgba(255,255,255,0.9)" strokeWidth="1.8" strokeLinecap="round"/>
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

const FIT_MODES  = ['cover', 'contain', 'fill'];
const FIT_LABELS = { cover: 'Best Fit', contain: 'Full View', fill: 'Stretch' };

// ── Adsterra Preroll ──────────────────────────────────────────────────────────
function AdsterraPreroll() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || el.dataset.loaded) return;
    el.dataset.loaded = 'true';
    window.atOptions = { key: 'c5831a750d0ec46ab4e86855aa45bdc1', format: 'iframe', height: 50, width: 320, params: {} };
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
  const videoRef     = useRef(null);
  const containerRef = useRef(null);
  const hlsRef       = useRef(null);

  const [liked, setLiked]             = useState(false);
  const [likeCount, setLikeCount]     = useState(video.like_count || 0);
  const [viewCount, setViewCount]     = useState(video.view_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments]       = useState([]);
  const [commentText, setCommentText] = useState('');
  const [playing, setPlaying]         = useState(false);
  const [muted, setMuted]             = useState(true); // start muted, unmute on first play gesture
  const [adShown, setAdShown]         = useState(false);
  const [adCountdown, setAdCountdown] = useState(5);
  const [showAd, setShowAd]           = useState(false);
  const [progress, setProgress]       = useState(0);
  const [duration, setDuration]       = useState(0);
  const [seeking, setSeeking]         = useState(false);
  const [buffered, setBuffered]       = useState(0);
  const [fitMode, setFitMode]         = useState(0);
  const [fitPopup, setFitPopup]       = useState('');
  const [skipAnim, setSkipAnim]       = useState('');
  const [skipSide, setSkipSide]       = useState('right');
  const [speedActive, setSpeedActive] = useState(false);
  const [showTags, setShowTags]       = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hlsError, setHlsError]       = useState(false); // fallback to embed on HLS fail

  const viewTracked   = useRef(false);
  const tapTimer      = useRef(null);
  const tapCount      = useRef(0);
  const holdTimer     = useRef(null);
  const seekBarRef    = useRef(null);
  const fitPopupTimer = useRef(null);
  const engageTimer   = useRef(null);
  const adTriggered   = useRef(false);
  const tags          = Array.isArray(video.tags) ? video.tags : [];

  // ── HLS loader ───────────────────────────────────────────────────────────
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !video.stream_url) return;

    setHlsError(false);
    setProgress(0); setDuration(0); setBuffered(0);

    const tryPlay = () => {
      vid.play()
        .then(() => { setPlaying(true); setMuted(false); })
        .catch(() => {
          // Browser blocked unmuted autoplay — play muted first
          vid.muted = true;
          setMuted(true);
          vid.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
        });
    };

    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        startLevel: -1,          // auto quality
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
      });
      hls.loadSource(video.stream_url);
      hls.attachMedia(vid);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (isActive) tryPlay();
      });
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) {
          setHlsError(true); // fallback to embed
          hls.destroy();
        }
      });
      hlsRef.current = hls;
    } else if (vid.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS
      vid.src = video.stream_url;
      if (isActive) tryPlay();
    } else {
      setHlsError(true); // no HLS support — fallback to embed
    }

    return () => {
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    };
  }, [video.stream_url]); // eslint-disable-line

  // ── Active / inactive controller ─────────────────────────────────────────
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    if (isActive) {
      adTriggered.current = false;
      // Attempt play — browser may mute it, that's fine
      vid.play()
        .then(() => { setPlaying(true); })
        .catch(() => {
          vid.muted = true; setMuted(true);
          vid.play().then(() => setPlaying(true)).catch(() => {});
        });

      // 3s engagement → show ad once per reel
      if (!adShown) {
        clearTimeout(engageTimer.current);
        engageTimer.current = setTimeout(() => {
          if (!adTriggered.current) {
            adTriggered.current = true;
            vid.pause(); setPlaying(false);
            setShowAd(true);
          }
        }, 3000);
      }
    } else {
      clearTimeout(engageTimer.current);
      vid.pause(); setPlaying(false);
      setShowAd(false); setShowTags(false); setShowComments(false);
    }
    return () => clearTimeout(engageTimer.current);
  }, [isActive]); // eslint-disable-line

  // Reset per-video
  useEffect(() => {
    adTriggered.current = false;
    viewTracked.current = false;
    setAdShown(false); setShowAd(false);
    setPlaying(false); setProgress(0); setDuration(0); setBuffered(0);
    setHlsError(false);
  }, [video.id]);

  // ── Ad countdown ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!showAd) return;
    setAdCountdown(5);
    const iv = setInterval(() => {
      setAdCountdown(p => {
        if (p <= 1) {
          clearInterval(iv);
          setShowAd(false); setAdShown(true);
          videoRef.current?.play().then(() => setPlaying(true)).catch(() => {});
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [showAd]);

  // ── View tracking ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isActive || viewTracked.current) return;
    const t = setTimeout(async () => {
      viewTracked.current = true;
      const newCount = await incrementView(video.id).catch(() => null);
      if (newCount !== null) setViewCount(newCount);
      if (userId) addToHistory(video.id, userId, {
        title: video.title, thumbnail_url: video.thumbnail_url,
        duration: video.duration, view_count: video.view_count,
        embed_url: video.embed_url
      });
    }, 5000);
    return () => clearTimeout(t);
  }, [isActive, video.id, userId]); // eslint-disable-line

  // ── Like state ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (userId) isLiked(video.id, userId).then(setLiked);
  }, [video.id, userId]);

  // ── Seekbar progress ──────────────────────────────────────────────────────
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const onTime = () => {
      if (!seeking && vid.duration) {
        setProgress(vid.currentTime / vid.duration);
        setDuration(vid.duration);
        // buffered
        if (vid.buffered.length > 0) {
          setBuffered(vid.buffered.end(vid.buffered.length - 1) / vid.duration);
        }
      }
    };
    const onMeta = () => setDuration(vid.duration || 0);
    const onEnded = () => { vid.currentTime = 0; vid.play().catch(() => {}); };
    vid.addEventListener('timeupdate', onTime);
    vid.addEventListener('loadedmetadata', onMeta);
    vid.addEventListener('ended', onEnded);
    return () => {
      vid.removeEventListener('timeupdate', onTime);
      vid.removeEventListener('loadedmetadata', onMeta);
      vid.removeEventListener('ended', onEnded);
    };
  }, [seeking]);

  // ── Fullscreen change listener ────────────────────────────────────────────
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

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
    const url = `${window.location.origin}/v/${video.id}`;
    if (navigator.share) await navigator.share({ title: video.title, url });
    else { await navigator.clipboard.writeText(url); alert('Link copied!'); }
  };

  const handleFitToggle = () => {
    const next = (fitMode + 1) % FIT_MODES.length;
    setFitMode(next);
    setFitPopup(FIT_LABELS[FIT_MODES[next]]);
    clearTimeout(fitPopupTimer.current);
    fitPopupTimer.current = setTimeout(() => setFitPopup(''), 1500);
  };

  // ── Fullscreen — fullscreen the FEED container so scroll works ────────────
  const handleFullscreen = async () => {
    // Try to fullscreen the feed container (passed as feedRef prop)
    // so reel scrolling continues to work in fullscreen
    const el = feedRef?.current || containerRef.current;
    if (!document.fullscreenElement) {
      try { await el.requestFullscreen(); } catch (e) {
        // Fallback to container
        try { await containerRef.current.requestFullscreen(); } catch (e2) {}
      }
    } else {
      try { await document.exitFullscreen(); } catch (e) {}
    }
  };

  const handleMuteToggle = () => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.muted = !vid.muted;
    setMuted(vid.muted);
  };

  // ── Seek ─────────────────────────────────────────────────────────────────
  const handleSeekChange = useCallback((e) => {
    const v = parseFloat(e.target.value);
    setProgress(v);
    const vid = videoRef.current;
    if (vid?.duration) vid.currentTime = v * vid.duration;
  }, []);

  // ── Tap / double-tap / hold gestures ─────────────────────────────────────
  const handleTouchStart = useCallback((e) => {
    if (showAd || showComments || showTags) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.touches[0].clientX - rect.left;
    // Hold left half = 2x speed
    if (x < rect.width / 2) {
      holdTimer.current = setTimeout(() => {
        const vid = videoRef.current;
        if (vid) { vid.playbackRate = 2; setSpeedActive(true); }
      }, 200);
    }
  }, [showAd, showComments, showTags]);

  const handleTouchEnd = useCallback(() => {
    clearTimeout(holdTimer.current);
    if (speedActive) {
      const vid = videoRef.current;
      if (vid) vid.playbackRate = 1;
      setSpeedActive(false);
    }
  }, [speedActive]);

  const handleTap = useCallback((e) => {
    if (showAd || showComments || showTags) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x    = (e.touches?.[0]?.clientX ?? e.clientX) - rect.left;
    const side = x < rect.width / 2 ? 'left' : 'right';

    tapCount.current += 1;
    clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => {
      const vid = videoRef.current;
      if (tapCount.current === 1) {
        // Single tap = play / pause + unmute
        if (!vid) { tapCount.current = 0; return; }
        if (playing) {
          vid.pause(); setPlaying(false);
        } else {
          vid.muted = false; setMuted(false);
          vid.play().then(() => setPlaying(true)).catch(() => {});
        }
      } else {
        // Double tap = skip ±10s
        if (!vid) { tapCount.current = 0; return; }
        const delta = side === 'right' ? 10 : -10;
        vid.currentTime = Math.max(0, Math.min(vid.duration || 0, vid.currentTime + delta));
        setSkipSide(side);
        setSkipAnim(delta > 0 ? '+10s' : '-10s');
        setTimeout(() => setSkipAnim(''), 700);
      }
      tapCount.current = 0;
    }, 250);
  }, [playing, showAd, showComments, showTags]);

  const handleTagClick = (tag) => {
    setShowTags(false);
    if (onTagSearch) onTagSearch(tag);
  };

  const formatCount = n => n >= 1000000 ? (n/1000000).toFixed(1)+'M' : n >= 1000 ? (n/1000).toFixed(1)+'K' : String(n || 0);
  const formatDate  = d => { try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return ''; } };
  const formatTime  = s => isNaN(s) || !s ? '0:00' : `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;

  return (
    <div ref={containerRef} style={st.container}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleTap}
    >
      <style>{`
        @keyframes skipFade  { 0%{opacity:1;transform:scale(1.3)} 100%{opacity:0;transform:scale(0.85)} }
        @keyframes popupFade { 0%{opacity:1;transform:translateY(0)} 80%{opacity:1} 100%{opacity:0;transform:translateY(-8px)} }
        @keyframes sheetUp   { from{transform:translateY(100%)} to{transform:translateY(0)} }
        .skip-anim  { animation: skipFade  0.7s ease forwards; pointer-events: none; }
        .fit-popup  { animation: popupFade 1.5s ease forwards; }
        .sheet-anim { animation: sheetUp   0.25s ease; }
        input[type=range] { -webkit-appearance:none; width:100%; height:3px; outline:none; cursor:pointer; border-radius:2px; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:14px; height:14px; border-radius:50%; background:#fff; cursor:pointer; box-shadow:0 0 6px rgba(26,107,255,0.9); }
      `}</style>

      {/* ── Native video element ──────────────────────────────────────────── */}
      {!hlsError ? (
        <video
          ref={videoRef}
          style={{ ...st.video, objectFit: FIT_MODES[fitMode] }}
          loop playsInline
          poster={video.thumbnail_url}
          muted={muted}
          preload="auto"
        />
      ) : (
        /* HLS failed — fallback to eporner embed */
        <iframe
          src={isActive ? `${video.embed_url}?autoplay=1&mute=0` : ''}
          style={st.video}
          allowFullScreen allow="autoplay; fullscreen"
          title={video.title} scrolling="no" frameBorder="0"
        />
      )}

      {/* ── Mute indicator (fades after 2s) ─────────────────────────────── */}
      {muted && playing && !hlsError && (
        <div style={st.muteBar} onClick={e => { e.stopPropagation(); handleMuteToggle(); }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M11 5L6 9H2v6h4l5 4V5z" fill="#fff"/>
            <line x1="23" y1="1" x2="1" y2="23" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span style={st.muteText}>Tap to unmute</span>
        </div>
      )}

      {/* ── Pause overlay ────────────────────────────────────────────────── */}
      {!playing && !showAd && !hlsError && (
        <div style={st.pauseOverlay}>
          <div style={st.playCircle}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white" style={{ marginLeft: '4px' }}>
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      )}

      {/* ── Speed badge ──────────────────────────────────────────────────── */}
      {speedActive && <div style={st.speedBadge}>⚡ 2×</div>}

      {/* ── Skip animation ───────────────────────────────────────────────── */}
      {skipAnim && (
        <div className="skip-anim" style={{
          ...st.skipAnim,
          left:  skipSide === 'left'  ? '14%' : 'auto',
          right: skipSide === 'right' ? '14%' : 'auto',
        }}>
          <div style={st.skipBubble}>{skipAnim}</div>
        </div>
      )}

      {/* ── Fit popup ────────────────────────────────────────────────────── */}
      {fitPopup && <div className="fit-popup" style={st.fitPopup}>{fitPopup}</div>}

      {/* ── Pre-roll ad overlay ──────────────────────────────────────────── */}
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
          <button onClick={handleFitToggle} style={st.topBtn} title="Fit"><FitIcon /></button>
          <button onClick={handleFullscreen} style={st.topBtn} title="Fullscreen">
            <FullscreenIcon active={isFullscreen} />
          </button>
        </div>
      </div>

      {/* ── Bottom info + seekbar ─────────────────────────────────────────── */}
      <div style={st.bottomArea}>
        <p style={st.title}>{video.title}</p>
        <p style={st.date}>{formatDate(video.created_at)}</p>
        <div style={st.seekRow}>
          <span style={st.timeLabel}>{formatTime(duration * progress)}</span>
          <div style={st.seekWrap} ref={seekBarRef}>
            {/* Buffered track */}
            <div style={{ ...st.seekBuf, width: `${buffered * 100}%` }} />
            {/* Progress input */}
            <input
              type="range" min="0" max="1" step="0.001"
              value={progress}
              style={{
                ...st.seekInput,
                background: `linear-gradient(to right, #fff ${(progress*100).toFixed(1)}%, rgba(255,255,255,0.18) ${(progress*100).toFixed(1)}%)`
              }}
              onChange={handleSeekChange}
              onMouseDown={() => setSeeking(true)}  onMouseUp={() => setSeeking(false)}
              onTouchStart={() => setSeeking(true)} onTouchEnd={() => setSeeking(false)}
              onClick={e => e.stopPropagation()}
            />
          </div>
          <span style={st.timeLabel}>{formatTime(duration)}</span>
        </div>
      </div>

      {/* ── Right action buttons ─────────────────────────────────────────── */}
      <div style={st.actions}>
        <Btn icon={<HeartIcon filled={liked} />}  label={formatCount(likeCount)} onClick={handleLike}                     active={liked}  color="#ff3b6b" />
        <Btn icon={<CommentIcon />}               label="Comment"                onClick={handleComments}                  color="#1a6bff" />
        <Btn icon={<ShareIcon />}                 label="Share"                  onClick={handleShare}                     color="#1a6bff" />
        {tags.length > 0 && (
          <Btn icon={<TagIcon />}                 label="Tags"                   onClick={() => setShowTags(true)}          color="#1a6bff" />
        )}
        <Btn icon={<EyeIcon />}                   label={formatCount(viewCount)}                                           color="#888" />
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
            <input value={commentText} onChange={e=>setCommentText(e.target.value)}
              placeholder="Add a comment..." style={st.cField}
              onKeyDown={e=>e.key==='Enter'&&handlePost()} />
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

// ── Reusable bottom sheet ─────────────────────────────────────────────────────
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

// ── Action button ─────────────────────────────────────────────────────────────
function Btn({ icon, label, onClick, active, color }) {
  return (
    <button onClick={onClick} style={st.actionBtn}>
      <div style={{ ...st.actionCircle, boxShadow: active ? `0 0 16px ${color}55` : 'none' }}>
        {icon}
      </div>
      {label && <span style={{ ...st.actionLabel, color: active ? color : 'rgba(255,255,255,0.85)' }}>{label}</span>}
    </button>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const topGlass = {
  background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
  padding: '6px 8px', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center'
};

const st = {
  container: { position: 'relative', width: '100%', height: '100%', background: '#000', overflow: 'hidden', userSelect: 'none' },
  video:     { width: '100%', height: '100%', display: 'block' },

  muteBar: {
    position: 'absolute', bottom: '140px', left: '50%', transform: 'translateX(-50%)',
    display: 'flex', alignItems: 'center', gap: '8px',
    background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.15)',
    padding: '7px 16px', borderRadius: '20px', zIndex: 6, cursor: 'pointer'
  },
  muteText: { color: 'rgba(255,255,255,0.85)', fontSize: '12px', fontWeight: 700, fontFamily: "'Syne',sans-serif" },

  pauseOverlay: {
    position: 'absolute', inset: 0, display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 2, pointerEvents: 'none'
  },
  playCircle: {
    width: '76px', height: '76px', borderRadius: '50%',
    background: 'rgba(26,107,255,0.22)', backdropFilter: 'blur(10px)',
    border: '1.5px solid rgba(26,107,255,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 0 40px rgba(26,107,255,0.35)'
  },

  speedBadge: {
    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
    background: 'rgba(26,107,255,0.88)', color: '#fff',
    padding: '8px 20px', borderRadius: '20px', fontSize: '17px', fontWeight: 800,
    backdropFilter: 'blur(8px)', zIndex: 8, pointerEvents: 'none'
  },

  skipAnim: { position: 'absolute', top: '42%', zIndex: 7 },
  skipBubble: {
    background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
    color: '#fff', fontSize: '18px', fontWeight: 800,
    padding: '8px 16px', borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.2)',
    fontFamily: "'Syne',sans-serif"
  },

  fitPopup: {
    position: 'absolute', top: '68px', left: '50%', transform: 'translateX(-50%)',
    background: 'rgba(26,107,255,0.88)', color: '#fff', backdropFilter: 'blur(8px)',
    padding: '6px 18px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
    letterSpacing: '0.5px', zIndex: 10, pointerEvents: 'none',
    fontFamily: "'Syne',sans-serif"
  },

  adOverlay: {
    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.93)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10
  },
  adBox: {
    width: '90%', maxWidth: '360px', background: '#0a1020',
    border: '1px solid rgba(26,107,255,0.25)', borderRadius: '16px',
    padding: '22px 20px', textAlign: 'center'
  },
  adLabel: { color: '#1a6bff', fontSize: '10px', fontWeight: 800, letterSpacing: '2px', margin: '0 0 10px', fontFamily: "'Syne',sans-serif" },
  adTimer: {
    marginTop: '18px', color: '#999', fontSize: '13px',
    background: 'rgba(26,107,255,0.12)', border: '1px solid rgba(26,107,255,0.25)',
    padding: '6px 18px', borderRadius: '20px', fontFamily: "'Syne',sans-serif"
  },

  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 4,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '52px 14px 12px',
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)'
  },
  brandRow:  { display: 'flex', alignItems: 'center', gap: '7px' },
  brandText: { color: '#fff', fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '15px', letterSpacing: '0.3px', textShadow: '0 0 20px rgba(26,107,255,0.5)' },
  topActions: { display: 'flex', gap: '8px', alignItems: 'center' },
  topBtn:    { ...topGlass },

  bottomArea: {
    position: 'absolute', bottom: '56px', left: 0, right: '72px', zIndex: 3,
    padding: '0 14px 10px',
    background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)'
  },
  title:  { color: '#fff', fontSize: '14px', fontWeight: 700, margin: '0 0 2px', lineHeight: 1.35, textShadow: '0 1px 6px rgba(0,0,0,0.9)' },
  date:   { color: 'rgba(255,255,255,0.45)', fontSize: '11px', margin: '0 0 10px' },
  seekRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  seekWrap: { flex: 1, position: 'relative', height: '14px', display: 'flex', alignItems: 'center' },
  seekBuf: {
    position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
    height: '3px', background: 'rgba(255,255,255,0.25)', borderRadius: '2px', pointerEvents: 'none'
  },
  seekInput: { position: 'relative', zIndex: 1, margin: 0 },
  timeLabel: { color: 'rgba(255,255,255,0.55)', fontSize: '10px', fontWeight: 600, minWidth: '34px', textAlign: 'center', fontFamily: "'Syne',sans-serif" },

  actions: {
    position: 'absolute', right: '10px', bottom: '120px',
    display: 'flex', flexDirection: 'column', gap: '14px', zIndex: 3, alignItems: 'center'
  },
  actionBtn:    { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', padding: 0, WebkitTapHighlightColor: 'transparent' },
  actionCircle: { width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.09)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.13)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'box-shadow 0.2s' },
  actionLabel:  { fontSize: '11px', fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.9)', fontFamily: "'Syne',sans-serif" },

  // Sheet
  sheetBackdrop: { position: 'absolute', inset: 0, zIndex: 20, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end' },
  sheetCard:     { width: '100%', background: 'rgba(7,11,22,0.97)', backdropFilter: 'blur(24px)', borderRadius: '22px 22px 0 0', border: '1px solid rgba(26,107,255,0.14)', borderBottom: 'none', display: 'flex', flexDirection: 'column', paddingBottom: '20px' },
  sheetHandle:   { width: '38px', height: '4px', background: 'rgba(26,107,255,0.38)', borderRadius: '2px', margin: '14px auto 0' },
  sheetHdr:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px 6px' },
  sheetTitle:    { color: 'rgba(26,107,255,0.75)', fontSize: '11px', fontWeight: 800, letterSpacing: '2px', margin: 0, fontFamily: "'Syne',sans-serif" },
  sheetX:        { background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' },

  // Tags
  tagsList: { display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '8px 16px 4px', overflowY: 'auto', maxHeight: '260px' },
  tagPill:  { background: 'rgba(26,107,255,0.1)', border: '1px solid rgba(26,107,255,0.28)', borderRadius: '20px', color: '#7aabff', fontSize: '13px', fontWeight: 600, padding: '6px 14px', cursor: 'pointer', fontFamily: "'Syne',sans-serif", WebkitTapHighlightColor: 'transparent' },
  tagHint:  { color: '#333', fontSize: '11px', textAlign: 'center', margin: '10px 0 0', fontFamily: "'Syne',sans-serif" },

  // Comments
  commentsList: { flex: 1, overflowY: 'auto', padding: '8px 16px' },
  noComments:   { color: '#444', textAlign: 'center', marginTop: '30px', fontSize: '14px', fontFamily: "'Syne',sans-serif" },
  comment:      { marginBottom: '14px', display: 'flex', gap: '10px', alignItems: 'flex-start' },
  cAvatar:      { width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#1a6bff,#0044cc)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 800 },
  cUser:        { color: '#1a6bff', fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '2px', fontFamily: "'Syne',sans-serif" },
  cText:        { color: '#ccc', fontSize: '13px', lineHeight: 1.4, display: 'block' },
  cInput:       { display: 'flex', gap: '10px', padding: '10px 16px', borderTop: '1px solid rgba(26,107,255,0.1)', alignItems: 'center' },
  cField:       { flex: 1, background: 'rgba(26,107,255,0.07)', border: '1px solid rgba(26,107,255,0.2)', borderRadius: '20px', color: '#fff', padding: '10px 16px', fontSize: '14px', outline: 'none', fontFamily: "'Syne',sans-serif" },
  sendBtn:      { width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg,#1a6bff,#0044cc)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(26,107,255,0.45)' },
};

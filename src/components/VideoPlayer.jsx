// src/components/VideoPlayer.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { supabase, toggleLike, isLiked, addToHistory, fetchComments, postComment, incrementView } from '../lib/supabase';

export default function VideoPlayer({ video, userId, isActive }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(video.like_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [playing, setPlaying] = useState(false);
  const [adShown, setAdShown] = useState(false);
  const [adCountdown, setAdCountdown] = useState(5);
  const [showAd, setShowAd] = useState(false);
  const viewTracked = useRef(false);

  // Load HLS stream
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !video.stream_url) return;

    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

    if (video.stream_url.includes('.m3u8') && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hls.loadSource(video.stream_url);
      hls.attachMedia(vid);
      hlsRef.current = hls;
    } else {
      vid.src = video.stream_url;
    }

    return () => { if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; } };
  }, [video.stream_url]);

  // Play/pause based on active state
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (isActive) {
      if (!adShown) { setShowAd(true); return; }
      vid.play().catch(() => {});
      setPlaying(true);
    } else {
      vid.pause();
      setPlaying(false);
      setShowAd(false);
    }
  }, [isActive, adShown]);

  // Ad countdown
  useEffect(() => {
    if (!showAd) return;
    setAdCountdown(5);
    const interval = setInterval(() => {
      setAdCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setShowAd(false);
          setAdShown(true);
          videoRef.current?.play().catch(() => {});
          setPlaying(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [showAd]);

  // Track view after 5 seconds
  useEffect(() => {
    if (!isActive || !playing || viewTracked.current) return;
    const t = setTimeout(() => {
      viewTracked.current = true;
      incrementView(video.id);
      if (userId) addToHistory(video.id, userId);
    }, 5000);
    return () => clearTimeout(t);
  }, [isActive, playing, video.id, userId]);

  // Load like state
  useEffect(() => {
    if (userId) isLiked(video.id, userId).then(setLiked);
  }, [video.id, userId]);

  const handleLike = async () => {
    if (!userId) { alert('Please sign in to like videos.'); return; }
    const nowLiked = await toggleLike(video.id, userId);
    setLiked(nowLiked);
    setLikeCount(c => nowLiked ? c + 1 : c - 1);
  };

  const handleComments = async () => {
    setShowComments(true);
    const data = await fetchComments(video.id);
    setComments(data);
  };

  const handlePost = async () => {
    if (!userId) { alert('Sign in to comment'); return; }
    if (!commentText.trim()) return;
    const c = await postComment(video.id, userId, commentText.trim());
    setComments(prev => [c, ...prev]);
    setCommentText('');
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/v/${video.id}`;
    if (navigator.share) {
      await navigator.share({ title: video.title, url });
    } else {
      await navigator.clipboard.writeText(url);
      alert('Link copied!');
    }
  };

  const togglePlay = () => {
    const vid = videoRef.current;
    if (!vid || showAd) return;
    if (playing) { vid.pause(); setPlaying(false); }
    else { vid.play(); setPlaying(true); }
  };

  const formatCount = n => n >= 1000000 ? (n/1000000).toFixed(1)+'M' : n >= 1000 ? (n/1000).toFixed(1)+'K' : n;
  const formatDate = d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div style={styles.container}>
      {/* Video */}
      <video
        ref={videoRef}
        style={styles.video}
        loop
        playsInline
        muted={false}
        onClick={togglePlay}
        poster={video.thumbnail_url}
      />

      {/* Play/Pause tap overlay */}
      {!playing && !showAd && (
        <div style={styles.pauseOverlay} onClick={togglePlay}>
          <div style={styles.playIcon}>▶</div>
        </div>
      )}

      {/* Pre-roll Ad Overlay */}
      {showAd && (
        <div style={styles.adOverlay}>
          {/* Replace this div with your actual ad tag/iframe from TrafficJunky/ExoClick */}
          <div style={styles.adBox}>
            <p style={styles.adLabel}>Advertisement</p>
            <p style={styles.adText}>[ Your Ad Network Tag Goes Here ]</p>
            <p style={styles.adSub}>Paste your VAST/banner ad code inside adBox in VideoPlayer.jsx</p>
          </div>
          <div style={styles.adTimer}>Ad ends in {adCountdown}s</div>
        </div>
      )}

      {/* Bottom info overlay */}
      <div style={styles.infoOverlay}>
        <p style={styles.title}>{video.title}</p>
        <p style={styles.date}>{formatDate(video.created_at)}</p>
      </div>

      {/* Right action buttons */}
      <div style={styles.actions}>
        <ActionBtn icon="❤️" label={formatCount(likeCount)} onClick={handleLike} active={liked} />
        <ActionBtn icon="💬" label="Comments" onClick={handleComments} />
        <ActionBtn icon="↗️" label="Share" onClick={handleShare} />
        <ActionBtn icon="👁" label={formatCount(video.view_count || 0)} />
      </div>

      {/* Comments Sheet */}
      {showComments && (
        <div style={styles.commentsSheet}>
          <div style={styles.commentsHeader}>
            <span style={styles.commentsTitle}>Comments</span>
            <button onClick={() => setShowComments(false)} style={styles.closeBtn}>✕</button>
          </div>
          <div style={styles.commentsList}>
            {comments.length === 0 && <p style={styles.noComments}>No comments yet. Be first!</p>}
            {comments.map(c => (
              <div key={c.id} style={styles.comment}>
                <span style={styles.commentUser}>{c.profiles?.username || 'User'}</span>
                <span style={styles.commentText}>{c.text}</span>
              </div>
            ))}
          </div>
          <div style={styles.commentInput}>
            <input
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              style={styles.commentField}
              onKeyDown={e => e.key === 'Enter' && handlePost()}
            />
            <button onClick={handlePost} style={styles.sendBtn}>↑</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionBtn({ icon, label, onClick, active }) {
  return (
    <button onClick={onClick} style={{ ...styles.actionBtn, opacity: active ? 1 : 0.85 }}>
      <span style={{ fontSize: '26px', filter: active ? 'drop-shadow(0 0 6px #ff416c)' : 'none' }}>{icon}</span>
      <span style={styles.actionLabel}>{label}</span>
    </button>
  );
}

const styles = {
  container: {
    position: 'relative', width: '100%', height: '100%',
    background: '#000', overflow: 'hidden', flexShrink: 0
  },
  video: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  pauseOverlay: {
    position: 'absolute', inset: 0, display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 2
  },
  playIcon: {
    fontSize: '60px', color: 'rgba(255,255,255,0.8)',
    textShadow: '0 2px 20px rgba(0,0,0,0.5)'
  },
  adOverlay: {
    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.92)',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', zIndex: 10
  },
  adBox: {
    width: '90%', maxWidth: '380px', background: '#111', borderRadius: '12px',
    padding: '30px 20px', textAlign: 'center', border: '1px solid #222'
  },
  adLabel: { color: '#ff416c', fontSize: '11px', fontWeight: 700, letterSpacing: '2px', margin: '0 0 8px' },
  adText: { color: '#fff', fontSize: '16px', fontWeight: 600, margin: '0 0 8px' },
  adSub: { color: '#666', fontSize: '12px', margin: 0 },
  adTimer: {
    marginTop: '20px', color: '#aaa', fontSize: '13px',
    background: 'rgba(0,0,0,0.6)', padding: '6px 16px', borderRadius: '20px'
  },
  infoOverlay: {
    position: 'absolute', bottom: '80px', left: '16px', right: '80px', zIndex: 3
  },
  title: {
    color: '#fff', fontSize: '14px', fontWeight: 600, margin: '0 0 4px',
    textShadow: '0 1px 8px rgba(0,0,0,0.8)', lineHeight: 1.3
  },
  date: { color: 'rgba(255,255,255,0.55)', fontSize: '11px', margin: 0 },
  actions: {
    position: 'absolute', right: '12px', bottom: '100px',
    display: 'flex', flexDirection: 'column', gap: '20px', zIndex: 3, alignItems: 'center'
  },
  actionBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: 0
  },
  actionLabel: { color: '#fff', fontSize: '11px', fontWeight: 600, textShadow: '0 1px 4px rgba(0,0,0,0.8)' },
  commentsSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '65%',
    background: '#111', borderRadius: '20px 20px 0 0', zIndex: 20,
    display: 'flex', flexDirection: 'column'
  },
  commentsHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 20px', borderBottom: '1px solid #222'
  },
  commentsTitle: { color: '#fff', fontWeight: 700, fontSize: '16px' },
  closeBtn: { background: 'none', border: 'none', color: '#888', fontSize: '18px', cursor: 'pointer' },
  commentsList: { flex: 1, overflowY: 'auto', padding: '12px 20px' },
  noComments: { color: '#555', textAlign: 'center', marginTop: '30px', fontSize: '14px' },
  comment: { marginBottom: '14px' },
  commentUser: { color: '#ff416c', fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '2px' },
  commentText: { color: '#ddd', fontSize: '14px' },
  commentInput: {
    display: 'flex', gap: '10px', padding: '12px 16px',
    borderTop: '1px solid #222', alignItems: 'center'
  },
  commentField: {
    flex: 1, background: '#1a1a1a', border: '1px solid #333', borderRadius: '20px',
    color: '#fff', padding: '10px 16px', fontSize: '14px', outline: 'none'
  },
  sendBtn: {
    width: '38px', height: '38px', borderRadius: '50%',
    background: 'linear-gradient(135deg, #ff416c, #ff4b2b)',
    border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer'
  }
};

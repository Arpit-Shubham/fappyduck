// src/components/VideoGrid.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function VideoGrid({ title, videos, loading }) {
  const navigate = useNavigate();
  return (
    <div style={styles.wrap}>
      <h2 style={styles.title}>{title}</h2>
      {loading && <div style={styles.center}><div style={styles.spinner} /></div>}
      {!loading && videos.length === 0 && <p style={styles.empty}>Nothing here yet.</p>}
      <div style={styles.grid}>
        {videos.map(v => (
          <div key={v.id} style={styles.card} onClick={() => navigate(`/v/${v.id}`)}>
            <div style={styles.thumb}>
              {v.thumbnail_url
                ? <img src={v.thumbnail_url} alt={v.title} style={styles.thumbImg} loading="lazy" />
                : <div style={styles.thumbPlaceholder}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                      <path d="M8 5v14l11-7z" fill="rgba(26,107,255,0.4)"/>
                    </svg>
                  </div>
              }
            </div>
            <div style={styles.info}>
              <p style={styles.cardTitle}>{v.title}</p>
              <p style={styles.cardMeta}>{(v.view_count||0).toLocaleString()} views</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    minHeight: 'calc(100vh - 68px)', background: '#050508',
    padding: '64px 14px 20px', fontFamily: "'Syne', sans-serif"
  },
  title: {
    color: '#fff', fontSize: '20px', fontWeight: 800, margin: '0 0 18px',
    letterSpacing: '0.3px'
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' },
  card: {
    cursor: 'pointer', borderRadius: '14px', overflow: 'hidden',
    background: 'rgba(26,107,255,0.04)',
    border: '1px solid rgba(26,107,255,0.08)',
    transition: 'border-color 0.2s ease'
  },
  thumb: { aspectRatio: '9/16', background: '#0a0e1a', position: 'relative', overflow: 'hidden' },
  thumbImg: { width: '100%', height: '100%', objectFit: 'cover' },
  thumbPlaceholder: {
    width: '100%', height: '100%', display: 'flex',
    alignItems: 'center', justifyContent: 'center'
  },
  info: { padding: '8px 10px 10px' },
  cardTitle: { color: '#ddd', fontSize: '12px', fontWeight: 700, margin: '0 0 3px', lineHeight: 1.3 },
  cardMeta: { color: '#444', fontSize: '11px', margin: 0 },
  center: { display: 'flex', justifyContent: 'center', padding: '60px 0' },
  spinner: {
    width: '28px', height: '28px',
    border: '2px solid rgba(26,107,255,0.15)',
    borderTop: '2px solid #1a6bff',
    borderRadius: '50%', animation: 'spin 0.8s linear infinite'
  },
  empty: { color: '#333', textAlign: 'center', marginTop: '80px', fontSize: '15px' }
};

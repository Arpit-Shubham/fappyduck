// src/components/VideoGrid.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function VideoGrid({ title, videos, loading }) {
  const navigate = useNavigate();

  return (
    <div style={styles.wrap}>
      <h2 style={styles.title}>{title}</h2>
      {loading && <div style={styles.center}><div style={styles.spinner} /></div>}
      {!loading && videos.length === 0 && (
        <p style={styles.empty}>Nothing here yet.</p>
      )}
      <div style={styles.grid}>
        {videos.map(v => (
          <div key={v.id} style={styles.card} onClick={() => navigate(`/v/${v.id}`)}>
            <div style={styles.thumb}>
              {v.thumbnail_url
                ? <img src={v.thumbnail_url} alt={v.title} style={styles.thumbImg} loading="lazy" />
                : <div style={styles.thumbPlaceholder}>▶</div>
              }
            </div>
            <p style={styles.cardTitle}>{v.title}</p>
            <p style={styles.cardMeta}>{v.view_count?.toLocaleString()} views</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    minHeight: 'calc(100vh - 68px)', background: '#0a0a0a',
    padding: '60px 16px 20px', fontFamily: "'Syne', sans-serif"
  },
  title: { color: '#fff', fontSize: '22px', fontWeight: 800, margin: '0 0 20px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' },
  card: { cursor: 'pointer', borderRadius: '12px', overflow: 'hidden', background: '#111' },
  thumb: { aspectRatio: '9/16', background: '#1a1a1a', position: 'relative', overflow: 'hidden' },
  thumbImg: { width: '100%', height: '100%', objectFit: 'cover' },
  thumbPlaceholder: {
    width: '100%', height: '100%', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    color: '#333', fontSize: '28px'
  },
  cardTitle: { color: '#ddd', fontSize: '12px', fontWeight: 600, padding: '8px 10px 2px', margin: 0, lineHeight: 1.3 },
  cardMeta: { color: '#555', fontSize: '11px', padding: '0 10px 8px', margin: 0 },
  center: { display: 'flex', justifyContent: 'center', padding: '60px 0' },
  spinner: {
    width: '28px', height: '28px', border: '2px solid #222',
    borderTop: '2px solid #ff416c', borderRadius: '50%',
    animation: 'spin 0.8s linear infinite'
  },
  empty: { color: '#555', textAlign: 'center', marginTop: '80px', fontSize: '15px' }
};

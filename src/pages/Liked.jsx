// src/pages/Liked.jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { fetchLiked } from '../lib/supabase';
import VideoGrid from '../components/VideoGrid';

export default function Liked() {
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetchLiked(user.id).then(data => { setVideos(data); setLoading(false); });
  }, [user]);

  if (!user) return <AuthPrompt label="liked videos" />;
  return <VideoGrid title="❤️ Liked Videos" videos={videos} loading={loading} />;
}

function AuthPrompt({ label }) {
  return (
    <div style={{ minHeight: 'calc(100vh - 68px)', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
      <p style={{ color: '#555', fontSize: '16px' }}>Sign in to see your {label}</p>
      <a href="/account" style={{ color: '#ff416c', fontSize: '14px', textDecoration: 'none' }}>Go to Account →</a>
    </div>
  );
}

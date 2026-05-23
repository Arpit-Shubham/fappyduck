// src/pages/History.jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { fetchHistory } from '../lib/supabase';
import VideoGrid from '../components/VideoGrid';

export default function History() {
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetchHistory(user.id).then(data => { setVideos(data); setLoading(false); });
  }, [user]);

  if (!user) return <AuthPrompt label="history" />;
  return <VideoGrid title="🕐 Watch History" videos={videos} loading={loading} />;
}

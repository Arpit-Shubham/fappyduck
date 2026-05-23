// src/pages/Liked.jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { fetchLiked } from '../lib/supabase';
import VideoGrid from '../components/VideoGrid';
import AuthPrompt from '../components/AuthPrompt';

export default function Liked() {
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetchLiked(user.id).then(data => { setVideos(data); setLoading(false); });
  }, [user]);

  if (!user) return <AuthPrompt icon="❤️" title="Liked Videos" message="Sign in to save all the videos you love." />;
  return <VideoGrid title="❤️ Liked Videos" videos={videos} loading={loading} />;
}

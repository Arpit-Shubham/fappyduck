// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY_HERE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function fetchVideos(sortBy = 'trending', page = 0, limit = 10) {
  let query = supabase
    .from('videos').select('*').eq('published', true)
    .range(page * limit, (page + 1) * limit - 1);
  if (sortBy === 'trending') query = query.order('view_count', { ascending: false });
  else if (sortBy === 'latest') query = query.order('created_at', { ascending: false });
  else if (sortBy === 'oldest') query = query.order('created_at', { ascending: true });
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// Returns fresh counts from DB after incrementing
export async function incrementView(videoId) {
  await supabase.rpc('increment_view', { video_id: videoId });
  const { data } = await supabase.from('videos').select('view_count').eq('id', videoId).single();
  return data?.view_count ?? null;
}

// Returns { liked, likeCount } fresh from DB
export async function toggleLike(videoId, userId) {
  const { data: existing } = await supabase
    .from('likes').select('id').eq('video_id', videoId).eq('user_id', userId).single();
  if (existing) {
    await supabase.from('likes').delete().eq('id', existing.id);
    await supabase.rpc('decrement_like', { video_id: videoId });
  } else {
    await supabase.from('likes').insert({ video_id: videoId, user_id: userId });
    await supabase.rpc('increment_like', { video_id: videoId });
  }
  const { data } = await supabase.from('videos').select('like_count').eq('id', videoId).single();
  return { liked: !existing, likeCount: data?.like_count ?? 0 };
}

export async function isLiked(videoId, userId) {
  const { data } = await supabase.from('likes').select('id')
    .eq('video_id', videoId).eq('user_id', userId).single();
  return !!data;
}

export async function addToHistory(videoId, userId) {
  await supabase.from('history').upsert(
    { video_id: videoId, user_id: userId, watched_at: new Date().toISOString() },
    { onConflict: 'video_id,user_id' }
  );
}

export async function fetchHistory(userId) {
  const { data, error } = await supabase.from('history')
    .select('video_id, watched_at, videos(*)')
    .eq('user_id', userId).order('watched_at', { ascending: false }).limit(50);
  if (error) throw error;
  return data?.map(h => ({ ...h.videos, watched_at: h.watched_at })) || [];
}

export async function fetchLiked(userId) {
  const { data, error } = await supabase.from('likes')
    .select('video_id, videos(*)')
    .eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return data?.map(l => l.videos) || [];
}

export async function fetchComments(videoId) {
  const { data, error } = await supabase.from('comments')
    .select('*, profiles(username, avatar_url)')
    .eq('video_id', videoId).order('created_at', { ascending: false }).limit(30);
  if (error) throw error;
  return data || [];
}

export async function postComment(videoId, userId, text) {
  const { data, error } = await supabase.from('comments')
    .insert({ video_id: videoId, user_id: userId, text })
    .select('*, profiles(username, avatar_url)').single();
  if (error) throw error;
  return data;
}

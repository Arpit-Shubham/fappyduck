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

export async function incrementView(videoId) {
  try {
    await supabase.rpc('increment_view', { video_id: videoId });
    const { data } = await supabase.from('videos').select('view_count').eq('id', videoId).single();
    return data?.view_count ?? null;
  } catch { return null; }
}

// ── Likes — works for both Supabase video IDs and eporner string IDs ──────────
// Uses eporner_likes table which stores video_id as plain text (no FK constraint)
export async function toggleLike(videoId, userId) {
  try {
    const { data: existing } = await supabase
      .from('eporner_likes')
      .select('id')
      .eq('video_id', String(videoId))
      .eq('user_id', userId)
      .single();

    if (existing) {
      await supabase.from('eporner_likes').delete().eq('id', existing.id);
      return { liked: false, likeCount: await getLikeCount(videoId) };
    } else {
      await supabase.from('eporner_likes').insert({
        video_id: String(videoId),
        user_id: userId
      });
      return { liked: true, likeCount: await getLikeCount(videoId) };
    }
  } catch (e) {
    console.error('toggleLike error:', e);
    return { liked: false, likeCount: 0 };
  }
}

async function getLikeCount(videoId) {
  const { count } = await supabase
    .from('eporner_likes')
    .select('id', { count: 'exact', head: true })
    .eq('video_id', String(videoId));
  return count || 0;
}

export async function isLiked(videoId, userId) {
  try {
    const { data } = await supabase
      .from('eporner_likes')
      .select('id')
      .eq('video_id', String(videoId))
      .eq('user_id', userId)
      .single();
    return !!data;
  } catch { return false; }
}

// ── History — stores eporner video metadata alongside the ID ─────────────────
export async function addToHistory(videoId, userId, videoMeta) {
  try {
    await supabase.from('eporner_history').upsert(
      {
        video_id: String(videoId),
        user_id: userId,
        watched_at: new Date().toISOString(),
        title: videoMeta?.title || '',
        thumbnail_url: videoMeta?.thumbnail_url || '',
        duration: videoMeta?.duration || 0,
        view_count: videoMeta?.view_count || 0,
        embed_url: videoMeta?.embed_url || ''
      },
      { onConflict: 'video_id,user_id' }
    );
  } catch (e) { console.error('addToHistory error:', e); }
}

export async function fetchHistory(userId) {
  try {
    const { data, error } = await supabase
      .from('eporner_history')
      .select('*')
      .eq('user_id', userId)
      .order('watched_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    // Reshape to match VideoGrid's expected format
    return (data || []).map(h => ({
      id: h.video_id,
      title: h.title,
      thumbnail_url: h.thumbnail_url,
      view_count: h.view_count,
      duration: h.duration,
      embed_url: h.embed_url,
      is_embed: true,
      watched_at: h.watched_at
    }));
  } catch (e) { console.error('fetchHistory error:', e); return []; }
}

export async function fetchLiked(userId) {
  try {
    const { data, error } = await supabase
      .from('eporner_likes')
      .select('video_id, title, thumbnail_url, view_count, duration, embed_url, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(l => ({
      id: l.video_id,
      title: l.title || '',
      thumbnail_url: l.thumbnail_url || '',
      view_count: l.view_count || 0,
      duration: l.duration || 0,
      embed_url: l.embed_url || '',
      is_embed: true
    }));
  } catch (e) { console.error('fetchLiked error:', e); return []; }
}

export async function fetchComments(videoId) {
  try {
    const { data, error } = await supabase
      .from('eporner_comments')
      .select('*, profiles(username, avatar_url)')
      .eq('video_id', String(videoId))
      .order('created_at', { ascending: false })
      .limit(30);
    if (error) throw error;
    return data || [];
  } catch (e) { console.error('fetchComments error:', e); return []; }
}

export async function postComment(videoId, userId, text) {
  const { data, error } = await supabase
    .from('eporner_comments')
    .insert({ video_id: String(videoId), user_id: userId, text })
    .select('*, profiles(username, avatar_url)')
    .single();
  if (error) throw error;
  return data;
}

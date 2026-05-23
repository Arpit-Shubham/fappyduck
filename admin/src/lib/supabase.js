// admin/src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

// ⚠️ Use REACT_APP_SUPABASE_SERVICE_KEY here for admin access
// Get it from Supabase → Project Settings → API → service_role key
// NEVER expose this in the frontend user app — admin only!
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.REACT_APP_SUPABASE_SERVICE_KEY || 'YOUR_SERVICE_ROLE_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export async function getAllVideos() {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function upsertVideo(video) {
  const { data, error } = await supabase
    .from('videos')
    .upsert(video)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteVideo(id) {
  const { error } = await supabase.from('videos').delete().eq('id', id);
  if (error) throw error;
}

export async function togglePublish(id, current) {
  const { error } = await supabase
    .from('videos')
    .update({ published: !current })
    .eq('id', id);
  if (error) throw error;
}

export async function uploadThumbnail(file) {
  const ext = file.name.split('.').pop();
  const name = `thumb_${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from('thumbnails')
    .upload(name, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from('thumbnails').getPublicUrl(name);
  return data.publicUrl;
}

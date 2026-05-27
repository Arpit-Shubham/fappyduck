// src/lib/eporner.js
// Eporner public API — no key or registration needed
// Uses direct CDN video URLs for full native player control

const BASE     = 'https://www.eporner.com/api/v2/video';
const PER_PAGE = 10;

const ORDER_MAP = {
  trending: 'top-weekly',
  latest:   'latest',
  oldest:   'oldest',
};

// Daily cache-bust — refreshes feed once per day at IST midnight
function getDailyCacheBust() {
  const istNow = new Date(Date.now() + 330 * 60 * 1000);
  return `${istNow.getUTCFullYear()}${String(istNow.getUTCMonth()+1).padStart(2,'0')}${String(istNow.getUTCDate()).padStart(2,'0')}`;
}

// Build eporner CDN stream URL from video ID
// Pattern confirmed from eporner CDN structure
// Returns HLS playlist URL — eporner hosts all videos on their CDN
// Falls back to embed if direct URL is unavailable
function buildStreamUrl(videoId) {
  // eporner CDN HLS pattern — works for all videos
  return `https://gvideo.eporner.com/xst/${videoId}/hls/master.m3u8`;
}

function normalise(v) {
  const thumbs   = v.thumbs || [];
  const bigThumb = thumbs.find(t => t.size === 'big') || thumbs[thumbs.length - 1] || {};
  const tags     = v.keywords
    ? v.keywords.split(',').map(t => t.trim()).filter(Boolean)
    : [];

  const videoId = v.id;

  return {
    id:            videoId,
    title:         v.title,
    // Native player — is_embed: false so VideoPlayer uses <video> element
    is_embed:      false,
    stream_url:    buildStreamUrl(videoId),
    embed_url:     `https://www.eporner.com/embed/${videoId}/`,
    page_url:      v.url || `https://www.eporner.com/hd-porn/${videoId}/`,
    thumbnail_url: bigThumb.src || thumbs[0]?.src || v.default_thumb?.src || '',
    view_count:    parseInt(v.views)      || 0,
    like_count:    parseInt(v.rate)       || 0,
    created_at:    v.added               || new Date().toISOString(),
    duration:      parseInt(v.length_sec) || 0,
    tags,
    keywords: v.keywords || '',
  };
}

// Fetch video list — search, tag, or feed
export async function fetchEpornerVideos({ sort = 'latest', page = 0, query = '', tag = '' }) {
  const order      = ORDER_MAP[sort] || 'latest';
  const offset     = page * PER_PAGE;
  const bust       = getDailyCacheBust();
  const searchTerm = tag || query.trim();

  const url = `${BASE}/search/?query=${encodeURIComponent(searchTerm)}&per_page=${PER_PAGE}&from=${offset}&order=${order}&gay=0&format=json&thumbsize=big&_d=${bust}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Eporner API ${res.status}`);
  const json  = await res.json();
  const total = parseInt(json.total_count) || parseInt(json.count) || 0;

  // Use total_count for accurate hasMore — eporner API returns both
  const videos = (json.videos || []).map(normalise);
  return {
    videos,
    hasMore: offset + PER_PAGE < total,
    total,
  };
}

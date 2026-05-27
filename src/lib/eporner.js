// src/lib/eporner.js
// Eporner public API — no key or registration needed

const BASE     = 'https://www.eporner.com/api/v2/video';
const PER_PAGE = 10;

const ORDER_MAP = {
  trending: 'top-weekly',
  latest:   'latest',
  oldest:   'oldest',
};

// Daily cache-bust key — changes once per day at midnight IST (UTC+5:30)
// Ensures trending feed refreshes daily instead of serving stale cached results
function getDailyCacheBust() {
  const now = new Date();
  // Offset to IST: UTC+5:30 = +330 minutes
  const istOffset = 330 * 60 * 1000;
  const istNow    = new Date(now.getTime() + istOffset);
  // Key = YYYYMMDD in IST — changes at IST midnight = UTC 18:30 previous day
  return `${istNow.getUTCFullYear()}${String(istNow.getUTCMonth()+1).padStart(2,'0')}${String(istNow.getUTCDate()).padStart(2,'0')}`;
}

function normalise(v) {
  const thumbs    = v.thumbs || [];
  const bigThumb  = thumbs.find(t => t.size === 'big') || thumbs[thumbs.length - 1] || {};
  // Parse tags/keywords into array
  const tags = v.keywords
    ? v.keywords.split(',').map(t => t.trim()).filter(Boolean)
    : [];

  return {
    id:            v.id,
    title:         v.title,
    embed_url:     `https://www.eporner.com/embed/${v.id}/`,
    stream_url:    `https://www.eporner.com/hd-porn/${v.id}/`,
    thumbnail_url: bigThumb.src || thumbs[0]?.src || '',
    view_count:    parseInt(v.views)       || 0,
    like_count:    parseInt(v.rate)        || 0,
    created_at:    v.added                 || new Date().toISOString(),
    duration:      parseInt(v.length_sec)  || 0,
    tags,                           // ← array of tag strings
    keywords:      v.keywords || '',
    is_embed:      true,
  };
}

export async function fetchEpornerVideos({ sort = 'trending', page = 0, query = '', tag = '' }) {
  const order  = ORDER_MAP[sort] || 'top-weekly';
  const offset = page * PER_PAGE;
  const bust   = getDailyCacheBust(); // cache-busts once per day IST

  let url;
  const searchTerm = tag ? tag : (query.trim() ? query.trim() : '');

  url = `${BASE}/search/?query=${encodeURIComponent(searchTerm)}&per_page=${PER_PAGE}&from=${offset}&order=${order}&gay=0&format=json&thumbsize=big&_d=${bust}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Eporner API ${res.status}`);
  const json   = await res.json();
  const videos = (json.videos || []).map(normalise);
  const total  = parseInt(json.count) || 0;
  return { videos, hasMore: offset + PER_PAGE < total, total };
}

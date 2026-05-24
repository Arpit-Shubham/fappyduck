// src/lib/eporner.js
// Eporner public API — no key or registration needed
// Docs: https://github.com/eporner/API

const BASE = 'https://www.eporner.com/api/v2/video';
const PER_PAGE = 10;

// Sort map: our keys → eporner order param
const ORDER_MAP = {
  trending: 'top-weekly',
  latest:   'latest',
  oldest:   'oldest',
};

// Normalise an eporner video object into the same shape VideoPlayer expects
function normalise(v) {
  // eporner returns embed URL like https://www.eporner.com/embed/VIDEOID/
  // We build the HLS stream URL from their format
  // eporner serves videos via their own embed — we use the embed src for the player
  const thumbs = v.thumbs || [];
  const bigThumb = thumbs.find(t => t.size === 'big') || thumbs[thumbs.length - 1] || {};

  return {
    id:            v.id,
    title:         v.title,
    stream_url:    `https://www.eporner.com/hd-porn/${v.id}/`, // embed fallback
    embed_url:     `https://www.eporner.com/embed/${v.id}/`,
    thumbnail_url: bigThumb.src || (thumbs[0]?.src) || '',
    view_count:    parseInt(v.views)  || 0,
    like_count:    parseInt(v.rate)   || 0,
    created_at:    v.added            || new Date().toISOString(),
    duration:      parseInt(v.length_sec) || 0,
    keywords:      v.keywords         || '',
    // flag so VideoPlayer knows this is an embed-based video
    is_embed:      true,
  };
}

export async function fetchEpornerVideos({ sort = 'trending', page = 0, query = '' }) {
  const order = ORDER_MAP[sort] || 'top-weekly';
  const offset = page * PER_PAGE;
  let url;

  if (query.trim()) {
    url = `${BASE}/search/?query=${encodeURIComponent(query)}&per_page=${PER_PAGE}&from=${offset}&order=${order}&gay=0&format=json&thumbsize=big`;
  } else {
    url = `${BASE}/search/?query=&per_page=${PER_PAGE}&from=${offset}&order=${order}&gay=0&format=json&thumbsize=big`;
  }

  const res  = await fetch(url);
  if (!res.ok) throw new Error(`Eporner API error: ${res.status}`);
  const json = await res.json();
  const videos = (json.videos || []).map(normalise);
  const total  = json.count || 0;
  const hasMore = offset + PER_PAGE < total;
  return { videos, hasMore, total };
}

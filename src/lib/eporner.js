// src/lib/eporner.js
const BASE     = 'https://www.eporner.com/api/v2/video';
const PER_PAGE = 10;

const ORDER_MAP = {
  trending: 'top-weekly',
  latest:   'latest',
  oldest:   'oldest',
};


function normalise(v) {
  const thumbs   = v.thumbs || [];
  const bigThumb = thumbs.find(t => t.size === 'big') || thumbs[thumbs.length - 1] || {};
  const tags     = v.keywords
    ? v.keywords.split(',').map(t => t.trim()).filter(Boolean)
    : [];
  return {
    id:            v.id,
    title:         v.title,
    is_embed:      true,
    embed_url:     `https://www.eporner.com/embed/${v.id}/`,
    stream_url:    null,
    thumbnail_url: bigThumb.src || thumbs[0]?.src || '',
    view_count:    parseInt(v.views)      || 0,
    like_count:    parseInt(v.rate)       || 0,
    created_at:    v.added               || new Date().toISOString(),
    duration:      parseInt(v.length_sec) || 0,
    tags,
    keywords:      v.keywords || '',
  };
}

export async function fetchEpornerVideos({ sort = 'latest', page = 0, query = '', tag = '' }) {
  const order      = ORDER_MAP[sort] || 'latest';
  const offset     = page * PER_PAGE;
  const searchTerm = tag || query.trim();
  const url = `${BASE}/search/?query=${encodeURIComponent(searchTerm)}&per_page=${PER_PAGE}&from=${offset}&order=${order}&gay=0&format=json&thumbsize=big`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Eporner API ${res.status}`);
  const json = await res.json();

  // Use total_count for reliable hasMore — avoids the "stuck at 10" bug
  const total  = parseInt(json.total_count) || parseInt(json.count) || 9999;
  const videos = (json.videos || []).map(normalise);

  // hasMore: true as long as we got a full page back
  // This is more reliable than trusting the count field
  const hasMore = videos.length === PER_PAGE;

  return { videos, hasMore, total };
}

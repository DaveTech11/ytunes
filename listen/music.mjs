// YouTube Data API v3 catalogue + YouTube's official embedded player.
// Playback stays inside the official YouTube player; this app never extracts audio.
const API_KEY = () => String(process.env.YOUTUBE_API_KEY || '').trim();
const REGION = () => /^[A-Z]{2}$/.test(String(process.env.YOUTUBE_REGION || 'NG').toUpperCase())
  ? String(process.env.YOUTUBE_REGION || 'NG').toUpperCase() : 'NG';
const API = 'https://www.googleapis.com/youtube/v3';
const clean = (s, n = 120) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n);
const cache = new Map();
const TTL = 5 * 60 * 1000;
function cached(key) { const v = cache.get(key); return v && Date.now() - v.at < TTL ? v.data : null; }
function remember(key, data) { cache.set(key, { at: Date.now(), data }); if (cache.size > 100) cache.delete(cache.keys().next().value); }
async function yt(path, params) {
  if (!API_KEY()) throw new Error('YouTube is not configured. Add YOUTUBE_API_KEY to the server environment.');
  const q = new URLSearchParams(Object.assign({}, params, { key: API_KEY() }));
  const r = await fetch(`${API}/${path}?${q}`, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(12000) });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(body.error && body.error.message || `YouTube API returned ${r.status}`);
  return body;
}
function durationSeconds(iso) {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(String(iso || ''));
  return m ? (Number(m[1] || 0) * 3600 + Number(m[2] || 0) * 60 + Number(m[3] || 0)) : 0;
}
function mapVideo(v) {
  const s = v.snippet || {}, id = typeof v.id === 'string' ? v.id : v.id && v.id.videoId;
  if (!id) return null;
  const thumbs = s.thumbnails || {};
  const cover = (thumbs.maxres || thumbs.high || thumbs.medium || thumbs.default || {}).url || '';
  return {
    id: `yt_${id}`, videoId: id, title: clean(s.title, 160), artist: clean(s.channelTitle, 120),
    album: 'YouTube', cover, duration: durationSeconds(v.contentDetails && v.contentDetails.duration),
    source: 'youtube', full: true, url: `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`
  };
}
async function hydrate(items) {
  const ids = items.map(x => x && (typeof x.id === 'string' ? x.id : x.id && x.id.videoId)).filter(Boolean).slice(0, 50);
  if (!ids.length) return [];
  const details = await yt('videos', { part: 'snippet,contentDetails', id: ids.join(','), maxResults: String(ids.length) });
  const byId = new Map((details.items || []).map(x => [x.id, x]));
  return ids.map(id => mapVideo(byId.get(id))).filter(x => x && x.duration > 0);
}
export async function musicSearch(q, limit = 30, region = REGION()) {
  const query = clean(q, 80);
  const regionCode = /^[A-Z]{2}$/.test(String(region || '').toUpperCase()) ? String(region).toUpperCase() : REGION();
  if (!query) return [];
  const key = `search:${query.toLowerCase()}:${regionCode}`;
  const hit = cached(key); if (hit) return hit;
  const found = await yt('search', {
    part: 'snippet', q: `${query} official audio`, type: 'video', videoCategoryId: '10',
    regionCode, relevanceLanguage: 'en',
    maxResults: String(Math.min(50, limit))
  });
  const tracks = (await hydrate(found.items || [])).slice(0, limit);
  remember(key, tracks); return tracks;
}
export async function musicTrending(limit = 30, region = REGION()) {
  const regionCode = /^[A-Z]{2}$/.test(String(region || '').toUpperCase()) ? String(region).toUpperCase() : REGION();
  const key = `trending:${regionCode}`;
  const hit = cached(key); if (hit) return hit;
  const found = await yt('videos', {
    part: 'snippet,contentDetails', chart: 'mostPopular', regionCode,
    videoCategoryId: '10', maxResults: String(Math.min(50, limit))
  });
  const tracks = (found.items || []).map(mapVideo).filter(x => x && x.duration > 0).slice(0, limit);
  remember(key, tracks); return tracks;
}
export async function musicTrack(id) {
  const m = /^yt_([A-Za-z0-9_-]{6,20})$/.exec(String(id || ''));
  if (!m) return null;
  const r = await yt('videos', { part: 'snippet,contentDetails', id: m[1] });
  return r.items && r.items[0] ? mapVideo(r.items[0]) : null;
}
// Retained as a compatibility export for the host integration. YouTube playback is iframe-only.
export async function streamUpstream() { throw new Error('YouTube audio is played in the official embedded player.'); }

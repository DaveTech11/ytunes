// The music website + its API, as ONE mountable handler.
// Used two ways:
//   1) inside the Xyron AI server  -> base "/listen", sign-in comes from Xyron (Google included)
//   2) by the standalone server.mjs -> base "",       sign-in comes from auth.mjs (own Google sign-in)
// Nothing here knows which one it is: the host passes in who the visitor is (`me`) and a few callbacks.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { musicSearch, musicTrending, musicTrack, streamUpstream } from './music.mjs';

const PUBLIC = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public');

// Only these hosts may be streamed through the stream route (it is not an open proxy).
const ALLOWED = []; // YouTube playback uses the official iframe player, never a proxied audio stream.
const hostOk = (u) => {
  try {
    const x = new URL(u);
    return x.protocol === 'https:' && ALLOWED.some((h) => x.hostname === h || x.hostname.endsWith('.' + h));
  } catch { return false; }
};

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.ico': 'image/x-icon',
};
const SECURITY = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Content-Security-Policy': "default-src 'self'; img-src 'self' https: data:; media-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' https://www.youtube.com https://s.ytimg.com; frame-src https://www.youtube.com https://www.youtube-nocookie.com; connect-src 'self' https://www.youtube.com https://youtube.com; base-uri 'none'; frame-ancestors 'none'",
};

function json(res, code, body) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...SECURITY });
  res.end(JSON.stringify(body));
}

/**
 * opts:
 *   base             "" or "/listen" (no trailing slash)
 *   secret           string or () => string. Signs the song stream links
 *   requireLogin     boolean or () => boolean. When true, search/streaming need a signed-in visitor.
 *   googleConfigured () => boolean   shows/hides the Google button
 *   googleStart      (req, res, u) => void   begins Google sign-in (host decides how)
 *   logout           async (req, res, me) => void
 *   otherLoginUrl    optional link for other sign-in methods (e.g. Xyron's email/phone login page)
 *   ip               optional (req) => string
 */
export function createListen(opts = {}) {
  const base = String(opts.base || '').replace(/\/+$/, '');
  const fallback = crypto.randomBytes(32).toString('hex');
  const getSecret = () => (typeof opts.secret === 'function' ? opts.secret() : opts.secret) || fallback; // may be a function so the host can supply it lazily
  const needLogin = () => (typeof opts.requireLogin === 'function' ? !!opts.requireLogin() : opts.requireLogin !== false);
  const sign = (u) => crypto.createHmac('sha256', getSecret()).update(u).digest('hex').slice(0, 32);
  const sigOk = (u, s) => {
    const a = Buffer.from(sign(String(u || ''))), b = Buffer.from(String(s || ''));
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  };
  const out = (t) => ({
    id: t.id, videoId: t.videoId, url: t.url, title: t.title, artist: t.artist, album: t.album,
    cover: t.cover, duration: t.duration, source: t.source, full: true,
  });
  const publicUser = (me) => {
    const email = String(me.email || '');
    const pic = String(me.picture || '');
    return {
      id: String(me.id || me.email || '').slice(0, 180),
      name: String(me.name || me.full_name || email.split('@')[0] || 'Listener').slice(0, 60),
      email,
      picture: /^https:\/\//i.test(pic) ? pic : '',
    };
  };

  const hits = new Map();
  const risingHistory = new Map(); // region -> last two daily trending snapshots, kept in memory
  // Live listening rooms are intentionally ephemeral: room state and chat live
  // for the lifetime of this server process. Playback is synchronized via SSE + POST.
  const rooms = new Map();
  const roomId = () => crypto.randomBytes(4).toString('hex').toUpperCase();
  const roomUser = (me) => ({ id: String(me.id || me.email || 'listener').slice(0, 180), name: String(me.name || me.full_name || me.email || 'Listener').slice(0, 60) });
  const queueSnapshot = (room) => room.queue.map(q => ({ id: q.id, track: q.track, suggestedBy: q.suggestedBy, suggestedById: q.suggestedById, votes: q.votes.size, voterIds: Array.from(q.votes) })).sort((a, b) => (b.votes - a.votes) || 0);
  const roomSnapshot = (room) => ({ id: room.id, name: room.name, genre: room.genre, isPublic: room.isPublic, scheduledAt: room.scheduledAt, hostId: room.hostId, state: room.state, queue: queueSnapshot(room), participants: Array.from(room.participants.values()), messages: room.messages.slice(-60) });
  const roomSummary = (room) => { const host = room.participants.get(room.hostId) || {}; return { id: room.id, name: room.name, genre: room.genre, scheduledAt: room.scheduledAt, host: host.name || 'Host', listeners: room.participants.size, nowPlaying: room.state.track ? { title: room.state.track.title, artist: room.state.track.artist, cover: room.state.track.cover } : null, live: room.clients.size > 0 }; };
  const roomBroadcast = (room, type, data) => {
    const packet = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of room.clients) { try { client.write(packet); } catch { room.clients.delete(client); } }
  };
  const usage = { search: 0, trending: 0, track: 0, windowStarted: Date.now() };
  const RATE = { search: 20, trending: 30, track: 60 };
  const dataRoot = path.resolve(process.env.DATA_DIR || './data');
  const adminFile = path.join(dataRoot, 'admin-workspace.json');
  const listeningFile = path.join(dataRoot, 'listening-analytics.json');
  let listeningState = null;
  async function getListeningState() {
    if (listeningState) return listeningState;
    try { listeningState = JSON.parse(await readFile(listeningFile, 'utf8')); } catch { listeningState = { users: {}, events: [] }; }
    listeningState.users ||= {}; listeningState.events ||= []; return listeningState;
  }
  async function saveListeningState() { const state = await getListeningState(); await mkdir(dataRoot, { recursive: true }); await writeFile(listeningFile, JSON.stringify(state, null, 2)); }
  let adminState = null;
  async function getAdminState() {
    if (adminState) return adminState;
    try { adminState = JSON.parse(await readFile(adminFile, 'utf8')); } catch { adminState = {}; }
    adminState = { announcements: [], promotions: [], featured: [], reports: [], support: [], logs: [], settings: { maintenance: false, searchLimit: RATE.search, trendingLimit: RATE.trending, trackLimit: RATE.track }, ...(adminState || {}) };
    return adminState;
  }
  async function saveAdminState() { await mkdir(path.dirname(adminFile), { recursive: true }); await writeFile(adminFile, JSON.stringify(adminState, null, 2)); }
  async function readBody(req, max = 12000) { let body=''; for await (const chunk of req) { body += chunk; if (body.length > max) throw new Error('Request too large'); } return JSON.parse(body || '{}'); }
  const getRate = (name) => Number(adminState && adminState.settings && adminState.settings[name + 'Limit']) || RATE[name];
  const limited = (key, max) => {
    const minute = Math.floor(Date.now() / 60000);
    const k = `${key}:${minute}`;
    const n = (hits.get(k) || 0) + 1;
    hits.set(k, n);
    if (hits.size > 5000) {
      for (const [oldKey] of hits) {
        const oldMinute = Number(oldKey.slice(oldKey.lastIndexOf(':') + 1));
        if (!Number.isFinite(oldMinute) || oldMinute < minute - 2) hits.delete(oldKey);
      }
    }
    return n > max;
  };

  // Returns true when it handled the request (so the host should stop), false when it is not ours.
  return async function handle({ req, res, u, p, method, me }) {
    if (base && p === base) { res.writeHead(302, { Location: base + '/' }); res.end(); return true; }
    if (!p.startsWith(base + '/')) return false;
    const rel = p.slice(base.length); // always starts with "/"

    // ---------------- API ----------------
    if (rel.startsWith('/api/')) {
      const route = rel.slice(5);
      const ip = (opts.ip ? opts.ip(req) : '') || String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();

      if (route === 'config' && method === 'GET') {
        return json(res, 200, { requireLogin: needLogin(), google: !!(opts.googleConfigured && opts.googleConfigured()), otherLogin: opts.otherLoginUrl || null, region: process.env.YOUTUBE_REGION || 'NG', limits: RATE, isAdmin: !!(me && opts.isAdmin && opts.isAdmin(me)) }), true;
      }
      if (route === 'rooms/list' && method === 'GET') {
        const now = Date.now(), genre = String(new URL(req.url, 'http://x').searchParams.get('genre') || 'Any');
        const list = [];
        for (const room of rooms.values()) {
          if (!room.isPublic) continue;
          const upcoming = room.scheduledAt && Date.parse(room.scheduledAt) > now;
          if (!room.clients.size && !upcoming) continue;
          if (genre !== 'Any' && room.genre !== genre) continue;
          list.push(roomSummary(room));
        }
        list.sort((a, b) => (b.live - a.live) || (b.listeners - a.listeners));
        return json(res, 200, { rooms: list.slice(0, 50) }), true;
      }
      if (route === 'rooms/create' && method === 'POST') {
        if (!me) return json(res, 401, { message: 'Sign in to create a Listening Room.' }), true;
        try {
          const body = await readBody(req, 4096), owner = roomUser(me);
          for (const [oldId, oldRoom] of rooms) if (Date.now() - oldRoom.createdAt > 12 * 60 * 60 * 1000) rooms.delete(oldId);
          let id = roomId(); while (rooms.has(id)) id = roomId();
          const scheduled = body.scheduledAt ? Date.parse(String(body.scheduledAt)) : NaN;
          if (body.scheduledAt && (!Number.isFinite(scheduled) || scheduled < Date.now() - 60000 || scheduled > Date.now() + 7 * 86400000)) throw new Error('Pick a start time within the next 7 days.');
          const GENRES = ['Any', 'Afrobeats', 'Hip-Hop', 'Pop', 'R&B', 'Chill', 'Gospel', 'Electronic'];
          const room = { id, name: String(body.name || `${owner.name}'s room`).trim().slice(0, 60) || 'Listening room', genre: GENRES.includes(body.genre) ? body.genre : 'Any', isPublic: !!body.isPublic, scheduledAt: Number.isFinite(scheduled) ? new Date(scheduled).toISOString() : null, hostId: owner.id, createdAt: Date.now(), state: { track: null, playing: false, position: 0, updatedAt: Date.now() }, participants: new Map([[owner.id, owner]]), clients: new Set(), messages: [], queue: [] };
          rooms.set(id, room);
          if (body.track && typeof body.track === 'object') { room.state.track = { id: String(body.track.id || '').slice(0,180), videoId: String(body.track.videoId || '').slice(0,40), title: String(body.track.title || '').slice(0,160), artist: String(body.track.artist || '').slice(0,120), cover: String(body.track.cover || '').slice(0,1000), duration: Math.max(0, Number(body.track.duration) || 0) }; room.state.playing = true; }
          return json(res, 201, { ok: true, room: roomSnapshot(room) }), true;
        } catch (e) { return json(res, 400, { message: e.message || 'Could not create room.' }), true; }
      }
      const roomMatch = route.match(/^rooms\/([A-Z0-9]{8})(?:\/(events|chat|control))?$/i);
      if (roomMatch) {
        const id = roomMatch[1].toUpperCase(), action = roomMatch[2] || '', room = rooms.get(id);
        if (!room) return json(res, 404, { message: 'This room is no longer available. Ask the host for a new invite.' }), true;
        if (!me) return json(res, 401, { message: 'Sign in to join a Listening Room.' }), true;
        const visitor = roomUser(me);
        if (action === 'events' && method === 'GET') {
          if (!room.participants.has(visitor.id) && room.participants.size >= 25) return json(res, 429, { message: 'This room has reached its 25-listener limit.' }), true;
          room.participants.set(visitor.id, visitor);
          res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', 'X-Accel-Buffering': 'no', Connection: 'keep-alive', ...SECURITY });
          res.write(`event: snapshot\ndata: ${JSON.stringify(roomSnapshot(room))}\n\n`);
          room.clients.add(res);
          roomBroadcast(room, 'presence', { participants: Array.from(room.participants.values()) });
          const heartbeat = setInterval(() => { try { res.write(': keep-alive\n\n'); } catch {} }, 20000);
          res.on('close', () => { clearInterval(heartbeat); room.clients.delete(res); room.participants.delete(visitor.id); if (visitor.id === room.hostId && room.participants.size) { room.hostId = room.participants.keys().next().value; roomBroadcast(room, 'roommeta', { hostId: room.hostId }); } roomBroadcast(room, 'presence', { participants: Array.from(room.participants.values()) }); if (!room.participants.size && !room.clients.size) rooms.delete(room.id); });
          return true;
        }
        if (action === 'chat' && method === 'POST') {
          try {
            if (limited('roomchat:' + visitor.id, 20)) return json(res, 429, { message: 'Please slow down before sending another message.' }), true;
            const body = await readBody(req, 2048), message = String(body.message || '').trim().slice(0, 500);
            if (!message) return json(res, 400, { message: 'Write a message first.' }), true;
            const item = { id: crypto.randomUUID(), userId: visitor.id, name: visitor.name, message, at: new Date().toISOString() };
            room.messages.push(item); if (room.messages.length > 100) room.messages.shift();
            roomBroadcast(room, 'chat', item); return json(res, 201, { ok: true, message: item }), true;
          } catch (e) { return json(res, 400, { message: e.message || 'Could not send message.' }), true; }
        }
        if (action === 'control' && method === 'POST') {
          try {
            const body = await readBody(req, 4096), kind = String(body.kind || '');
            if (kind === 'track') {
              const t = body.track || {}; if (!t.videoId || !t.title) throw new Error('Track details are missing.');
              room.state.track = { id: String(t.id || '').slice(0,180), videoId: String(t.videoId).slice(0,40), title: String(t.title).slice(0,160), artist: String(t.artist || '').slice(0,120), cover: String(t.cover || '').slice(0,1000), duration: Math.max(0, Number(t.duration) || 0) };
              room.state.position = 0; room.state.playing = true;
            } else if (kind === 'play' || kind === 'pause') { room.state.playing = kind === 'play'; if (body.position != null) room.state.position = Math.max(0, Number(body.position) || 0); }
            else if (kind === 'seek') room.state.position = Math.max(0, Number(body.position) || 0);
            else if (kind === 'suggest' || kind === 'vote' || kind === 'next' || kind === 'remove') {
              const broadcastQueue = () => roomBroadcast(room, 'queue', { queue: queueSnapshot(room) });
              if (kind === 'suggest') {
                const t = body.track || {};
                if (!t.videoId || !t.title) throw new Error('Track details are missing.');
                if (room.queue.length >= 30) throw new Error('The queue is full. Try again later.');
                if (room.queue.filter(q => q.suggestedById === visitor.id).length >= 5) throw new Error('You can have up to 5 suggestions in the queue.');
                if (room.queue.some(q => q.track.videoId === String(t.videoId))) throw new Error('That song is already in the queue.');
                room.queue.push({ id: crypto.randomUUID(), track: { id: String(t.id || '').slice(0,180), videoId: String(t.videoId).slice(0,40), title: String(t.title).slice(0,160), artist: String(t.artist || '').slice(0,120), cover: String(t.cover || '').slice(0,1000), duration: Math.max(0, Number(t.duration) || 0) }, suggestedBy: visitor.name, suggestedById: visitor.id, votes: new Set([visitor.id]), addedAt: Date.now() });
              } else if (kind === 'vote') {
                const item = room.queue.find(q => q.id === String(body.queueId || ''));
                if (!item) throw new Error('That suggestion is no longer in the queue.');
                if (item.votes.has(visitor.id)) item.votes.delete(visitor.id); else item.votes.add(visitor.id);
              } else if (kind === 'remove') {
                const idx = room.queue.findIndex(q => q.id === String(body.queueId || ''));
                if (idx < 0) throw new Error('That suggestion is no longer in the queue.');
                if (visitor.id !== room.hostId && room.queue[idx].suggestedById !== visitor.id) throw new Error('Only the host or the person who suggested it can remove it.');
                room.queue.splice(idx, 1);
              } else if (kind === 'next') {
                if (visitor.id !== room.hostId) throw new Error('Only the host can play the next song.');
                if (!room.queue.length) throw new Error('The queue is empty.');
                const top = room.queue.reduce((best, q) => (q.votes.size > best.votes.size || (q.votes.size === best.votes.size && q.addedAt < best.addedAt)) ? q : best);
                room.queue = room.queue.filter(q => q.id !== top.id);
                room.state.track = top.track; room.state.position = 0; room.state.playing = true; room.state.updatedAt = Date.now();
                roomBroadcast(room, 'state', { state: room.state, by: visitor.id });
              }
              broadcastQueue();
              return json(res, 200, { ok: true, queue: queueSnapshot(room) }), true;
            }
            else if (kind === 'host') {
              if (visitor.id !== room.hostId) throw new Error('Only the host can pass control.');
              const next = String(body.userId || '');
              if (!room.participants.has(next)) throw new Error('That listener is not in the room.');
              room.hostId = next; roomBroadcast(room, 'roommeta', { hostId: room.hostId }); return json(res, 200, { ok: true, hostId: room.hostId }), true;
            }
            else if (kind === 'sync') { room.state.position = Math.max(0, Number(body.position) || 0); room.state.playing = !!body.playing; }
            else throw new Error('Unknown room control.');
            room.state.updatedAt = Date.now(); roomBroadcast(room, 'state', { state: room.state, by: visitor.id });
            return json(res, 200, { ok: true, state: room.state }), true;
          } catch (e) { return json(res, 400, { message: e.message || 'Could not sync playback.' }), true; }
        }
        if (!action && method === 'GET') return json(res, 200, { room: roomSnapshot(room) }), true;
      }

      if (route.startsWith('admin/')) {
        if (!me || !opts.isAdmin || !opts.isAdmin(me)) return json(res, 403, { message: 'Admin access only.' }), true;
        if (route === 'admin/summary' && method === 'GET') {
          let users = [];
          try { users = opts.adminUsers ? await opts.adminUsers() : []; } catch {}
          const now = Date.now();
          const analytics = await getListeningState();
          const listeningUsers = Object.values(analytics.users);
          return json(res, 200, {
            users, listeningUsers, listeningEvents: analytics.events.slice(-500).reverse(), totalPlays: analytics.events.length, activeListeners: listeningUsers.filter(x => Date.now() - Date.parse(x.lastPlayed || 0) < 30 * 86400000).length,
            totalUsers: users.length,
            premiumUsers: users.filter((x) => x.tier === 'premium').length,
            freeUsers: users.filter((x) => x.tier !== 'premium').length,
            usage: { ...usage, windowStarted: new Date(usage.windowStarted).toISOString() },
            limits: { search: getRate('search'), trending: getRate('trending'), track: getRate('track') }, region: process.env.YOUTUBE_REGION || 'NG',
            apiKeyConfigured: !!process.env.YOUTUBE_API_KEY,
            uptimeSeconds: Math.floor(process.uptime()),
            maintenance: (await getAdminState()).settings.maintenance,
            capturedAt: new Date(now).toISOString(),
          }), true;
        }
        if (route === 'admin/workspace' && method === 'GET') {
          const data = await getAdminState();
          let users = [];
          try { users = opts.adminUsers ? await opts.adminUsers() : []; } catch {}
          const analytics = await getListeningState();
          return json(res, 200, { ...data, listeningUsers: Object.values(analytics.users), listeningEvents: analytics.events.slice(-500).reverse(), totalPlays: analytics.events.length, users, staff: String(process.env.ADMIN_EMAILS || '').split(',').map(x => x.trim()).filter(Boolean), capturedAt: new Date().toISOString() }), true;
        }
        if (route === 'admin/workspace' && method === 'POST') {
          try {
            const body = await readBody(req);
            const data = await getAdminState();
            const now = new Date().toISOString();
            const actor = String(me.email || 'admin');
            const log = (action, detail) => { data.logs.unshift({ id: crypto.randomUUID(), action, detail: String(detail || '').slice(0, 180), actor, at: now }); data.logs = data.logs.slice(0, 150); };
            if (body.action === 'maintenance') { data.settings.maintenance = !!body.enabled; log('Maintenance mode', body.enabled ? 'Enabled' : 'Disabled'); }
            else if (body.action === 'limits') {
              for (const key of ['searchLimit','trendingLimit','trackLimit']) if (body[key] != null) data.settings[key] = Math.max(1, Math.min(500, Number(body[key]) || 1));
              log('Rate limits updated', 'Search / trending / track limits changed');
            }
            else if (body.action === 'announcement') {
              const title = String(body.title || '').trim().slice(0, 90), message = String(body.message || '').trim().slice(0, 1000);
              if (!title || !message) throw new Error('Announcement title and message are required.');
              data.announcements.unshift({ id: crypto.randomUUID(), title, message, at: now }); data.announcements = data.announcements.slice(0, 50); log('Announcement created', title);
            }
            else if (body.action === 'promotion') {
              const code = String(body.code || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g,'').slice(0,24);
              if (!code) throw new Error('Enter a valid promo code.');
              data.promotions.unshift({ id: crypto.randomUUID(), code, discount: Math.max(0,Math.min(100,Number(body.discount)||0)), active: true, at: now }); log('Promotion created', code);
            }
            else if (body.action === 'featured') {
              const title = String(body.title || '').trim().slice(0,100), videoId = String(body.videoId || '').trim().slice(0,40);
              if (!title || !videoId) throw new Error('Track title and YouTube video ID are required.');
              data.featured.unshift({ id: crypto.randomUUID(), title, videoId, artist: String(body.artist || '').slice(0,100), at: now }); data.featured = data.featured.slice(0,100); log('Featured track added', title);
            }
            else if (body.action === 'remove-item') {
              const lists = ['announcements','promotions','featured','reports','support'];
              if (!lists.includes(body.list)) throw new Error('Invalid list.');
              data[body.list] = data[body.list].filter(x => x.id !== body.id); log('Item removed', body.list);
            }
            else throw new Error('Unknown admin action.');
            await saveAdminState();
            return json(res, 200, { ok: true, workspace: data }), true;
          } catch (e) { return json(res, 400, { message: e.message || 'Could not save admin changes.' }), true; }
        }
        if (route === 'admin/user-tier' && method === 'POST') {
          let body = '';
          try {
            for await (const chunk of req) { body += chunk; if (body.length > 4096) throw new Error('Request too large'); }
            const data = JSON.parse(body || '{}');
            const ok = opts.setUserTier && await opts.setUserTier(String(data.id || ''), String(data.tier || ''));
            if (ok) { const state = await getAdminState(); state.logs.unshift({ id: crypto.randomUUID(), action: 'User tier updated', detail: String(data.tier || ''), actor: String(me.email || 'admin'), at: new Date().toISOString() }); state.logs = state.logs.slice(0,150); await saveAdminState(); }
            return json(res, ok ? 200 : 404, ok ? { ok: true } : { message: 'User not found or update unavailable.' }), true;
          } catch (e) {
            return json(res, 400, { message: e.message || 'Invalid request.' }), true;
          }
        }
        return json(res, 404, { message: 'Admin route not found.' }), true;
      }
      if (route === 'listening/event' && method === 'POST') {
        if (!me) return json(res, 401, { message: 'Sign in to save listening history across devices.' }), true;
        try {
          const body = await readBody(req, 4096);
          const id = String(me.id || me.email || '').slice(0, 180);
          const title = String(body.title || '').slice(0, 160), artist = String(body.artist || '').slice(0, 120);
          const trackId = String(body.trackId || '').slice(0, 180);
          if (!id || !trackId || !title) return json(res, 400, { message: 'Track details are required.' }), true;
          const state = await getListeningState(), now = new Date().toISOString();
          const user = state.users[id] || { id, name: String(me.name || me.full_name || me.email || 'Listener').slice(0, 80), email: String(me.email || '').slice(0, 180), plays: 0, tracks: {}, firstPlayed: now };
          user.plays += 1; user.tracks[trackId] = (user.tracks[trackId] || 0) + 1; user.lastPlayed = now; user.lastTrack = title;
          state.users[id] = user;
          const duration = Math.max(0, Math.min(36000, Number(body.duration) || 0)), context = String(body.context || '').replace(/\s+/g, ' ').trim().slice(0, 40) || 'Trending';
          user.minutes = (user.minutes || 0) + duration / 60;
          state.events.push({ id: crypto.randomUUID(), userId: id, user: user.name, trackId, title, artist, duration, context, at: now });
          if (state.events.length > 20000) state.events.splice(0, state.events.length - 20000);
          await saveListeningState(); return json(res, 200, { ok: true, plays: user.plays, uniqueTracks: Object.keys(user.tracks).length }), true;
        } catch (e) { return json(res, 400, { message: e.message || 'Could not save listening event.' }), true; }
      }
      if (route === 'listening/wrap' && method === 'GET') {
        if (!me) return json(res, 401, { message: 'Sign in to see your listening wrap.' }), true;
        const period = u.searchParams.get('period') === 'year' ? 'year' : 'month';
        const since = Date.now() - (period === 'year' ? 365 : 30) * 86400000;
        const id = String(me.id || me.email || '');
        const state = await getListeningState();
        const mine = state.events.filter(e => e.userId === id && Date.parse(e.at) >= since);
        const count = (items, key) => { const m = new Map(); for (const x of items) { const k = x[key]; if (k) m.set(k, (m.get(k) || 0) + 1); } return [...m.entries()].sort((a, b) => b[1] - a[1]); };
        const topTracks = [...mine.reduce((m, e) => { const cur = m.get(e.trackId) || { title: e.title, artist: e.artist, plays: 0 }; cur.plays++; m.set(e.trackId, cur); return m; }, new Map()).values()].sort((a, b) => b.plays - a.plays).slice(0, 5);
        const topArtists = count(mine, 'artist').slice(0, 5).map(([name, plays]) => ({ name, plays }));
        const vibe = count(mine, 'context')[0];
        const minutes = Math.round(mine.reduce((sum, e) => sum + (e.duration || 0), 0) / 60);
        return json(res, 200, { period, plays: mine.length, minutes, minutesTracked: mine.some(e => e.duration), topTracks, topArtists, topVibe: vibe ? vibe[0] : null, since: new Date(since).toISOString() }), true;
      }
      if (route === 'listening/me' && method === 'GET') {
        if (!me) return json(res, 401, { message: 'Sign in to view your Music Passport.' }), true;
        const state = await getListeningState(), id = String(me.id || me.email || ''), user = state.users[id] || { plays: 0, tracks: {}, firstPlayed: null, lastPlayed: null };
        return json(res, 200, { plays: user.plays || 0, uniqueTracks: Object.keys(user.tracks || {}).length, tracks: user.tracks || {}, firstPlayed: user.firstPlayed || null, lastPlayed: user.lastPlayed || null }), true;
      }
      if (route === 'features/mood' && method === 'POST') {
        if (needLogin() && !me) return json(res, 401, { message: 'Sign in to create a mood mix.' }), true;
        const who = me && (me.id || me.email) ? String(me.id || me.email) : ip;
        if (limited('s:' + who, getRate('search'))) return json(res, 429, { message: 'Too many searches. Try again in a minute.' }), true;
        usage.search++;
        try { const body = await readBody(req, 2048); const mood = String(body.mood || '').trim().slice(0, 100); if (!mood) return json(res, 400, { message: 'Describe your mood first.' }), true; const tracks = await musicSearch(mood + ' music playlist'); return json(res, 200, { mood, tracks: tracks.map(out) }), true; }
        catch (e) { return json(res, 502, { message: 'Could not create this mood mix right now.' }), true; }
      }
      if (route === 'me' && method === 'GET') {
        return me ? json(res, 200, { user: publicUser(me) }) : json(res, 401, { message: 'Not signed in.' }), true;
      }
      if (route === 'login/google' && method === 'GET') {
        if (opts.googleStart && opts.googleConfigured && opts.googleConfigured()) { opts.googleStart(req, res, u); return true; }
        res.writeHead(302, { Location: `${base}/?auth_error=${encodeURIComponent('Google sign-in is not set up yet.')}` }); res.end(); return true;
      }
      if (route === 'logout' && method === 'POST') {
        if (opts.logout) await opts.logout(req, res, me);
        if (!res.headersSent) json(res, 200, { ok: true });
        return true;
      }

      if (route.startsWith('music/')) {
        if (needLogin() && !me) return json(res, 401, { message: 'Sign in to listen.' }), true;
        const platformState = await getAdminState();
        if (platformState.settings.maintenance && !(me && opts.isAdmin && opts.isAdmin(me))) return json(res, 503, { message: 'Ytunes is temporarily under maintenance. Please check back soon.' }), true;
        const who = me && (me.id || me.email) ? String(me.id || me.email) : ip;

        if (route === 'music/search' && method === 'GET') {
          const q = String(u.searchParams.get('q') || '').replace(/\s+/g, ' ').trim().slice(0, 80);
          if (!q) return json(res, 400, { message: 'Type a song or artist.' }), true;
          if (limited('s:' + who, getRate('search'))) return json(res, 429, { message: 'Too many searches. Try again in a minute.' }), true;
          usage.search++;
          try { json(res, 200, { q, tracks: (await musicSearch(q, 30, u.searchParams.get('region') || undefined)).map(out) }); }
          catch (e) { console.error('[listen] search failed:', e.message); json(res, 502, { message: 'Music search is unavailable right now. Please try again.' }); }
          return true;
        }
        if (route === 'music/trending' && method === 'GET') {
          if (limited('t:' + who, getRate('trending'))) return json(res, 429, { message: 'Too many requests. Try again in a minute.' }), true;
          usage.trending++;
          try { json(res, 200, { tracks: (await musicTrending(30, u.searchParams.get('region') || undefined)).map(out) }); }
          catch (e) { console.error('[listen] trending failed:', e.message); json(res, 502, { message: 'Music is unavailable right now. Please try again.' }); }
          return true;
        }
        if (route === 'music/rising' && method === 'GET') {
          if (limited('t:' + who, getRate('trending'))) return json(res, 429, { message: 'Too many requests. Try again in a minute.' }), true;
          usage.trending++;
          const region = String(u.searchParams.get('region') || '').toUpperCase();
          try {
            const tracks = await musicTrending(50, /^[A-Z]{2}$/.test(region) ? region : undefined);
            const key = /^[A-Z]{2}$/.test(region) ? region : (process.env.YOUTUBE_REGION || 'NG').toUpperCase();
            const today = new Date().toISOString().slice(0, 10);
            const hist = risingHistory.get(key) || [];
            if (!hist.length || hist[hist.length - 1].day !== today) {
              hist.push({ day: today, ids: tracks.map(t => t.id) });
              while (hist.length > 2) hist.shift();
              risingHistory.set(key, hist);
            }
            const prev = hist.length > 1 ? hist[hist.length - 2] : null;
            if (!prev) return json(res, 200, { tracks: [], note: 'Rising charts need at least one day of history. Check back tomorrow.' }), true;
            const prevRank = new Map(prev.ids.map((id, i) => [id, i]));
            const ranked = tracks.map((t, i) => ({ ...t, rise: (prevRank.has(t.id) ? prevRank.get(t.id) : 50) - i, isNew: !prevRank.has(t.id) }))
              .filter(t => t.rise > 0).sort((a, b) => b.rise - a.rise).slice(0, 20).map(out);
            return json(res, 200, { tracks: ranked, note: ranked.length ? null : 'Nothing is climbing the chart yet today.' }), true;
          } catch (e) { console.error('[listen] rising failed:', e.message); json(res, 502, { message: 'Rising charts are unavailable right now.' }); }
          return true;
        }
        if (route === 'music/track' && method === 'GET') {
          if (limited('k:' + who, getRate('track'))) return json(res, 429, { message: 'Too many track lookups. Try again in a minute.' }), true;
          usage.track++;
          try {
            const t = await musicTrack(u.searchParams.get('id'));
            if (!t) json(res, 404, { message: 'Song not found.' }); else json(res, 200, { track: out(t) });
          } catch { json(res, 502, { message: 'Could not load that song.' }); }
          return true;
        }
        if (route === 'music/stream' && (method === 'GET' || method === 'HEAD')) {
          const src = String(u.searchParams.get('u') || '');
          if (!sigOk(src, u.searchParams.get('s')) || !hostOk(src)) return json(res, 403, { message: 'Bad audio link' }), true;
          try { await streamUpstream(src, req, res); }
          catch { if (!res.headersSent) json(res, 502, { message: 'Song unavailable' }); else res.end(); }
          return true;
        }
      }
      return json(res, 404, { message: 'Not found' }), true;
    }

    // ---------------- website files ----------------
    if (method !== 'GET' && method !== 'HEAD') { res.writeHead(405); res.end(); return true; }
    let file;
    try { file = path.normalize(decodeURIComponent(rel === '/' ? '/index.html' : rel)); } catch { res.writeHead(400); res.end(); return true; }
    const full = path.join(PUBLIC, file);
    if (!full.startsWith(PUBLIC + path.sep)) { res.writeHead(403); res.end(); return true; }
    try {
      const data = await readFile(full);
      const ext = path.extname(full).toLowerCase();
      const fresh = ext === '.html' || full.endsWith('sw.js') || full.endsWith('/app.js') || full.endsWith('/style.css');
      res.writeHead(200, { 'Content-Type': TYPES[ext] || 'application/octet-stream', 'Cache-Control': fresh ? 'no-cache' : 'public, max-age=3600', ...SECURITY });
      res.end(method === 'HEAD' ? undefined : data);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('Not found');
    }
    return true;
  };
}

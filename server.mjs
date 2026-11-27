// Standalone music server (use this when you deploy the music site on its own).
//   node server.mjs        -> http://localhost:3000
//
// Environment variables (all optional for a local test):
//   PORT                   default 3000
//   PUBLIC_URL             the address people open, e.g. https://music.example.com  (no trailing slash)
//   GOOGLE_CLIENT_ID       \ Google sign-in. Without them the site opens with no sign-in.
//   GOOGLE_CLIENT_SECRET   /
//   REQUIRE_LOGIN          "true" | "false" (default: true when Google is set up, otherwise false)
//   SESSION_SECRET         long random text. Keep it the same between restarts so people stay signed in.
//   DATA_DIR               where users.json is kept (default ./data)

import http from 'node:http';
import crypto from 'node:crypto';
import { createListen } from './listen/site.mjs';
import { createAuth } from './listen/auth.mjs';

const PORT = Number(process.env.PORT) || 3000;
const SECRET = process.env.SESSION_SECRET || process.env.STREAM_SECRET || crypto.randomBytes(32).toString('hex');
if (!process.env.SESSION_SECRET) console.warn('[music] SESSION_SECRET is not set: people will be signed out every time the server restarts.');

const auth = createAuth({
  secret: SECRET,
  publicUrl: process.env.PUBLIC_URL || '',
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  dataDir: process.env.DATA_DIR || './data',
});

const flag = String(process.env.REQUIRE_LOGIN || 'auto').toLowerCase();
const listen = createListen({
  base: '',
  secret: SECRET,
  requireLogin: () => (flag === 'true' ? true : flag === 'false' ? false : auth.configured),
  googleConfigured: () => auth.configured,
  googleStart: auth.start,
  logout: auth.logout,
  isAdmin: (me) => String(process.env.ADMIN_EMAILS || '').split(',').map((x) => x.trim().toLowerCase()).filter(Boolean).includes(String(me.email || '').toLowerCase()),
  adminUsers: auth.adminUsers,
  setUserTier: auth.setUserTier,
});

http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, 'http://x'), p = u.pathname, method = req.method;
    if (p === '/healthz') { res.writeHead(200); return res.end('ok'); }
    if (p === '/auth/google/callback' && method === 'GET') return await auth.callback(req, res, u);
    if (await listen({ req, res, u, p, method, me: auth.sessionUser(req) })) return;
    res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('Not found');
  } catch (e) {
    console.error(e);
    if (!res.headersSent) res.writeHead(500);
    res.end();
  }
}).listen(PORT, () => {
  console.log(`Ytunes running on http://localhost:${PORT}`);
  console.log(process.env.YOUTUBE_API_KEY ? `YouTube music enabled (${process.env.YOUTUBE_REGION || 'NG'}).` : 'WARNING: YOUTUBE_API_KEY is missing; music search will not work.');
  console.log(auth.configured
    ? `Google sign-in is ON. Add this redirect URI in Google Console: ${(process.env.PUBLIC_URL || 'http://localhost:' + PORT).replace(/\/+$/, '')}/auth/google/callback`
    : 'Google sign-in is OFF (set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and PUBLIC_URL to turn it on).');
});

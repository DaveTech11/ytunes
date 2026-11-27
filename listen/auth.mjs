// Google sign-in for the STANDALONE music site (not used when the site runs inside the Xyron server,
// because Xyron already has its own Google sign-in and accounts).
//
// Needs: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, PUBLIC_URL (the address people open, no trailing slash).
// Google Console > Authorized redirect URI:  PUBLIC_URL + /auth/google/callback
// Sign-in is a normal web redirect, so it works in Huawei Browser without Google Play Services.
//
// Sessions are signed cookies (no database needed). New people are also recorded in data/users.json.

import crypto from 'node:crypto';
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import path from 'node:path';

const DAY = 86400000;

export function createAuth({ secret, publicUrl = '', clientId = '', clientSecret = '', dataDir = './data' }) {
  const configured = Boolean(clientId && clientSecret);
  const secure = /^https:/i.test(publicUrl);
  const sign = (s) => crypto.createHmac('sha256', secret).update(s).digest('base64url');
  const pack = (obj) => { const p = Buffer.from(JSON.stringify(obj)).toString('base64url'); return `${p}.${sign(p)}`; };
  const unpack = (v) => {
    v = String(v || ''); const i = v.indexOf('.'); if (i < 1) return null;
    const p = v.slice(0, i), a = Buffer.from(sign(p)), b = Buffer.from(v.slice(i + 1));
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    try { const o = JSON.parse(Buffer.from(p, 'base64url').toString()); return o.exp > Date.now() ? o : null; } catch { return null; }
  };
  const cookies = (req) => Object.fromEntries(String(req.headers.cookie || '').split(';').filter(Boolean).map((x) => { const i = x.indexOf('='); return [x.slice(0, i).trim(), x.slice(i + 1).trim()]; }));
  const cookie = (name, val, maxAge) => `${name}=${val}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
  const safePath = (v) => { const s = String(v || '/'); return s.startsWith('/') && !s.startsWith('//') && !s.includes('\\') && s.length < 300 ? s : '/'; };
  const baseOf = (req) => (publicUrl || `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}`).replace(/\/+$/, '');
  const redirect = (res, to, extra = {}) => { res.writeHead(302, { Location: to, 'Cache-Control': 'no-store', ...extra }); res.end(); };
  const fail = (res, msg) => redirect(res, `/?auth_error=${encodeURIComponent(msg)}`, { 'Set-Cookie': cookie('hm_oauth', '', 0) });

  // ---- remembered sign-ups ----
  const FILE = path.join(dataDir, 'users.json');
  let users = null, chain = Promise.resolve();
  async function loadUsers() { if (!users) { try { users = JSON.parse(await readFile(FILE, 'utf8')); } catch { users = {}; } } return users; }
  function saveUsers() {
    chain = chain.then(async () => { await mkdir(dataDir, { recursive: true }); const tmp = FILE + '.tmp'; await writeFile(tmp, JSON.stringify(users, null, 1)); await rename(tmp, FILE); })
      .catch((e) => console.error('[auth] could not save users.json:', e.message));
    return chain;
  }

  return {
    configured,

    // The signed-in person for this request, or null.
    sessionUser(req) {
      const s = unpack(cookies(req).hm_session);
      return s ? { id: s.id, email: s.email, name: s.name, picture: s.picture } : null;
    },

    // Step 1: send the visitor to Google.
    start(req, res, u) {
      const state = crypto.randomBytes(20).toString('hex');
      const q = new URLSearchParams({
        client_id: clientId, redirect_uri: baseOf(req) + '/auth/google/callback', response_type: 'code',
        scope: 'openid email profile', state, prompt: 'select_account',
      });
      redirect(res, 'https://accounts.google.com/o/oauth2/v2/auth?' + q, {
        'Set-Cookie': cookie('hm_oauth', pack({ s: state, r: safePath(u.searchParams.get('returnTo')), exp: Date.now() + 10 * 60000 }), 600),
      });
    },

    // Step 2: Google sends them back here with a code.
    async callback(req, res, u) {
      if (!configured) return fail(res, 'Google sign-in is not set up yet.');
      if (u.searchParams.get('error')) return fail(res, 'Google sign-in was cancelled.');
      const o = unpack(cookies(req).hm_oauth), code = u.searchParams.get('code');
      if (!o || o.s !== u.searchParams.get('state') || !code) return fail(res, 'Google sign-in expired. Please try again.');
      try {
        const tr = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, signal: AbortSignal.timeout(15000),
          body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: baseOf(req) + '/auth/google/callback', grant_type: 'authorization_code' }),
        });
        const tok = await tr.json();
        if (!tr.ok || !tok.access_token) { console.error('[auth] google token error:', tok); return fail(res, 'Google sign-in failed. Check the server settings.'); }
        const ir = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { Authorization: 'Bearer ' + tok.access_token }, signal: AbortSignal.timeout(15000) });
        const info = await ir.json();
        if (!ir.ok || !info.sub || !info.email || info.email_verified !== true) return fail(res, 'Your Google email is not verified.');

        const all = await loadUsers(), now = new Date().toISOString(), prev = all[info.sub];
        const person = { id: String(info.sub), email: String(info.email).toLowerCase(), name: String(info.name || info.email.split('@')[0]).slice(0, 60), picture: /^https:\/\//.test(info.picture || '') ? info.picture : '' };
        all[info.sub] = { ...person, created: prev ? prev.created : now, lastLogin: now };
        if (!prev) console.log('[auth] new sign-up:', person.email);
        saveUsers();

        redirect(res, safePath(o.r), { 'Set-Cookie': [cookie('hm_session', pack({ ...person, exp: Date.now() + 30 * DAY }), 30 * 86400), cookie('hm_oauth', '', 0)] });
      } catch (e) {
        console.error('[auth] google sign-in error:', e.message);
        fail(res, 'Google sign-in failed. Please try again.');
      }
    },

    async adminUsers() {
      const all = await loadUsers();
      return Object.values(all).map((u) => ({
        id: String(u.id || ''), name: String(u.name || ''), email: String(u.email || ''),
        picture: String(u.picture || ''), tier: u.tier === 'premium' ? 'premium' : 'free',
        created: u.created || null, lastLogin: u.lastLogin || null,
      })).sort((a, b) => String(b.lastLogin || '').localeCompare(String(a.lastLogin || '')));
    },

    async setUserTier(id, tier) {
      if (!['free', 'premium'].includes(tier)) throw new Error('Invalid account tier.');
      const all = await loadUsers();
      const user = Object.values(all).find((u) => String(u.id) === String(id));
      if (!user) return false;
      user.tier = tier;
      await saveUsers();
      return true;
    },

    logout(req, res) {
      res.setHeader('Set-Cookie', cookie('hm_session', '', 0));
    },
  };
}

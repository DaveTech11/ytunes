# Put the music site inside your Xyron AI server

After this, **deploying the Xyron server also deploys the music site** at `https://YOUR-SITE/listen/`.
It uses Xyron's own accounts and Xyron's Google sign-in (the same `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
you already set). No new Google redirect URI is needed. Add the YouTube settings below to your Xyron host environment.

## Easiest way (3 steps)
1. Copy the whole `listen/` folder into the **root of your Xyron project** (next to `server.mjs`).
2. Replace `server.mjs` with `xyron/server.mjs`, and `public/sw.js` with `xyron/public/sw.js`, from this zip.
   (They were made from the Xyron zip you sent me. If you edited those two files since, use 2b instead.)
3. Deploy as usual, then open `/listen/`.

## 2b. If you changed server.mjs since: add 3 small pieces (or run `patch -p1 < xyron/xyron-listen.patch`)

**A. Under the line `import {musicSearch,musicTrending,...} from './music.mjs';` add:**
```js
import {createListen} from './listen/site.mjs'; // the standalone music website, served at /listen
```

**B. Right above `async function route(req,res){` add:**
```js
const listenSite=createListen({
  base:'/listen',
  secret:()=>process.env.STREAM_SECRET||animeSecret(),
  requireLogin:true,
  googleConfigured:()=>Boolean(process.env.GOOGLE_CLIENT_ID&&process.env.GOOGLE_CLIENT_SECRET),
  googleStart:(req,res)=>{res.writeHead(302,{Location:'/api/auth/google?returnTo='+encodeURIComponent('/listen/')});res.end()},
  otherLoginUrl:'/login?returnTo='+encodeURIComponent('/listen/'),
  logout:async(req,res)=>{const sid=parseCookies(req).xyron_session;db.sessions=db.sessions.filter(x=>x.id!==sid);await save();cookie(res,'xyron_session','',0)},
  ip:req=>clientIp(req),
});
```

**C. Inside `route`, directly ABOVE the line `if((method==='GET'||method==='HEAD')&&!p.startsWith('/api/'))return serveStatic(req,res,p);` add:**
```js
if((p==='/listen'||p.startsWith('/listen/'))&&await listenSite({req,res,u,p,method,me}))return; // music website
```

**D. In `public/sw.js`, change**
`if (url.pathname.startsWith("/api/") || req.headers.has("range")) return;` **to**
`if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/listen") || req.headers.has("range")) return;`
(so Xyron's service worker never swaps the music page in as its offline page).

## YouTube setup (required for music)

In your Xyron host dashboard (for example Render → Environment), add:

- `YOUTUBE_API_KEY` = your YouTube Data API v3 key
- `YOUTUBE_REGION` = `NG` (or another two-letter country code)

Enable YouTube Data API v3 in Google Cloud Console. Keep the key in server environment variables only; do not add it to frontend JavaScript or commit it into Git. Restrict the key to YouTube Data API v3 and apply suitable application restrictions.

Ytunes now uses YouTube for music discovery and the official YouTube embedded player for playback. It does not extract or proxy YouTube audio. Some videos may have embedding restrictions, ads, or regional availability limits.

## Good to know
- Xyron's own `/music` page and `/api/music/*` keep working exactly as before. The new site has its own routes under `/listen/api/*`.
- It only needs Node built-ins, so there is nothing to `npm install`.
- Ytunes music search uses YouTube Data API v3. Playback runs in YouTube's official embedded player; Google Play Services are not required.

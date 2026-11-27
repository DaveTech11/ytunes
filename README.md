# Ytunes — YouTube-powered music discovery

Ytunes is a lightweight, mobile-friendly music web app that uses the **YouTube Data API v3** to find music and the **official YouTube embedded player** for playback. It works in modern mobile browsers, including Huawei Browser, without requiring Google Play Services.

## Run it

```bash
npm start
```

Set these environment variables on your host (Render, Railway, etc.):

| Variable | Required | Purpose |
|---|---|---|
| `YOUTUBE_API_KEY` | Yes | YouTube Data API v3 key. Keep it server-side; never put it in browser code or commit it. |
| `YOUTUBE_REGION` | No | Two-letter region for charts and search. Defaults to `NG`. |
| `PORT` | No | Server port; defaults to `3000`. |
| `PUBLIC_URL` | No | Public HTTPS site URL. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | No | Optional Google sign-in when running standalone. |
| `SESSION_SECRET` | Recommended | Stable secret for sign-in sessions. |
| `REQUIRE_LOGIN` | No | `true` / `false`; defaults to requiring login when Google sign-in is configured. |
| `DATA_DIR` | No | Persistent folder for account data; defaults to `./data`. |

Enable **YouTube Data API v3** in Google Cloud Console and restrict the API key to that API. Add website/application restrictions where practical. Set `YOUTUBE_REGION=NG` for Nigerian trending music, or another two-letter country code.

## What Ytunes includes

- YouTube music search and regional music charts
- Afrobeats, Hip-Hop, Pop, R&B, Chill, Gospel and Electronic discovery chips
- Official YouTube video playback (not extracted or proxied audio)
- Queue, next/previous, shuffle and repeat controls
- Liked songs and recently played library stored in the browser
- Responsive mini-player and full now-playing view
- Optional Google sign-in or Xyron account integration
- Search/chart caching to reduce API quota usage

## Playback and YouTube limitations

Ytunes uses YouTube's official embedded player. Playback therefore follows YouTube's availability, embed restrictions, ads, age restrictions, and regional rules. Some videos may refuse embedded playback; choose another result if that happens. The YouTube player may display video rather than audio-only playback. Ytunes does not download, extract, or proxy YouTube audio.

The YouTube Data API has quota limits. Search requests consume more quota than chart/video detail requests, so use the cache and monitor quota in Google Cloud Console.

## Mount inside Xyron

Copy the `listen/` folder into the root of your Xyron project and follow `xyron/APPLY.md`. Add `YOUTUBE_API_KEY` and `YOUTUBE_REGION=NG` to the Xyron host's environment variables. The API key remains on the server; it is never sent to the browser.

## Project layout

- `listen/site.mjs` — website and music API routes
- `listen/music.mjs` — YouTube Data API search, charts and video metadata
- `listen/public/` — frontend, player and PWA assets
- `listen/auth.mjs` — optional standalone Google sign-in
- `server.mjs` — standalone Node server
- `xyron/` — Xyron integration instructions and patch files

## Profile, settings and request limits

The app includes Profile and Settings screens. Profile displays the signed-in account and browser-library counts. Settings links out to Google Cloud Console in a separate tab for API credentials and YouTube Data API v3 setup; Ytunes never asks visitors to paste API keys into the website. The deployment owner configures the server key through the hosting provider's environment variables.

Server-side per-minute limits are 20 search requests, 30 trending requests and 60 track lookups per signed-in account (or per IP address when signed out). These counters are in-memory and reset each minute; use a shared store such as Redis if running multiple server instances.

## Admin dashboard

Set `ADMIN_EMAILS` to a comma-separated allowlist of Google sign-in email addresses, for example `owner@example.com`. Only signed-in users whose verified email matches this list see the Admin tab. The dashboard includes account counts, free/premium tier management, server uptime, API request counters, and YouTube API key configuration status. It does not expose the API key itself.

The admin account controls currently update the stored account tier (`free` or `premium`). Connecting those tiers to actual feature entitlements or payment subscriptions requires integrating them with the app's subscription/billing system. Request counters are in-memory and reset on server restart; they are not a substitute for Google Cloud quota metrics. For multiple instances, use a shared database/Redis store.


## Admin V2 workspace

The admin dashboard includes overview analytics, account tier controls, featured-track curation, saved announcements, promotion-code records, reports/support inbox placeholders, activity logs, administrator allowlist visibility, maintenance mode, and configurable per-minute API limits. Admin workspace data is stored in `DATA_DIR/admin-workspace.json`.

Important integration boundaries:
- Announcements are stored in the dashboard; email, push, and in-app delivery are not connected.
- Promotion codes are stored for administration; there is no checkout/payment redemption flow in this project yet.
- Reports and support sections are ready as dashboard destinations, but need public report/contact submission forms to populate them.
- Featured tracks are stored in the admin workspace; they are not yet injected into the public home feed.
- Admin staff access is controlled by the verified-email `ADMIN_EMAILS` allowlist; this dashboard does not create separate staff permission levels.
- Maintenance mode blocks music API requests for non-admin users; the public static shell remains accessible.
- Rate limits are enforced per account/IP within one server process. They reset every minute and are not shared across multiple instances.
- User analytics currently reflect registered accounts and in-process API request counts. No revenue, stream, or listener-location metrics are fabricated.


## Ytunes Explore additions

The Explore tab adds country-specific music charts (Nigeria, Ghana, Germany and USA), mood-based search mixes, a local Music Passport, on-device song battle votes and fan points, decade search shortcuts, artist search, WhatsApp sharing for a locally assembled friendship soundtrack, and live Listening Rooms.

Signed-in users who enable listening analytics have track-start events stored in `DATA_DIR/listening-analytics.json`. Administrators can view aggregate play counts, unique tracks per account, and the most recent track in the Admin > Listening analytics section. Users can disable this collection in Settings; disabling it stops new events but does not erase previously stored events. Analytics are not recorded for anonymous users. Treat this data as personal data: disclose it in your privacy notice, restrict admin access, set a retention period, and provide an appropriate deletion process before public launch.

Listening Rooms are now live for signed-in users: create or join an 8-character room, invite others with the room URL, synchronize track changes/play/pause/seeking, see current participants, and chat in real time. They use same-origin Server-Sent Events for server-to-browser updates and authenticated POST requests for chat and playback controls; no third-party real-time provider or extra npm dependency is required. Room state and chat are held in server memory, so rooms end when the server restarts or the room becomes empty, and rooms are not shared between multiple server instances. For horizontal scaling or persistent room history, move room state/pub-sub to Redis or a database. Rooms currently allow up to 25 concurrent listeners and chat is rate-limited. Any signed-in room member can control the shared playback.

Other Explore concepts remain intentionally lightweight: song-battle votes and fan points are stored on the current device; Music DNA is a simple local summary, not an AI model. Shared voting, redeemable rewards, and artist fan communities require additional backend services and moderation.

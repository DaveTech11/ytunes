/* Ytunes - YouTube-powered music discovery with official embedded playback. */
(function () {
  'use strict';

  var GENRES = [
    { label: 'All', q: '' }, { label: 'Afrobeats', q: 'afrobeats' }, { label: 'Hip-Hop', q: 'hip hop' },
    { label: 'Pop', q: 'pop hits' }, { label: 'R&B', q: 'r&b' }, { label: 'Chill', q: 'chill lofi' },
    { label: 'Gospel', q: 'gospel' }, { label: 'Electronic', q: 'electronic' }
  ];

  var P = function (d) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + d + '</svg>'; };
  var ICON = {
    play: P('<path d="M8 5v14l11-7z"/>'),
    pause: P('<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>'),
    next: P('<path d="M6 5l9 7-9 7zM16 5h2.5v14H16z"/>'),
    prev: P('<path d="M18 5l-9 7 9 7zM5.5 5H8v14H5.5z"/>'),
    heart: P('<path fill="none" stroke="currentColor" stroke-width="2" d="M12 20.5s-8-4.7-8-10.6A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8 2.9c0 5.9-8 10.6-8 10.6z"/>'),
    heartOn: P('<path d="M12 20.5s-8-4.7-8-10.6A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8 2.9c0 5.9-8 10.6-8 10.6z"/>'),
    search: P('<path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4"/>'),
    x: P('<path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M6 6l12 12M18 6L6 18"/>'),
    down: P('<path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6"/>'),
    queue: P('<path d="M3 6h12v2H3zM3 11h12v2H3zM3 16h8v2H3zM17 11v7.2a2.8 2.8 0 1 0 2 2.7V13h3v-2z"/>'),
    shuffle: P('<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M16 4h4v4M4 20L20 4M20 16v4h-4M15 15l5 5M4 4l5 5"/>'),
    repeat: P('<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3"/>'),
    repeat1: P('<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3"/><text x="12" y="15.5" text-anchor="middle" font-size="8" font-weight="700" fill="currentColor">1</text>'),
    home: P('<path d="M12 3l9 8h-3v9h-5v-6h-2v6H6v-9H3z"/>'),
    profile: P('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0z"/>'),
    settings: P('<path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm8.2 4a8.2 8.2 0 0 0-.1-1.3l1.6-1.2-1.6-2.8-1.9.7a8.4 8.4 0 0 0-2.2-1.3L15.7 4h-3.3l-.3 2.1a8.4 8.4 0 0 0-2.2 1.3L8 6.7 6.4 9.5 8 10.7a8.2 8.2 0 0 0 0 2.6l-1.6 1.2L8 17.3l1.9-.7a8.4 8.4 0 0 0 2.2 1.3l.3 2.1h3.3l.3-2.1a8.4 8.4 0 0 0 2.2-1.3l1.9.7 1.6-2.8-1.6-1.2c.1-.4.1-.8.1-1.3z"/>'),
    admin: P('<path d="M12 2 4 5v6c0 5.2 3.4 9.8 8 11 4.6-1.2 8-5.8 8-11V5zm-1 14-4-4 1.4-1.4L11 13.2l4.6-4.6L17 10z"/>'),
    lib: P('<path d="M9 18V6l11-2v12" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="6.5" cy="18" r="2.8"/><circle cx="17.5" cy="16" r="2.8"/>'),
    note: P('<path d="M9 18V6l11-2v12" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="6.5" cy="18" r="2.8"/><circle cx="17.5" cy="16" r="2.8"/>'),
    loader: P('<path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" d="M12 3a9 9 0 1 0 9 9"/>'),
    wifi: P('<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M2 8.8a15 15 0 0 1 20 0M5 12.5a10.5 10.5 0 0 1 14 0M8.5 16a5.5 5.5 0 0 1 7 0M3 3l18 18"/><circle cx="12" cy="19.5" r="1.3"/>'),
    google: '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>',
    refresh: P('<path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M20 11a8 8 0 1 0-2.3 6M20 4v7h-7"/>')
  };

  function $(s) { return document.querySelector(s); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmt(sec) { var s = Math.max(0, Math.floor(Number(sec) || 0)); return Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + (s % 60); }
  function readList(k) { try { var v = JSON.parse(localStorage.getItem(k) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
  function writeList(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage blocked */ } }
  function getJSON(url, init) {
    var o = init || {}; o.credentials = 'same-origin';
    return fetch(url, o).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) { var err = new Error(j.message || 'Something went wrong'); err.status = r.status; throw err; }
        return j;
      });
    });
  }

  // ---------- state ----------
  var st = {
    tab: 'home', genre: 'All', query: '', term: '', tracks: [], status: 'loading', error: '',
    libFilter: 'all', list: [], // list = what is shown on screen (rows index into it)
    queue: [], index: -1, playing: false, loading: false, shuffle: false, repeat: 'off',
    cur: 0, dur: 0, showQueue: false, npOpen: false,
    liked: readList('ytunes_liked'), recent: readList('ytunes_recent'),
    user: null, cfg: { requireLogin: false, google: false, otherLogin: null, isAdmin: false }, needLogin: false, authError: '', adminData: null, adminWorkspace: null, adminSection: 'overview', adminError: '', listenStats: null,
    roomId: '', roomData: null, roomStream: null, roomApplying: false, roomSyncAt: 0
  };
  var reqId = 0, failures = 0, retried = {}, toastT, searchT;
  var ytPlayer = null, ytApiLoading = false, ytApiReady = false, ytTick = null;
  function loadYouTubeApi(done) {
    if (window.YT && window.YT.Player) { ytApiReady = true; done(); return; }
    window.onYouTubeIframeAPIReady = function () { ytApiReady = true; done(); };
    if (!ytApiLoading) {
      ytApiLoading = true;
      var tag = document.createElement('script'); tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
  }
  function mountYouTube(videoId) {
    loadYouTubeApi(function () {
      var host = $('#ytPlayer'); if (!host) return;
      if (!ytPlayer) {
        ytPlayer = new YT.Player('ytPlayer', {
          width: '100%', height: '220', videoId: videoId,
          playerVars: { autoplay: 1, playsinline: 1, rel: 0, modestbranding: 1, origin: window.location.origin },
          events: {
            onReady: function () { if (ytPlayer) { ytPlayer.playVideo(); if (!ytTick) ytTick = setInterval(syncYouTube, 700); } },
            onStateChange: function (e) {
              if (e.data === YT.PlayerState.PLAYING) { st.playing = true; st.loading = false; }
              else if (e.data === YT.PlayerState.PAUSED) st.playing = false;
              else if (e.data === YT.PlayerState.BUFFERING) st.loading = true;
              else if (e.data === YT.PlayerState.ENDED) { var n = pickNext(true); if (n < 0) { st.playing = false; } else startAt(st.queue, n); }
              refresh();
            },
            onError: function () { failTrack('This video cannot be played here. Try another result.'); }
          }
        });
      } else { ytPlayer.loadVideoById(videoId); }
    });
  }
  function syncYouTube() {
    if (!ytPlayer || !track()) return;
    try {
      st.cur = ytPlayer.getCurrentTime() || 0; st.dur = ytPlayer.getDuration() || track().duration || 0;
      var state = ytPlayer.getPlayerState();
      st.playing = state === 1; st.loading = state === 3; tick();
      if (st.roomId && st.roomData && st.roomData.hostId === (st.user && (st.user.id || st.user.email)) && !st.roomApplying && Date.now() - st.roomSyncAt > 4500) { st.roomSyncAt = Date.now(); sendRoomControl('sync', { position: st.cur, playing: st.playing }); }
      if (st.npOpen) $('#cPlay').innerHTML = st.loading ? '<span class="spin">' + ICON.loader + '</span>' : st.playing ? ICON.pause : ICON.play;
      $('#miniToggle').innerHTML = st.playing ? ICON.pause : ICON.play;
    } catch (e) { /* player not ready */ }
  }

  function track() { return st.queue[st.index] || null; }
  function isLiked(id) { return st.liked.some(function (t) { return t.id === id; }); }
  function toast(msg) { var el = $('#toast'); el.textContent = msg; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(function () { el.hidden = true; }, 2600); }

  // ---------- small view helpers ----------
  function thumb(videoId) { return videoId ? 'https://i.ytimg.com/vi/' + encodeURIComponent(videoId) + '/hqdefault.jpg' : ''; }
  function cover(src, size, radius) {
    var s = typeof size === 'number' ? size + 'px' : size;
    var style = 'width:' + s + ';height:' + s + (radius !== undefined ? ';border-radius:' + radius : '');
    var inner = src ? '<img src="' + esc(src) + '" alt="" loading="lazy" draggable="false" referrerpolicy="no-referrer">' : '';
    return '<span class="cover" style="' + style + '">' + inner + '<i>' + ICON.note + '</i></span>';
  }
  // Inline onerror attributes are blocked by the CSP, so hide broken artwork here instead.
  document.addEventListener('error', function (e) {
    var t = e.target;
    if (t && t.tagName === 'IMG' && t.parentNode && t.parentNode.classList && t.parentNode.classList.contains('cover')) t.style.display = 'none';
  }, true);
  function eq(active) { return '<span class="eq' + (active ? ' go' : '') + '" aria-hidden="true"><s></s><s></s><s></s></span>'; }
  function badge(t) { return '<span class="badge full" title="Ytunes">Official</span>'; }

  function rowHTML(t, i) {
    var cur = track() && track().id === t.id, playingNow = cur && st.playing;
    var btn = cur && st.loading ? '<span class="spin">' + ICON.loader + '</span>' : playingNow ? eq(true) : ICON.play;
    return '<div class="row' + (cur ? ' cur' : '') + '">' +
      '<button type="button" class="row-main" data-act="play" data-i="' + i + '" aria-label="Play ' + esc(t.title) + ' by ' + esc(t.artist) + '">' +
      cover(t.cover || thumb(t.videoId), 56) +
      '<span class="row-text"><b>' + esc(t.title) + '</b><small><span class="a">' + esc(t.artist) + '</span>' + badge(t) + '</small></span></button>' +
      (t.full && t.duration > 0 ? '<span class="dur">' + fmt(t.duration) + '</span>' : '') +
      '<button type="button" class="heart' + (isLiked(t.id) ? ' on' : '') + '" data-act="like" data-i="' + i + '" aria-label="' + (isLiked(t.id) ? 'Unlike' : 'Like') + '">' + (isLiked(t.id) ? ICON.heartOn : ICON.heart) + '</button>' +
      '<button type="button" class="rplay" data-act="play" data-i="' + i + '" aria-label="' + (playingNow ? 'Pause' : 'Play') + '">' + btn + '</button></div>';
  }
  function skeleton() {
    var h = '';
    for (var i = 0; i < 8; i++) h += '<div class="skel"><i style="width:56px;height:56px;border-radius:16px"></i><div style="flex:1;margin:0 12px"><i style="height:12px;width:66%;border-radius:6px"></i><i style="height:10px;width:33%;border-radius:6px;margin-top:8px"></i></div><i style="width:48px;height:48px;border-radius:50%"></i></div>';
    return h;
  }

  // ---------- sign-in ----------
  function signinHTML() {
    var h = '<div class="signin"><div class="signin-logo">' + ICON.note + '</div><h1>Ytunes</h1>' +
      '<p class="signin-sub">Sign in to discover music.</p>';
    if (st.authError) h += '<p class="err" role="alert">' + esc(st.authError) + '</p>';
    if (st.cfg.google) h += '<a class="gbtn" href="api/login/google">' + ICON.google + '<span>Continue with Google</span></a>';
    if (st.cfg.otherLogin) h += '<a class="olink" href="' + esc(st.cfg.otherLogin) + '">Use email or phone instead</a>';
    if (!st.cfg.google && !st.cfg.otherLogin) h += '<p class="err">Sign-in is not set up on this server yet.</p>';
    return h + '<p class="note">By continuing you agree to use this site responsibly. Songs are streamed only.</p></div>';
  }
  function accountHTML() {
    var u = st.user; if (!u) return '';
    var ini = esc((u.name || '?').charAt(0).toUpperCase());
    return '<div class="acct"><span class="avatar">' + (u.picture ? '<img src="' + esc(u.picture) + '" alt="" referrerpolicy="no-referrer">' : ini) + '</span>' +
      '<span class="acct-t"><b>' + esc(u.name) + '</b><small>' + esc(u.email) + '</small></span>' +
      '<button type="button" class="signout" data-act="logout">Sign out</button></div>';
  }

  function listAdminItems(items, list) {
    return (items||[]).map(function(x){ return '<div class="admin-health-row"><span><b>'+esc(x.title||x.code||x.name||x.videoId||'Item')+'</b><small class="admin-log-detail">'+esc(x.message||x.artist||('Code: '+(x.code||'')))+'</small></span><button class="tier-btn" data-act="admin-remove" data-list="'+list+'" data-id="'+esc(x.id)+'">Remove</button></div>'; }).join('') || '<p class="admin-footnote">Nothing here yet.</p>';
  }

  var CITIES = [['Lagos', 'NG'], ['Abuja', 'NG'], ['Accra', 'GH'], ['Nairobi', 'KE'], ['Johannesburg', 'ZA'], ['Cape Town', 'ZA'], ['London', 'GB'], ['Atlanta', 'US']];
  function worldExtras() {
    return '<p class="setting-help"><b>City charts</b></p><div class="chips">' + CITIES.map(function (c) { return '<button class="chip" data-act="city" data-v="' + esc(c[0]) + '" data-r="' + c[1] + '">' + esc(c[0]) + '</button>'; }).join('') + '</div>' +
      '<p class="setting-help"><b>Rising now</b> compares today with yesterday, so it fills in after the first day.</p><div class="chips">' +
      ['NG', 'GH', 'ZA', 'US'].map(function (r) { return '<button class="chip" data-act="rising" data-v="' + r + '">Rising in ' + r + '</button>'; }).join('') + '</div>';
  }
  var ROOM_GENRES = ['Any', 'Afrobeats', 'Hip-Hop', 'Pop', 'R&B', 'Chill', 'Gospel', 'Electronic'];
  function roomGenreOptions() { return ROOM_GENRES.map(function (g) { return '<option>' + g + '</option>'; }).join(''); }
  function roomHTML() {
    if (!st.roomId || !st.roomData) return '';
    var r = st.roomData, state = r.state || {}, t = state.track;
    var isHost = !!st.user && r.hostId === (st.user.id || st.user.email);
    var invite = window.location.origin + window.location.pathname + '?room=' + encodeURIComponent(st.roomId);
    var people = (r.participants || []).map(function (x) {
      var action = x.id === r.hostId ? '<small>Host</small>' : (isHost ? '<button type="button" class="setting-action room-host" data-act="room-host" data-uid="' + esc(x.id) + '">Make host</button>' : '');
      return '<span class="room-person"><i title="' + esc(x.name) + '">' + esc((x.name || 'L').charAt(0).toUpperCase()) + '</i>' + action + '</span>';
    }).join('');
    var when = r.scheduledAt && Date.parse(r.scheduledAt) > Date.now() ? '<small>Starts ' + esc(new Date(r.scheduledAt).toLocaleString()) + '</small>' : '';
    var queue = r.queue || [], me = st.user ? (st.user.id || st.user.email) : '';
    var qItems = queue.length ? queue.map(function (q) {
      var voted = (q.voterIds || []).indexOf(me) >= 0, canRemove = isHost || q.suggestedById === me;
      return '<div class="queue-item">' + cover(q.track.cover || thumb(q.track.videoId), 40, '10px') +
        '<span class="queue-text"><b>' + esc(q.track.title) + '</b><small>' + esc(q.track.artist || '') + ' · suggested by ' + esc(q.suggestedBy) + '</small></span>' +
        '<button type="button" class="vote-btn' + (voted ? ' on' : '') + '" data-act="room-vote" data-id="' + esc(q.id) + '">▲ ' + q.votes + '</button>' +
        (canRemove ? '<button type="button" class="setting-action room-host" data-act="room-remove" data-id="' + esc(q.id) + '">Remove</button>' : '') + '</div>';
    }).join('') : '<p class="setting-help">No suggestions yet. Play a song and tap Suggest to add it here.</p>';
    var qActions = (st.user && track() ? '<button type="button" class="setting-action" data-act="room-suggest">Suggest this song</button>' : '') +
      (isHost && queue.length ? '<button type="button" class="setting-action" data-act="room-next">Play top suggestion</button>' : '');
    var queueHTML = '<div class="room-queue"><b>Up next · vote for songs</b>' + qItems + '<div class="room-queue-actions">' + qActions + '</div></div>';
    return '<div class="live-room"><div class="room-head"><div><b>' + esc(r.name || ('Room ' + st.roomId)) + '</b><small>' + (state.playing ? 'Playing together' : 'Room is live') + ' · ' + esc(r.genre || 'Any') + '</small>' + when + '</div><button type="button" class="tier-btn" data-act="room-copy">Copy invite</button></div>' +
      (t ? '<div class="room-track">' + cover(t.cover || thumb(t.videoId), 54, '12px') + '<span><b>' + esc(t.title) + '</b><small>' + esc(t.artist || '') + '</small></span></div>' : '<p class="setting-help">No shared song yet. Start a song to play it for everyone.</p>') +
      queueHTML + '<div class="room-people"><b>Listening now · ' + ((r.participants || []).length) + '</b><div class="room-people-list">' + people + '</div></div>' +
      '<div class="room-chat" id="roomChat">' + (r.messages || []).map(function(m){return '<p><b>'+esc(m.name)+':</b> '+esc(m.message)+'</p>';}).join('') + '</div>' +
      '<form id="roomChatForm" class="room-chat-form"><input name="message" maxlength="500" placeholder="Message everyone…" required><button>Send</button></form>' +
      '<p class="setting-help">Share this invite: <a href="' + esc(invite) + '">' + esc(invite) + '</a></p><button class="setting-action room-leave" data-act="room-leave">Leave room</button></div>';
  }
  function loadWrap() {
    var el = $('#wrapCard'); if (!el) return;
    if (!st.user) { el.innerHTML = '<p class="setting-help">Sign in to see your listening wrap.</p>'; return; }
    if (localStorage.getItem('ytunes_analytics_consent') !== 'yes') { el.innerHTML = '<p class="setting-help">Turn on listening analytics above to build your wrap.</p>'; return; }
    var period = ($('#wrapPeriod') || {}).value || 'month';
    getJSON('api/listening/wrap?period=' + encodeURIComponent(period)).then(function (w) {
      st.wrap = w;
      var label = w.period === 'year' ? 'Last 12 months' : 'Last 30 days';
      if (!w.plays) { el.innerHTML = '<p class="setting-help">No plays in this period yet. Start a few songs and check back.</p>'; return; }
      el.innerHTML = '<div class="wrap-card"><small>YTUNES WRAP · ' + label.toUpperCase() + '</small>' +
        '<h3>' + w.plays.toLocaleString() + ' plays</h3>' +
        (w.minutesTracked ? '<p>' + w.minutes.toLocaleString() + ' minutes</p>' : '<p class="setting-help">Minutes start counting from plays made after this update.</p>') +
        (w.topVibe ? '<p>Top vibe: <b>' + esc(w.topVibe) + '</b></p>' : '') +
        '<div class="wrap-list"><b>Top tracks</b>' + w.topTracks.map(function (t, i) { return '<span>' + (i + 1) + '. ' + esc(t.title) + ' <small>' + esc(t.artist || '') + ' · ' + t.plays + '</small></span>'; }).join('') + '</div>' +
        (w.topArtists.length ? '<div class="wrap-list"><b>Top artists</b>' + w.topArtists.map(function (a) { return '<span>' + esc(a.name) + ' <small>' + a.plays + ' plays</small></span>'; }).join('') + '</div>' : '') +
        '</div><button type="button" class="setting-action" data-act="wrap-share">Share my wrap</button>';
    }).catch(function () { el.innerHTML = '<p class="setting-help">Could not load your wrap.</p>'; });
  }
  function loadRoomList() {
    var el = $('#roomList'); if (!el) return;
    var g = (($('#roomGenre') || {}).value) || 'Any';
    getJSON('api/rooms/list?genre=' + encodeURIComponent(g)).then(function (res) {
      var list = res.rooms || [];
      el.innerHTML = list.length ? list.map(function (x) {
        var now = x.nowPlaying ? '<small>Now: ' + esc(x.nowPlaying.title) + '</small>' : '';
        var when = x.scheduledAt && !x.live ? '<small>Starts ' + esc(new Date(x.scheduledAt).toLocaleString()) + '</small>' : '';
        return '<div class="room-card"><div><b>' + esc(x.name) + '</b><small>' + esc(x.genre) + ' · hosted by ' + esc(x.host) + ' · ' + x.listeners + ' listening</small>' + now + when + '</div><button type="button" class="setting-action" data-act="room-join" data-id="' + esc(x.id) + '">Join</button></div>';
      }).join('') : '<p class="setting-help">No public rooms right now. Create one and share it.</p>';
    }).catch(function () { el.innerHTML = '<p class="setting-help">Could not load rooms.</p>'; });
  }
  function roomPost(path, body) {
    if (!st.roomId) return Promise.reject(new Error('Join a room first.'));
    return getJSON('api/rooms/' + encodeURIComponent(st.roomId) + '/' + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });
  }
  function connectRoom(id) {
    id = String(id || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    if (!id || id.length !== 8) { toast('Enter a valid 8-character room code'); return; }
    if (st.roomStream) st.roomStream.close();
    st.roomId = id; st.roomData = { id: id, participants: [], messages: [], state: {} }; renderView();
    getJSON('api/rooms/' + encodeURIComponent(id)).then(function(info){
      st.roomData = info.room || st.roomData;
      var es = new EventSource('api/rooms/' + encodeURIComponent(id) + '/events'); st.roomStream = es;
      es.addEventListener('snapshot', function(e){ try { st.roomData = JSON.parse(e.data); renderView(); applyRoomState(st.roomData.state, true); } catch (_) {} });
      es.addEventListener('state', function(e){ try { var d=JSON.parse(e.data); st.roomData.state=d.state; renderView(); applyRoomState(d.state, false); } catch (_) {} });
      es.addEventListener('presence', function(e){ try { st.roomData.participants=JSON.parse(e.data).participants||[]; renderView(); } catch (_) {} });
      es.addEventListener('queue', function(e){ try { st.roomData.queue = JSON.parse(e.data).queue || []; renderView(); } catch (_) {} });
      es.addEventListener('roommeta', function(e){ try { st.roomData.hostId=JSON.parse(e.data).hostId; } catch (_) {} });
      es.addEventListener('chat', function(e){ try { var m=JSON.parse(e.data); st.roomData.messages=(st.roomData.messages||[]).concat([m]).slice(-60); renderView(); var c=$('#roomChat'); if(c)c.scrollTop=c.scrollHeight; } catch (_) {} });
      es.onerror = function(){ if (es.readyState === EventSource.CLOSED) toast('Room connection closed. The room may have ended.'); };
      var u = new URL(window.location.href); u.searchParams.set('room', id); history.replaceState({}, '', u.toString());
      renderView();
    }).catch(function(e){ st.roomId=''; st.roomData=null; renderView(); toast(e.message || 'Could not join this room'); });
  }
  function applyRoomState(state, initial) {
    if (!state || !state.track || st.roomApplying) return;
    var current = track(), t = state.track;
    st.roomApplying = true;
    try {
      if (!current || current.videoId !== t.videoId) {
        var roomTrack = { id:t.id || t.videoId, videoId:t.videoId, title:t.title, artist:t.artist, cover:t.cover, duration:t.duration || 0 };
        startAt([roomTrack], 0);
      } else if (ytPlayer) {
        var drift = Math.abs((ytPlayer.getCurrentTime() || 0) - (Number(state.position) || 0));
        if (initial || drift > 3) ytPlayer.seekTo(Math.max(0, Number(state.position) || 0), true);
        if (state.playing) ytPlayer.playVideo(); else ytPlayer.pauseVideo();
      }
    } catch (_) {} finally { setTimeout(function(){ st.roomApplying=false; }, 450); }
  }
  function sendRoomControl(kind, extra) {
    if (!st.roomId || st.roomApplying) return;
    var body = Object.assign({ kind: kind }, extra || {});
    roomPost('control', body).catch(function(e){ toast(e.message || 'Room sync failed'); });
  }
  function leaveRoom() {
    if (st.roomStream) st.roomStream.close(); st.roomStream = null; st.roomId = ''; st.roomData = null;
    var u = new URL(window.location.href); u.searchParams.delete('room'); history.replaceState({}, '', u.toString()); renderView();
  }

  document.addEventListener('change', function (e) { if (e.target && e.target.id === 'roomGenre') loadRoomList(); if (e.target && e.target.id === 'wrapPeriod') loadWrap(); });

  // ---------- main view ----------
  function renderView() {
    var v = $('#view'), h = '';
    $('#main').classList.toggle('admin-mode', st.tab === 'admin' && !st.needLogin);
    $('.top').hidden = st.needLogin; document.querySelector('.tabs').hidden = st.needLogin;
    if (st.needLogin) { v.innerHTML = signinHTML(); return; }
    if (st.tab === 'admin') {
      if (!st.cfg.isAdmin) { h += '<h1>Admin</h1><div class="box">You do not have permission to view this page.</div>'; }
      else {
        var ad = st.adminData || {}, w = st.adminWorkspace || {}, users = w.users || ad.users || [];
        var sections = [['overview','Overview'],['users','Users'],['listening','Listening analytics'],['music','Music manager'],['reports','Reports'],['broadcasts','Broadcasts'],['promotions','Promotions'],['support','Support'],['logs','Activity logs'],['staff','Admin roles'],['settings','System settings']];
        h += '<div class="admin-shell"><aside class="admin-rail"><div class="admin-mark">✳</div><div class="admin-rail-icons"><span class="active">⌂</span><span>♫</span><span>♙</span><span>＄</span><span>♧</span></div><div class="admin-rail-bottom">?</div></aside>' +
          '<section class="admin-main"><header class="admin-top"><div><h1>' + esc((sections.find(x=>x[0]===st.adminSection)||sections[0])[1]) + '</h1><p>Ytunes platform control center</p></div><div class="admin-top-actions"><span class="admin-period">Live overview</span><button class="admin-refresh" data-act="admin-refresh">↻ Refresh</button></div></header>' +
          '<nav class="admin-v2-nav">' + sections.map(x=>'<button data-act="admin-section" data-section="'+x[0]+'" class="'+(st.adminSection===x[0]?'on':'')+'">'+x[1]+'</button>').join('') + '</nav>';
        if (st.adminError) h += '<div class="admin-alert">' + esc(st.adminError) + '</div>';
        if (!st.adminData || !st.adminWorkspace) h += '<div class="admin-loading">Loading admin workspace…</div>';
        else if (st.adminSection === 'overview') {
          var totalReq=(ad.usage.search||0)+(ad.usage.trending||0)+(ad.usage.track||0);
          h += '<div class="admin-v2-stats"><article><small>TOTAL USERS</small><b>'+Number(ad.totalUsers||0).toLocaleString()+'</b><span>Registered accounts</span></article><article><small>PREMIUM USERS</small><b>'+Number(ad.premiumUsers||0).toLocaleString()+'</b><span>Stored account tier</span></article><article><small>API REQUESTS</small><b>'+totalReq.toLocaleString()+'</b><span>Since server start</span></article><article><small>FEATURED TRACKS</small><b>'+(w.featured||[]).length+'</b><span>Admin-curated</span></article></div>' +
          '<div class="admin-v2-grid"><section class="admin-panel"><h3>API usage</h3>'+['search','trending','track'].map(k=>'<div class="admin-health-row"><span>'+k+'</span><b>'+Number(ad.usage[k]||0).toLocaleString()+'</b></div>').join('')+'<p class="admin-footnote">Process counters reset on restart. Google Cloud Console provides official quota usage.</p></section><section class="admin-panel"><h3>System health</h3><div class="admin-health-row"><span>Music API key</span><b class="'+(ad.apiKeyConfigured?'ok':'warn')+'">'+(ad.apiKeyConfigured?'Configured':'Missing')+'</b></div><div class="admin-health-row"><span>Region</span><b>'+esc(ad.region||'NG')+'</b></div><div class="admin-health-row"><span>Uptime</span><b>'+Math.floor((ad.uptimeSeconds||0)/3600)+'h '+Math.floor(((ad.uptimeSeconds||0)%3600)/60)+'m</b></div><div class="admin-health-row"><span>Maintenance</span><b>'+(w.settings&&w.settings.maintenance?'ON':'OFF')+'</b></div></section></div>';
        } else if (st.adminSection === 'users') {
          h += '<section class="admin-panel"><h3>User management · '+users.length+'</h3><input class="admin-filter" id="adminUserFilter" placeholder="Search name or email"><div id="adminUsersList">'+users.map(u=>'<div class="admin-user"><div class="admin-user-avatar">'+esc((u.name||'L').charAt(0).toUpperCase())+'</div><div class="admin-user-main"><b>'+esc(u.name||'Listener')+'</b><small>'+esc(u.email)+'</small><small>Joined '+esc(u.created?new Date(u.created).toLocaleDateString():'—')+'</small><small>Listening plays: '+Number(((w.listeningUsers||[]).find(function(x){return x.id===u.id;})||{}).plays||0)+'</small></div><span class="tier '+(u.tier==='premium'?'premium':'')+'">'+esc(u.tier||'free')+'</span><button class="tier-btn" data-act="tier" data-id="'+esc(u.id)+'" data-tier="'+(u.tier==='premium'?'free':'premium')+'">'+(u.tier==='premium'?'Set Free':'Make Premium')+'</button></div>').join('')+'</div></section>';
        } else if (st.adminSection === 'listening') {
          var lu=w.listeningUsers||[]; h += '<section class="admin-panel"><h3>Listening analytics · '+Number(w.totalPlays||0)+' plays</h3><p class="admin-footnote">Play counts are recorded when signed-in users start a track. Anonymous sessions are not included.</p>'+lu.map(function(x){return '<div class="admin-user"><div class="admin-user-avatar">'+esc((x.name||'L').charAt(0))+'</div><div class="admin-user-main"><b>'+esc(x.name||'Listener')+'</b><small>'+esc(x.email||'')+'</small><small>Last played: '+esc(x.lastTrack||'—')+' · '+esc(x.lastPlayed?new Date(x.lastPlayed).toLocaleString():'—')+'</small></div><span class="tier">'+Number(x.plays||0)+' plays</span><span class="tier">'+Object.keys(x.tracks||{}).length+' tracks</span></div>';}).join('')+'</section>';
        } else if (st.adminSection === 'music') {
          h += '<section class="admin-panel"><h3>Featured music</h3><form class="admin-form" data-admin-form="featured"><input name="title" required placeholder="Track title"><input name="artist" placeholder="Artist"><input name="videoId" required placeholder="Track video ID"><button>Add featured track</button></form>'+listAdminItems(w.featured,'featured')+'</section>';
        } else if (st.adminSection === 'reports') {
          h += '<section class="admin-panel"><h3>Content reports</h3><p class="admin-footnote">Reports will appear here when a report-submission flow is connected. No reports are currently stored.</p>'+listAdminItems(w.reports,'reports')+'</section>';
        } else if (st.adminSection === 'broadcasts') {
          h += '<section class="admin-panel"><h3>Announcement centre</h3><form class="admin-form" data-admin-form="announcement"><input name="title" required placeholder="Announcement title"><textarea name="message" required placeholder="Message for listeners"></textarea><button>Publish announcement</button></form>'+listAdminItems(w.announcements,'announcements')+'<p class="admin-footnote">Announcements are saved in the admin workspace. Live push/email delivery requires a notification provider.</p></section>';
        } else if (st.adminSection === 'promotions') {
          h += '<section class="admin-panel"><h3>Promotion codes</h3><form class="admin-form" data-admin-form="promotion"><input name="code" required placeholder="PROMO2026"><input name="discount" type="number" min="0" max="100" placeholder="Discount %"><button>Create code</button></form>'+listAdminItems(w.promotions,'promotions')+'<p class="admin-footnote">Codes are managed here; checkout redemption is not connected until a payment system is integrated.</p></section>';
        } else if (st.adminSection === 'support') {
          h += '<section class="admin-panel"><h3>Support inbox</h3><p class="admin-footnote">No support tickets are connected yet. Connect a contact form or support provider to populate this inbox.</p>'+listAdminItems(w.support,'support')+'</section>';
        } else if (st.adminSection === 'logs') {
          h += '<section class="admin-panel"><h3>Admin activity</h3>'+(w.logs||[]).map(x=>'<div class="admin-health-row"><span><b>'+esc(x.action)+'</b><small class="admin-log-detail">'+esc(x.detail)+' · '+esc(x.actor)+'</small></span><b>'+esc(new Date(x.at).toLocaleString())+'</b></div>').join('')+'</section>';
        } else if (st.adminSection === 'staff') {
          h += '<section class="admin-panel"><h3>Authorized administrators</h3><p class="admin-footnote">Staff access is controlled by the ADMIN_EMAILS environment variable on your hosting provider. Only listed verified accounts can open this dashboard.</p>'+(w.staff||[]).map(x=>'<div class="admin-health-row"><span>'+esc(x)+'</span><b>Admin</b></div>').join('')+'</section>';
        } else if (st.adminSection === 'settings') {
          var cfg=w.settings||{};
          h += '<section class="admin-panel"><h3>Platform settings</h3><div class="admin-setting"><span>Maintenance mode</span><button data-act="maintenance" data-enabled="'+(!cfg.maintenance)+'">'+(cfg.maintenance?'Disable':'Enable')+' maintenance</button></div><p class="admin-footnote">Maintenance mode blocks music API access for listeners while administrators retain access.</p><form class="admin-form" data-admin-form="limits"><label>Search / minute<input name="searchLimit" type="number" min="1" max="500" value="'+Number(cfg.searchLimit||20)+'"></label><label>Trending / minute<input name="trendingLimit" type="number" min="1" max="500" value="'+Number(cfg.trendingLimit||30)+'"></label><label>Track lookups / minute<input name="trackLimit" type="number" min="1" max="500" value="'+Number(cfg.trackLimit||60)+'"></label><button>Save rate limits</button></form><p class="admin-footnote">Rate limits are enforced per account or IP by this server process. They reset each minute and are not shared across multiple server instances.</p><a class="setting-link" target="_blank" rel="noopener noreferrer" href="https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas">Open Google API quota console ↗</a></section>';
        }
        h += '</section><aside class="admin-side"><div class="admin-account"><span class="admin-avatar">'+(au.picture?'<img src="'+esc(au.picture)+'" alt="">':esc((au.name||'A').charAt(0)))+'</span><div><b>'+esc(au.name||'Administrator')+'</b><small>Administrator</small></div></div><div class="admin-side-block"><small>PLATFORM SOURCE</small><div class="admin-source"><span class="youtube-mark">▶</span><div><b>Ytunes</b><small>Official music source</small></div><span class="source-check">✓</span></div></div><div class="admin-side-block admin-side-note"><small>ADMIN ACCESS</small><h3>Ytunes control centre</h3><p>Manage the music platform and its listener experience.</p></div></aside></div>';
      }
    } else if (st.tab === 'explore') {
      var passport = readList('ytunes_recent'); var likes = readList('ytunes_liked'); var points = Number(localStorage.getItem('ytunes_points') || 0);
      h += '<h1>Explore Ytunes</h1><p class="note">A new music world, added alongside your existing Ytunes experience.</p>' +
        '<section class="settings-group"><h2>1 · Music World</h2><p class="setting-help">Explore music by scene and country. Choose a chart to discover sounds from that place.</p><div class="chips"><button class="chip" data-act="world" data-v="NG">Nigeria</button><button class="chip" data-act="world" data-v="GH">Ghana</button><button class="chip" data-act="world" data-v="DE">Germany</button><button class="chip" data-act="world" data-v="US">USA</button></div>' + worldExtras() + '<p class="setting-help">Country charts depend on the music provider and server region; this is not a live listener-location map.</p></section>' +
        '<section class="settings-group"><h2>Activity modes</h2><p class="setting-help">One tap finds music for what you are doing.</p><div class="chips"><button class="chip" data-act="mode" data-v="study">Study</button><button class="chip" data-act="mode" data-v="commute">Commute</button><button class="chip" data-act="mode" data-v="party">Party</button><button class="chip" data-act="mode" data-v="workout">Workout</button></div></section>' +
        '<section class="settings-group"><h2>2 · Mood Translator</h2><p class="setting-help">Describe how you feel and build a matching music mix.</p><form id="moodForm" class="admin-form"><input name="mood" required maxlength="100" placeholder="e.g. I need hope after a hard week"><button>Create my mood mix</button></form></section>' +
        '<section class="settings-group"><h2>3 · Listening Rooms</h2><p class="setting-help">Listen together in sync, see who is in the room and chat live.</p><div class="room-actions"><button class="setting-action" data-act="room-create">Create a live room</button><form id="roomJoinForm" class="room-join"><input name="roomCode" maxlength=8 placeholder="Enter room code" required><button>Join</button></form></div><div id="roomInvite">' + roomHTML() + '</div></section>' +
        '<section class="settings-group"><h2>4 · Music Passport</h2><div class="setting-row"><span>Recently discovered tracks</span><b>' + passport.length + '</b></div><div class="setting-row"><span>Liked songs</span><b>' + likes.length + '</b></div><div class="setting-row"><span>Fan points on this device</span><b>' + points + '</b></div><p class="setting-help">Your personal passport updates as you listen and discover music.</p></section>' +
        '<section class="settings-group"><h2>5 · Song Battles</h2><p class="setting-help">Pick a winner from two tracks in your current recommendations.</p><div class="battle-picks">' + (st.tracks[0] ? '<button class="setting-action" data-act="battle" data-i="0">' + esc(st.tracks[0].title) + ' — Vote winner</button>' : '') + (st.tracks[1] ? '<button class="setting-action" data-act="battle" data-i="1">' + esc(st.tracks[1].title) + ' — Vote winner</button>' : '') + '</div><p class="setting-help">Votes are currently saved on this device.</p></section>' +
        '<section class="settings-group"><h2>6 · Fan Rewards</h2><div class="setting-row"><span>Your discovery points</span><b>' + points + '</b></div><p class="setting-help">Earn a point when you play a track. Points are for fun and have no cash value.</p></section>' +
        '<section class="settings-group"><h2>7 · Time Machine</h2><p class="setting-help">Choose an era and explore songs from that year.</p><div class="chips"><button class="chip" data-act="era" data-v="1990">1990s</button><button class="chip" data-act="era" data-v="2000">2000s</button><button class="chip" data-act="era" data-v="2010">2010s</button><button class="chip" data-act="era" data-v="2020">2020s</button></div></section>' +
        '<section class="settings-group"><h2>8 · Artist Universe</h2><p class="setting-help">Find an artist to explore their songs and build a fan community around them.</p><button class="setting-action" data-act="artist">Explore an artist</button></section>' +
        '<section class="settings-group"><h2>9 · Friendship Soundtrack</h2><p class="setting-help">Create a shareable mix from your liked and recently played songs.</p><button class="setting-action" data-act="friendmix">Create friendship soundtrack</button></section>' +
        '<section class="settings-group"><h2>10 · Music DNA</h2><p class="setting-help">Your listening identity is based on your saved recent and liked tracks.</p><div class="setting-row"><span>Tracks in your taste profile</span><b>' + (passport.length + likes.length) + '</b></div><div class="setting-row"><span>Current discovery style</span><b>' + (passport.length ? 'Curious listener' : 'Ready to discover') + '</b></div></section>' + accountHTML();
    } else if (st.tab === 'profile') {
      var pu = st.user || {};
      var initials = esc((pu.name || 'Listener').split(/\\s+/).map(function (x) { return x.charAt(0); }).join('').slice(0, 2).toUpperCase());
      h += '<h1>Your profile</h1><section class="profile-card"><div class="profile-avatar">' +
        (pu.picture ? '<img src="' + esc(pu.picture) + '" alt="" referrerpolicy="no-referrer">' : initials) +
        '</div><div class="profile-meta"><h2>' + esc(pu.name || 'Guest listener') + '</h2><p>' + esc(pu.email || 'You are listening without an account') + '</p></div></section>' +
        '<section class="settings-group"><h2>Listening profile</h2><div class="setting-row"><span>Liked songs</span><b>' + st.liked.length + '</b></div>' +
        '<div class="setting-row"><span>Recently played on this device</span><b>' + st.recent.length + '</b></div>' +
        '<div class="setting-row"><span>Total plays on your account</span><b>' + Number((st.listenStats||{}).plays||0) + '</b></div><div class="setting-row"><span>Unique tracks played</span><b>' + Number((st.listenStats||{}).uniqueTracks||0) + '</b></div></section>' +
        '<section class="settings-group"><h2>Account</h2>' +
        (st.user ? '<button type="button" class="setting-action danger" data-act="logout">Sign out</button>' : '<p class="setting-help">Sign-in is optional. Your liked and recent songs are saved in this browser.</p>') +
        '</section>';
    } else if (st.tab === 'settings') {
      var analyticsOn = localStorage.getItem('ytunes_analytics_consent') === 'yes';
      h += '<h1>Settings</h1>' +
        '<section class="settings-group"><h2>Listening privacy</h2><p class="setting-help">If enabled, Ytunes records the songs you start while signed in. Administrators can see your play count and recent track. You can turn this off at any time.</p><button type="button" class="setting-action" data-act="analytics">' + (analyticsOn ? 'Turn off listening analytics' : 'Allow listening analytics') + '</button></section>' +
        '<section class="settings-group"><h2>Your listening wrap</h2><p class="setting-help">A recap of what you played. Only plays from signed-in accounts with listening analytics on are included.</p>' +
        '<select id="wrapPeriod" class="room-create"><option value="month">Last 30 days</option><option value="year">Last 12 months</option></select><div id="wrapCard"></div></section>' +
        '<section class="settings-group"><h2>Share Ytunes</h2><p class="setting-help">Invite someone to discover Ytunes with you.</p><button type="button" class="setting-action" data-act="share">Share website on WhatsApp</button></section>' +
'<section class="settings-group"><h2>Listening rooms</h2><p class="setting-help">Create a room, share it, or join one. Rooms stay in sync and have chat.</p>' +
        (st.user ? '' : '<p class="setting-help">Sign in to create a room or join one.</p>') +
        (st.roomId ? '' : '<form id="roomCreateForm" class="room-create"><input name="name" maxlength="60" placeholder="Room name"><select name="genre">' + roomGenreOptions() + '</select><label><input type="checkbox" name="isPublic" checked> Show in public room list</label><label>Start time (optional)<input type="datetime-local" name="scheduledAt"></label><label><input type="checkbox" name="startNow" checked> Start with the song playing now</label><button>Create room</button></form>' +
        '<div class="room-actions"><form id="roomJoinForm" class="room-join"><input name="roomCode" maxlength="8" placeholder="Enter room code" required><button>Join</button></form></div>') +
        '<p class="setting-help"><b>Public rooms</b></p><select id="roomGenre" class="room-create">' + roomGenreOptions() + '</select><div id="roomList"></div><div id="roomInvite">' + roomHTML() + '</div></section>';
      setTimeout(loadRoomList, 0); setTimeout(loadWrap, 0);
    } else if (st.tab === 'library') {
      var base;
      if (st.libFilter === 'liked') base = st.liked;
      else if (st.libFilter === 'recent') base = st.recent;
      else { var seen = {}; base = st.liked.concat(st.recent).filter(function (t) { if (seen[t.id]) return false; seen[t.id] = 1; return true; }); }
      st.list = base;
      h += '<h1>Your library</h1><div class="chips">';
      [['all', 'All'], ['liked', 'Liked Songs'], ['recent', 'Recently Played']].forEach(function (f) {
        h += '<button type="button" class="chip' + (st.libFilter === f[0] ? ' on' : '') + '" data-act="lib" data-v="' + f[0] + '">' + f[1] + '</button>';
      });
      h += '</div><div class="list" style="margin-top:20px">';
      if (!base.length) {
        h += '<div class="box dash">' + (st.libFilter === 'recent' ? 'Songs you play will show up here.' : 'Tap the heart on a song to keep it here.') + '<br><button type="button" class="pill" data-act="tab" data-v="home">Find music</button></div>';
      } else base.forEach(function (t, i) { h += rowHTML(t, i); });
      h += '</div>' + accountHTML();
    } else {
      st.list = st.tracks;
      var searching = !!st.term.trim() && st.term.trim() === st.query;
      var heading = searching ? 'Results for \u201c' + esc(st.query) + '\u201d' : st.genre !== 'All' ? esc(st.genre) : 'Popular';
      h += '<h1>' + (st.user ? 'Hello, ' + esc(String(st.user.name).split(' ')[0]) : 'Ytunes') + '</h1><div class="chips">';
      GENRES.forEach(function (g) { h += '<button type="button" class="chip' + (st.genre === g.label && !searching ? ' on' : '') + '" data-act="genre" data-v="' + esc(g.label) + '">' + esc(g.label) + '</button>'; });
      h += '</div>';
      if (!searching && st.genre === 'All') {
        var c0 = st.tracks[0] && st.tracks[0].cover;
        h += '<h2 class="sec">For you</h2><div class="hero">' + (c0 ? '<img src="' + esc(c0) + '" alt="" referrerpolicy="no-referrer">' : '') +
          '<h3>Your Music Universe</h3><p>Discover Nigerian hits, global charts and new sounds.</p><button type="button" data-act="startall"' + (st.tracks.length ? '' : ' disabled') + '>' + ICON.play.replace('<svg', '<svg style="width:16px;height:16px"') + 'Start Listening</button></div>';
      }
      h += '<h2 class="sec">' + heading + '</h2><div class="list">';
      if (st.status === 'loading') h += skeleton();
      else if (st.status === 'error') h += '<div class="box"><div style="font-size:32px;color:rgba(255,255,255,.4);display:inline-block">' + ICON.wifi + '</div><p style="margin:12px 0 0">' + esc(st.error) + '</p><button type="button" class="pill" data-act="retry">Try again</button></div>';
      else if (!st.tracks.length) h += '<p class="empty">Nothing found. Try another song or artist.</p>';
      else st.tracks.forEach(function (t, i) { h += rowHTML(t, i); });
      h += '</div><p class="note">Songs are streamed only. \u201c30s\u201d songs are 30-second previews.</p>';
    }
    v.innerHTML = h;
  }

  // ---------- loading music ----------
  function load(q) {
    var mine = ++reqId;
    st.status = 'loading'; st.error = '';
    renderView();
    getJSON(q ? 'api/music/search?q=' + encodeURIComponent(q) : 'api/music/trending').then(function (res) {
      if (mine !== reqId) return;
      st.tracks = res.tracks || []; st.status = 'ready'; renderView();
    }).catch(function (e) {
      if (mine !== reqId) return;
      if (e && e.status === 401) { st.needLogin = true; st.user = null; renderView(); return; }
      st.error = (e && e.message) || "Couldn't load music."; st.status = 'error'; renderView();
    });
  }
  function genreQuery() { var g = GENRES.filter(function (x) { return x.label === st.genre; })[0]; return g ? g.q : ''; }

  // ---------- player ----------
  function startAt(list, i) {
    var t = list[i]; if (!t || !t.videoId) return;
    st.queue = list; st.index = i; st.loading = true; st.playing = false; st.cur = 0; st.dur = t.duration || 0;
    st.npOpen = true; st.showQueue = false;
    refresh();
    mountYouTube(t.videoId);
    if (st.roomId && !st.roomApplying) sendRoomControl('track', { track: t });
    st.recent = [t].concat(st.recent.filter(function (x) { return x.id !== t.id; })).slice(0, 30);
    writeList('ytunes_recent', st.recent);
    localStorage.setItem('ytunes_points', String(Number(localStorage.getItem('ytunes_points') || 0) + 1));
    if (st.user && localStorage.getItem('ytunes_analytics_consent') === 'yes') getJSON('api/listening/event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trackId: t.id, title: t.title, artist: t.artist, duration: t.duration || 0, context: st.query || st.genre || 'Trending' }) }).catch(function () {});
    setMediaMeta(); refresh();
  }
  function play(list, i) {
    var ok = list.filter(function (t) { return t && t.videoId; });
    if (!ok.length) return;
    var target = list[i]; var idx = Math.max(0, ok.indexOf(target));
    failures = 0; startAt(ok, idx);
  }
  function toggle() {
    if (!ytPlayer || !track()) return;
    try { if (ytPlayer.getPlayerState() === 1) { ytPlayer.pauseVideo(); sendRoomControl('pause', { position: st.cur }); } else { ytPlayer.playVideo(); sendRoomControl('play', { position: st.cur }); } } catch (e) {}
  }
  function seek(sec) {
    if (!isFinite(sec) || !ytPlayer) return;
    try { ytPlayer.seekTo(Math.max(0, sec), true); sendRoomControl('seek', { position: Math.max(0, sec) }); } catch (e) {}
  }
  function pickNext(auto) {
    var q = st.queue, i = st.index;
    if (!q.length) return -1;
    if (auto && st.repeat === 'one') return i;
    if (st.shuffle && q.length > 1) { var r = i; while (r === i) r = Math.floor(Math.random() * q.length); return r; }
    if (i + 1 < q.length) return i + 1;
    return st.repeat === 'all' || !auto ? 0 : -1;
  }
  function next() { var n = pickNext(false); if (n >= 0) startAt(st.queue, n); }
  function prev() {
    if (st.cur > 3) { seek(0); return; }
    if (!st.queue.length) return;
    startAt(st.queue, st.index > 0 ? st.index - 1 : st.queue.length - 1);
  }
  function stop() {
    if (ytPlayer) { try { ytPlayer.stopVideo(); } catch (e) {} }
    st.queue = []; st.index = -1; st.playing = false; st.loading = false; st.npOpen = false; st.showQueue = false;
    refresh();
  }
  function failTrack(msg) {
    failures++; st.loading = false; toast(msg || "That song can't play right now");
    if (failures < Math.min(st.queue.length, 4) && st.index + 1 < st.queue.length) setTimeout(function () { startAt(st.queue, st.index + 1); }, 700);
    else { st.playing = false; refresh(); }
  }


  // ---------- Media Session (notification shade / lock screen) ----------
  function setMediaMeta() {
    var t = track(); if (!t || !('mediaSession' in navigator) || !window.MediaMetadata) return;
    try {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: t.title, artist: t.artist, album: t.album || 'Music',
        artwork: t.cover ? [96, 192, 256, 384, 512].map(function (n) { return { src: t.cover, sizes: n + 'x' + n, type: 'image/jpeg' }; }) : []
      });
    } catch (e) { /* unsupported */ }
  }
  (function setupMediaSession() {
    if (!('mediaSession' in navigator)) return;
    var set = function (n, fn) { try { navigator.mediaSession.setActionHandler(n, fn); } catch (e) { /* not supported here */ } };
    set('play', function () { if (!st.playing) toggle(); });
    set('pause', function () { if (st.playing) toggle(); });
    set('previoustrack', prev);
    set('nexttrack', next);
    set('seekto', function (d) { if (d && typeof d.seekTime === 'number') seek(d.seekTime); });
    set('seekbackward', function (d) { seek(st.cur - ((d && d.seekOffset) || 10)); });
    set('seekforward', function (d) { seek(st.cur + ((d && d.seekOffset) || 10)); });
  })();
  var lastPos = 0;
  function updatePosition() {
    if (!('mediaSession' in navigator)) return;
    try { navigator.mediaSession.playbackState = !track() ? 'none' : st.playing ? 'playing' : 'paused'; } catch (e) { /* ignore */ }
    var now = Date.now(); if (now - lastPos < 1000 || !st.dur || !isFinite(st.dur) || !navigator.mediaSession.setPositionState) return;
    lastPos = now;
    try { navigator.mediaSession.setPositionState({ duration: st.dur, playbackRate: 1, position: Math.min(st.cur, st.dur) }); } catch (e) { /* ignore */ }
  }

  // ---------- player UI ----------
  function barsFor(id, n) {
    var h = 2166136261, out = [], i;
    for (var k = 0; k < String(id).length; k++) h = Math.imul(h ^ String(id).charCodeAt(k), 16777619);
    for (i = 0; i < n; i++) {
      h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
      out.push((0.28 + (h % 1000) / 1000 * 0.72) * (0.65 + 0.35 * Math.sin((i / n) * Math.PI)));
    }
    return out;
  }
  var waveFor = null, waveBars = [];
  function buildWave(id) {
    if (waveFor === id) return; waveFor = id;
    var b = barsFor(id, 64), h = '';
    b.forEach(function (v) { h += '<i style="height:' + Math.round(v * 100) + '%"></i>'; });
    var w = $('#wave'); w.innerHTML = h; waveBars = w.children;
  }
  var dragPct = null;
  function paintWave() {
    var pct = dragPct !== null ? dragPct : (st.dur ? Math.min(1, st.cur / st.dur) : 0);
    for (var i = 0; i < waveBars.length; i++) {
      var on = (i + 0.5) / waveBars.length <= pct;
      if (on !== (waveBars[i].className === 'd')) waveBars[i].className = on ? 'd' : '';
    }
  }
  function tick() { // cheap per-second update: progress only
    var pct = st.dur ? Math.min(100, st.cur / st.dur * 100) : 0;
    $('#miniProg').style.width = pct + '%';
    if (st.npOpen) { $('#tCur').textContent = fmt(st.cur); $('#tDur').textContent = fmt(st.dur || (track() && track().duration)); paintWave(); }
    updatePosition();
  }

  function renderNowPlaying() {
    var t = track(), np = $('#np');
    if (!t) { np.hidden = true; return; }
    np.hidden = !st.npOpen; if (!st.npOpen) return;
    $('#npBlur').style.backgroundImage = t.cover ? 'url("' + t.cover.replace(/"/g, '%22') + '")' : 'none';
    if (st.showQueue) {
      var q = '<div class="queue"><p>Up next</p>';
      st.queue.forEach(function (x, i) {
        q += '<button type="button" class="qrow' + (i === st.index ? ' cur' : '') + '" data-act="qplay" data-i="' + i + '">' + cover(x.cover || thumb(x.videoId), 44, '12px') +
          '<span class="row-text"><b>' + esc(x.title) + '</b><small>' + esc(x.artist) + '</small></span>' + (i === st.index ? eq(st.playing) : '') + '</button>';
      });
      $('#npBody').innerHTML = q + '</div>';
    } else {
      if (!$('#ytPlayer')) $('#npBody').innerHTML = '<div class="yt-player-shell"><div id="ytPlayer"></div></div>';
    }
    $('#npArtist').textContent = t.artist; $('#npTitle').textContent = t.title;
    $('#npSrc').textContent = 'Official embedded player';
    $('#npLike').innerHTML = isLiked(t.id) ? ICON.heartOn : ICON.heart;
    $('#cPlay').innerHTML = st.loading ? '<span class="spin">' + ICON.loader + '</span>' : st.playing ? ICON.pause : ICON.play;
    $('#cRepeat').innerHTML = st.repeat === 'one' ? ICON.repeat1 : ICON.repeat;
    $('#cRepeat').className = 'plain' + (st.repeat !== 'off' ? ' on' : '');
    $('#cQueue').className = 'plain' + (st.showQueue ? ' on' : '');
    $('#cShuffle').className = 'shuffle' + (st.shuffle ? ' on' : '');
    $('#cShuffle').innerHTML = ICON.shuffle + 'Shuffle ' + (st.shuffle ? 'on' : 'off');
    buildWave(t.id); tick();
  }

  function renderMini() {
    var t = track(), mini = $('#mini');
    mini.hidden = !t || st.npOpen;
    if (!t) return;
    $('#miniCover').outerHTML = cover(t.cover || thumb(t.videoId), 44).replace('<span class="cover"', '<span id="miniCover" class="cover"');
    $('#miniTitle').textContent = t.title; $('#miniArtist').textContent = t.artist;
    $('#miniToggle').innerHTML = st.loading ? '<span class="spin">' + ICON.loader + '</span>' : st.playing ? ICON.pause : ICON.play;
  }

  function refresh() { renderView(); renderMini(); renderNowPlaying(); tick(); }

  // ---------- events ----------
  function toggleLike(t) {
    if (!t) return;
    st.liked = isLiked(t.id) ? st.liked.filter(function (x) { return x.id !== t.id; }) : [t].concat(st.liked);
    writeList('ytunes_liked', st.liked);
    refresh();
  }

  $('#view').addEventListener('click', function (e) {
    var el = e.target; while (el && el !== this && !el.getAttribute('data-act')) el = el.parentNode;
    if (!el || el === this) return;
    var act = el.getAttribute('data-act'), i = Number(el.getAttribute('data-i')), v = el.getAttribute('data-v');
    var t = st.list[i];
    if (act === 'play') { if (track() && t && track().id === t.id) toggle(); else play(st.list, i); }
    else if (act === 'like') toggleLike(t);
    else if (act === 'startall') play(st.tracks, 0);
    else if (act === 'genre') { st.genre = v; st.term = ''; $('#q').value = ''; $('#clearQ').hidden = true; st.query = genreQuery(); load(st.query); }
    else if (act === 'retry') load(st.query);
    else if (act === 'lib') { st.libFilter = v; renderView(); }
    else if (act === 'tab') setTab(v);
    else if (act === 'admin-refresh') { loadAdmin(); }
    else if (act === 'analytics') { var nextConsent = localStorage.getItem('ytunes_analytics_consent') === 'yes' ? 'no' : 'yes'; localStorage.setItem('ytunes_analytics_consent', nextConsent); toast(nextConsent === 'yes' ? 'Listening analytics enabled' : 'Listening analytics disabled'); renderView(); }
    else if (act === 'share') { var shareUrl = window.location.href.split('#')[0]; window.location.href = 'https://wa.me/?text=' + encodeURIComponent('Listen with me on Ytunes: ' + shareUrl); }
    else if (act === 'world') { getJSON('api/music/trending?region=' + encodeURIComponent(v)).then(function(r){st.tracks=r.tracks||[];st.list=st.tracks;st.status='ready';st.genre='All';st.query='';st.tab='home';document.querySelectorAll('.tab').forEach(function(x){x.classList.toggle('on',x.getAttribute('data-tab')==='home');});renderView();toast('Loaded ' + v + ' music chart');}).catch(function(e){toast(e.message||'Could not load this chart');}); }
    else if (act === 'era') { st.genre = 'All'; st.query = v + 's popular hits'; setTab('home'); load(st.query); }
    else if (act === 'artist') { var artistName = window.prompt('Enter an artist name to explore'); if (artistName) { $('#q').value = artistName; st.query = artistName; setTab('home'); load(artistName); } }
    else if (act === 'room-create') { getJSON('api/rooms/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({track:track()})}).then(function(r){connectRoom(r.room.id);toast('Live room created');}).catch(function(e){toast(e.message||'Could not create room');}); }
    else if (act === 'room-copy') { var link=window.location.origin+window.location.pathname+'?room='+encodeURIComponent(st.roomId); if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(link).then(function(){toast('Room invite copied');}).catch(function(){window.prompt('Copy room invite',link);});else window.prompt('Copy room invite',link); }
    else if (act === 'room-leave') leaveRoom();
    else if (act === 'room-join') connectRoom(el.getAttribute('data-id'));
    else if (act === 'room-suggest') { var sg = track(); if (sg) roomPost('control', { kind: 'suggest', track: { id: sg.id, videoId: sg.videoId, title: sg.title, artist: sg.artist, cover: sg.cover, duration: sg.duration } }).then(function () { toast('Suggested to the room'); }).catch(function (e) { toast(e.message || 'Could not suggest this song'); }); }
    else if (act === 'room-vote') roomPost('control', { kind: 'vote', queueId: el.getAttribute('data-id') }).catch(function (e) { toast(e.message || 'Could not vote'); });
    else if (act === 'room-remove') roomPost('control', { kind: 'remove', queueId: el.getAttribute('data-id') }).catch(function (e) { toast(e.message || 'Could not remove'); });
    else if (act === 'room-next') roomPost('control', { kind: 'next' }).catch(function (e) { toast(e.message || 'Could not play the next song'); });
    else if (act === 'room-host') roomPost('control', { kind: 'host', userId: el.getAttribute('data-uid') }).then(function (r) { st.roomData.hostId = r.hostId; renderView(); toast('Host passed on'); }).catch(function (e) { toast(e.message || 'Could not pass host'); });
    else if (act === 'city') { var cq = el.getAttribute('data-v') + ' music hits'; getJSON('api/music/search?q=' + encodeURIComponent(cq) + '&region=' + encodeURIComponent(el.getAttribute('data-r'))).then(function (r) { st.tracks = r.tracks || []; st.list = st.tracks; st.status = 'ready'; st.genre = 'All'; st.query = ''; if (st.tab !== 'home') setTab('home'); renderView(); toast((r.tracks || []).length ? 'Loaded ' + el.getAttribute('data-v') + ' charts' : 'No ' + el.getAttribute('data-v') + ' tracks found'); }).catch(function (e) { toast(e.message || 'Could not load that city'); }); }
    else if (act === 'rising') { getJSON('api/music/rising?region=' + encodeURIComponent(v)).then(function (r) { st.tracks = r.tracks || []; st.list = st.tracks; st.status = 'ready'; st.genre = 'All'; st.query = ''; if (st.tab !== 'home') setTab('home'); renderView(); toast(r.note || ('Rising in ' + v)); }).catch(function (e) { toast(e.message || 'Rising charts are unavailable'); }); }
    else if (act === 'wrap-share') { var w = st.wrap || {}; var text = 'My Ytunes wrap: ' + (w.plays || 0) + ' plays' + (w.minutesTracked ? ', ' + w.minutes + ' minutes' : '') + (w.topVibe ? ', top vibe ' + w.topVibe : '') + (w.topTracks && w.topTracks[0] ? '. Top track: ' + w.topTracks[0].title + ' by ' + (w.topTracks[0].artist || 'unknown') : '') + '.'; if (navigator.share) navigator.share({ title: 'My Ytunes wrap', text: text, url: window.location.origin + window.location.pathname }).catch(function () {}); else if (navigator.clipboard) navigator.clipboard.writeText(text + ' ' + window.location.origin + window.location.pathname).then(function () { toast('Wrap copied to clipboard'); }); }
    else if (act === 'mode') { var mq = { study: 'lofi study focus instrumental', commute: 'commute drive mix hits', party: 'party dance hits', workout: 'workout gym hype' }[v]; if (mq) { st.genre = 'All'; st.query = v; if (st.tab !== 'home') setTab('home'); load(mq); } }
    else if (act === 'battle') { var bt = st.tracks[Number(el.getAttribute('data-i'))]; if (bt) { var votes = JSON.parse(localStorage.getItem('ytunes_battle_votes') || '{}'); votes[bt.id] = (votes[bt.id] || 0) + 1; localStorage.setItem('ytunes_battle_votes', JSON.stringify(votes)); toast('Vote saved for ' + bt.title); } }
    else if (act === 'friendmix') { var mix = st.liked.concat(st.recent).filter(function (x, idx, arr) { return arr.findIndex(function(y){return y.id===x.id;})===idx; }); if (mix.length) { var mixText = 'Our Ytunes friendship soundtrack:\n' + mix.slice(0,12).map(function(x){return x.title+' — '+x.artist;}).join('\n') + '\n' + window.location.href.split('#')[0]; window.location.href = 'https://wa.me/?text=' + encodeURIComponent(mixText); } else toast('Like or play a few songs first'); }
    else if (act === 'tier') {
      getJSON('api/admin/user-tier', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: el.getAttribute('data-id'), tier: el.getAttribute('data-tier') }) })
        .then(function(){ toast('Account tier updated'); loadAdmin(); }).catch(function(e){ toast(e.message || 'Could not update account'); });
    }
    else if (act === 'admin-section') { st.adminSection = el.getAttribute('data-section') || 'overview'; renderView(); }
    else if (act === 'maintenance') { adminPost({action:'maintenance',enabled:el.getAttribute('data-enabled')==='true'}); }
    else if (act === 'admin-remove') { adminPost({action:'remove-item',list:el.getAttribute('data-list'),id:el.getAttribute('data-id')}); }
    else if (act === 'logout') { stop(); getJSON('api/logout', { method: 'POST' }).catch(function () {}).then(function () { window.location.reload(); }); }
  });

  function adminPost(body) {
    getJSON('api/admin/workspace',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
      .then(function(){ toast('Admin changes saved'); loadAdmin(); })
      .catch(function(e){ toast(e.message || 'Could not save changes'); });
  }
  document.addEventListener('submit',function(e){
    var roomJoin=e.target.closest('#roomJoinForm'); if(roomJoin){e.preventDefault();connectRoom(new FormData(roomJoin).get('roomCode'));return;}
    var roomChat=e.target.closest('#roomChatForm'); if(roomChat){e.preventDefault();var msg=String(new FormData(roomChat).get('message')||'').trim();if(msg)roomPost('chat',{message:msg}).then(function(){roomChat.reset();}).catch(function(err){toast(err.message||'Could not send message');});return;}
    var roomCreate=e.target.closest('#roomCreateForm'); if(roomCreate){ e.preventDefault(); var rf=new FormData(roomCreate), when=rf.get('scheduledAt'); getJSON('api/rooms/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:rf.get('name'),genre:rf.get('genre'),isPublic:!!rf.get('isPublic'),scheduledAt:when?new Date(when).toISOString():null,track:rf.get('startNow')?track():null})}).then(function(r){ connectRoom(r.room.id); toast(r.room.scheduledAt ? 'Room scheduled' : 'Live room created'); }).catch(function(err){ toast(err.message || 'Could not create room'); }); return; }
    var moodForm=e.target.closest('#moodForm'); if (moodForm) { e.preventDefault(); var mood=new FormData(moodForm).get('mood'); getJSON('api/features/mood',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mood:mood})}).then(function(r){ if(r.tracks&&r.tracks.length){ st.tracks=r.tracks; st.list=r.tracks; st.status='ready'; st.tab='home'; document.querySelectorAll('.tab').forEach(function(x){x.classList.toggle('on',x.getAttribute('data-tab')==='home');}); renderView(); toast('Your mood mix is ready'); } else toast('No tracks found for that mood'); }).catch(function(e){toast(e.message||'Mood mix unavailable');}); return; }
    var form=e.target.closest('[data-admin-form]'); if(!form) return;
    e.preventDefault(); var data=Object.fromEntries(new FormData(form).entries()); data.action=form.getAttribute('data-admin-form');
    adminPost(data);
  });

  function loadAdmin() {
    st.adminError = '';
    Promise.all([getJSON('api/admin/summary'),getJSON('api/admin/workspace')]).then(function(data){ st.adminData = data[0]; st.adminWorkspace = data[1]; renderView(); })
      .catch(function(e){ st.adminError = e.message || 'Could not load admin data'; st.adminData = null; renderView(); });
  }

  function setTab(name) {
    st.tab = name;
    if (name === 'admin' && st.cfg.isAdmin) loadAdmin();
    var tabs = document.querySelectorAll('.tab');
    for (var i = 0; i < tabs.length; i++) tabs[i].className = 'tab' + (tabs[i].getAttribute('data-tab') === name ? ' on' : '');
    renderView(); window.scrollTo(0, 0);
  }
  var tabEls = document.querySelectorAll('.tab');
  for (var ti = 0; ti < tabEls.length; ti++) tabEls[ti].addEventListener('click', function () { setTab(this.getAttribute('data-tab')); });

  // search box: searches after a short pause, Enter searches straight away
  var qEl = $('#q');
  function runSearch() {
    var t = qEl.value.trim(); st.term = t;
    $('#clearQ').hidden = !qEl.value;
    if (t) { st.genre = 'All'; st.query = t; if (st.tab !== 'home') setTab('home'); load(t); }
    else { st.query = genreQuery(); load(st.query); }
  }
  qEl.addEventListener('input', function () { $('#clearQ').hidden = !qEl.value; clearTimeout(searchT); searchT = setTimeout(function () { if (qEl.value.trim() !== st.query) runSearch(); }, 550); });
  $('#searchForm').addEventListener('submit', function (e) { e.preventDefault(); clearTimeout(searchT); qEl.blur(); if (qEl.value.trim()) runSearch(); });
  $('#clearQ').addEventListener('click', function () { qEl.value = ''; runSearch(); });

  // mini player + full player buttons
  $('#miniOpen').addEventListener('click', function () { st.npOpen = true; refresh(); });
  $('#miniToggle').addEventListener('click', toggle);
  $('#miniNext').addEventListener('click', next);
  $('#npClose').addEventListener('click', function () { st.npOpen = false; refresh(); });
  $('#npStop').addEventListener('click', stop);
  $('#npLike').addEventListener('click', function () { toggleLike(track()); });
  $('#cPlay').addEventListener('click', toggle);
  $('#cNext').addEventListener('click', next);
  $('#cPrev').addEventListener('click', prev);
  $('#cRepeat').addEventListener('click', function () { st.repeat = st.repeat === 'off' ? 'all' : st.repeat === 'all' ? 'one' : 'off'; refresh(); });
  $('#cShuffle').addEventListener('click', function () { st.shuffle = !st.shuffle; refresh(); });
  $('#cQueue').addEventListener('click', function () { st.showQueue = !st.showQueue; refresh(); });
  $('#npBody').addEventListener('click', function (e) {
    var el = e.target; while (el && el !== this && !el.getAttribute('data-act')) el = el.parentNode;
    if (el && el !== this && el.getAttribute('data-act') === 'qplay') startAt(st.queue, Number(el.getAttribute('data-i')));
  });

  // waveform seeking (pointer events, with touch fallback for very old WebViews)
  var wave = $('#wave');
  function pctAt(x) { var r = wave.getBoundingClientRect(); return Math.max(0, Math.min(1, (x - r.left) / r.width)); }
  if (window.PointerEvent) {
    wave.addEventListener('pointerdown', function (e) { try { wave.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ } dragPct = pctAt(e.clientX); paintWave(); });
    wave.addEventListener('pointermove', function (e) { if (dragPct !== null) { dragPct = pctAt(e.clientX); paintWave(); } });
    wave.addEventListener('pointerup', function (e) { var p = pctAt(e.clientX); dragPct = null; if (st.dur) seek(p * st.dur); });
    wave.addEventListener('pointercancel', function () { dragPct = null; });
  } else {
    wave.addEventListener('touchstart', function (e) { dragPct = pctAt(e.touches[0].clientX); paintWave(); });
    wave.addEventListener('touchmove', function (e) { dragPct = pctAt(e.touches[0].clientX); paintWave(); });
    wave.addEventListener('touchend', function () { var p = dragPct; dragPct = null; if (st.dur && p !== null) seek(p * st.dur); });
  }
  wave.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') seek(st.cur + 5); if (e.key === 'ArrowLeft') seek(st.cur - 5); });

  // static icons
  $('#icoSearch').innerHTML = ICON.search; $('#clearQ').innerHTML = ICON.x;
  $('#npClose').innerHTML = ICON.down; $('#npStop').innerHTML = ICON.x;
  $('#cPrev').innerHTML = ICON.prev; $('#cNext').innerHTML = ICON.next; $('#cQueue').innerHTML = ICON.queue;
  $('#miniNext').innerHTML = ICON.next;
  var tis = document.querySelectorAll('.ti'); for (var k = 0; k < tis.length; k++) tis[k].innerHTML = ICON[tis[k].getAttribute('data-ico')];

  // ---------- start: who is this, and is sign-in needed? ----------
  var qs = ''; try { qs = new URLSearchParams(window.location.search).get('auth_error') || ''; } catch (e) { /* old browser */ }
  if (qs) { st.authError = qs; try { window.history.replaceState(null, '', window.location.pathname); } catch (e) { /* ignore */ } }
  Promise.all([getJSON('api/config').catch(function () { return null; }), getJSON('api/me').catch(function () { return null; })]).then(function (r) {
    if (r[0]) st.cfg = r[0];
    var adminTab = $('#adminTab'); if (adminTab) adminTab.hidden = !st.cfg.isAdmin;
    st.user = r[1] && r[1].user ? r[1].user : null;
    st.needLogin = !!st.cfg.requireLogin && !st.user;
    if (st.user) getJSON('api/listening/me').then(function(x){st.listenStats=x; if(st.tab==='profile')renderView();}).catch(function(){});
    if (st.needLogin) renderView(); else { load(''); var roomParam = new URLSearchParams(window.location.search).get('room'); if (roomParam) { st.tab='explore'; document.querySelectorAll('.tab').forEach(function(x){x.classList.toggle('on',x.getAttribute('data-tab')==='explore');}); connectRoom(roomParam); } }
  });
  if ('serviceWorker' in navigator) window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () { /* optional */ }); });
})();

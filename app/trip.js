  /* ================= مناطق الصيد في مصر · خطة رحلة اليوم · التتبع والسجل والاستغاثة =================
     يُدرج داخل app.js (نفس النطاق). يعتمد على: EG_SPOTS, EG_PRES, EG_MASK, GEAR, BYG, store, getLoc, mapHtml, MAPST, LMAP. */

  /* ---------- أدوات المسافة والاتجاه ---------- */
  const kmBetween = (a, b, c, d) => { const R = 6371, r = Math.PI / 180, x = Math.sin((c - a) * r / 2), y = Math.sin((d - b) * r / 2); return 2 * R * Math.asin(Math.sqrt(x * x + Math.cos(a * r) * Math.cos(c * r) * y * y)); };
  const DIR8 = ['شمال', 'شمال شرق', 'شرق', 'جنوب شرق', 'جنوب', 'جنوب غرب', 'غرب', 'شمال غرب'];
  const bearingTo = (a, b, c, d) => { const r = Math.PI / 180, y = Math.sin((d - b) * r) * Math.cos(c * r), x = Math.cos(a * r) * Math.sin(c * r) - Math.sin(a * r) * Math.cos(c * r) * Math.cos((d - b) * r); return (Math.atan2(y, x) / r + 360) % 360; };
  const fmtKm = k => k < 1 ? Math.round(k * 1000) + ' م' : k < 20 ? k.toFixed(1) + ' كم' : Math.round(k).toLocaleString('en') + ' كم';
  const travel = k => { const road = k * 1.3; if (k < 1.5) return 'حوالي ' + Math.max(1, Math.round(k / 5 * 60)) + ' دقيقة مشي'; const h = road / 65; return 'حوالي ' + (h < 1 ? Math.max(5, Math.round(h * 60)) + ' دقيقة' : (Math.round(h * 2) / 2).toString().replace('.5', '½') + ' ساعة') + ' بالعربية'; };
  const SPOT_T = { sh: 'شط رملي', rk: 'صخور وكاسرات', hb: 'رصيف ومينا', bt: 'قارب وأعماق', lk: 'بحيرة', rv: 'نهر وترع' };
  const WATER_L = { med: 'البحر المتوسط', red: 'البحر الأحمر وخليجا السويس والعقبة', fw: 'النيل والبحيرات والمياه الداخلية' };
  const SPOT = {}; EG_SPOTS.forEach(s => { SPOT[s[0]] = s; });
  const spotsByDist = loc => EG_SPOTS.map(s => ({ s, km: kmBetween(loc.lat, loc.lng, s[2], s[3]) })).sort((a, b) => a.km - b.km);
  const presOf = (spotId, spId) => { const r = (EG_PRES[spotId] || []).find(x => x[0] === spId); return r ? r[1] : 0; };
  const geoHref = (la, lo, name) => 'geo:' + la + ',' + lo + '?q=' + la + ',' + lo + '(' + encodeURIComponent(name) + ')';
  const routeHref = (loc, la, lo) => 'https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=' + loc.lat.toFixed(5) + ',' + loc.lng.toFixed(5) + ';' + la + ',' + lo;
  const osmHref = (la, lo) => 'https://www.openstreetmap.org/?mlat=' + (+la).toFixed(5) + '&mlon=' + (+lo).toFixed(5) + '#map=16/' + (+la).toFixed(5) + '/' + (+lo).toFixed(5);
  const spName = id => BYG[id] ? dispName(BYG[id]) : id;
  const spPhoto = s => deckPhoto(s) || img('sp_' + s.id);

  /* ---------- قناع مصر عالي الدقة (≈ 550 م) للخريطة المرسومة ---------- */
  let EGM = null;
  function egMask() {
    if (EGM !== null) return EGM;
    if (typeof EG_MASK === 'undefined') return (EGM = false);
    const M = EG_MASK, b = atob(M.d), g = new Uint8Array(M.w * M.h); let p = 0;
    for (let r = 0; r < M.h; r++) { let c = 0, cur = 0; while (c < M.w) { let n = 0, sh = 0, v; do { v = b.charCodeAt(p++); n |= (v & 127) << sh; sh += 7; } while (v & 128); if (cur) g.fill(1, r * M.w + c, r * M.w + c + n); c += n; cur ^= 1; } }
    return (EGM = { M, g });
  }
  function egVal(la, lo) {
    const E = egMask(); if (!E) return -1; const M = E.M;
    if (la < M.la0 || la >= M.la1 || lo < M.lo0 || lo >= M.lo1) return -1;
    const fy = (la - M.la0) / M.r - 0.5, fx = (lo - M.lo0) / M.r - 0.5, y0 = Math.max(0, Math.floor(fy)), x0 = Math.max(0, Math.floor(fx)), y1 = Math.min(M.h - 1, y0 + 1), x1 = Math.min(M.w - 1, x0 + 1), ty = Math.min(1, Math.max(0, fy - y0)), tx = Math.min(1, Math.max(0, fx - x0)), g = E.g, W = M.w;
    return (g[y0 * W + x0] * (1 - tx) + g[y0 * W + x1] * tx) * (1 - ty) + (g[y1 * W + x0] * (1 - tx) + g[y1 * W + x1] * tx) * ty;
  }
  const EGOC = {};
  const egObs = id => { if (typeof EG_OBS === 'undefined' || !EG_OBS[id]) return null; if (!EGOC[id]) { const b = atob(EG_OBS[id]), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); EGOC[id] = new Int16Array(u.buffer); } return EGOC[id]; };
  /* رسم أماكن الصيد المصرية فوق الخريطة المرسومة */
  function drawEgSpots(ctx, px, py, W, H, S, span, egsp) {
    const ob = egsp ? egObs(egsp) : null;
    if (ob) { ctx.fillStyle = '#FFE08A'; ctx.strokeStyle = 'rgba(6,32,44,.85)'; ctx.lineWidth = .8 * S; ctx.beginPath(); for (let q = 0; q < ob.length; q += 2) { const x = px(ob[q + 1] / 100), y = py(ob[q] / 100); if (x < 0 || x > W || y < 0 || y > H) continue; ctx.moveTo(x + 2 * S, y); ctx.arc(x, y, 2 * S, 0, 6.3); } ctx.fill(); ctx.stroke(); }
    ctx.font = (10.5 * S) + 'px "IBM Plex Sans Arabic",Tahoma,sans-serif'; ctx.textAlign = 'center';
    EG_SPOTS.forEach(s => {
      const x = px(s[3]), y = py(s[2]); if (x < -10 || x > W + 10 || y < -10 || y > H + 10) return;
      const pc = egsp ? presOf(s[0], egsp) : 0; if (egsp && !pc) { ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.arc(x, y, 2.2 * S, 0, 6.3); ctx.fill(); return; }
      if (egsp) { const Rk = s[4] === 'fw' ? 12 : 20, rp = Math.max(7 * S, Rk / (111 * span / W)); ctx.fillStyle = 'rgba(255,138,0,' + (0.22 + Math.min(0.45, pc / 50)) + ')'; ctx.strokeStyle = 'rgba(200,80,0,.8)'; ctx.lineWidth = 1 * S; ctx.beginPath(); ctx.arc(x, y, rp, 0, 6.3); ctx.fill(); ctx.stroke(); }
      const r = (egsp ? 2.2 : 3) * S;
      ctx.fillStyle = s[4] === 'fw' ? '#2bb3a3' : s[4] === 'red' ? '#e0675a' : '#3f8fdc'; ctx.strokeStyle = '#06202C'; ctx.lineWidth = 1.5 * S;
      ctx.beginPath(); ctx.arc(x, y, r, 0, 6.3); ctx.fill(); ctx.stroke();
      if (span <= 6) { const lab = egsp ? pc + '%' : s[1].split(' (')[0]; ctx.lineWidth = 3 * S; ctx.strokeStyle = 'rgba(6,32,44,.8)'; ctx.strokeText(lab, x, y - r - 3 * S); ctx.fillStyle = '#fff'; ctx.fillText(lab, x, y - r - 3 * S); }
    });
  }
  /* نفس الأماكن على خريطة Leaflet الحقيقية */
  function leafEgSpots(id) {
    const L2 = LMAP[id]; if (!L2) return; const wrap = $('.mapbox[data-mapid="' + id + '"]'); if (!wrap || !wrap.dataset.spots) return;
    (L2.spots || []).forEach(m => L2.map.removeLayer(m)); L2.spots = [];
    const egsp = wrap.dataset.egsp || '';
    EG_SPOTS.forEach(s => {
      const pc = egsp ? presOf(s[0], egsp) : 0; if (egsp && !pc) return;
      const m = L.circleMarker([s[2], s[3]], { radius: egsp ? 3 + Math.min(4, pc / 6) : 4, color: '#06202C', weight: 1, fillColor: s[4] === 'fw' ? '#2bb3a3' : s[4] === 'red' ? '#e0675a' : '#3f8fdc', fillOpacity: .95 }).addTo(L2.map);
      m.bindTooltip(s[1] + (egsp ? ' · ' + pc + '%' : ''), { direction: 'top' }); m.on('click', () => { location.hash = '#/egypt/' + s[0]; });
      L2.spots.push(m);
    });
    if (wrap.dataset.track) {
      const pts = (store.get('track', { pts: [] }).pts || []).map(p => [p[1], p[2]]);
      if (pts.length > 1) L2.spots.push(L.polyline(pts, { color: '#E8A800', weight: 4 }).addTo(L2.map));
      store.get('log', []).filter(c => c.la).forEach(c => { const mk = L.circleMarker([c.la, c.lo], { radius: 5, color: '#fff', weight: 2, fillColor: '#E8A800', fillOpacity: 1 }).addTo(L2.map); mk.bindTooltip(c.sp || 'صيدة'); L2.spots.push(mk); });
    }
  }

  /* ---------- صفحة مناطق الصيد في مصر ---------- */
  let egSp = '';
  V.egypt = function (a) {
    const loc = getLoc(), near = spotsByDist(loc), sel = a[0] && SPOT[a[0]];
    if (!MAPST['map-eg'] || sel) MAPST['map-eg'] = sel ? { lat: sel[2], lng: sel[3], span: 1.2 } : { lat: 27.4, lng: 30.8, span: 19 };
    const allSp = {}; Object.keys(EG_PRES).forEach(k => EG_PRES[k].forEach(r => { if (BYG[r[0]]) allSp[r[0]] = 1; }));
    const opts = Object.keys(allSp).sort((x, y) => spName(x).localeCompare(spName(y), 'ar'));
    const spotRow = (o, extra) => { const s = o.s; return '<a class="card spotrow" href="#/egypt/' + s[0] + '"><span class="dot w-' + s[4] + '"></span><div style="flex:1;min-width:0"><b>' + esc(s[1]) + '</b><div class="muted small">' + s[5].split(',').map(t => SPOT_T[t]).join(' · ') + (extra || '') + '</div></div><span class="num small">' + fmtKm(o.km) + '</span></a>'; };
    let body;
    if (sel) {
      const km = kmBetween(loc.lat, loc.lng, sel[2], sel[3]), br = bearingTo(loc.lat, loc.lng, sel[2], sel[3]), pres = EG_PRES[sel[0]] || [];
      body = '<section class="card stack"><div class="row between"><h2 class="h2" style="margin:0">' + esc(sel[1]) + '</h2><span class="tag w-' + sel[4] + '">' + esc(WATER_L[sel[4]]) + '</span></div>' +
        '<div class="chips">' + sel[5].split(',').map(t => '<span class="chip">' + SPOT_T[t] + '</span>').join('') + '</div><p style="margin:0">' + esc(sel[6]) + '</p>' +
        (/محمي/.test(sel[1] + sel[6]) ? '<div class="notice warn">منطقة محمية أو مقيدة: اتأكد من التصاريح قبل أي صيد.</div>' : '') +
        '<div class="kv"><dt>المسافة من موقعك</dt><dd><b>' + fmtKm(km) + '</b> ناحية ال' + DIR8[Math.round(br / 45) % 8] + ' · ' + travel(km) + '</dd><dt>الإحداثيات</dt><dd class="num">' + sel[2].toFixed(4) + '، ' + sel[3].toFixed(4) + '</dd></div>' +
        '<div class="chips"><a class="btn small" href="' + geoHref(sel[2], sel[3], sel[1]) + '">' + ico('pin', 16) + ' افتح في تطبيق الخرائط</a><a class="btn ghost small" target="_blank" rel="noopener" href="' + routeHref(loc, sel[2], sel[3]) + '">طريق الوصول بالعربية</a><a class="btn ghost small" href="#/trip?spot=' + sel[0] + '">خطة رحلة لهنا</a></div></section>' +
        '<section class="card stack"><h2 class="h2" style="margin:0">الأنواع ونسب تواجدها التقديرية</h2>' +
        '<div class="stack" style="gap:8px">' + pres.filter(r => BYG[r[0]]).map(r => { const s = BYG[r[0]]; return '<a class="presrow" href="#/sp/' + s.id + '"><img loading="lazy" alt="" src="' + spPhoto(s) + '"><div style="flex:1;min-width:0"><div class="row between"><b>' + esc(dispName(s)) + '</b><b class="num">' + r[1] + '%</b></div><div class="bar"><i style="width:' + Math.min(100, r[1] * 3) + '%"></i></div><div class="muted small">' + [r[3] ? 'مذكور هنا في ملف مساعد الصيد' : '', r[2] ? r[2] + ' مشاهدة موثقة في نطاق 25 كم' : ''].filter(Boolean).join(' · ') + '</div></div></a>'; }).join('') + '</div>' +
        '<div class="muted small">النسبة = نصيب النوع بين الأنواع المعروفة في المكان ده، محسوبة من ملاءمة المكان لبيئة النوع، والمشاهدات الحقيقية القريبة، وذكر المكان في ملف مساعد الصيد، وبيانات المصايد المعروفة للبحيرات والنيل. هي تقدير للتوجيه وبتتغير بالموسم.</div></section>' +
        '<h2 class="h2" style="margin:0">أماكن قريبة</h2><div class="stack" style="gap:8px">' + spotsByDist({ lat: sel[2], lng: sel[3] }).slice(1, 6).map(o => spotRow({ s: o.s, km: kmBetween(loc.lat, loc.lng, o.s[2], o.s[3]) })).join('') + '</div>';
    } else {
      const list = egSp ? near.filter(o => presOf(o.s[0], egSp)).sort((x, y) => (presOf(y.s[0], egSp) - presOf(x.s[0], egSp)) || (x.km - y.km)) : near;
      body = '<div class="field"><label for="egsp">ورّيني أماكن نوع معيّن ونسبته في كل مكان</label><select id="egsp"><option value="">— كل الأماكن —</option>' + opts.map(id => '<option value="' + id + '"' + (id === egSp ? ' selected' : '') + '>' + esc(spName(id)) + '</option>').join('') + '</select></div>' +
        '<div class="legend"><span><i style="background:#3f8fdc;border-radius:50%"></i>المتوسط</span><span><i style="background:#e0675a;border-radius:50%"></i>الأحمر</span><span><i style="background:#2bb3a3;border-radius:50%"></i>نيل وبحيرات</span></div>' +
        '<h2 class="h2" style="margin:0">' + (egSp ? 'أماكن ' + esc(spName(egSp)) + ' (الأعلى نسبة ثم الأقرب)' : 'الأماكن من الأقرب لموقعك') + '</h2><div class="stack" style="gap:8px">' +
        list.map(o => spotRow(o, egSp ? ' · <b>' + presOf(o.s[0], egSp) + '%</b>' : '')).join('') + '</div>';
    }
    return '<div class="stack-lg"><div class="row between"><div><div class="eyebrow">' + EG_SPOTS.length + ' مكان على السواحل والنيل والبحيرات</div><h1 class="h1">مناطق الصيد في مصر</h1></div>' + (sel ? '<a class="btn ghost small" href="#/egypt">كل الأماكن</a>' : '') + '</div>' +
      mapHtml('map-eg', { span: MAPST['map-eg'].span, h: 380, sp: sel ? '' : egSp }).replace('class="mapbox"', 'class="mapbox" data-spots="1" data-egsp="' + (sel ? '' : egSp) + '"') +
      '<div class="muted small">الخريطة المرسومة بدون إنترنت لمصر بدقة نحو 550 م (سواحل وبحيرات ومجرى النيل)، ومع الإنترنت بتظهر خريطة الشوارع والقمر الصناعي بتفاصيل لحد عشرات الأمتار. اضغط على أي نقطة تفتح المكان.</div>' + body + '</div>';
  };

  /* ---------- خطة رحلة اليوم ---------- */
  const HOW_GEAR = { cast: ['rod', 'reel', 'line', 'leader', 'wobbler', 'spoons'], bot: ['rod', 'reel', 'sinker', 'hook', 'swivel', 'leader', 'rodpod'], float: ['float', 'hook', 'line', 'sinker'], troll: ['boat', 'wobbler', 'leader', 'reel'], jig: ['jighead', 'spoons', 'reel', 'line'], pop: ['stickbait', 'rod', 'reel', 'leader'], live: ['hook', 'float', 'swivel', 'leader', 'net'], sabiki: ['sabiki', 'sinker'], spear: ['speargun', 'polespear'], castnet: ['castnet'], gillnet: ['gillnet'], seine: ['gillnet'], trawl: ['gillnet'], trap: ['basket', 'crabpot'], hand: ['line', 'hook', 'sinker'], night: ['headlamp'], drift: ['hook', 'sinker', 'swivel'], chum: ['pots'], fly: ['rod', 'reel'] };
  const gearLink = id => { const g = GEAR.find(x => x.id === id); return g ? '<a class="chip" href="#/gear/' + id + '">' + esc(g.t.split(' (')[0]) + '</a>' : ''; };
  V.trip = function (a, qs) {
    const loc = getLoc(), di = dayInfo(loc), regs = regionsAt(loc), plan = store.get('trip', { sp: [] });
    if (qs.add && BYG[qs.add] && plan.sp.indexOf(qs.add) < 0) { plan.sp.push(qs.add); store.set('trip', plan); }
    if (qs.spot && SPOT[qs.spot]) { plan.spot = qs.spot; if (!plan.sp.length) plan.sp = (EG_PRES[qs.spot] || []).filter(r => BYG[r[0]]).slice(0, 3).map(r => r[0]); store.set('trip', plan); }
    const near = spotsByDist(loc), nearSp = {}; near.slice(0, 4).forEach(o => (EG_PRES[o.s[0]] || []).slice(0, 6).forEach(r => { if (BYG[r[0]]) nearSp[r[0]] = (nearSp[r[0]] || 0) + r[1]; }));
    const suggest = Object.keys(nearSp).sort((x, y) => nearSp[y] - nearSp[x]).filter(id => plan.sp.indexOf(id) < 0).slice(0, 10);
    const sorted = SG.slice().sort((x, y) => x.ar.localeCompare(y.ar, 'ar'));
    const cards = plan.sp.filter(id => BYG[id]).map(id => {
      const s = BYG[id], ms = monthScores(s, loc, { m: regs.m, f: regs.f }, null), lv = ms ? ms[CUR] : 0, ws = windows(s, di);
      const baits = listNames(s.bt, BAIT), hows = (s.how || '').split(',').filter(Boolean), gear = {}; hows.forEach(h => (HOW_GEAR[h] || []).forEach(g => { gear[g] = 1; }));
      const sp = near.filter(o => presOf(o.s[0], id)).slice(0, 4);
      return '<article class="card stack tripcard"><div class="row" style="gap:10px;flex-wrap:nowrap"><img class="tripimg" alt="" src="' + spPhoto(s) + '"><div style="flex:1;min-width:0"><div class="row between"><h3 class="h3" style="margin:0"><a href="#/sp/' + id + '">' + esc(dispName(s)) + '</a></h3><button class="btn ghost small" data-act="tripdel" data-id="' + id + '" aria-label="شيل">✕</button></div>' +
        '<span class="tag ' + SC_CLS[lv] + '">' + (ms ? SC_L[lv] + ' الشهر ده' : 'مش مسجّل في منطقتك') + '</span></div></div>' +
        '<dl class="kv" style="margin:0"><dt>أحسن وقت النهارده</dt><dd>' + (winHtml(ws, di.sun) || esc(todText(s))) + '</dd><dt>الطُّعم المناسب</dt><dd>' + esc(baits.join('، ') || '—') + '</dd><dt>الطريقة</dt><dd>' + esc(listNames(s.how, HOW).join('، ') || '—') + '</dd>' + (s.sz ? '<dt>الحجم المعتاد</dt><dd>' + esc(s.sz) + '</dd>' : '') + '</dl>' +
        '<div class="stack" style="gap:6px"><b class="small">العدة اللي تاخدها</b><div class="chips">' + Object.keys(gear).map(gearLink).join('') + '</div></div>' +
        (sp.length ? '<div class="stack" style="gap:6px"><b class="small">أماكن تواجده الأقرب لك</b>' + sp.map((o, i) => '<a class="spotrow card" href="#/egypt/' + o.s[0] + '"><span class="dot w-' + o.s[4] + '"></span><div style="flex:1;min-width:0"><b>' + esc(o.s[1]) + '</b><div class="muted small">' + presOf(o.s[0], id) + '% · ' + travel(o.km) + '</div></div><span class="num small">' + fmtKm(o.km) + '</span></a>' + (i === 0 ? '<div class="chips"><a class="btn small" href="' + geoHref(o.s[2], o.s[3], o.s[1]) + '">' + ico('pin', 16) + ' روح لأقرب مكان</a><a class="btn ghost small" target="_blank" rel="noopener" href="' + routeHref(loc, o.s[2], o.s[3]) + '">طريق الوصول</a></div>' : '')).join('') + '</div>' : '<div class="muted small">مالوش مكان مسجّل في مصر في الدليل؛ شوف خريطة انتشاره في صفحته.</div>') + '</article>';
    });
    /* أفضل مكان يجمع كل اختياراتك: مجموع النسب مع خصم بسيط للبعد */
    let best = '';
    if (plan.sp.length) {
      const sc = near.map(o => ({ o, v: plan.sp.reduce((t, id) => t + presOf(o.s[0], id), 0) })).filter(x => x.v > 0).map(x => ({ o: x.o, v: x.v, k: x.v / (1 + x.o.km / 120) })).sort((x, y) => y.k - x.k).slice(0, 3);
      if (sc.length) best = '<section class="card stack"><h2 class="h2" style="margin:0">أنسب مكان لاختياراتك</h2>' + sc.map(x => '<a class="spotrow card" href="#/egypt/' + x.o.s[0] + '"><span class="dot w-' + x.o.s[4] + '"></span><div style="flex:1;min-width:0"><b>' + esc(x.o.s[1]) + '</b><div class="muted small">' + plan.sp.filter(id => presOf(x.o.s[0], id)).map(id => esc(spName(id)) + ' ' + presOf(x.o.s[0], id) + '%').join(' · ') + '</div></div><span class="num small">' + fmtKm(x.o.km) + '</span></a>').join('') + '</section>';
    }
    return '<div class="stack-lg"><div><div class="eyebrow">' + esc(loc.name) + ' · ' + NOW.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' }) + '</div><h1 class="h1">خطة رحلة اليوم</h1></div>' +
      '<section class="card stack"><h2 class="h2" style="margin:0">ناوي تصطاد إيه؟</h2>' +
      (suggest.length ? '<div class="muted small">مقترحات من الأماكن القريبة منك:</div><div class="chips">' + suggest.map(id => '<a class="chip" href="#/trip?add=' + id + '">+ ' + esc(spName(id)) + '</a>').join('') + '</div>' : '') +
      '<div class="field"><label for="tripadd">أو اختار أي نوع</label><select id="tripadd"><option value="">— اختار —</option>' + sorted.map(s => '<option value="' + s.id + '">' + esc(s.ar) + '</option>').join('') + '</select></div></section>' +
      (cards.length ? best + cards.join('') + '<div class="chips"><a class="btn" href="#/track">ابدأ الرحلة وسجّل المسار</a><button class="btn ghost" data-act="tripshare">شارك الخطة</button><button class="btn ghost" data-act="tripclear">امسح الخطة</button></div>' : '<div class="notice info">اختار نوع أو أكتر وهتلاقي لكل نوع: أحسن وقت النهارده، والطُّعم، والعدة، وأقرب مكان ليه والمسافة وطريق الوصول.</div>') + '</div>';
  };
  function tripText() {
    const loc = getLoc(), plan = store.get('trip', { sp: [] }), near = spotsByDist(loc);
    return '🎣 خطة رحلة صيد — ' + NOW.toLocaleDateString('ar-EG') + '\n' + plan.sp.filter(id => BYG[id]).map(id => { const s = BYG[id], o = near.find(x => presOf(x.s[0], id)); return '• ' + dispName(s) + ': طُعم ' + listNames(s.bt, BAIT).slice(0, 3).join('، ') + (o ? ' — ' + o.s[1] + ' (' + fmtKm(o.km) + ') ' + osmHref(o.s[2], o.s[3]) : ''); }).join('\n') + '\n— من تطبيق الصنّارة';
  }

  /* ---------- التتبع وسجل الصيد بالمكان والمشاركة والاستغاثة ---------- */
  const TRK = { watch: null, lock: null, last: null };
  const curTrack = () => store.get('track', { on: false, pts: [] });
  const trackKm = pts => { let d = 0; for (let i = 1; i < pts.length; i++) d += kmBetween(pts[i - 1][1], pts[i - 1][2], pts[i][1], pts[i][2]); return d; };
  function trackStart() {
    if (!navigator.geolocation) { toast('الجهاز ده مش بيدعم تحديد الموقع.'); return; }
    const t = curTrack(); if (!t.on) { t.on = true; t.start = Date.now(); t.pts = []; store.set('track', t); }
    TRK.watch = navigator.geolocation.watchPosition(p => {
      const c = p.coords, tr = curTrack(), last = tr.pts[tr.pts.length - 1];
      TRK.last = { la: c.latitude, lo: c.longitude, acc: c.accuracy, t: Date.now() };
      if (!last || kmBetween(last[1], last[2], c.latitude, c.longitude) > 0.02 || Date.now() - last[0] > 120000) { tr.pts.push([Date.now(), +c.latitude.toFixed(6), +c.longitude.toFixed(6), Math.round(c.accuracy)]); store.set('track', tr); }
      const st = $('#trkstat'); if (st) st.innerHTML = trackStat();
    }, e => toast('مش قادر أحدد موقعك: ' + (e.code === 1 ? 'اسمح للتطبيق بالموقع من إعدادات المتصفح.' : 'جرّب في مكان مفتوح.')), { enableHighAccuracy: true, maximumAge: 10000, timeout: 30000 });
    try { if (navigator.wakeLock) navigator.wakeLock.request('screen').then(l => { TRK.lock = l; }).catch(() => {}); } catch (e) {}
  }
  function trackStop() {
    if (TRK.watch != null) navigator.geolocation.clearWatch(TRK.watch); TRK.watch = null;
    try { if (TRK.lock) TRK.lock.release(); } catch (e) {} TRK.lock = null;
    const t = curTrack(); if (t.on) { t.on = false; t.end = Date.now(); const trips = store.get('trips', []); if (t.pts.length) trips.unshift({ start: t.start, end: t.end, pts: t.pts }); store.set('trips', trips.slice(0, 30)); store.set('track', t); }
  }
  const trackStat = () => { const t = curTrack(), p = t.pts, last = TRK.last || (p.length ? { la: p[p.length - 1][1], lo: p[p.length - 1][2], acc: p[p.length - 1][3] } : null);
    return '<div class="now"><div><b class="num">' + (t.start ? Math.round(((t.end && !t.on ? t.end : Date.now()) - t.start) / 60000) : 0) + '</b><span>دقيقة</span></div><div><b class="num">' + fmtKm(trackKm(p)) + '</b><span>المسافة</span></div><div><b class="num">' + p.length + '</b><span>نقطة</span></div></div>' +
      (last ? '<div class="muted small num">آخر موقع: ' + last.la.toFixed(5) + '، ' + last.lo.toFixed(5) + (last.acc ? ' (± ' + Math.round(last.acc) + ' م)' : '') + '</div>' : ''); };
  const getHere = () => new Promise((ok, no) => { if (TRK.last && Date.now() - TRK.last.t < 60000) return ok(TRK.last); if (!navigator.geolocation) return no(new Error('geo')); navigator.geolocation.getCurrentPosition(p => ok({ la: p.coords.latitude, lo: p.coords.longitude, acc: p.coords.accuracy, t: Date.now() }), no, { enableHighAccuracy: true, timeout: 20000, maximumAge: 30000 }); });
  const gpx = pts => '<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="Sayad" xmlns="http://www.topografix.com/GPX/1/1"><trk><name>رحلة صيد</name><trkseg>' + pts.map(p => '<trkpt lat="' + p[1] + '" lon="' + p[2] + '"><time>' + new Date(p[0]).toISOString() + '</time></trkpt>').join('') + '</trkseg></trk>' +
    store.get('log', []).filter(c => c.la).map(c => '<wpt lat="' + c.la + '" lon="' + c.lo + '"><name>' + esc(c.sp || 'صيدة') + '</name></wpt>').join('') + '</gpx>';
  const shareText = async (title, text) => { try { if (navigator.share) { await navigator.share({ title, text }); return; } } catch (e) { if (e && e.name === 'AbortError') return; } try { await navigator.clipboard.writeText(text); toast('اتنسخ النص، الصقه في أي رسالة.'); } catch (e) { prompt('انسخ النص ده:', text); } };
  /* جهات الطوارئ (حتى 5) */
  const sosList = () => store.get('sos', []);
  async function sosPick() {
    try {
      if (!('contacts' in navigator) || !navigator.contacts.select) { toast('الجهاز ده مش بيسمح باختيار جهات الاتصال من المتصفح؛ اكتب الرقم بإيدك.'); return; }
      const res = await navigator.contacts.select(['name', 'tel'], { multiple: true }), L = sosList();
      res.forEach(c => { if (L.length < 5 && c.tel && c.tel[0]) L.push({ n: (c.name && c.name[0]) || '', t: c.tel[0].replace(/[^\d+]/g, '') }); });
      store.set('sos', L.slice(0, 5)); render();
    } catch (e) {}
  }
  const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent);
  async function sosSend() {
    const L = sosList(); let pos = null; try { pos = await getHere(); } catch (e) {}
    const me = store.get('myname', '');
    const msg = '🆘 استغاثة' + (me ? ' من ' + me : '') + ': محتاج مساعدة في رحلة صيد.\n' + (pos ? 'موقعي: ' + pos.la.toFixed(5) + '، ' + pos.lo.toFixed(5) + ' (± ' + Math.round(pos.acc || 0) + ' م)\n' + osmHref(pos.la, pos.lo) : 'الموقع غير متاح، آخر مكان معروف: ' + getLoc().name) + '\nالوقت: ' + new Date().toLocaleString('ar-EG');
    if (!L.length) { toast('ضيف رقم واحد على الأقل لجهات الطوارئ.'); return shareText('استغاثة', msg); }
    location.href = 'sms:' + L.map(c => c.t).join(',') + (isIOS ? '&' : '?') + 'body=' + encodeURIComponent(msg);
  }
  V.track = function () {
    const t = curTrack(), log = store.get('log', []).filter(c => c.la), L = sosList(), trips = store.get('trips', []);
    if (t.on && TRK.watch == null) setTimeout(trackStart, 0);
    if (!MAPST['map-trk']) { const p = t.pts[t.pts.length - 1], lc = getLoc(); MAPST['map-trk'] = { lat: p ? p[1] : lc.lat, lng: p ? p[2] : lc.lng, span: 0.6 }; }
    /* أماكني الأفضل: تجميع الصيدات المسجلة بالموقع في خلايا ≈ 500 م */
    const cells = {}; log.forEach(c => { const k = (Math.round(c.la * 200) / 200).toFixed(3) + ',' + (Math.round(c.lo * 200) / 200).toFixed(3); (cells[k] = cells[k] || { la: c.la, lo: c.lo, n: 0, sp: {} }).n++; cells[k].sp[c.sp || '؟'] = 1; });
    const mySpots = Object.values(cells).sort((x, y) => y.n - x.n).slice(0, 6);
    return '<div class="stack-lg"><div><div class="eyebrow">تسجيل · مشاركة · أمان</div><h1 class="h1">رحلتي</h1></div>' +
      '<section class="card stack sosbox"><div class="row between"><h2 class="h2" style="margin:0">طوارئ</h2><span class="muted small">' + L.length + ' / 5 أرقام</span></div>' +
      '<button class="btn sosbtn" data-act="sos">🆘 نداء استغاثة بموقعي</button>' +
      '<div class="muted small">بيفتح رسالة SMS جاهزة فيها موقعك الحالي لكل جهات الطوارئ، وانت تدوس إرسال. ممكن تتصل كمان:</div>' +
      '<div class="chips"><a class="chip" href="tel:122">الشرطة 122</a><a class="chip" href="tel:123">الإسعاف 123</a><a class="chip" href="tel:180">المطافي 180</a><a class="chip" href="tel:112">الطوارئ الدولي 112</a>' + L.map(c => '<a class="chip" href="tel:' + esc(c.t) + '">' + esc(c.n || c.t) + '</a>').join('') + '</div>' +
      '<details class="acc"><summary><span>جهات الطوارئ (حتى 5 أرقام)</span></summary><div class="body stack">' +
      (L.length ? L.map((c, i) => '<div class="row between"><span>' + esc(c.n || '—') + ' <span class="num muted">' + esc(c.t) + '</span></span><button class="btn ghost small" data-act="sosdel" data-i="' + i + '">شيل</button></div>').join('') : '<div class="muted small">لسه مفيش أرقام.</div>') +
      (L.length < 5 ? '<button class="btn ghost small" data-act="sospick">اختار من جهات الاتصال</button><form class="row" data-form="sosadd" style="gap:6px"><input id="sosn" placeholder="الاسم" style="flex:1;min-width:0"><input id="sost" placeholder="الرقم" inputmode="tel" required style="flex:1;min-width:0"><button class="btn small" type="submit">ضيف</button></form>' : '') +
      '<div class="field"><label for="myname">اسمك (بيظهر في رسالة الاستغاثة)</label><input id="myname" value="' + esc(store.get('myname', '')) + '"></div>' +
      '<div class="muted small">الأرقام محفوظة على جهازك بس، ومابتتبعتش لأي حد إلا لما انت تبعت الرسالة.</div></div></details></section>' +
      '<section class="card stack"><div class="row between"><h2 class="h2" style="margin:0">تتبع خط السير</h2>' + (t.on ? '<span class="tag ok">شغّال</span>' : '') + '</div>' +
      '<div id="trkstat">' + trackStat() + '</div>' +
      '<div class="chips">' + (t.on ? '<button class="btn" data-act="trkstop">إيقاف وحفظ الرحلة</button>' : '<button class="btn" data-act="trkstart">ابدأ التتبع</button>') + '<button class="btn ghost" data-act="trkshare">شارك موقعي الآن</button>' + (t.pts.length ? '<button class="btn ghost" data-act="trkgpx">نزّل خط السير (GPX)</button>' : '') + '</div>' +
      '<div class="muted small">التتبع بيشتغل طول ما التطبيق مفتوح والشاشة شغالة (بنحاول نمنع الشاشة تقفل). المتابعة اللحظية من جهاز تاني محتاجة سيرفر مش موجود في التطبيق، فبدلها ابعت موقعك كل شوية بزرار «شارك موقعي الآن» أو ابعت خط السير كله في الآخر.</div></section>' +
      mapHtml('map-trk', { span: MAPST['map-trk'].span, h: 300 }).replace('class="mapbox"', 'class="mapbox" data-spots="1" data-track="1"') +
      badgesHtml() +
      '<section class="card stack"><h2 class="h2" style="margin:0">سجّل صيدة هنا</h2><form class="stack" data-form="catchhere" style="gap:8px"><div class="field"><label for="chsp">السمكة</label><input id="chsp" list="spl2" required placeholder="اختار أو اكتب"><datalist id="spl2">' + SG.map(s => '<option value="' + esc(s.ar) + '">').join('') + '</datalist></div>' +
      '<div class="grid2"><div class="field"><label for="chlen">الطول (سم)</label><input id="chlen" inputmode="decimal"></div><div class="field"><label for="chbt">الطُّعم</label><input id="chbt"></div></div><button class="btn" type="submit">سجّل بموقعي الحالي</button></form></section>' +
      (mySpots.length ? '<section class="card stack"><h2 class="h2" style="margin:0">أماكني الأنجح</h2>' + mySpots.map(c => '<div class="row between"><span>' + Object.keys(c.sp).slice(0, 4).map(esc).join('، ') + '</span><span class="row" style="gap:6px"><b class="num">' + c.n + '</b><a class="btn ghost small" href="' + geoHref(c.la.toFixed(5), c.lo.toFixed(5), 'مكان صيد') + '">افتح</a></span></div>').join('') + '</section>' : '') +
      (trips.length ? '<section class="card stack"><h2 class="h2" style="margin:0">رحلات سابقة</h2>' + trips.slice(0, 5).map(tr => '<div class="row between"><span class="num">' + new Date(tr.start).toLocaleString('ar-EG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + '</span><span class="num muted">' + fmtKm(trackKm(tr.pts)) + ' · ' + Math.round((tr.end - tr.start) / 60000) + ' د</span></div>').join('') + '</section>' : '') +
      '<a class="btn ghost" href="#/tools?t=log">السجل الكامل</a></div>';
  };
  /* أحداث الصفحات الجديدة */
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-act]'); if (!t) return; const act = t.dataset.act;
    if (act === 'tripdel') { const p = store.get('trip', { sp: [] }); p.sp = p.sp.filter(x => x !== t.dataset.id); store.set('trip', p); render(); }
    else if (act === 'tripclear') { store.set('trip', { sp: [] }); render(); }
    else if (act === 'tripshare') shareText('خطة رحلة صيد', tripText());
    else if (act === 'trkstart') { trackStart(); render(); }
    else if (act === 'trkstop') { trackStop(); render(); toast('اتحفظت الرحلة.'); }
    else if (act === 'trkshare') { getHere().then(p => shareText('موقعي', '📍 موقعي دلوقتي في رحلة الصيد: ' + p.la.toFixed(5) + '، ' + p.lo.toFixed(5) + ' (± ' + Math.round(p.acc || 0) + ' م)\n' + osmHref(p.la, p.lo) + '\n' + new Date().toLocaleString('ar-EG'))).catch(() => toast('مش قادر أحدد موقعك دلوقتي.')); }
    else if (act === 'trkgpx') { const b = new Blob([gpx(curTrack().pts)], { type: 'application/gpx+xml' }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'rehla-' + new Date().toISOString().slice(0, 10) + '.gpx'; document.body.appendChild(a); a.click(); a.remove(); }
    else if (act === 'sos') sosSend();
    else if (act === 'sospick') sosPick();
    else if (act === 'sosdel') { const L = sosList(); L.splice(+t.dataset.i, 1); store.set('sos', L); render(); }
  });
  document.addEventListener('change', e => {
    if (e.target.id === 'egsp') { egSp = e.target.value; render(); }
    if (e.target.id === 'tripadd' && e.target.value) { location.hash = '#/trip?add=' + e.target.value; }
    if (e.target.id === 'myname') store.set('myname', e.target.value.trim());
  });
  document.addEventListener('submit', e => {
    const f = e.target.closest('form'); if (!f) return; const k = f.dataset.form;
    if (k === 'sosadd') { e.preventDefault(); const L = sosList(), n = $('#sosn').value.trim(), tl = $('#sost').value.replace(/[^\d+]/g, ''); if (tl && L.length < 5) { L.push({ n, t: tl }); store.set('sos', L); render(); } }
    if (k === 'catchhere') { e.preventDefault(); const sp = $('#chsp').value.trim(), len = $('#chlen').value.trim(), bt = $('#chbt').value.trim();
      getHere().then(p => { const L = store.get('log', []); L.unshift({ sp, len, bait: bt, at: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16), la: +p.la.toFixed(6), lo: +p.lo.toFixed(6), place: p.la.toFixed(4) + '، ' + p.lo.toFixed(4) }); store.set('log', L); toast('اتسجلت الصيدة بمكانها.'); render(); })
        .catch(() => toast('مش قادر أحدد موقعك؛ سجّلها من «سجل الصيد».')); }
  }, true);

  /* ---------- توزيع النوع داخل مصر بخلايا ≈ 550 م حول أماكن تواجده (للخرائط المرسومة وLeaflet) ---------- */
  const EGD = {};
  function egDist(id) {
    if (id in EGD) return EGD[id];
    const E = egMask(); if (!E || typeof EG_PRES === 'undefined') return (EGD[id] = null);
    const M = E.M, W = M.w, H = M.h, v = new Float32Array(W * H); let any = 0, r0 = H, r1 = 0, c0 = W, c1 = 0;
    EG_SPOTS.forEach(s => {
      const p = presOf(s[0], id); if (!p) return;
      const R = s[4] === 'fw' ? 12 : 20, cl = Math.cos(s[2] * Math.PI / 180), cr = Math.round((s[2] - M.la0) / M.r), cc = Math.round((s[3] - M.lo0) / M.r);
      const nr = Math.ceil(R / 111 / M.r), nc = Math.ceil(R / (111 * cl) / M.r), base = Math.min(1, 0.25 + p / 22);
      for (let r = Math.max(0, cr - nr); r <= Math.min(H - 1, cr + nr); r++) for (let c = Math.max(0, cc - nc); c <= Math.min(W - 1, cc + nc); c++) {
        const k = r * W + c; if (E.g[k]) continue;
        const d = Math.hypot((r - cr) * M.r * 111, (c - cc) * M.r * 111 * cl); if (d > R) continue;
        const w = base * (1 - 0.65 * d / R); if (w > v[k]) { v[k] = w; any = 1; if (r < r0) r0 = r; if (r > r1) r1 = r; if (c < c0) c0 = c; if (c > c1) c1 = c; }
      }
    });
    return (EGD[id] = any ? { v, r0, r1, c0, c1 } : null);
  }
  const egCell = (la, lo) => { const E = egMask(); if (!E) return -1; const M = E.M, r = Math.floor((la - M.la0) / M.r), c = Math.floor((lo - M.lo0) / M.r); return r < 0 || c < 0 || r >= M.h || c >= M.w ? -1 : r * M.w + c; };
  /* طبقة Leaflet: صورة شفافة بخلايا التوزيع + نسبة كل مكان */
  function leafEgDist(L2, id) {
    const ob = egObs(id); if (ob && typeof L !== 'undefined') { if (!L2.rend) L2.rend = L.canvas({ padding: .3 }); for (let q = 0; q < ob.length; q += 2) L2.rects.push(L.circleMarker([ob[q] / 100, ob[q + 1] / 100], { renderer: L2.rend, radius: 2.5, color: '#06202C', weight: .8, fillColor: '#FFE08A', fillOpacity: 1, interactive: false }).addTo(L2.map)); }
    const D = egDist(id); if (!D || typeof L === 'undefined') return;
    const M = egMask().M, w = D.c1 - D.c0 + 1, h = D.r1 - D.r0 + 1, cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const x = cv.getContext('2d'), im = x.createImageData(w, h);
    for (let r = D.r0; r <= D.r1; r++) for (let c = D.c0; c <= D.c1; c++) { const q = D.v[r * M.w + c]; if (!q) continue; const o = ((D.r1 - r) * w + (c - D.c0)) * 4; im.data[o] = 255; im.data[o + 1] = Math.round(150 - 90 * q); im.data[o + 2] = 0; im.data[o + 3] = Math.round(70 + 170 * q); }
    x.putImageData(im, 0, 0);
    const b = [[M.la0 + D.r0 * M.r, M.lo0 + D.c0 * M.r], [M.la0 + (D.r1 + 1) * M.r, M.lo0 + (D.c1 + 1) * M.r]];
    L2.rects.push(L.imageOverlay(cv.toDataURL(), b, { interactive: false, className: 'pixelated' }).addTo(L2.map));
    EG_SPOTS.forEach(s => { const p = presOf(s[0], id); if (!p) return; const m = L.circleMarker([s[2], s[3]], { radius: 3, color: '#7a2a00', weight: 1, fillColor: '#ff8a00', fillOpacity: 1 }).addTo(L2.map); m.bindTooltip(s[1].split(' (')[0] + ' · ' + p + '%', { direction: 'top' }); m.on('click', () => { location.hash = '#/egypt/' + s[0]; }); L2.rects.push(m); });
  }
  /* دبوس الموقع الرفيع الأحمر (Leaflet) */
  const pinIcon = () => L.divIcon({ className: 'mypin', html: '<svg width="18" height="34" viewBox="0 0 18 34"><path d="M9 33V13" stroke="#8b0000" stroke-width="2.4" stroke-linecap="round"/><circle cx="9" cy="8" r="6.5" fill="#e11d1d" stroke="#fff" stroke-width="2"/></svg>', iconSize: [18, 34], iconAnchor: [9, 33] });
  /* أماكن النوع في مصر تحت خريطته */
  function egSpHtml(id) {
    if (typeof EG_PRES === 'undefined') return '';
    const loc = getLoc(), L = EG_SPOTS.map(s => ({ s, p: presOf(s[0], id), km: kmBetween(loc.lat, loc.lng, s[2], s[3]) })).filter(x => x.p).sort((a, b) => b.p - a.p);
    if (!L.length) return '<div class="muted small">مش مسجّل في أماكن الصيد المعروفة في مصر.</div>';
    { const la = L.map(x => x.s[2]), lo = L.map(x => x.s[3]), a0 = Math.min.apply(0, la), a1 = Math.max.apply(0, la), o0 = Math.min.apply(0, lo), o1 = Math.max.apply(0, lo);
      MAPST['map-spe'] = { lat: (a0 + a1) / 2, lng: (o0 + o1) / 2, span: Math.max(2.5, Math.min(16, Math.max((o1 - o0) * 1.5, (a1 - a0) * 1.9))) }; }
    return '<div class="stack" style="gap:6px"><h3 class="h3" style="margin:8px 0 0">خريطة تواجده داخل مصر · ' + L.length + ' مكان</h3>' +
      mapHtml('map-spe', { sp: id, span: MAPST['map-spe'].span, h: 380 }) +
      '<div class="legend"><span><i style="background:#ff8a00"></i>منطقة تواجد (الأغمق = نسبة أعلى)</span><span><i style="background:#FFE08A;border-radius:50%"></i>مشاهدة حقيقية موثقة داخل مصر (≈ 1 كم)</span><span><i style="background:#e11d1d;border-radius:50%"></i>موقعك</span></div><div class="chips">' +
      L.slice(0, 12).map(x => '<a class="chip" href="#/egypt/' + x.s[0] + '"><span class="dot w-' + x.s[4] + '" style="width:9px;height:9px"></span> ' + esc(x.s[1].split(' (')[0]) + ' <b class="num">' + x.p + '%</b></a>').join('') + '</div></div>';
  }
  /* ---------- أسماك البحر والنهر ---------- */
  const bothCard = b => { const ids = b.ids || [b.id], s = BYG[b.id];
    return '<article class="card stack bothcard"><div class="row" style="gap:10px;flex-wrap:nowrap">' + (s ? '<img class="tripimg" alt="" src="' + spPhoto(s) + '">' : '') + '<div style="flex:1;min-width:0"><h3 class="h3" style="margin:0">' + esc(b.t) + '</h3><div class="muted small">' + esc(BOTH_TYPE[b.type]) + '</div>' +
      '<div class="chips" style="margin-top:6px">' + ids.filter(i => BYG[i]).map(i => '<a class="chip" href="#/sp/' + i + '">' + esc(dispName(BYG[i])) + '</a>').join('') + '</div></div></div>' +
      '<div class="both2"><div><b>🌊 في البحر</b><p>' + esc(b.sea) + '</p></div><div><b>🏞️ في النهر والبحيرات</b><p>' + esc(b.fresh) + '</p></div></div>' +
      '<dl class="kv" style="margin:0"><dt>الطعم</dt><dd>' + esc(b.taste) + '</dd><dt>طرق الصيد</dt><dd>' + esc(b.fish) + '</dd></dl></article>'; };
  V.both = function () {
    return '<div class="stack-lg"><div><div class="eyebrow">مالح وعذب</div><h1 class="h1">أسماك البحر والنهر</h1></div>' +
      '<p class="muted" style="margin:0">أنواع بتعيش في البحر وكمان في الأنهار أو البحيرات. نفس النوع بيختلف شكله وحجمه وطعمه وطريقة صيده حسب المياه اللي اتصاد منها.</p>' +
      '<div class="chips">' + Object.keys(BOTH_TYPE).map(k => '<span class="chip">' + esc(BOTH_TYPE[k]) + '</span>').join('') + '</div>' +
      BOTH.map(bothCard).join('') + '</div>';
  };
  const bothFor = id => { const b = BOTH.find(x => (x.ids || [x.id]).indexOf(id) > -1); return b ? '<section class="stack"><h2 class="h2" style="margin:0">في البحر وفي النهر</h2>' + bothCard(b) + '<a class="btn ghost small" href="#/both">كل أسماك البحر والنهر</a></section>' : ''; };

  /* ================= التشويق: العد التنازلي، سمكة اليوم، هل تعرف؟، الإنجازات ================= */
  const FACTS = [
    'البوري بيقدر يعيش في مياه مالحة جدًا وفي مياه عذبة، وده سبب إنه موجود من البحر لحد قارون والترع.',
    'الدنيس بيغيّر جنسه: بيبدأ ذكر وبعدين يتحول لأنثى لما يكبر.',
    'سمكة أبو سيف بتسخّن عينيها ومخها بعضلة خاصة عشان تشوف كويس في الأعماق الباردة.',
    'التونة زرقاء الزعنفة ممكن تعدّي المحيط الأطلسي في أقل من شهرين.',
    'قرش الحوت أكبر سمكة في العالم، وبياكل كائنات صغيرة جدًا (بلانكتون) بس.',
    'سمكة الأسد (البوبيت) دخلت البحر المتوسط من البحر الأحمر عن طريق قناة السويس.',
    'الأخطبوط عنده 3 قلوب ودمه أزرق.',
    'السمك بيسمع الصوت وبيحس بالحركة بخط جانبي على جسمه؛ عشان كده الهدوء على الشط بيفرق.',
    'القمر بيأثر على المد والجزر، وأيام البدر والمحاق المد بيبقى أقوى والسمك غالبًا أنشط.',
    'الكابوريا الزرقاء أصلها من المحيط الأطلسي، ووصلت البحر المتوسط ومصر مع «مياه الصابورة»: المياه اللي السفن بتملا بيها خزانات في قاعها عشان تتزن وهي فاضية، وبتفرّغها في ميناء تاني ومعاها كائنات صغيرة ويرقات.',
    'البلطي الأم بتحضن البيض والزريعة جوه بُقها لحد ما يقدروا يعيشوا لوحدهم.',
    'سمكة الشراع أسرع سمكة معروفة، وممكن توصل لحوالي 100 كم/ساعة في الانقضاض.',
    'القاروص بيحب الموج والرغوة لأنها بتلخبط السمك الصغير وتسهّل صيده.',
    'الحبار والكلماري بيغيّروا لونهم في أقل من ثانية للتمويه والتواصل.',
    'المرجان في البحر الأحمر حيوانات مش صخور، والشعاب بتكون بيت لربع أنواع السمك البحري.',
    'السلمون بيرجع يبيض في نفس النهر اللي اتولد فيه بعد سنين في البحر، وبيلاقيه بحاسة الشم.',
    'قشر البياض (فرخ النيل) في بحيرة ناصر ممكن يعدّي 100 كجم.',
    'سمك الإبرة (الزرقان) عضمه أخضر طبيعي، وده مش ضار.',
    'أحسن وقت للصيد غالبًا ساعة قبل الغروب لحد ساعة بعده: الضوء الخافت بيخلي المفترسات تقرّب من الشط.',
    'الريح الخفيفة اللي بتحرّك سطح المياه بتخلي السمك أقل حذرًا من المياه الهادية الصافية.',
    'التونة والماكريل لازم يفضلوا يعوموا طول الوقت عشان المياه تعدّي على خياشيمهم ويتنفسوا.',
    'الشفش (اللبط) بيعمل صوت طبول بعضلات جنب مثانة العوم، والصيادين بيسمعوه أحيانًا.',
    'عمر السمكة ممكن يتعرف من حلقات في قشرها زي حلقات الشجر.',
    'المحار بيفلتر حوالي 50 لتر مياه في اليوم وبينضّف البحيرات.',
    'مياه الصابورة هي مياه بتسحبها السفينة الفاضية في خزانات تحت عشان تتزن، ولما تحمّل بضاعة بترميها؛ وده نقل كائنات كتير من بحر لبحر.',
    'قناة السويس فتحت طريق لأكتر من 400 نوع من البحر الأحمر يدخلوا المتوسط، ومنهم البطاطا (السيجان) والسمكة المنتفخة الفضية.',
    'السمكة المنتفخة الفضية (الأرنب) سامة جدًا ومحرّم أكلها، وأسنانها بتقطع السنانير والشباك.',
    'بحيرة البردويل من أملح البحيرات في مصر، والصيد فيها بيتقفل في شهور الشتا عشان تكاثر السمك.',
    'بحيرة قارون أملح من مياه البحر، عشان كده الأسماك اللي فيها أنواع بحرية زي البوري والموسى.',
    'بحيرة ناصر من أكبر البحيرات الصناعية في العالم، وطولها حوالي 500 كم.',
    'البحر الأحمر من أملح بحار العالم ومن أدفاها، وده سبب تنوع الشعاب المرجانية فيه.',
    'البحر المتوسط عند السواحل المصرية فقير نسبيًا في المغذيات، عشان كده السمك بيتجمع عند الصخور والحطام والمصبات.',
    'مصب النيل في رشيد ودمياط بيخلط المياه العذبة بالمالحة، وده بيجذب البوري والقاروص.',
    'الرياح الشمالية الغربية هي الغالبة على ساحل إسكندرية، وبتجيب موج مناسب لصيد القاروص من الصخور.',
    'المد والجزر في المتوسط ضعيف (حوالي 30 سم)، لكن في خليج السويس ممكن يوصل لأكتر من متر ونص.',
    'أحسن مياه للصيد غالبًا «المياه المعكّرة شوية» بعد نوة: السمك بيقرّب يدوّر على أكل اتقلّب من القاع.',
    'النوة في إسكندرية ليها مواعيد شبه ثابتة كل سنة زي نوة الفيضة الصغرى والكرم والمكنسة.',
    'السمك أبو أسنان زي المياس والباراكودا محتاج طرف سلك (واير) عشان مايقطعش الخيط.',
    'الطُّعم الطازة دايمًا أحسن من المتلّج، وريحة الطُّعم أهم من شكله في الترقيد.',
    'استخدم أصغر سنارة تناسب الطُّعم: السنارة الكبيرة بتخوّف السمك الحذر.',
    'الخيط الرفيع بيجيب ضربات أكتر في المياه الصافية، بس محتاج فرامل مكنة مضبوطة.',
    'لو السمك بيلمس الطُّعم ومش بيشد، صغّر السنارة أو الطُّعم أو استخدم ليدر فلوروكربون.',
    'اعرف المقاس الأدنى المسموح لكل نوع ورجّع السمك الصغير للمياه بسرعة وبإيد مبلولة.',
    'الإطلاق الصحيح: قلّل وقت السمكة بره المية، وماتمسكهاش من الخياشيم.',
    'الضوء في الليل بيجذب الجمبري والسمك الصغير، ووراهم بتيجي المفترسات؛ ده سر الصيد الليلي جنب الأرصفة المنورة.',
    'البارومتر النازل قبل العاصفة غالبًا بيخلي السمك ياكل بشراهة، وبعدها بيهدى.',
    'في الصيف السمك بيروح للمياه الأعمق والأبرد نص النهار، وبيطلع للشط الصبح بدري وبالليل.',
    'في الشتا السمك أبطأ، فلمّ الطُّعم الصناعي ببطء أكتر وانزل لعمق أكبر.',
    'السمك بيشوف الألوان: في المياه الصافية الألوان الطبيعية أحسن، وفي العكرة الألوان الفاقعة أو الغامقة.',
    'سمكة الحجر (الحجرية) في البحر الأحمر من أسمّ الأسماك في العالم؛ البس حذاء وانت ماشي على الشعاب.',
    'البوبيت (سمكة الأسد) أشواكها سامة لكن لحمها حلو وآمن بعد شيل الأشواك، وصيدها بيحمي الشعاب.',
    'سلطان إبراهيم بيدوّر على أكله في الرمل بشنبين تحت بقه.',
    'الوقار (الهامور) بيقعد في نفس الجحر سنين، ولو اتصاد واحد من جحر غالبًا هييجي غيره مكانه.',
    'التونة بتقدر ترفع حرارة جسمها عن حرارة المية، وده بيخليها سريعة في المياه الباردة.',
    'الحبار والسبيط بيتصادوا أحسن بالليل بالنور وبالطُّعم الصناعي المسمى «إيجي».',
    'الأخطبوط ذكي جدًا وبيعرف يفتح برطمانات، وبيتصاد في مصايد فخار في بعض البلاد.',
    'الدنيس بيكسر الصدف والجمبري بأسنان ضروس قوية، عشان كده بيحب طُعم الكابوريا والبلح.',
    'القرموط بيتنفس هوا من السطح، فبيعيش في مياه قليلة الأكسجين في الترع.',
    'البلطي النيلي من أقدم الأسماك المربّاة: المصريين القدماء رسموه على جدران المقابر.',
    'قشر البياض (فرخ النيل) دخل بحيرة فيكتوريا وغيّر نظامها البيئي بالكامل.',
    'الماكريل بيمشي في أسراب كبيرة وبيتصاد بالسبيكي والملاعق الصغيرة.',
    'سمك الإبرة بيقفز فوق المية، وفي الليل ممكن ينط ناحية النور.',
    'الشعري (الإمبيرور) في البحر الأحمر بيكتر صيده بالليل على القاع.',
    'الأسماك بتحس بالضغط الجوي والتغيرات في المياه بالمثانة الهوائية.',
    'خط المياه الأبيض (الرغوة) على الصخور مكان ممتاز للقاروص والمياس.',
    'حطام السفن تحت المياه بيتحول لشعاب صناعية وبيجمع أسماك كتير.',
    'كل ما الريح كانت من البحر للشط، الطُّعم والأكل بيتدفعوا ناحية الشط والسمك بيقرّب.'
  ];
  const dayKey = () => { const d = new Date(); return d.getFullYear() * 400 + d.getMonth() * 32 + d.getDate(); };
  const hashN = (n, m) => ((n * 2654435761) >>> 0) % m;
  function nextWindow(loc) {
    const di = dayInfo(loc), s = di.sun, H = 3600000, now = Date.now(), W = [];
    if (s.rise) W.push({ a: (s.dawn || new Date(s.rise - .5 * H)).getTime(), b: s.rise.getTime() + H, l: 'نشاط الفجر' });
    if (s.set) W.push({ a: s.set.getTime() - H, b: (s.dusk || new Date(s.set.getTime() + .5 * H)).getTime(), l: 'نشاط الغروب' });
    di.slots.filter(x => x.kind === 'major').forEach(x => W.push({ a: x.t.getTime() - H, b: x.t.getTime() + H, l: x.label }));
    const tm = dayInfo(loc, new Date(now + 86400000)).sun; if (tm.rise) W.push({ a: (tm.dawn || new Date(tm.rise - .5 * H)).getTime(), b: tm.rise.getTime() + H, l: 'نشاط فجر بكرة' });
    W.sort((x, y) => x.a - y.a); const cur = W.find(w => w.a <= now && w.b > now); if (cur) return { now: 1, w: cur };
    const nx = W.find(w => w.a > now); return nx ? { now: 0, w: nx } : null;
  }
  const fmtDur = ms => { const m = Math.max(0, Math.round(ms / 60000)), h = Math.floor(m / 60); return (h ? h + ' س ' : '') + (m % 60) + ' د'; };
  function countdownHtml() {
    const loc = getLoc(), n = nextWindow(loc); if (!n) return '';
    const span = n.w.b - n.w.a, pct = n.now ? Math.round((Date.now() - n.w.a) / span * 100) : Math.max(3, 100 - Math.round((n.w.a - Date.now()) / (6 * 3600000) * 100));
    return '<section class="card cdown" data-cd="1"><div class="ring" style="--p:' + Math.min(100, pct) + '"><span>' + (n.now ? '🔥' : '⏳') + '</span></div><div style="flex:1;min-width:0"><div class="eyebrow" style="color:var(--gold)">' + (n.now ? 'دلوقتي وقت ذروة!' : 'أحسن وقت جاي') + '</div>' +
      '<b class="cdt num">' + (n.now ? 'باقي ' + fmtDur(n.w.b - Date.now()) : 'بعد ' + fmtDur(n.w.a - Date.now())) + '</b><div class="muted small">' + esc(n.w.l) + ' · ' + T(new Date(n.w.a)) + '–' + T(new Date(n.w.b)) + '</div></div><a class="btn small" href="#/trip">جهّز الرحلة</a></section>';
  }
  setInterval(() => { const c = $('[data-cd]'); if (c) { const t = document.createElement('div'); t.innerHTML = countdownHtml(); if (t.firstChild) c.replaceWith(t.firstChild); } }, 30000);
  function fishOfDay() {
    const loc = getLoc(), regs = regionsAt(loc);
    const L = SG.filter(s => { const m = monthScores(s, loc, { m: regs.m, f: regs.f }, null); return m && m[CUR] >= 2 && s.g !== 'mam' && s.g !== 'orn'; });
    if (!L.length) return '';
    const s = L[hashN(dayKey(), L.length)], m = monthScores(s, loc, { m: regs.m, f: regs.f }, null), di = dayInfo(loc);
    const moonB = di.spring ? 15 : 0, chance = Math.min(95, 35 + m[CUR] * 15 + moonB + (nextWindow(loc) && nextWindow(loc).now ? 10 : 0));
    const fact = s.n ? s.n.split(/[.!]/)[0] : '';
    return '<section class="card fod"><div class="eyebrow" style="color:var(--gold)">⭐ سمكة النهارده</div><a class="fodimg" href="#/sp/' + s.id + '"><img alt="" src="' + spPhoto(s) + '"></a>' +
      '<div class="row between" style="align-items:flex-end"><div><h2 class="h2" style="margin:0"><a href="#/sp/' + s.id + '" style="color:inherit;text-decoration:none">' + esc(dispName(s)) + '</a></h2><div class="muted small latin">' + esc(s.en) + '</div></div>' +
      '<div class="gauge" style="--p:' + chance + '"><b class="num">' + chance + '%</b><span>فرصتك</span></div></div>' +
      (fact ? '<p style="margin:0">💡 ' + esc(fact) + '.</p>' : '') + '<div class="chips"><a class="chip" href="#/trip?add=' + s.id + '">+ ضيفها لخطة اليوم</a><a class="chip" href="#/sp/' + s.id + '">الطُّعم والمكان</a></div></section>';
  }
  /* أكتر من 1000 معلومة: أولًا عن أماكن الصيد الأقرب لموقعك، بعدين أنواع منطقتك، بعدين معلومات عامة */
  const MN = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  let FCACHE = null;
  function allFacts() {
    const loc = getLoc(), key = loc.lat.toFixed(2) + loc.lng.toFixed(2); if (FCACHE && FCACHE.k === key) return FCACHE.L;
    const L = [], add = (c, x) => { if (x) L.push([c, x]); };
    /* معلومات الأماكن: بس الأماكن القريبة منك فعلًا (أقل من 150 كم)، وكل معلومة فيها حاجة تعملها: إيه اللي بيطلع وتاخد إيه معاك */
    const near = spotsByDist(loc).filter(o => o.km <= 150).slice(0, 6), dir = (a, b) => { const d = Math.atan2((b[1] - a[1]) * Math.cos(a[0] * Math.PI / 180), b[0] - a[0]) * 180 / Math.PI; return ['الشمال', 'الشمال الشرقي', 'الشرق', 'الجنوب الشرقي', 'الجنوب', 'الجنوب الغربي', 'الغرب', 'الشمال الغربي'][Math.round(((d + 360) % 360) / 45) % 8]; };
    const tk = id => (typeof FISH_TACKLE !== 'undefined' && FISH_TACKLE.find(r => r[0] === id)) || null;
    near.forEach((o, n) => { const s = o.s, nm = s[1].split(' (')[0], P = (EG_PRES[s[0]] || []).filter(r => BYG[r[0]]);
      const inSeason = P.filter(r => BYG[r[0]].pk && BYG[r[0]].pk.indexOf(CUR + 1) > -1), top = (inSeason.length ? inSeason : P).slice(0, 3);
      add('قريب منك', (n ? '' : 'أقرب مكان صيد ليك: ') + nm + ' — ' + fmtKm(o.km) + ' ناحية ' + dir([loc.lat, loc.lng], [s[2], s[3]]) + '. ' + (top.length ? (inSeason.length ? 'بيطلع فيه الموسم ده: ' : 'أكتر حاجة بتطلع فيه: ') + top.map(r => spName(r[0])).join('، ') + '.' : s[6]));
      const t = top[0] && BYG[top[0][0]], r = t && tk(t.id), m = t && typeof FT_MORE !== 'undefined' && FT_MORE[t.id];
      if (t) add('قريب منك', 'لو رايح ' + nm + ' عشان ' + spName(t.id) + ': ' + (r ? 'خيط ' + r[2] + '، سنارة ' + r[4] + '، ' + r[6] + '، ' : '') + 'وطُعم ' + (m && m.bait ? m.bait : listNames(t.bt, BAIT).slice(0, 3).join(' أو ')) + (t.tod ? '. أحسن وقت: ' + todText(t) : '') + '.');
    });
    const regs = regionsAt(loc), lv = s => { const m = monthScores(s, loc, { m: regs.m, f: regs.f }, null); return m ? m[CUR] : -1; };
    SG.slice().sort((a, b) => lv(b) - lv(a)).forEach(s => { const n = spName(s.id);
      if (s.n) s.n.split(/(?<=[.!؟])\s+/).slice(0, 2).forEach(x => add('سمكة', n + ': ' + x.trim()));
      if (s.sz) add('سمكة', 'الحجم المعتاد لـ' + n + ': ' + s.sz + '.');
      if (s.sst) add('سمكة', n + ' بيحب مياه حرارتها بين ' + s.sst[0] + ' و' + s.sst[1] + '°م.');
      if (s.pk && s.pk.length && s.pk.length < 12) add('سمكة', 'ذروة موسم ' + n + ' (شمال الكرة): ' + s.pk.map(m => MN[m - 1]).join('، ') + '.');
      if (s.bt) add('سمكة', 'طُعم ' + n + ': ' + listNames(s.bt, BAIT).join('، ') + '.');
      if (s.how) add('سمكة', 'طرق صيد ' + n + ': ' + listNames(s.how, HOW).slice(0, 3).join('، ') + '.');
      if (s.fam) add('سمكة', n + ' من ' + s.fam + '.');
      if (s.dp) add('سمكة', 'بتلاقي ' + n + ' في ' + DP_L[s.dp] + (s.tod ? '، وأحسن وقت: ' + todText(s) : '') + '.');
    });
    FACTS.forEach(x => add('عامة', x));
    FCACHE = { k: key, L }; return L;
  }
  function factHtml() { const L = allFacts(), i = store.get('fi', hashN(dayKey(), Math.min(12, L.length))) % L.length, on = store.get('fnote', false);
    return '<section class="card fact" data-fi="' + i + '"><div class="row between"><b>🤔 هل تعرف؟ <span class="tag gold fcat">' + L[i][0] + '</span></b><span class="fnav"><button class="fstep" data-act="factstep" data-d="-1" aria-label="المعلومة السابقة">›</button><button class="fstep" data-act="factstep" data-d="1" aria-label="المعلومة التالية">‹</button></span></div>' +
      '<p class="factx" style="margin:0">' + esc(L[i][1]) + '</p><div class="row between">' +
      '</div><div class="row" style="gap:8px;align-items:center"><label for="fint" class="small">🔔 إشعار بمعلومة:</label><select id="fint" class="finsel">' +
      FINT.map(o => '<option value="' + o[0] + '"' + (String(on ? store.get('fint', 1440) : 0) === String(o[0]) ? ' selected' : '') + '>' + o[1] + '</option>').join('') +
      (on && !FINT.some(o => o[0] === store.get('fint', 1440)) ? '<option value="' + store.get('fint') + '" selected>كل ' + store.get('fint') + ' دقيقة</option>' : '') + '</select></div></section>'; }
  const FINT = [[0, 'مقفولة'], [3, 'كل 3 دقايق'], [5, 'كل 5 دقايق'], [10, 'كل 10 دقايق'], [15, 'كل 15 دقيقة'], [30, 'كل نص ساعة'], [60, 'كل ساعة'], [180, 'كل 3 ساعات'], [300, 'كل 5 ساعات'], [600, 'كل 10 ساعات'], [900, 'كل 15 ساعة'], [1440, 'مرة في اليوم'], ['c', 'مدة تختارها انت…']];
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-act="factstep"]');
    if (b) { const c = b.closest('.fact'), L = allFacts(), i = (+c.dataset.fi + +b.dataset.d + L.length) % L.length; c.dataset.fi = i; store.set('fi', i); const p = c.querySelector('.factx'); p.style.opacity = 0; setTimeout(() => { p.textContent = L[i][1]; c.querySelector('.fcat').textContent = L[i][0]; p.style.opacity = 1; }, 160); return; }
  });
  document.addEventListener('change', async e => {
    if (e.target.id !== 'fint') return; let v = e.target.value;
    if (v === 'c') { const x = prompt('كل كام دقيقة عاوز إشعار؟ (مثلًا 45 أو 120)', '120'); v = Math.max(1, Math.round(+x || 0)); if (!v) { render(); return; } }
    v = +v; if (!v) { store.set('fnote', false); toast('وقفت الإشعارات.'); return; }
    store.set('fint', v); if (!store.get('fnote', false)) await factNoteToggle(); else { factsToCache(); regSync(); toast('تمام، الإشعار هيوصلك ' + (FINT.find(o => o[0] === v) || [0, 'كل ' + v + ' دقيقة'])[1] + '.'); }
  });
  /* الإشعارات: الصفحة بتحفظ 60 معلومة في الكاش والعامل بيعرض واحدة كل يوم (تزامن دوري على أندرويد للنسخة المثبتة) + إشعار طول ما التطبيق مفتوح في الخلفية */
  async function factsToCache() { try { const L = allFacts(), s = store.get('fi', 0), f = []; for (let k = 0; k < 60; k++) f.push(L[(s + 1 + k) % L.length][1]); const c = await caches.open('sayad-facts'); await c.put('facts.json', new Response(JSON.stringify({ f, i: 0 }))); } catch (e) {} }
  async function factNoteToggle() {
    if (store.get('fnote', false)) { store.set('fnote', false); toast('وقفت الإشعارات.'); render(); return; }
    if (!('Notification' in window)) { toast('المتصفح ده مش بيدعم الإشعارات.'); return; }
    const pm = await Notification.requestPermission(); if (pm !== 'granted') { toast('لازم تسمح بالإشعارات من إعدادات المتصفح.'); return; }
    store.set('fnote', true); store.set('fnlast', 0); await factsToCache();
    regSync(); showFactNote(); toast('تمام! هيوصلك إشعار بمعلومة ' + ((FINT.find(o => o[0] === store.get('fint', 1440)) || [0, 'كل ' + store.get('fint') + ' دقيقة'])[1]) + '.'); render();
  }
  async function regSync() { try { const r = await navigator.serviceWorker.ready; if (r.periodicSync) await r.periodicSync.register('sayad-fact', { minInterval: Math.max(15, store.get('fint', 1440)) * 60000 }); } catch (e) {} }
  async function showFactNote() {
    const L = allFacts(), i = (store.get('fni', 0)) % L.length; store.set('fni', i + 1); store.set('fnlast', Date.now());
    const body = L[i][1], opt = { body, icon: 'icon-192.png', tag: 'sayad-fact', lang: 'ar', dir: 'rtl' };
    try { if (navigator.serviceWorker && navigator.serviceWorker.controller) { const r = await navigator.serviceWorker.ready; return r.showNotification('🤔 هل تعرف؟ — الصنّارة', opt); } } catch (e) {}
    try { new Notification('🤔 هل تعرف؟ — الصنّارة', opt); } catch (e) {}
  }
  /* لو التطبيق مفتوح في الخلفية: إشعار كل 6 ساعات، وعند الفتح لو عدّى يوم */
  setInterval(() => { if (store.get('fnote', false) && 'Notification' in window && Notification.permission === 'granted' && Date.now() - store.get('fnlast', 0) >= store.get('fint', 1440) * 60000 - 5000) showFactNote(); }, 30000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && store.get('fnote', false)) factsToCache(); });
  /* الإنجازات من السجل والرحلات */
  function badgesHtml() {
    const log = store.get('log', []), trips = store.get('trips', []), sp = new Set(log.map(c => c.sp).filter(Boolean)), dawn = log.some(c => { const h = +(c.at || '').slice(11, 13); return h >= 4 && h < 7; }), night = log.some(c => { const h = +(c.at || '').slice(11, 13); return h >= 21 || h < 3; });
    const km = trips.reduce((a, t) => a + trackKm(t.pts), 0), big = log.some(c => +c.len >= 50), places = new Set(log.filter(c => c.la).map(c => c.la.toFixed(2) + c.lo.toFixed(2)));
    const B = [['🎣', 'أول صيدة', log.length >= 1], ['🐟', '10 صيدات', log.length >= 10], ['🏆', '50 صيدة', log.length >= 50], ['🌈', '5 أنواع مختلفة', sp.size >= 5], ['📚', '15 نوع', sp.size >= 15], ['🌅', 'صياد الفجر', dawn], ['🌙', 'صياد الليل', night], ['📏', 'سمكة 50 سم+', big], ['🧭', 'رحلة 5 كم', km >= 5], ['🗺️', '3 أماكن مختلفة', places.size >= 3]];
    const n = B.filter(b => b[2]).length;
    return '<section class="card stack"><div class="row between"><h2 class="h2" style="margin:0">إنجازاتك</h2><span class="tag gold num">' + n + ' / ' + B.length + '</span></div><div class="bar"><i style="width:' + Math.round(n / B.length * 100) + '%"></i></div>' +
      '<div class="badges">' + B.map(b => '<div class="badge' + (b[2] ? ' on' : '') + '"><span>' + b[0] + '</span><small>' + esc(b[1]) + '</small></div>').join('') + '</div></section>';
  }

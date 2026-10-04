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
  /* رسم أماكن الصيد المصرية فوق الخريطة المرسومة */
  function drawEgSpots(ctx, px, py, W, H, S, span, egsp) {
    ctx.font = (10.5 * S) + 'px "IBM Plex Sans Arabic",Tahoma,sans-serif'; ctx.textAlign = 'center';
    EG_SPOTS.forEach(s => {
      const x = px(s[3]), y = py(s[2]); if (x < -10 || x > W + 10 || y < -10 || y > H + 10) return;
      const pc = egsp ? presOf(s[0], egsp) : 0; if (egsp && !pc) { ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.arc(x, y, 2.2 * S, 0, 6.3); ctx.fill(); return; }
      if (egsp) { const Rk = s[4] === 'fw' ? 12 : 20, rp = Math.max(12 * S, Rk / (111 * span / W)); ctx.fillStyle = 'rgba(255,138,0,' + (0.22 + Math.min(0.45, pc / 50)) + ')'; ctx.strokeStyle = 'rgba(200,80,0,.8)'; ctx.lineWidth = 1 * S; ctx.beginPath(); ctx.arc(x, y, rp, 0, 6.3); ctx.fill(); ctx.stroke(); }
      const r = (egsp ? 3 : 4.5) * S;
      ctx.fillStyle = s[4] === 'fw' ? '#2bb3a3' : s[4] === 'red' ? '#e0675a' : '#3f8fdc'; ctx.strokeStyle = '#06202C'; ctx.lineWidth = 1.5 * S;
      ctx.beginPath(); ctx.arc(x, y, r, 0, 6.3); ctx.fill(); ctx.stroke();
      if (span <= 7 || egsp) { const lab = egsp ? pc + '%' : s[1].split(' (')[0]; ctx.lineWidth = 3 * S; ctx.strokeStyle = 'rgba(6,32,44,.8)'; ctx.strokeText(lab, x, y - r - 3 * S); ctx.fillStyle = '#fff'; ctx.fillText(lab, x, y - r - 3 * S); }
    });
  }
  /* نفس الأماكن على خريطة Leaflet الحقيقية */
  function leafEgSpots(id) {
    const L2 = LMAP[id]; if (!L2) return; const wrap = $('.mapbox[data-mapid="' + id + '"]'); if (!wrap || !wrap.dataset.spots) return;
    (L2.spots || []).forEach(m => L2.map.removeLayer(m)); L2.spots = [];
    const egsp = wrap.dataset.egsp || '';
    EG_SPOTS.forEach(s => {
      const pc = egsp ? presOf(s[0], egsp) : 0; if (egsp && !pc) return;
      const m = L.circleMarker([s[2], s[3]], { radius: egsp ? 6 + Math.min(10, pc / 3) : 7, color: '#06202C', weight: 2, fillColor: s[4] === 'fw' ? '#2bb3a3' : s[4] === 'red' ? '#e0675a' : '#3f8fdc', fillOpacity: .95 }).addTo(L2.map);
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
    const D = egDist(id); if (!D || typeof L === 'undefined') return;
    const M = egMask().M, w = D.c1 - D.c0 + 1, h = D.r1 - D.r0 + 1, cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const x = cv.getContext('2d'), im = x.createImageData(w, h);
    for (let r = D.r0; r <= D.r1; r++) for (let c = D.c0; c <= D.c1; c++) { const q = D.v[r * M.w + c]; if (!q) continue; const o = ((D.r1 - r) * w + (c - D.c0)) * 4; im.data[o] = 255; im.data[o + 1] = Math.round(150 - 90 * q); im.data[o + 2] = 0; im.data[o + 3] = Math.round(70 + 170 * q); }
    x.putImageData(im, 0, 0);
    const b = [[M.la0 + D.r0 * M.r, M.lo0 + D.c0 * M.r], [M.la0 + (D.r1 + 1) * M.r, M.lo0 + (D.c1 + 1) * M.r]];
    L2.rects.push(L.imageOverlay(cv.toDataURL(), b, { interactive: false, className: 'pixelated' }).addTo(L2.map));
    EG_SPOTS.forEach(s => { const p = presOf(s[0], id); if (!p) return; const m = L.circleMarker([s[2], s[3]], { radius: 4, color: '#7a2a00', weight: 1, fillColor: '#ff8a00', fillOpacity: 1 }).addTo(L2.map); m.bindTooltip(s[1].split(' (')[0] + ' · ' + p + '%', { direction: 'top' }); m.on('click', () => { location.hash = '#/egypt/' + s[0]; }); L2.rects.push(m); });
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
      '<div class="legend"><span><i style="background:#ff8a00"></i>منطقة تواجد (مربعات ≈ 550 م)، الأغمق = نسبة أعلى</span><span><i style="background:#e11d1d;border-radius:50%"></i>موقعك</span></div><div class="chips">' +
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
      '<p class="muted" style="margin:0">أنواع بتعيش في البحر وكمان في الأنهار أو البحيرات. نفس النوع بيختلف شكله وحجمه وطعمه وطريقة صيده حسب المية اللي اتصاد منها.</p>' +
      '<div class="chips">' + Object.keys(BOTH_TYPE).map(k => '<span class="chip">' + esc(BOTH_TYPE[k]) + '</span>').join('') + '</div>' +
      BOTH.map(bothCard).join('') + '</div>';
  };
  const bothFor = id => { const b = BOTH.find(x => (x.ids || [x.id]).indexOf(id) > -1); return b ? '<section class="stack"><h2 class="h2" style="margin:0">في البحر وفي النهر</h2>' + bothCard(b) + '<a class="btn ghost small" href="#/both">كل أسماك البحر والنهر</a></section>' : ''; };

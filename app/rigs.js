/*! الصنّارة (دليل الصياد) — © 2026 Maro Shahaly. جميع الحقوق محفوظة. يُمنع النسخ أو إعادة النشر دون إذن كتابي. */
/* ================= رسومات الأرمات والقرم =================
   كل رسمة مبنية من شرح الطريقة نفسه في ملف «مساعد الصيد». البيانات مكتوبة جنب الرسمة في قائمة مرقّمة،
   والأرقام بس هي اللي على الرسمة، عشان الرسمة تفضل نظيفة وواضحة.
   صيغة الوصف: { e: [[نوع, تسمية, خيارات], ...], n: [ملاحظات] } — المفتاح رقم الشريحة (slide) في ملف مصر.
   null = طريقة تجهيز (طُعم/زفر) مالهاش أرمة. */
const RigArt = (function () {
  const W = 240, CX = 150;
  const LEAD = '#7E8894', LEAD_D = '#4D5662', METAL = '#5B6672';
  const f = n => Math.round(n * 10) / 10;
  const hookPath = (x, y, s) => {
    s = s || 1;
    const sh = 20 * s, r = 6 * s;
    return '<g class="rg-hook"><circle cx="' + x + '" cy="' + f(y + 2.6 * s) + '" r="' + f(2.6 * s) + '" fill="none" stroke="currentColor" stroke-width="1.8"/>' +
      '<path d="M' + x + ' ' + f(y + 5.2 * s) + ' V' + f(y + sh) + ' A' + r + ' ' + r + ' 0 0 0 ' + f(x + 2 * r) + ' ' + f(y + sh) + ' V' + f(y + sh - 9 * s) + '" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"/>' +
      '<path d="M' + f(x + 2 * r) + ' ' + f(y + sh - 9 * s) + ' l' + f(-3.2 * s) + ' ' + f(4.2 * s) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></g>';
  };
  const treble = (x, y) => '<g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="' + x + '" cy="' + (y + 2) + '" r="2"/><path d="M' + x + ' ' + (y + 4) + ' V' + (y + 14) + '"/>' +
    '<path d="M' + x + ' ' + (y + 14) + ' q0 6 6 6 q3 0 3-4"/><path d="M' + x + ' ' + (y + 14) + ' q0 6 -6 6 q-3 0 -3-4"/><path d="M' + x + ' ' + (y + 14) + ' v7"/></g>';
  const fish = (x, y, len, dir, col) => { /* سمكة أفقية رأسها عند x */
    const d = dir || 1, L = len || 46, h = L * 0.34;
    return '<g><path d="M' + x + ' ' + y + ' q' + f(d * L * 0.35) + ' ' + f(-h) + ' ' + f(d * L * 0.8) + ' 0 l' + f(d * L * 0.2) + ' ' + f(-h * 0.6) + ' v' + f(h * 1.2) + ' l' + f(-d * L * 0.2) + ' ' + f(-h * 0.6) + ' q' + f(-d * L * 0.45) + ' ' + f(h) + ' ' + f(-d * L * 0.8) + ' 0z" fill="' + (col || '#B9C6CF') + '" stroke="#55626C" stroke-width="1.1"/>' +
      '<circle cx="' + f(x + d * L * 0.12) + '" cy="' + f(y - 1.5) + '" r="1.6" fill="#1D262D"/><path d="M' + f(x + d * L * 0.25) + ' ' + f(y - h * 0.55) + ' q' + f(d * 3) + ' ' + f(h * 0.55) + ' 0 ' + f(h * 1.1) + '" fill="none" stroke="#55626C" stroke-width=".9"/></g>';
  };
  const BAIT = {
    dough: (x, y) => '<circle cx="' + (x + 6) + '" cy="' + (y + 18) + '" r="7.5" fill="#E9D3A1" stroke="#B89A5E" stroke-width="1"/>',
    bread: (x, y) => '<rect x="' + (x - 2) + '" y="' + (y + 10) + '" width="16" height="14" rx="4" fill="#E2C48A" stroke="#A9884B" stroke-width="1"/>',
    shrimp: (x, y) => '<path d="M' + (x + 1) + ' ' + (y + 8) + ' q12 2 12 14 q-1 7 -9 8 l-3 -3 q6 -2 6 -6 q0 -7 -7 -9z" fill="#F2A28B" stroke="#C4624B" stroke-width="1"/><path d="M' + (x + 4) + ' ' + (y + 30) + ' l-4 4 M' + (x + 5) + ' ' + (y + 30) + ' l-1 5" stroke="#C4624B" stroke-width="1"/>',
    worm: (x, y) => '<path d="M' + (x + 12) + ' ' + (y + 10) + ' q6 4 0 8 q-6 4 0 8 q6 4 0 8" fill="none" stroke="#B5655B" stroke-width="3.2" stroke-linecap="round"/>',
    strip: (x, y) => '<rect x="' + (x + 7) + '" y="' + (y + 8) + '" width="7" height="20" rx="2" fill="#C9D2D8" stroke="#6E7B85" stroke-width="1"/>',
    squid: (x, y) => '<path d="M' + (x + 4) + ' ' + (y + 4) + ' h12 l-2 16 h-8z" fill="#F4E6DE" stroke="#B48C7C" stroke-width="1"/><path d="M' + (x + 7) + ' ' + (y + 20) + ' v8 M' + (x + 10) + ' ' + (y + 20) + ' v10 M' + (x + 13) + ' ' + (y + 20) + ' v8" stroke="#B48C7C" stroke-width="1.2"/>',
    algae: (x, y) => '<path d="M' + (x + 6) + ' ' + (y + 30) + ' q-6 -10 0 -20 M' + (x + 8) + ' ' + (y + 30) + ' q2 -12 8 -18 M' + (x + 10) + ' ' + (y + 30) + ' q8 -6 10 -14" fill="none" stroke="#3E9B5A" stroke-width="2.2" stroke-linecap="round"/>',
    gut: (x, y) => '<path d="M' + (x + 10) + ' ' + (y + 8) + ' q8 3 2 8 q-7 4 1 8 q8 3 0 8" fill="none" stroke="#C5786F" stroke-width="4" stroke-linecap="round"/>',
    eel: (x, y) => '<path d="M' + (x + 12) + ' ' + (y + 6) + ' q14 8 2 16 q-12 8 2 16 q10 5 4 12" fill="none" stroke="#6F5B3E" stroke-width="3.6" stroke-linecap="round"/><circle cx="' + (x + 13) + '" cy="' + (y + 6) + '" r="1.3" fill="#111"/>'
  };
  /* كل عنصر يرجّع {h, svg, ay, ax, tail} — ay/ax نقطة السهم المرقّم، tail = لو العنصر نهاية الخيط */
  const E = {};
  E.tip = (y) => ({ h: 34, svg: '<path d="M' + (W - 6) + ' ' + (y + 2) + ' Q' + (CX + 40) + ' ' + (y + 6) + ' ' + CX + ' ' + (y + 28) + '" fill="none" stroke="var(--ink2)" stroke-width="3.2" stroke-linecap="round"/><circle cx="' + CX + '" cy="' + (y + 29) + '" r="3.2" fill="none" stroke="var(--ink2)" stroke-width="1.6"/>', ay: y + 20, ax: CX + 20 });
  E.boat = (y) => ({ h: 52, water: y + 32, svg: '<path d="M' + (CX - 10) + ' ' + (y + 18) + ' h76 l-10 16 h-58z" fill="#E7EDF0" stroke="#55626C" stroke-width="1.4"/><rect x="' + (CX + 20) + '" y="' + (y + 6) + '" width="18" height="12" rx="2" fill="#C8D3D9" stroke="#55626C" stroke-width="1.2"/><path d="M' + (CX + 4) + ' ' + (y + 18) + ' L' + CX + ' ' + (y + 6) + '" stroke="var(--ink2)" stroke-width="2.4" stroke-linecap="round"/>', ay: y + 24, ax: CX + 10, start: y + 6 });
  E.line = (y, o) => {
    const h = o.h || 46, st = o.wire ? 'stroke="' + METAL + '" stroke-width="2.6"' : o.leader ? 'stroke="var(--teal)" stroke-width="1.5"' : 'stroke="currentColor" stroke-width="1.8"';
    return { h: h, svg: '<line x1="' + CX + '" y1="' + y + '" x2="' + CX + '" y2="' + (y + h) + '" ' + st + (o.dash ? ' stroke-dasharray="5 4"' : '') + '/>', ay: y + h / 2 };
  };
  E.float = (y, o) => {
    const big = o.big, rx = big ? 13 : o.small ? 6 : 9, ry = big ? 17 : o.small ? 10 : 14, cy = y + ry + 8;
    return { h: ry * 2 + 16, water: cy, svg: '<line x1="' + CX + '" y1="' + y + '" x2="' + CX + '" y2="' + (y + ry * 2 + 16) + '" stroke="currentColor" stroke-width="1.8"/>' +
      '<line x1="' + CX + '" y1="' + (cy - ry - 7) + '" x2="' + CX + '" y2="' + (cy - ry) + '" stroke="#E5484D" stroke-width="2.6"/>' +
      '<path d="M' + (CX - rx) + ' ' + cy + ' A' + rx + ' ' + ry + ' 0 0 1 ' + (CX + rx) + ' ' + cy + 'z" fill="#E5484D"/><path d="M' + (CX - rx) + ' ' + cy + ' A' + rx + ' ' + ry + ' 0 0 0 ' + (CX + rx) + ' ' + cy + 'z" fill="#F7F7F5"/>' +
      '<ellipse cx="' + CX + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="none" stroke="#7A3236" stroke-width="1.1"/>' + (o.glow ? '<rect x="' + (CX + rx + 2) + '" y="' + (cy - ry) + '" width="4" height="12" rx="2" fill="#7CF29A" stroke="#2E8B57" stroke-width=".8"/>' : ''), ay: cy };
  };
  E.water = (y) => ({ h: 6, water: y + 3, svg: '', ay: y + 3 });
  E.balloon = (y) => ({ h: 52, water: y + 40, svg: '<line x1="' + CX + '" y1="' + y + '" x2="' + CX + '" y2="' + (y + 52) + '" stroke="currentColor" stroke-width="1.8"/><path d="M' + CX + ' ' + (y + 30) + ' q18 -2 22 -16" fill="none" stroke="#888" stroke-width="1"/><ellipse cx="' + (CX + 24) + '" cy="' + (y + 12) + '" rx="10" ry="12" fill="#F6B73C" stroke="#B57F12" stroke-width="1.1"/>', ay: y + 30, ax: CX + 14 });
  E.stopper = (y) => ({ h: 12, svg: '<line x1="' + CX + '" y1="' + y + '" x2="' + CX + '" y2="' + (y + 12) + '" stroke="currentColor" stroke-width="1.8"/><path d="M' + (CX - 6) + ' ' + (y + 6) + ' h12" stroke="#E8A800" stroke-width="3" stroke-linecap="round"/>', ay: y + 6 });
  E.bead = (y) => ({ h: 12, svg: '<line x1="' + CX + '" y1="' + y + '" x2="' + CX + '" y2="' + (y + 12) + '" stroke="currentColor" stroke-width="1.8"/><circle cx="' + CX + '" cy="' + (y + 6) + '" r="3.6" fill="#E5484D"/>', ay: y + 6 });
  E.sinker = (y, o) => {
    const sh = o.shape || 'egg', cy = y + 16; let g;
    if (sh === 'ball') g = '<circle cx="' + CX + '" cy="' + cy + '" r="7.5"/>';
    else if (sh === 'pyramid') g = '<path d="M' + CX + ' ' + (cy - 11) + ' l11 20 h-22z"/>';
    else if (sh === 'strip') g = '<rect x="' + (CX - 4.5) + '" y="' + (cy - 10) + '" width="9" height="20" rx="2"/><path d="M' + (CX - 4.5) + ' ' + (cy - 4) + ' h9 M' + (CX - 4.5) + ' ' + (cy + 3) + ' h9" stroke="#3B434C" stroke-width=".8"/>';
    else if (sh === 'stack') g = [0, 1, 2, 3].map(i => '<ellipse cx="' + CX + '" cy="' + (cy - 9 + i * 6.5) + '" rx="5.5" ry="3.6"/>').join('');
    else if (sh === 'shot') g = '<circle cx="' + CX + '" cy="' + (cy - 5) + '" r="3.4"/><circle cx="' + CX + '" cy="' + (cy + 4) + '" r="3.4"/>';
    else g = '<ellipse cx="' + CX + '" cy="' + cy + '" rx="' + (o.small ? 5 : 7) + '" ry="' + (o.small ? 8 : 12) + '"/>';
    return { h: 32, svg: '<line x1="' + CX + '" y1="' + y + '" x2="' + CX + '" y2="' + (y + 32) + '" stroke="currentColor" stroke-width="1.8"/><g fill="' + LEAD + '" stroke="' + LEAD_D + '" stroke-width="1.2">' + g + '</g>', ay: cy, ax: CX - 8 };
  };
  E.swivel = (y, o) => ({ h: o.snap ? 34 : 26, svg: '<g fill="none" stroke="' + METAL + '" stroke-width="1.8"><circle cx="' + CX + '" cy="' + (y + 4) + '" r="3.4"/><rect x="' + (CX - 3.6) + '" y="' + (y + 8) + '" width="7.2" height="10" rx="3" fill="#AEB8C1"/><circle cx="' + CX + '" cy="' + (y + 22) + '" r="3.4"/>' +
    (o.snap ? '<path d="M' + CX + ' ' + (y + 25) + ' v4 q0 5 4 5 q4 0 4 -5 v-6" />' : '') + '</g>', ay: y + 13, ax: CX - 6 });
  E.tee = (y, o) => { /* مدوّر ثلاثي: فرع جانبي للرصاص */
    const sl = o.side || 40;
    return { h: 30, svg: '<g fill="none" stroke="' + METAL + '" stroke-width="1.8"><circle cx="' + CX + '" cy="' + (y + 4) + '" r="3.4"/><rect x="' + (CX - 4) + '" y="' + (y + 8) + '" width="8" height="12" rx="3" fill="#AEB8C1"/><circle cx="' + CX + '" cy="' + (y + 25) + '" r="3.4"/><circle cx="' + (CX + 8) + '" cy="' + (y + 14) + '" r="3"/></g>' +
      '<path d="M' + (CX + 11) + ' ' + (y + 14) + ' L' + (CX + 46) + ' ' + (y + 14 + sl) + '" stroke="currentColor" stroke-width="1.4"' + (o.weak ? ' stroke-dasharray="4 3"' : '') + '/>' +
      '<ellipse cx="' + (CX + 48) + '" cy="' + (y + 26 + sl) + '" rx="7" ry="11" fill="' + LEAD + '" stroke="' + LEAD_D + '" stroke-width="1.2"/>', ay: y + 14, ax: CX - 6, extra: { y: y + 26 + sl, x: CX + 40 } };
  };
  /* فروع على شكل V أو مروحة من نقطة واحدة */
  E.v = (y, o) => {
    const legs = o.legs || [60, 44], n = legs.length, maxL = Math.max.apply(null, legs);
    let s = '';
    legs.forEach((L, i) => {
      const t = n === 1 ? 0 : -1 + 2 * i / (n - 1), x2 = CX + t * (o.spread || 62), y2 = y + L;
      s += '<line x1="' + CX + '" y1="' + y + '" x2="' + f(x2) + '" y2="' + y2 + '" stroke="var(--teal)" stroke-width="1.5"/>' + hookPath(f(x2), y2, o.hs) + (o.bait && BAIT[o.bait] ? BAIT[o.bait](f(x2), y2) : '');
    });
    return { h: maxL + 36, svg: s, ay: y + legs[0] * 0.5, ax: CX - (o.spread || 62) * 0.5, tail: true };
  };
  /* سنانير جانبية على طول الخيط (سبحة / بترنوستر) */
  E.side = (y, o) => {
    const n = o.n || 3, shown = Math.min(n, 6), gap = o.gap || 30, dl = o.dl || 22;
    let s = '<line x1="' + CX + '" y1="' + y + '" x2="' + CX + '" y2="' + (y + shown * gap + 8) + '" stroke="currentColor" stroke-width="1.8"/>';
    for (let i = 0; i < shown; i++) {
      const yy = y + 6 + i * gap, x2 = CX + dl;
      const skip = n > 6 && i === 4;
      s += '<line x1="' + CX + '" y1="' + yy + '" x2="' + x2 + '" y2="' + (yy + 8) + '" stroke="var(--teal)" stroke-width="1.4"' + (skip ? ' stroke-dasharray="3 3"' : '') + '/>';
      if (skip) { s += '<text x="' + (x2 + 8) + '" y="' + (yy + 12) + '" font-size="13" fill="var(--ink2)">⋮</text>'; continue; }
      if (o.lure === 'squidjig') s += LURE.squidjig(x2, yy + 8, 0.7);
      else if (o.lure === 'jag') s += '<path d="M' + x2 + ' ' + (yy + 8) + ' v10 q0 6 7 6 q4 0 4 -6" fill="none" stroke="currentColor" stroke-width="2.4"/>';
      else s += hookPath(x2, yy + 8, o.hs || 0.8) + (o.bait && BAIT[o.bait] ? BAIT[o.bait](x2, yy + 8) : '') + (o.flash ? '<path d="M' + (x2 + 2) + ' ' + (yy + 14) + ' l-6 9 M' + (x2 + 4) + ' ' + (yy + 14) + ' l-2 10" stroke="#E8A800" stroke-width="1.6"/>' : '');
    }
    return { h: shown * gap + 8, svg: s, ay: y + gap + 10, ax: CX + dl - 2 };
  };
  /* رصاصة عليها كورة عجين أو عيش والسنانير مغروسة حواليها (المشنقة / البوصة / السندوتش) */
  E.cluster = (y, o) => {
    const cy = y + 32, k = o.k || 6;
    let s = '<line x1="' + CX + '" y1="' + y + '" x2="' + CX + '" y2="' + (cy - 14) + '" stroke="currentColor" stroke-width="1.8"/>';
    for (let i = 0; i < k; i++) {
      const a = Math.PI * (0.15 + 0.7 * i / (k - 1)), r1 = 16, r2 = o.short ? 28 : 38;
      const x1 = CX + Math.cos(a) * r1 * (i % 2 ? 1 : -1), y1 = cy + Math.sin(a) * r1, x2 = CX + Math.cos(a) * r2 * (i % 2 ? 1 : -1), y2 = cy + Math.sin(a) * r2;
      s += '<line x1="' + f(x1) + '" y1="' + f(y1) + '" x2="' + f(x2) + '" y2="' + f(y2) + '" stroke="var(--teal)" stroke-width="1.3"/>' + hookPath(f(x2), f(y2 - 4), 0.6);
    }
    s += o.bread ? '<rect x="' + (CX - 17) + '" y="' + (cy - 14) + '" width="34" height="28" rx="9" fill="#E2C48A" stroke="#A9884B" stroke-width="1.2"/><path d="M' + (CX - 10) + ' ' + (cy - 14) + ' v28 M' + (CX + 10) + ' ' + (cy - 14) + ' v28" stroke="#A9884B" stroke-width="1"/>'
      : '<circle cx="' + CX + '" cy="' + cy + '" r="15" fill="#E9D3A1" stroke="#B89A5E" stroke-width="1.2"/><rect x="' + (CX - 4) + '" y="' + (cy - 9) + '" width="8" height="18" rx="2" fill="' + LEAD + '" opacity=".85"/>';
    return { h: 82, svg: s, ay: cy, ax: CX - 16, tail: !o.cont };
  };
  /* ثعابين/فخاخ الإستاكوزا: سنانير متقاربة + حلقات بروسي + ثقل */
  E.snares = (y, o) => {
    const n = o.n || 6; let s = '<line x1="' + CX + '" y1="' + y + '" x2="' + CX + '" y2="' + (y + n * 11 + 6) + '" stroke="currentColor" stroke-width="1.8"/>';
    for (let i = 0; i < n; i++) { const yy = y + 6 + i * 11; s += '<ellipse cx="' + (CX + 8) + '" cy="' + yy + '" rx="8" ry="4.5" fill="none" stroke="#3F7FA6" stroke-width="1.2"/><ellipse cx="' + (CX - 8) + '" cy="' + (yy + 3) + '" rx="8" ry="4.5" fill="none" stroke="#3F7FA6" stroke-width="1.2"/>'; }
    return { h: n * 11 + 6, svg: s, ay: y + n * 5, ax: CX - 16 };
  };
  E.hooks3 = (y, o) => { /* 3 سنانير متتالية ملفوف عليها الطُّعم */
    let s = '<line x1="' + CX + '" y1="' + y + '" x2="' + CX + '" y2="' + (y + 62) + '" stroke="currentColor" stroke-width="1.8"/>';
    s += '<path d="M' + (CX - 7) + ' ' + (y + 6) + ' h14 l4 44 h-22z" fill="#F4E6DE" stroke="#B48C7C" stroke-width="1"/>';
    for (let i = 0; i < 3; i++) s += hookPath(CX + (i - 1) * 5, y + 8 + i * 15, 0.65);
    return { h: 62, svg: s, ay: y + 30, ax: CX - 12 };
  };
  E.bundle = (y) => ({ h: 70, svg: '<line x1="' + CX + '" y1="' + y + '" x2="' + CX + '" y2="' + (y + 16) + '" stroke="currentColor" stroke-width="1.8"/>' +
    [-1, 1, -1, 1].map((d, i) => fish(CX + d * 2, y + 26 + i * 9, 38, d, i % 2 ? '#C7D3DA' : '#AFC0CA')).join('') + '<path d="M' + (CX - 8) + ' ' + (y + 20) + ' h16 M' + (CX - 8) + ' ' + (y + 54) + ' h16" stroke="#8A5A2B" stroke-width="2.2"/>', ay: y + 40, ax: CX - 30 });
  E.sock = (y) => ({ h: 66, svg: '<line x1="' + CX + '" y1="' + y + '" x2="' + CX + '" y2="' + (y + 14) + '" stroke="currentColor" stroke-width="1.8"/><path d="M' + (CX - 9) + ' ' + (y + 14) + ' h18 v30 q0 10 10 12 q6 2 4 8 h-22 q-10 0 -10 -12z" fill="#C7A27A" stroke="#7E5E3A" stroke-width="1.2"/><path d="M' + (CX - 9) + ' ' + (y + 22) + ' h18 M' + (CX - 9) + ' ' + (y + 30) + ' h18" stroke="#7E5E3A" stroke-width=".8"/>', ay: y + 36, ax: CX - 12, tail: true });
  E.skewer = (y) => ({ h: 74, svg: '<line x1="' + CX + '" y1="' + y + '" x2="' + CX + '" y2="' + (y + 70) + '" stroke="' + METAL + '" stroke-width="2.4"/>' + '<g transform="rotate(90 ' + CX + ' ' + (y + 14) + ')">' + fish(CX, y + 14, 54, 1) + '</g>' + treble(CX, y + 64), ay: y + 40, ax: CX - 10, tail: true });
  E.bed = (y, o) => ({ h: 16, svg: o.rock ? '<path d="M0 ' + (y + 14) + ' q12 -14 26 -4 q10 -12 24 -2 q14 -10 26 0 q12 -12 28 -2 q12 -10 26 0 q14 -12 30 -2 q12 -10 26 0 q10 -8 54 0 V' + (y + 16) + ' H0z" fill="#8E8A7E" opacity=".55"/>' : '<path d="M0 ' + (y + 8) + ' q20 -6 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 V' + (y + 16) + ' H0z" fill="#D9C79B" opacity=".75"/>', ay: y + 8, noLine: true });
  E.marker = (y) => ({ h: 30, svg: '<line x1="' + CX + '" y1="' + y + '" x2="' + CX + '" y2="' + (y + 30) + '" stroke="currentColor" stroke-width="1.8"/><rect x="' + (CX + 6) + '" y="' + (y + 6) + '" width="14" height="18" rx="3" fill="#C9D2D8" stroke="#55626C" stroke-width="1.1"/><path d="M' + CX + ' ' + (y + 12) + ' h6" stroke="currentColor" stroke-width="1.2"/>', ay: y + 15, ax: CX - 4 });
  /* نهايات الخيط: سنارة بطُعم، طُعم حي، رابلات */
  E.hook = (y, o) => {
    const x = CX; let s = '<line x1="' + x + '" y1="' + y + '" x2="' + x + '" y2="' + (y + 2) + '" stroke="currentColor" stroke-width="1.6"/>' + hookPath(x, y, o.s || 1.1);
    if (o.live) s += fish(x + 14, y + 14, o.big ? 58 : 46, 1);
    else if (o.bait && BAIT[o.bait]) s += BAIT[o.bait](x, y);
    if (o.treble) s += '<line x1="' + (x + 13) + '" y1="' + (y + 18) + '" x2="' + (x + 40) + '" y2="' + (y + 26) + '" stroke="' + METAL + '" stroke-width="1.4"/>' + treble(x + 40, y + 24);
    if (o.circle) s = '<path d="M' + x + ' ' + y + ' v6 a9 9 0 1 0 9 9" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>' + (o.live ? fish(x + 12, y + 18, 46, 1) : '');
    return { h: o.live ? 46 : 42, svg: s, ay: y + 14, ax: x - 4, tail: true };
  };
  const LURE = {
    plug: (x, y) => '<path d="M' + x + ' ' + (y + 6) + ' q30 -14 70 -2 q8 4 0 8 q-40 12 -70 -6z" fill="#9FC7D6" stroke="#36667A" stroke-width="1.2"/><path d="M' + x + ' ' + (y + 6) + ' l-10 10 l12 -4z" fill="#D9E6EC" stroke="#36667A" stroke-width="1"/><circle cx="' + (x + 12) + '" cy="' + (y + 3) + '" r="2.6" fill="#fff" stroke="#111" stroke-width="1"/>' + treble(x + 24, y + 12) + treble(x + 56, y + 12),
    popper: (x, y) => '<path d="M' + x + ' ' + (y - 4) + ' q4 10 0 20 q30 -2 54 -8 q4 -2 0 -4 q-24 -6 -54 -8z" fill="#F3F0E8" stroke="#555" stroke-width="1.2"/><ellipse cx="' + (x + 1) + '" cy="' + (y + 6) + '" rx="3" ry="9" fill="#C94040"/><circle cx="' + (x + 12) + '" cy="' + (y + 2) + '" r="2.4" fill="#111"/>' + treble(x + 26, y + 14) + '<path d="M' + (x + 54) + ' ' + (y + 4) + ' l14 -6 M' + (x + 54) + ' ' + (y + 6) + ' l16 2 M' + (x + 54) + ' ' + (y + 8) + ' l12 8" stroke="#E5484D" stroke-width="2.2" stroke-linecap="round"/>',
    spoon: (x, y) => '<circle cx="' + (x + 3) + '" cy="' + (y + 3) + '" r="3" fill="none" stroke="' + METAL + '" stroke-width="1.4"/><path d="M' + (x + 6) + ' ' + (y + 4) + ' q22 -14 46 0 q-22 14 -46 0z" fill="#E6C34E" stroke="#8B6B12" stroke-width="1.2"/><path d="M' + (x + 14) + ' ' + (y + 2) + ' q14 -5 28 0" stroke="#fff" stroke-width="1.4" fill="none" opacity=".8"/>' + treble(x + 54, y - 2),
    squidjig: (x, y, sc) => { sc = sc || 1; return '<g transform="translate(' + x + ' ' + y + ') scale(' + sc + ')"><path d="M0 2 q20 -10 48 -2 q4 2 0 4 q-28 8 -48 -2z" fill="#F07BB0" stroke="#9C2F64" stroke-width="1.2"/><path d="M8 -2 l10 -8 l2 8z" fill="#F7A9CD" stroke="#9C2F64" stroke-width=".9"/><circle cx="8" cy="1" r="2.2" fill="#111"/>' + [0, 1, 2, 3, 4].map(i => '<path d="M50 ' + (-4 + i * 2.5) + ' l8 ' + (-5 + i * 2.5) + '" stroke="#555" stroke-width="1"/>').join('') + '</g>'; },
    feather: (x, y) => hookPath(x, y, 1) + '<path d="M' + (x + 2) + ' ' + (y + 6) + ' q-14 10 -6 26 M' + (x + 4) + ' ' + (y + 6) + ' q-6 12 2 26 M' + (x + 6) + ' ' + (y + 6) + ' q4 12 -2 24" fill="none" stroke="#C9B48A" stroke-width="3" stroke-linecap="round"/>',
    skirt: (x, y) => '<path d="M' + x + ' ' + (y - 2) + ' q10 -6 18 0 v12 q-8 6 -18 0z" fill="#D43E3E" stroke="#7A1E1E" stroke-width="1.1"/>' + [0, 1, 2, 3, 4, 5].map(i => '<path d="M' + (x + 18) + ' ' + (y + 1 + i * 1.6) + ' q16 ' + (i - 2.5) * 2 + ' 34 ' + (i - 2.5) * 4 + '" fill="none" stroke="' + ['#F07BB0', '#F2C14E', '#ffffff', '#F07BB0', '#9C5BD9', '#F2C14E'][i] + '" stroke-width="2.2" stroke-linecap="round"/>').join('') + hookPath(x + 46, y + 2, 0.9),
    softjig: (x, y) => '<circle cx="' + (x + 6) + '" cy="' + (y + 4) + '" r="6" fill="' + LEAD + '" stroke="' + LEAD_D + '"/><path d="M' + (x + 11) + ' ' + (y + 2) + ' q20 -4 34 2 q8 4 14 -2 q-2 10 -14 6 q-14 4 -34 0z" fill="#7BC5A4" stroke="#2F7656" stroke-width="1.1"/>' + '<path d="M' + (x + 20) + ' ' + (y + 6) + ' v10 q0 5 6 5" fill="none" stroke="currentColor" stroke-width="1.8"/>',
    metaljig: (x, y) => '<path d="M' + x + ' ' + (y + 2) + ' q24 -8 52 0 q-24 8 -52 0z" fill="#B8C7D1" stroke="#45545E" stroke-width="1.2"/>' + treble(x + 54, y - 2)
  };
  E.lure = (y, o) => {
    const k = o.k || 'plug', surf = o.surface;
    return { h: 46, water: surf ? y + 8 : null, svg: '<line x1="' + CX + '" y1="' + y + '" x2="' + CX + '" y2="' + (y + 8) + '" stroke="currentColor" stroke-width="1.6"/>' + LURE[k](CX, y + 8), ay: y + 10, ax: CX - 4, tail: true };
  };
  function drawVertical(spec) {
    let y = 4, svg = '', water = null, calls = [], hasTail = false, lineFrom = null;
    spec.e.forEach(it => {
      const t = it[0], lab = it[1], o = it[2] || {};
      const r = E[t](y, o);
      if (r.water != null && water == null) water = r.water;
      svg += r.svg;
      if (lab) calls.push({ y: r.ay, x: r.ax != null ? r.ax : CX - 4, t: lab });
      if (r.extra && it[3]) calls.push({ y: r.extra.y, x: r.extra.x, t: it[3] });
      y += r.h;
    });
    const H = y + 6;
    const waterSvg = water != null ? '<path d="M0 ' + water + ' q15 -4 30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0" fill="none" stroke="#3E9CC4" stroke-width="1.6" opacity=".9"/><rect x="0" y="' + water + '" width="' + W + '" height="' + (H - water) + '" fill="#3E9CC4" opacity=".07"/>' : '';
    return { H: H, body: waterSvg + svg, calls: calls };
  }
  function drawLongline() {
    const H = 170, y0 = 56; let s = '<path d="M0 30 q15 -4 30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0" fill="none" stroke="#3E9CC4" stroke-width="1.6"/><rect x="0" y="30" width="' + W + '" height="' + (H - 30) + '" fill="#3E9CC4" opacity=".07"/>';
    s += '<circle cx="14" cy="26" r="8" fill="#F28C28" stroke="#9A4F0D"/><circle cx="' + (W - 14) + '" cy="26" r="8" fill="#F28C28" stroke="#9A4F0D"/><line x1="14" y1="34" x2="20" y2="' + y0 + '" stroke="currentColor" stroke-width="1.4"/><line x1="' + (W - 14) + '" y1="34" x2="' + (W - 20) + '" y2="' + y0 + '" stroke="currentColor" stroke-width="1.4"/>';
    s += '<line x1="20" y1="' + y0 + '" x2="' + (W - 20) + '" y2="' + y0 + '" stroke="currentColor" stroke-width="2"/>';
    for (let i = 0; i < 4; i++) { const x = 44 + i * 50; s += '<line x1="' + x + '" y1="' + y0 + '" x2="' + x + '" y2="' + (y0 + 40) + '" stroke="' + METAL + '" stroke-width="2.2"/>' + hookPath(x, y0 + 40, 0.9) + fish(x + 12, y0 + 58, 30, 1); if (i < 3) s += '<ellipse cx="' + (x + 25) + '" cy="' + (y0 + 6) + '" rx="4" ry="7" fill="' + LEAD + '" stroke="' + LEAD_D + '"/>'; }
    return { H: H, body: s, calls: [{ y: y0, x: 24, t: 0 }, { y: y0 + 24, x: 42, t: 1 }, { y: y0 + 6, x: 64, t: 2 }, { y: y0 + 60, x: 54, t: 3 }, { y: 26, x: 8, t: 4 }] };
  }
  function render(spec, esc) {
    let d;
    if (spec.longline) { d = drawLongline(); d.calls.forEach(c => { c.t = spec.longline[c.t]; }); d.calls = d.calls.filter(c => c.t); }
    else d = drawVertical(spec);
    /* أرقام البيانات: عمود على الشمال، مع منع التداخل */
    const sorted = d.calls.slice().sort((a, b) => a.y - b.y); let last = -99;
    sorted.forEach(c => { c.ly = Math.max(c.y, last + 19); last = c.ly; });
    const H = Math.max(d.H, last + 14);
    let marks = '';
    sorted.forEach((c, i) => {
      c.n = i + 1;
      marks += '<path d="M24 ' + c.ly + ' L' + (c.x - 4) + ' ' + c.y + '" stroke="var(--ink2)" stroke-width=".9" stroke-dasharray="2 2" fill="none" opacity=".75"/>' +
        '<circle cx="14" cy="' + c.ly + '" r="9" fill="var(--teal)"/><text x="14" y="' + (c.ly + 0.5) + '" text-anchor="middle" dominant-baseline="middle" font-size="10.5" font-weight="700" fill="var(--teal-ink)">' + c.n + '</text>';
    });
    return '<figure class="rig2" role="img" aria-label="رسم الأرمة"><div class="rig2art"><svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMin meet" style="color:var(--ink)">' + d.body + marks + '</svg></div>' +
      '<figcaption class="rig2leg"><ol>' + sorted.map(c => '<li><span class="rn">' + c.n + '</span><span>' + esc(c.t) + '</span></li>').join('') + '</ol>' +
      (spec.n && spec.n.length ? '<ul class="rignotes">' + spec.n.map(t => '<li>' + esc(t) + '</li>').join('') + '</ul>' : '') + '</figcaption></figure>';
  }
  return { render: render };
})();

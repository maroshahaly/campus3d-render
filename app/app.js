/* ============ دليل الصياد — منطق التطبيق ============ */
(function () {
  'use strict';
  const STANDALONE = !!window.__STANDALONE__;
  const DATA = JSON.parse(document.getElementById('data-json').textContent);
  const IMGS = JSON.parse(document.getElementById('imgs-json').textContent);
  const VIDS = (() => { const e = document.getElementById('vids-json'); try { return e ? JSON.parse(e.textContent) : {}; } catch (x) { return {}; } })();
  const SP = DATA.species, BY = {};
  SP.forEach(s => (BY[s.id] = s));
  const MONTHS = DATA.months.map(m => m.name);
  const NOW = new Date();
  const CUR = NOW.getMonth();

  /* ---------- أدوات ---------- */
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem('sayad:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('sayad:' + k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  };
  const norm = s => String(s || '').replace(/[ً-ْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/\s+/g, ' ').trim().toLowerCase();
  const _tf = {}, _of = {};
  const tfmt = (tz, o, key) => {
    const k = (tz || '') + '|' + key;
    if (!_tf[k]) { try { _tf[k] = new Intl.DateTimeFormat('ar-EG-u-nu-latn', Object.assign({}, o, tz ? { timeZone: tz } : {})); } catch (e) { _tf[k] = new Intl.DateTimeFormat('ar-EG-u-nu-latn', o); } }
    return _tf[k];
  };
  const curTz = () => { try { return getLoc().tz; } catch (e) { return undefined; } };
  const fmtT = { format: d => tfmt(curTz(), { hour: '2-digit', minute: '2-digit', hour12: true }, 't').format(d) };
  const fmtD = { format: d => tfmt(curTz(), { weekday: 'long', day: 'numeric', month: 'long' }, 'd').format(d) };
  const T = d => (d ? fmtT.format(d) : '—');
  /* فرق التوقيت بالمللي ثانية لمنطقة زمنية عند لحظة معينة، وبداية اليوم المحلي بتوقيت تلك المنطقة */
  function tzOff(ts, tz) {
    const dev = () => -new Date(ts).getTimezoneOffset() * 60000;
    if (!tz) return dev();
    let f = _of[tz];
    if (!f) { try { f = _of[tz] = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' }); } catch (e) { return dev(); } }
    const p = {}; f.formatToParts(new Date(ts)).forEach(x => (p[x.type] = +x.value));
    return Date.UTC(p.year, p.month - 1, p.day, p.hour % 24, p.minute, p.second) - Math.floor(ts / 1000) * 1000;
  }
  function dayStart(tz, d) {
    const off = tzOff(d.getTime(), tz), l = new Date(d.getTime() + off), base = Date.UTC(l.getUTCFullYear(), l.getUTCMonth(), l.getUTCDate());
    return base - tzOff(base - off, tz);
  }
  let hijri = '';
  try { hijri = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'long' }).format(NOW); } catch (e) { hijri = ''; }
  const toast = (m) => {
    let t = $('#toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = m; t.hidden = false; clearTimeout(toast._t); toast._t = setTimeout(() => (t.hidden = true), 2600);
  };

  /* ---------- أيقونات ---------- */
  const IC = {
    home: '<path d="M3 11.5 12 4l9 7.5M5.5 10v10h13V10"/>',
    cal: '<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M8 3v4M16 3v4M3.5 10h17"/>',
    fish: '<path d="M3 12c3-4.5 8-6 13-3.2L21 6.5v11L16 15c-5 2.8-10 1.3-13-3z"/><circle cx="8.5" cy="11" r=".9" fill="currentColor"/>',
    tools: '<circle cx="12" cy="12" r="8.5"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
    book: '<path d="M5 4.5h11a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
    moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/>',
    sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.3M12 19.2v2.3M2.5 12h2.3M19.2 12h2.3M5.3 5.3 7 7M17 17l1.7 1.7M5.3 18.7 7 17M17 7l1.7-1.7"/>',
    wave: '<path d="M2.5 9c2.2 0 2.2-2 4.5-2s2.3 2 4.5 2 2.3-2 4.5-2 2.3 2 4.5 2M2.5 15c2.2 0 2.2-2 4.5-2s2.3 2 4.5 2 2.3-2 4.5-2 2.3 2 4.5 2"/>',
    hook: '<path d="M12 3v11a4 4 0 1 1-4-4"/><circle cx="12" cy="3" r="1.3"/>',
    shield: '<path d="M12 3 4.5 6v5.5c0 4.5 3.2 8 7.5 9.5 4.3-1.5 7.5-5 7.5-9.5V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
    globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.6 3.6 5.5 3.6 8.5s-1 5.9-3.6 8.5c-2.6-2.6-3.6-5.5-3.6-8.5s1-5.9 3.6-8.5z"/>',
    knot: '<path d="M4 8c4-4 8 4 12 0s4 0 4 0M4 16c4-4 8 4 12 0"/>',
    pin: '<path d="M12 21s6.5-5.7 6.5-11A6.5 6.5 0 0 0 5.5 10C5.5 15.3 12 21 12 21z"/><circle cx="12" cy="10" r="2.3"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.4"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    back: '<path d="m9 5 7 7-7 7"/>',
    theme: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor"/>',
    camera: '<path d="M4 8.5h3.2L8.8 6h6.4l1.6 2.5H20a1 1 0 0 1 1 1V18a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.2" r="3.6"/>'
  };
  const ico = (n, sz) => '<svg width="' + (sz || 24) + '" height="' + (sz || 24) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + IC[n] + '</svg>';
  const FISHPH = '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + IC.fish + '</svg>';
  const img = n => IMGS[n] || '';
  const credit = k => { const c = PHOTO_CREDITS[k]; return c ? (c.lic === 'CC0' ? 'صورة حرة الاستخدام (CC0).' : c.lic === 'Pixabay' ? 'صورة حرة الاستخدام.' : 'تصوير: ' + esc(c.by) + ' — رخصة ' + esc(c.lic.replace('CC-', 'CC ')) + '.') : ''; };
  /* الشعار الرسمي (خطاف وسمكة) — مضمّن كـ SVG بمعرّفات فريدة لتفادي تعارض التدرجات عند التكرار في الصفحة */
  const LOGO_MARK = (sz, id) => {
    const g = 'lg' + id;
    return '<svg class="wmark-logo" width="' + (sz || 22) + '" height="' + Math.round((sz || 22) * 220 / 170) + '" viewBox="0 0 170 220" aria-hidden="true">' +
      '<defs><linearGradient id="' + g + '" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#f6d365"/><stop offset="55%" stop-color="#e8a800"/><stop offset="100%" stop-color="#c9860a"/></linearGradient></defs>' +
      '<g fill="none" stroke="url(#' + g + ')" stroke-width="15" stroke-linecap="round"><circle cx="70" cy="40" r="11"/>' +
      '<path d="M 70 51 L 73 146 C 75 178 100 197 128 189 C 152 182 161 156 144 140 C 132 129 115 133 112 146"/>' +
      '<path d="M 112 146 L 95 143" stroke-width="13"/></g>' +
      '<g transform="translate(30 150) rotate(-8)"><path d="M0 0 C 14 -12 36 -12 50 0 C 36 12 14 12 0 0 Z" fill="url(#' + g + ')"/><path d="M50 0 L 67 -10 L 61 0 L 67 10 Z" fill="url(#' + g + ')"/></g></svg>';
  };
  const BUILD_ID = (typeof window !== 'undefined' && window.__BUILD_ID__) || 'SYD-DEV';

  /* ---------- تحضير البيانات ---------- */
  const KIND = { 58: 'fresh', 168: 'fresh', 129: 'shell', 30: 'shell', 31: 'shell' };
  const KIND_L = { fish: 'أسماك بحرية', shell: 'رخويات وقشريات', fresh: 'مياه عذبة' };
  const SIZE_L = { L: 'كمية / أحجام كبيرة', M: 'كمية / أحجام متوسطة', S: 'كمية / أحجام صغيرة' };
  const SIZE_C = { L: 'var(--lv3)', M: 'var(--lv2)', S: 'var(--lv1)' };
  const monthSize = {}; /* id -> [12] */
  DATA.months.forEach((m, mi) => m.rows.forEach(r => { if (r.id) { (monthSize[r.id] = monthSize[r.id] || new Array(12).fill(null))[mi] = r.s; } }));
  SP.forEach(s => {
    s.kind = KIND[s.id] || 'fish';
    const ms = monthSize[s.id] || new Array(12).fill(null);
    const sum = (s.levels || []).reduce((a, b) => a + b, 0);
    s.lv = sum > 0 ? s.levels.slice() : ms.map(x => (x === 'L' ? 3 : x === 'M' ? 2 : x === 'S' ? 1 : 0));
    s.ms = ms;
    s.hay = norm([s.name, s.raw, s.en, s.bait, s.places, s.season, s.how].join(' '));
    s.nameHay = norm([s.name, s.raw, s.en].join(' '));
  });
  const inSeason = s => s.lv[CUR] >= 2 || s.ms[CUR] === 'L';

  /* ---------- نص عربي بفقرات مقروءة ---------- */
  function paras(t) {
    return String(t || '').split('\n').flatMap(line => {
      line = line.trim(); if (!line) return [];
      if (line.length < 380) return [line];
      const sents = line.replace(/([.!؟?])\s+/g, '$1\u0001').split('\u0001'), out = []; let cur = '';
      sents.forEach(x => { if ((cur + ' ' + x).length > 300 && cur) { out.push(cur.trim()); cur = x; } else cur += ' ' + x; });
      if (cur.trim()) out.push(cur.trim());
      return out;
    });
  }
  const prose = secs => '<div class="prose">' + secs.map(x => {
    const ps = paras(x.p).map(p => '<p>' + esc(p) + '</p>').join('');
    return x.h ? '<p><span class="lbl">' + esc(x.h) + '</span></p>' + ps : ps;
  }).join('') + '</div>';
  const figures = (imgs, alt) => imgs.map(n => '<button class="figure" data-zoom="' + n + '" aria-label="تكبير الصورة: ' + esc(alt) + '"><img loading="lazy" src="' + img(n) + '" alt="' + esc(alt) + '"><span class="figmag">' + ico('search', 18) + '</span></button>').join('');
  /* الرسم الموحّد له الأولوية دايمًا لو موثّق لهذه الطريقة؛ غير كده صورة الملف الأصلي (لو موجودة) أو المخطط العام المؤقت */
  const rigOrFig = m => (m.slide != null && RIGSPECS[m.slide]) ? rigPh(m) : (m.imgs.length ? figures(m.imgs, m.t) : rigPh(m));
  /* صندوق بحث موحّد: زر عدسة شغّال يقفل الكيبورد ويرسل النموذج، وزر كاميرا لبحث بصورة السمكة. */
  const searchForm = (id, val, ph, label, formKey) => '<form class="search" data-form="' + (formKey || 'qq') + '" role="search"><input id="' + id + '" type="search" value="' + esc(val || '') + '" placeholder="' + esc(ph) + '" aria-label="' + esc(label) + '">' +
    '<span class="searchico"><button type="submit" aria-label="بحث">' + ico('search', 20) + '</button>' +
    '<label aria-label="ابحث بصورة السمكة">' + ico('camera', 18) + '<input type="file" class="photoq" accept="image/*" capture="environment"></label></span></form>';
  /* ---- رسم موحّد ومقاس لكل أرمة/قرمة، مبني على أرقام حقيقية مأخوذة من شرح الطريقة نفسه (مش تخمين) ----
     spec: { main: طول الشعر الأساسي, leaderLen: طول الفروع, hooks: عدد السنانير, hookSize: نمرة السنارة,
             weight: وصف الرصاص, weightPos: 'end'|'above', bait: الطعم, note: ملاحظة قصيرة, title: عنوان الأرمة } */
  /* خطاف سنارة واضح الشكل (مش علامة مجردة): ساق + انحناء + شُص، بحجم ثابت فى كل الرسومات */
  /* خطاف حقيقي الشكل: عين دائرية + ساق مستقيم + انحناء دائري واضح + سن راجع لفوق مع شُص صغير، ورقم نمرته مكتوب جنبه مباشرة */
  const hookGlyph = (x, y, size) => '<g>' +
    '<circle cx="' + x + '" cy="' + y + '" r="2.5" fill="none" stroke="currentColor" stroke-width="2"/>' +
    '<line x1="' + x + '" y1="' + (y + 2.5) + '" x2="' + x + '" y2="' + (y + 19) + '" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>' +
    '<path d="M' + x + ' ' + (y + 19) + ' A 9 9 0 0 0 ' + (x + 18) + ' ' + (y + 19) + '" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>' +
    '<line x1="' + (x + 18) + '" y1="' + (y + 19) + '" x2="' + (x + 18) + '" y2="' + (y + 8) + '" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>' +
    '<path d="M' + (x + 18) + ' ' + (y + 11) + ' l-4 2.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>' +
    (size ? '<text x="' + (x + 24) + '" y="' + (y + 16) + '" font-size="10.5" font-weight="700" fill="currentColor" text-anchor="start">نمرة ' + esc(size) + '</text>' : '') +
    '</g>';
  /* تسمية مكتوبة مايلة بالظبط على اتجاه الخط نفسه (زي رسومات المهندسين)، مش موضوعة عشوائي أو مغطّاة بالرسمة:
     بتحسب زاوية الخط وتكتب عليه مباشرة مع إزاحة بسيطة جنبه عشان الخط نفسه يفضل ظاهر تحتها */
  const slantLabel = (x1, y1, x2, y2, t, frac, gap) => {
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
    let ang = Math.atan2(dy, dx) * 180 / Math.PI;
    if (ang > 90) ang -= 180; else if (ang < -90) ang += 180;
    const px = x1 + dx * (frac == null ? 0.5 : frac), py = y1 + dy * (frac == null ? 0.5 : frac);
    const side = (x1 + x2) / 2 >= 0 ? 1 : 1; /* احتياطي لو احتجنا لاحقًا نعكس الجهة */
    const nx = (-dy / len), ny = (dx / len);
    const d = gap == null ? 9 : gap, sgn = dx >= 0 ? -1 : 1;
    const lx = px + nx * d * sgn, ly = py + ny * d * sgn;
    return '<text x="' + lx + '" y="' + ly + '" transform="rotate(' + ang.toFixed(1) + ' ' + lx.toFixed(1) + ' ' + ly.toFixed(1) + ')" font-size="11.5" font-weight="700" fill="currentColor" text-anchor="middle" dominant-baseline="middle">' + esc(t) + '</text>';
  };
  function rigDraw(o) {
    const W = 360, branchY = o.weightPos === 'above' ? 150 : 230, mainBottom = branchY;
    const total = o.hooks || 1, many = total > 5;
    /* لو العدد كبير: نرسم أول واحد وآخر واحد بخطوط وخطاطيف حقيقية، والوسط خطوط متقطعة (بدون خطاف) تدل على باقي العدد المذكور فى الشرح تحت */
    const n = Math.min(total, 5);
    const spread = n <= 1 ? [0] : Array.from({ length: n }, (_, i) => -1 + (2 * i) / (n - 1));
    const hookY = branchY + 70;
    let firstEdge = null;
    const branches = spread.map((dx, i) => {
      const x2 = W / 2 + dx * 115;
      const isEdge = !many || i === 0 || i === n - 1;
      if (isEdge && firstEdge === null) firstEdge = { x1: W / 2, y1: branchY, x2: x2, y2: hookY };
      const dash = isEdge ? '' : ' stroke-dasharray="4 4"';
      const line = '<line x1="' + (W / 2) + '" y1="' + branchY + '" x2="' + x2 + '" y2="' + hookY + '" stroke="currentColor" stroke-width="2"' + dash + '/>';
      return line + (isEdge ? hookGlyph(x2, hookY, o.hookSize) : '');
    }).join('');
    const weightY = hookY + 48;
    const weightSvg = o.weightPos === 'above'
      ? '<ellipse cx="' + (W / 2) + '" cy="' + (branchY - 22) + '" rx="7" ry="15" fill="var(--gold)"/>'
      : '<ellipse cx="' + (W / 2) + '" cy="' + weightY + '" rx="7" ry="15" fill="var(--gold)"/>';
    const weightLineSvg = o.weightPos === 'above'
      ? '<line x1="' + (W / 2) + '" y1="' + (branchY - 37) + '" x2="' + (W / 2) + '" y2="' + branchY + '" stroke="currentColor" stroke-width="2"/>'
      : '<line x1="' + (W / 2) + '" y1="' + (hookY + 19) + '" x2="' + (W / 2) + '" y2="' + (weightY - 15) + '" stroke="currentColor" stroke-width="2"/>';
    /* تسمية طول الشعر الأساسي مكتوبة مايلة بالظبط على خطه، وتسمية طول الفرع مكتوبة مايلة على أول خط فرع حقيقي */
    const onSvg = [
      o.main ? slantLabel(W / 2, 18, W / 2, mainBottom, 'الشعر الأساسي: ' + o.main, 0.42, 11) : '',
      o.leaderLen && firstEdge ? slantLabel(firstEdge.x1, firstEdge.y1, firstEdge.x2, firstEdge.y2, 'الفرع: ' + o.leaderLen, 0.4, 11) : ''
    ].join('');
    const belowSvg = [
      o.weight ? 'الرصاص: ' + o.weight : null,
      many ? 'العدد الكلي: ' + o.hooks + ' سنارة' : null,
      o.bait ? 'الطُّعم: ' + o.bait : null
    ].filter(Boolean);
    const h = o.weightPos === 'above' ? hookY + 34 : weightY + 24;
    return '<div class="rigph rigreal" role="img" aria-label="مخطط ' + esc(o.title || 'الأرمة') + ' بمقاساتها الحقيقية"><svg viewBox="0 0 ' + W + ' ' + h + '" width="100%" height="' + Math.min(h, 300) + '">' +
      '<line x1="' + (W / 2) + '" y1="18" x2="' + (W / 2) + '" y2="' + mainBottom + '" stroke="currentColor" stroke-width="2"/>' +
      '<circle cx="' + (W / 2) + '" cy="14" r="5" fill="none" stroke="currentColor" stroke-width="2"/>' +
      weightLineSvg + branches + weightSvg + onSvg +
      '</svg>' + (belowSvg.length ? '<dl class="rigfacts">' + belowSvg.map(t => '<dd>' + esc(t) + '</dd>').join('') + '</dl>' : '') +
      '<div class="muted small">' + (o.note ? esc(o.note) + ' — ' : '') + 'المقاسات من شرح الطريقة فوق، مش رسم عام.</div></div>';
  }
  /* مفاتيح RIGSPECS = رقم الشريحة (slide) الخاص بالطريقة في ملف مصر، بحيث كل رسم مربوط بنص حقيقي قرأناه بنفسنا */
  const RIGSPECS = {
    45: { title: 'الفلة', main: '25', leaderLen: '15–20', hooks: 1, hookSize: '20–25', weight: 'بدون رصاصة ثابتة (فلة تعويم)', weightPos: 'end', bait: 'عجينة طرية', note: 'شعر الفروع قصير (25 و15/20 سم)، والعمق نص عمق المية' },
    46: { title: 'الربع (المشنقة)', main: '25', leaderLen: '15–20', hooks: 6, hookSize: '5–6', weight: 'رصاص شريط حوالين مكان توصيل السنانير', weightPos: 'above', bait: 'عجينة ناشفة أو سردين', note: 'من 5 إلى 7 سنانير: 3 منها طولها 10 سم والباقي حوالي 5 سم' },
    47: { title: 'البوصة', main: '40', leaderLen: '30–35', hooks: 20, hookSize: '18–20', weight: 'رصاصة عادية', weightPos: 'above', bait: 'عيش بلدي أسمر ملفوف بالاستيك', note: 'من 15 إلى 25 سنارة بنفس الطول (15 سم)، كلها متوصلة فوق الرصاصة بـ30 سم' },
    180: { title: 'السندوتش', main: '40', leaderLen: '', hooks: 12, hookSize: '6', weight: 'شمندورة فيها رصاص + رصاص تحتها', weightPos: 'above', bait: 'شريحة رغيف أو عيش شامي ملفوفة حوالين السنانير', note: '10 إلى 14 سنارة ملفوفة داخل شريحة الرغيف على هيئة سندوتش' }
  };
  /* مخطط عام مؤقت لأي طريقة لسه ملهاش رقم حقيقي موثّق — يستبدل أي صورة قديمة عليها علامة جهة تانية أو رسم غير واضح */
  const rigPh = m => {
    const spec = m && m.slide != null ? RIGSPECS[m.slide] : null;
    if (spec) return rigDraw(spec);
    return '<div class="rigph" role="img" aria-label="مخطط عام لتجهيزة الصيد"><svg viewBox="0 0 220 160" width="100%" height="140">' +
      '<line x1="110" y1="6" x2="110" y2="55" stroke="currentColor" stroke-width="2"/>' +
      '<circle cx="110" cy="55" r="5" fill="none" stroke="currentColor" stroke-width="2"/>' +
      '<ellipse cx="110" cy="80" rx="7" ry="14" fill="var(--gold)"/>' +
      '<line x1="110" y1="94" x2="60" y2="140" stroke="currentColor" stroke-width="2"/>' +
      '<line x1="110" y1="94" x2="110" y2="140" stroke="currentColor" stroke-width="2"/>' +
      '<line x1="110" y1="94" x2="160" y2="140" stroke="currentColor" stroke-width="2"/>' +
      '<path d="M60 140 q-8 14 6 16" fill="none" stroke="currentColor" stroke-width="2"/>' +
      '<path d="M110 140 q-8 14 6 16" fill="none" stroke="currentColor" stroke-width="2"/>' +
      '<path d="M160 140 q-8 14 6 16" fill="none" stroke="currentColor" stroke-width="2"/>' +
      '</svg><div class="muted small">مخطط عام تقريبي للتجهيزة لحد ما نوثّق مقاساتها الحقيقية من شرحها — مش طريقة بديلة.</div></div>';
  };

  /* ---------- الموقع والحسابات الفلكية ---------- */
  /* [الاسم, عرض, طول, منطقة زمنية, m بحري / f عذب] */
  const PRESETS = [
    ['الإسكندرية (مصر)', 31.2001, 29.9187, 'Africa/Cairo', 'm'], ['بورسعيد (مصر)', 31.2653, 32.3019, 'Africa/Cairo', 'm'], ['دمياط (مصر)', 31.4165, 31.8133, 'Africa/Cairo', 'm'], ['مرسى مطروح (مصر)', 31.3543, 27.2373, 'Africa/Cairo', 'm'],
    ['العريش (مصر)', 31.1316, 33.7984, 'Africa/Cairo', 'm'], ['السويس (مصر)', 29.9668, 32.5498, 'Africa/Cairo', 'm'], ['الغردقة (مصر)', 27.2579, 33.8116, 'Africa/Cairo', 'm'], ['شرم الشيخ (مصر)', 27.9158, 34.33, 'Africa/Cairo', 'm'],
    ['القاهرة — النيل (مصر)', 30.0444, 31.2357, 'Africa/Cairo', 'f'], ['أسوان — بحيرة ناصر (مصر)', 24.0889, 32.8998, 'Africa/Cairo', 'f'],
    ['جدة (السعودية)', 21.5433, 39.1728, 'Asia/Riyadh', 'm'], ['دبي (الإمارات)', 25.2048, 55.2708, 'Asia/Dubai', 'm'], ['مسقط (عُمان)', 23.588, 58.3829, 'Asia/Muscat', 'm'], ['الدوحة (قطر)', 25.2854, 51.531, 'Asia/Qatar', 'm'],
    ['الكويت', 29.3759, 47.9774, 'Asia/Kuwait', 'm'], ['بيروت (لبنان)', 33.8938, 35.5018, 'Asia/Beirut', 'm'], ['عدن (اليمن)', 12.7855, 45.0187, 'Asia/Aden', 'm'],
    ['تونس', 36.8065, 10.1815, 'Africa/Tunis', 'm'], ['الجزائر', 36.7538, 3.0588, 'Africa/Algiers', 'm'], ['طرابلس (ليبيا)', 32.8872, 13.1913, 'Africa/Tripoli', 'm'], ['الدار البيضاء (المغرب)', 33.5731, -7.5898, 'Africa/Casablanca', 'm'],
    ['مرسيليا (فرنسا)', 43.2965, 5.3698, 'Europe/Paris', 'm'], ['برشلونة (إسبانيا)', 41.3851, 2.1734, 'Europe/Madrid', 'm'], ['إسطنبول (تركيا)', 41.0082, 28.9784, 'Europe/Istanbul', 'm'], ['أثينا (اليونان)', 37.9838, 23.7275, 'Europe/Athens', 'm'],
    ['لشبونة (البرتغال)', 38.7223, -9.1393, 'Europe/Lisbon', 'm'], ['لندن (بريطانيا)', 51.5074, -0.1278, 'Europe/London', 'm'], ['ترومسو (النرويج)', 69.6492, 18.9553, 'Europe/Oslo', 'm'], ['ريكيافيك (أيسلندا)', 64.1466, -21.9426, 'Atlantic/Reykjavik', 'm'],
    ['زيورخ — بحيرات (سويسرا)', 47.3769, 8.5417, 'Europe/Zurich', 'f'],
    ['ميامي (أمريكا)', 25.7617, -80.1918, 'America/New_York', 'm'], ['نيو أورلينز (أمريكا)', 29.9511, -90.0715, 'America/Chicago', 'm'], ['بوسطن (أمريكا)', 42.3601, -71.0589, 'America/New_York', 'm'], ['سان دييغو (أمريكا)', 32.7157, -117.1611, 'America/Los_Angeles', 'm'],
    ['أنكوراج (ألاسكا)', 61.2181, -149.9003, 'America/Anchorage', 'm'], ['هونولولو (هاواي)', 21.3069, -157.8583, 'Pacific/Honolulu', 'm'], ['فانكوفر (كندا)', 49.2827, -123.1207, 'America/Vancouver', 'm'], ['شيكاغو — البحيرات العظمى', 41.8781, -87.6298, 'America/Chicago', 'f'],
    ['كانكون (المكسيك)', 21.1619, -86.8515, 'America/Cancun', 'm'], ['بنما سيتي', 8.9824, -79.5199, 'America/Panama', 'm'], ['ريو دي جانيرو (البرازيل)', -22.9068, -43.1729, 'America/Sao_Paulo', 'm'], ['مانوس — الأمازون (البرازيل)', -3.119, -60.0217, 'America/Manaus', 'f'],
    ['بوينس آيرس (الأرجنتين)', -34.6037, -58.3816, 'America/Argentina/Buenos_Aires', 'm'], ['فالبارايسو (تشيلي)', -33.0472, -71.6127, 'America/Santiago', 'm'], ['ليما (بيرو)', -12.0464, -77.0428, 'America/Lima', 'm'],
    ['كيب تاون (جنوب إفريقيا)', -33.9249, 18.4241, 'Africa/Johannesburg', 'm'], ['ديربان (جنوب إفريقيا)', -29.8587, 31.0218, 'Africa/Johannesburg', 'm'], ['داكار (السنغال)', 14.7167, -17.4677, 'Africa/Dakar', 'm'], ['لاغوس (نيجيريا)', 6.5244, 3.3792, 'Africa/Lagos', 'm'],
    ['ممباسا (كينيا)', -4.0435, 39.6682, 'Africa/Nairobi', 'm'], ['زنجبار (تنزانيا)', -6.1659, 39.2026, 'Africa/Dar_es_Salaam', 'm'], ['كامبالا — بحيرة فيكتوريا (أوغندا)', 0.3476, 32.5825, 'Africa/Kampala', 'f'], ['بحيرة كاريبا (زامبيا/زيمبابوي)', -16.5, 28.8, 'Africa/Harare', 'f'],
    ['مومباي (الهند)', 19.076, 72.8777, 'Asia/Kolkata', 'm'], ['كولومبو (سريلانكا)', 6.9271, 79.8612, 'Asia/Colombo', 'm'], ['ماليه (المالديف)', 4.1755, 73.5093, 'Indian/Maldives', 'm'], ['بوكيت (تايلاند)', 7.8804, 98.3923, 'Asia/Bangkok', 'm'],
    ['سنغافورة', 1.3521, 103.8198, 'Asia/Singapore', 'm'], ['مانيلا (الفلبين)', 14.5995, 120.9842, 'Asia/Manila', 'm'], ['بالي (إندونيسيا)', -8.4095, 115.1889, 'Asia/Makassar', 'm'], ['هونغ كونغ', 22.3193, 114.1694, 'Asia/Hong_Kong', 'm'],
    ['طوكيو (اليابان)', 35.6762, 139.6503, 'Asia/Tokyo', 'm'], ['بوسان (كوريا)', 35.1796, 129.0756, 'Asia/Seoul', 'm'],
    ['سيدني (أستراليا)', -33.8688, 151.2093, 'Australia/Sydney', 'm'], ['كيرنز (أستراليا)', -16.9203, 145.771, 'Australia/Brisbane', 'm'], ['بيرث (أستراليا)', -31.9505, 115.8605, 'Australia/Perth', 'm'], ['نهر مورّاي — ألبوري (أستراليا)', -36.0737, 146.9135, 'Australia/Sydney', 'f'],
    ['أوكلاند (نيوزيلندا)', -36.8485, 174.7633, 'Pacific/Auckland', 'm'], ['سوفا (فيجي)', -18.1248, 178.4501, 'Pacific/Fiji', 'm']
  ];
  const getLoc = () => store.get('loc', { name: 'الإسكندرية', lat: 31.2001, lng: 29.9187, def: true });
  function dayInfo(loc, when) {
    const t0 = dayStart(loc.tz, when || new Date()), d = new Date(t0 + 12 * 3600000);
    const sun = Astro.sunTimes(d, loc.lat, loc.lng), mo = Astro.moonEvents(d, loc.lat, loc.lng, t0), ph = Astro.moonPhase(d);
    const slots = [];
    (mo.upper || []).forEach(t => slots.push({ t, kind: 'major', label: 'ذروة القمر (فوق رأسك)' }));
    (mo.lower || []).forEach(t => slots.push({ t, kind: 'major', label: 'ذروة القمر السفلية' }));
    (mo.rise || []).forEach(t => slots.push({ t, kind: 'minor', label: 'شروق القمر' }));
    (mo.set || []).forEach(t => slots.push({ t, kind: 'minor', label: 'غروب القمر' }));
    slots.sort((a, b) => a.t - b.t);
    const spring = Math.min(Math.abs(ph.phase - 0), Math.abs(ph.phase - 1), Math.abs(ph.phase - 0.5)) < 0.07;
    return { sun, mo, ph, slots, spring, next: Astro.nextSyzygy(d) };
  }
  function moonSvg(ph) { /* رسم القمر بمنطقة مضيئة تقريبية */
    const p = ph.phase, r = 34, cx = 40, cy = 40, k = Math.cos(p * 2 * Math.PI); /* +1 محاق ... -1 بدر */
    const waxing = p < 0.5, rx = Math.abs(k) * r;
    /* شكل الجزء المضيء: نصف دائرة + نصف قطع ناقص */
    const sweepOuter = waxing ? 1 : 0, sweepInner = (k > 0) === waxing ? 1 : 0;
    const path = 'M' + cx + ' ' + (cy - r) + ' A' + r + ' ' + r + ' 0 0 ' + sweepOuter + ' ' + cx + ' ' + (cy + r) + ' A' + rx.toFixed(1) + ' ' + r + ' 0 0 ' + sweepInner + ' ' + cx + ' ' + (cy - r) + 'Z';
    return '<svg class="moonicon" viewBox="0 0 80 80" role="img" aria-label="' + esc(Astro.phaseName(p)) + '"><circle cx="40" cy="40" r="34" fill="var(--lv0)" stroke="var(--line)"/><path d="' + path + '" fill="var(--gold)"/></svg>';
  }

  /* ---------- الشرائح المساعدة ---------- */
  const strip = s => '<div class="strip" aria-hidden="true">' + s.lv.map((l, i) => '<i class="l' + l + (i === CUR ? ' cur' : '') + '"></i>').join('') + '</div>';
  function fcard(s) {
    const im = s.photo ? '<img loading="lazy" alt="" src="' + img(s.photo) + '">' : FISHPH;
    return '<a class="fcard" href="#/fish/' + s.id + '"><span class="ph">' + im + '</span><span style="min-width:0;flex:1"><b>' + esc(s.name) + '</b>' +
      (inSeason(s) ? '<span class="tag ok">موسمها الآن</span>' : '<span class="muted small">' + KIND_L[s.kind] + '</span>') + strip(s) + '</span></a>';
  }
  const backBtn = (href, label) => '<a class="btn ghost small" href="' + href + '">' + esc(label || 'رجوع') + '</a>';
  const seg = (items, cur, key) => '<div class="seg" role="tablist">' + items.map(([k, l]) => '<button role="tab" data-seg="' + key + '" data-k="' + k + '" aria-selected="' + (k === cur ? 'true' : 'false') + '">' + esc(l) + '</button>').join('') + '</div>';

  /* ---------- العروض ---------- */
  const V = {};

  V.home = function () {
    const loc = getLoc(), di = dayInfo(loc);
    const top = candidates(loc, { h: 'all', sst: null }).filter(c => c.sc[CUR] === 3).slice(0, 8);
    return '<div class="stack-lg">' +
      '<section class="hero stack"><div><div class="eyebrow" style="color:var(--gold)">للهواة والمحترفين · بحار العالم وأنهاره</div><h1 class="h1">الصنّارة</h1></div>' +
      '<p>أي سمكة تصطاد الآن في مكانك، ومتى؟ مواسم أنواع الأسماك من مختلف قارات العالم تتكيّف تلقائيًا مع موقعك ونصف الكرة الذي تصطاد فيه، وتحدَّد أفضل أوقات اليوم والأسبوع للصيد، إلى جانب ملف «مساعد الصيد» التفصيلي، وأدوات تعمل بلا إنترنت، ومراجع موثوقة ومجانية.</p>' +
      searchForm('q0', '', 'ابحث باسم السمكة (عربي أو إنجليزي أو علمي) أو الطُّعم', 'بحث', 'q') + '</section>' +
      '<section class="card stack"><div class="row between"><h2 class="h2" style="margin:0">الأنسب الآن — ' + esc(loc.name) + '</h2><a class="btn ghost small" href="#/here">التفاصيل والأوقات</a></div>' + locSummary(loc) +
      (top.length ? '<div class="chips">' + top.map(c => '<a class="chip" href="#/sp/' + c.s.id + '">' + esc(c.s.ar) + '</a>').join('') + '</div>' : '<div class="muted small">لا أنواع بذروة هذا الشهر في هذا الموقع. افتح «هنا الآن» لترى الجيد والمتوسط.</div>') +
      (loc.def ? '<a class="btn" href="#/here">' + ico('pin', 20) + ' حدّد موقعك لتحصل على أسماك مكانك</a><div class="muted small">الموقع الافتراضي الإسكندرية.</div>' : '') + '</section>' +
      '<section class="card stack"><h2 class="h2" style="margin:0">اليوم</h2>' +
      '<div class="row" style="flex-wrap:nowrap">' + moonSvg(di.ph) + '<div class="now" style="flex:1;min-width:0"><div><b class="num">' + T(di.sun.rise) + '</b><span>شروق الشمس</span></div><div><b class="num">' + T(di.sun.set) + '</b><span>غروب الشمس</span></div><div><b>' + Astro.phaseName(di.ph.phase).split(' ')[0] + '</b><span>القمر ' + Math.round(di.ph.fraction * 100) + '%</span></div></div></div></section>' +
      '<section><div class="tiles">' +
      tile('#/here', 'pin', 'هنا الآن', 'أنواعك وأوقاتك حسب موقعك') +
      tile('#/species', 'fish', 'الأنواع', 'بحر ونهر من كل العالم') +
      tile('#/here?t=map', 'globe', 'الخريطة', 'موقعك ونطاق انتشار كل نوع') +
      tile('#/here?t=tide', 'wave', 'مد وجزر', 'مد وموج ورياح وضغط') +
      tile('#/fish', 'fish', 'ملف مصر', 'أرمات وصور وجداول شهرية') +
      tile('#/tools', 'tools', 'أدوات', 'شمس وقمر وبحر وسجل صيد') +
      tile('#/tech', 'hook', 'الترقيد والسبحة', 'شرح مفصل من الملف') +
      tile('#/world', 'globe', 'دليل التقنيات', 'طرق وعقد وخيوط') +
      tile('#/safety', 'shield', 'السلامة', 'قبل الخروج والإسعاف') +
      tile('#/months', 'cal', 'جدول مصر الشهري', 'من الملف الأصلي') +
      '<a class="tile wide" href="#/links">' + ico('book', 30) + '<div><b>المراجع والمواقع المجانية</b><span>' + LINKS.length + ' مرجعًا: خطط الرحلة والتعريف والقوانين حسب البلد</span></div></a>' +
      '</div></section>' +
      (STANDALONE ? '<p class="muted small" style="text-align:center">يعمل بدون إنترنت بعد فتحه مرة. توقعات البحر وحرارة الماء الحية تحتاج إنترنت.</p>' : '') +
      '</div>';
  };
  const tile = (href, ic, b, s) => '<a class="tile" href="' + href + '">' + ico(ic, 30) + '<b>' + esc(b) + '</b><span>' + esc(s) + '</span></a>';

  V.months = function () {
    return '<div class="stack"><div><div class="eyebrow">الجدول الشهري</div><h1 class="h1">اختر الشهر</h1><p class="muted">أسماك كل شهر مقسّمة حسب الكمية والحجم، من جداول الملف (مصر: الإسكندرية والبحر الأحمر).</p></div>' +
      '<div class="monthgrid">' + MONTHS.map((m, i) => '<a href="#/month/' + i + '"' + (i === CUR ? ' class="cur"' : '') + '>' + m + '<small>' + DATA.months[i].rows.length + ' نوعًا' + (i === CUR ? ' · الآن' : '') + '</small></a>').join('') + '</div></div>';
  };

  V.month = function (a) {
    const i = Math.max(0, Math.min(11, +a[0] || 0)), rows = DATA.months[i].rows;
    const grp = k => rows.filter(r => r.s === k).map(r => r.id ? '<a class="chip" href="#/fish/' + r.id + '">' + esc(r.n) + '</a>' : '<span class="chip">' + esc(r.n) + '</span>').join('');
    const block = (k, cls) => '<div class="sizeblock"><h3><span class="dot" style="background:' + SIZE_C[k] + '"></span>' + SIZE_L[k] + '</h3><div class="chips">' + (grp(k) || '<span class="muted small">لا شيء</span>') + '</div></div>';
    return '<div class="stack"><div class="row between"><div><div class="eyebrow">الجدول الشهري</div><h1 class="h1">' + MONTHS[i] + '</h1></div><a class="btn ghost small" href="#/months">شهر آخر</a></div>' +
      block('L') + block('M') + block('S') +
      '<div class="row between">' + '<a class="btn ghost" href="#/month/' + ((i + 11) % 12) + '">الشهر السابق</a><a class="btn" href="#/month/' + ((i + 1) % 12) + '">الشهر التالي</a></div>' +
      '<p class="muted small">المصدر: جداول الملف الأصلي. الأحجام والكميات تقديرات ميدانية لمصر وليست قياسًا علميًا.</p></div>';
  };

  let fishQ = '', fishF = 'all';
  V.fishlist = function (a, qs) {
    if (qs.q != null) fishQ = qs.q;
    return '<div class="stack"><div class="row between"><div><div class="eyebrow">ملف مساعد الصيد (مصر)</div><h1 class="h1">أسماك الملف</h1></div><a class="btn ghost small" href="#/species">الأنواع العالمية</a></div>' +
      searchForm('fq', fishQ, 'ابحث باسم السمكة أو الطُّعم أو المكان', 'بحث في الأسماك') +
      '<div class="chips" id="ff">' + [['all', 'الكل'], ['now', 'موسمها الآن'], ['fish', 'أسماك بحرية'], ['shell', 'رخويات وقشريات'], ['fresh', 'مياه عذبة']].map(([k, l]) => '<button class="chip" data-ff="' + k + '" aria-pressed="' + (fishF === k) + '">' + l + '</button>').join('') + '</div>' +
      '<div id="flist" class="fishgrid"></div></div>';
  };
  function drawFishList() {
    const el = $('#flist'); if (!el) return;
    const toks = norm(fishQ).split(' ').filter(Boolean), qf = norm(fishQ).replace(/ /g, '').length <= 2 ? 'nameHay' : 'hay';
    let list = SP.filter(s => toks.every(t => s[qf].indexOf(t) > -1));
    if (fishF === 'now') list = list.filter(inSeason); else if (fishF !== 'all') list = list.filter(s => s.kind === fishF);
    list.sort((x, y) => (y.lv[CUR] - x.lv[CUR]) || x.name.localeCompare(y.name, 'ar'));
    el.innerHTML = list.length ? list.map(fcard).join('') : '<div class="empty" style="grid-column:1/-1">لا نتائج. جرّب كلمة أقصر أو فلترًا آخر.</div>';
  }

  V.fish = function (a) {
    const s = BY[+a[0]]; if (!s) return '<div class="empty">لم أجد هذه السمكة. <a href="#/fish">كل الأسماك</a></div>';
    const missing = []; if (!s.methods.length) missing.push('طرق الصيد'); if (!s.rigs.length) missing.push('صور الأرمات'); if (!s.notes.length) missing.push('الملاحظات'); if (!s.places) missing.push('أماكن الصيد');
    const linkedW = DECK_REV[s.id] && BYG[DECK_REV[s.id]];
    const facts = [['الفصيلة', linkedW && linkedW.fam], ['الطعم', s.bait], ['أماكن الصيد', s.places], ['المواسم والأوقات', s.season], ['طريقة الصيد', s.how], ['القرمة', s.rigtxt]].filter(x => x[1]);
    const sizes = s.ms.some(Boolean) ? '<div class="stack"><h2 class="h2" style="margin:0">الكمية والحجم حسب الشهر (جدول الملف)</h2><div class="tablewrap"><table><thead><tr>' + MONTHS.map(m => '<th>' + m + '</th>').join('') + '</tr></thead><tbody><tr>' + s.ms.map(x => '<td>' + (x ? '<span class="dot" style="background:' + SIZE_C[x] + ';margin-inline-end:4px"></span>' + { L: 'كبيرة', M: 'متوسطة', S: 'صغيرة' }[x] : '<span class="muted">—</span>') + '</td>').join('') + '</tr></tbody></table></div></div>' : '';
    const chart = s.lv.some(x => x > 0) ? '<section class="card stack"><h2 class="h2" style="margin:0">ذروة الموسم على مدار السنة (%)</h2><div class="bars" role="img" aria-label="نسبة ذروة موسم ' + esc(s.name) + ' في كل شهر">' + s.lv.map((l, i) => { const pct = Math.round(l * 100 / 3); return '<div class="col l' + l + (i === CUR ? ' cur' : '') + '"><b class="pct">' + pct + '%</b><div class="batt"><i style="height:' + pct + '%"></i></div><span>' + MONTHS[i].slice(0, 3) + '</span></div>'; }).join('') + '</div>' +
      '<div class="legend"><span><i style="background:var(--lv0)"></i>0%</span><span><i style="background:var(--lv1)"></i>33%</span><span><i style="background:var(--lv2)"></i>66%</span><span><i style="background:var(--lv3)"></i>100%</span></div>' + '</section>' : '';
    const acc = (arr, title, open) => arr.length ? '<section class="stack"><h2 class="h2" style="margin:0">' + title + '</h2><div>' + arr.map((m, i) => '<details class="acc"' + (open && i === 0 ? ' open' : '') + '><summary>' + esc(m.t) + '</summary><div class="body stack">' + (m.secs.length ? prose(m.secs) : '') + rigOrFig(m) + '</div></details>').join('') + '</div></section>' : '';
    /* طرق الصيد في ملف مصر نصوص حرة بدون كود؛ نخمّن فئتها من عنوانها لعرضها مبوّبة (سنارة/رمح/شبكة/فخ/يد) */
    const METH_KW = [['net', /شبك|طرح|خيش/], ['spear', /بندقي|رمح|غطس|حرب/], ['trap', /فخ|قفص|مصيدة/], ['hand', /باليد|القاء اليد| اليد /]];
    const methCat = t => { const kw = METH_KW.find(([, re]) => re.test(t || '')); return kw ? kw[0] : 'rod'; };
    const CAT_L2 = Object.assign({ other: 'طرق أخرى' }, HOWCAT_L);
    const methAcc = (arr, title) => {
      if (!arr.length) return '';
      const groups = {}; arr.forEach(m => { const c = methCat(m.t); (groups[c] = groups[c] || []).push(m); });
      let firstDone = false;
      const body = HOWCAT_ORDER.concat(['other']).filter(c => groups[c] && groups[c].length).map(c => '<div class="stack"><div class="small" style="font-weight:700;color:var(--ink2)">' + esc(CAT_L2[c]) + '</div>' + groups[c].map(m => { const openFirst = !firstDone; firstDone = true; return '<details class="acc"' + (openFirst ? ' open' : '') + '><summary>' + esc(m.t) + '</summary><div class="body stack">' + (m.secs.length ? prose(m.secs) : '') + rigOrFig(m) + '</div></details>'; }).join('') + '</div>').join('');
      return '<section class="stack"><h2 class="h2" style="margin:0">' + title + '</h2>' + body + '</section>';
    };
    const rigs = s.rigs.length ? '<section class="stack"><h2 class="h2" style="margin:0">الأرمات والقرم</h2><div class="stack">' + s.rigs.map(m => '<div class="stack"><div class="small" style="font-weight:700">' + esc(m.t) + '</div>' + (m.secs.length ? prose(m.secs) : '') + rigOrFig(m) + '</div>').join('') + '</div></section>' : '';
    return '<div class="stack-lg"><div class="row between"><a class="btn ghost small" href="#/fish">كل الأسماك</a>' + (inSeason(s) ? '<span class="tag ok">موسمها الآن</span>' : '') + '</div>' +
      '<header class="stack"><div><h1 class="h1">' + esc(s.name) + '</h1>' + (s.en ? '<div class="muted latin" style="margin-top:2px">' + esc(s.en) + '</div>' : '') + '</div><div class="chips"><span class="tag">' + KIND_L[s.kind] + '</span></div></header>' +
      (s.photo ? '<button class="fishhero figure" data-zoom="' + s.photo + '" aria-label="تكبير صورة ' + esc(s.name) + '"><img src="' + img(s.photo) + '" alt="' + esc(s.name) + '"><span class="figmag">' + ico('search', 18) + '</span></button>' + (PHOTO_CREDITS[s.photo] ? '<div class="muted small">' + credit(s.photo) + '</div>' : '') :
        (fishPhotoTitles(s) ? '<button class="fishhero figure" data-fph="' + s.id + '" aria-label="صورة ' + esc(s.name) + '"><span class="muted small fphload" style="display:block;padding:24px;text-align:center">' + (STANDALONE ? 'جارٍ تحميل صورة حقيقية موثوقة…' : 'الصورة الحقيقية تظهر في النسخة المتصلة بالإنترنت') + '</span></button>'
          : '<div class="notice">صورة الملف الأصلي لهذا النوع كانت عليها علامة جهة تانية أو مش دقيقة، فشلناها لحد ما نجيب صورة حقيقية نظيفة بدالها. واسمها بالإنجليزي مش مؤكد عندنا لسه عشان نجيب صورتها الحقيقية تلقائيًا.</div>')) +
      vidHtml(DECK_REV[s.id]) +
      chart +
      (() => { const cl = CAUTION[s.id] || 2; return '<div class="notice ' + (cl >= 3 ? 'warn' : '') + '"><b>مستوى حذر ' + esc(s.name) + ': ' + CAUTION_L[cl] + ' (' + cl + '/4).</b> ' + CAUTION_TXT[cl] + '</div>'; })() +
      (facts.length ? '<section class="card"><dl class="kv" style="margin:0">' + facts.map(f => '<dt>' + f[0] + '</dt><dd>' + esc(f[1]) + '</dd>').join('') + '</dl></section>' : '') +
      sizes + methAcc(s.methods, 'طرق الصيد') + rigs + acc(s.baits, 'تجهيز الطُّعم', false) + acc(s.notes, 'ملاحظات ونصائح', true) +
      (missing.length ? '<p class="muted small">لم يُملأ في الملف الأصلي بعد: ' + missing.join('، ') + '.</p>' : '') + '</div>';
  };

  /* رسم عام (مش لسمكة بعينها) لفكرة الترقيد والسبحة نفسها، زي رسومات الأرمات بالظبط */
  const GENRIGS = {
    tarqeed: { title: 'الترقيد', main: '100', leaderLen: '100–125', hooks: 1, hookSize: 'حسب السمكة المستهدفة', weight: 'رصاصة ثقيلة تثبّت على القاع (80–150 حسب الريح والموج)', weightPos: 'end', bait: 'طُعم خشن (سمك/سردين/جرايات/جندوفلي)', note: 'طرف قايم واحد فقط: طوله متر وربع تحت الرصاصة للترقيد على الرمل، أو شبر فوق الرصاصة للترقيد على الوعر' },
    sabha: { title: 'السبحة', main: '40', leaderLen: '20–30', hooks: 5, weight: 'رصاص شريط حوالين مكان توصيل السنانير', weightPos: 'above', bait: 'حسب الهدف', note: 'نمرة السنارة حسب السمكة المستهدفة. سبحة ضيقة (فرد قصير) لو السمك واقف وبيضرب من غير ما يسحب، وسبحة واسعة (فرد طويل، أكتر من مترين) لو السمك خايف من الطعم المشدود' }
  };

  let techTab = 'tarqeed';
  V.tech = function (a, qs) {
    if (qs.t) techTab = qs.t;
    const I = DATA.info;
    let body = '';
    if (techTab === 'tarqeed') body = rigDraw(GENRIGS.tarqeed) + '<div class="card">' + prose(I.tarqeed.secs) + '</div>';
    else if (techTab === 'sabha') body = rigDraw(GENRIGS.sabha) + '<div class="stack">' + I.sabha.map(p => '<div class="card">' + prose(p.secs) + '</div>').join('') + '</div>';
    else if (techTab === 'mouth') body = '<div class="card">' + prose(I.mouth.secs) + '</div>';
    else body = '<div class="stack"><p class="muted small">جداول مصورة من الملف: الطُّعم والخيط والسنارة لعدة أسماك. اضغط للتكبير.</p>' + I.charts.map(c => '<button class="figure" data-zoom="' + c.img + '"><img loading="lazy" src="' + img(c.img) + '" alt="جدول المعلومات"></button>').join('') + '</div>';
    return '<div class="stack"><div><div class="eyebrow">من الملف</div><h1 class="h1">الترقيد والسبحة</h1></div>' + seg([['tarqeed', 'الترقيد'], ['sabha', 'السبحة'], ['mouth', 'الفم والسنانير'], ['charts', 'جداول']], techTab, 'tech') + body + '</div>';
  };

  let worldTab = 'tech';
  V.world = function (a, qs) {
    if (qs.t) worldTab = qs.t;
    let body = '';
    if (worldTab === 'tech') body = '<div>' + TECHNIQUES.map((t, i) => '<details class="acc"' + (i === 0 ? ' open' : '') + '><summary><span>' + esc(t.t) + '<br><span class="muted small latin">' + esc(t.en) + '</span></span></summary><div class="body stack"><p>' + esc(t.what) + '</p>' +
      '<dl class="kv" style="margin:0"><dt>الوقت</dt><dd>' + esc(t.when) + '</dd><dt>العدة</dt><dd>' + esc(t.gear) + '</dd></dl><ul style="margin:0;padding-inline-start:20px">' + t.tips.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul></div></details>').join('') + '</div>';
    else if (worldTab === 'knots') body = '<div class="stack"><p class="muted small">لخطوات متحركة راجع <a href="https://www.animatedknots.com/fishing-knots" target="_blank" rel="noopener">Animated Knots by Grog</a> (مجاني، وله تطبيق).</p><div>' + KNOTS.map((k, i) => '<details class="acc"' + (i === 0 ? ' open' : '') + '><summary><span>' + esc(k.t) + '<br><span class="muted small latin">' + esc(k.en) + '</span></span></summary><div class="body stack"><p>' + esc(k.use) + '</p><ol style="margin:0;padding-inline-start:22px;display:flex;flex-direction:column;gap:6px">' + k.steps.map(x => '<li>' + esc(x) + '</li>').join('') + '</ol></div></details>').join('') + '</div></div>';
    else body = '<div class="stack">' + LINE_INFO.map(x => '<div class="card"><h3 class="h3">' + esc(x.t) + '</h3><p class="muted">' + esc(x.p) + '</p></div>').join('') + '</div>';
    return '<div class="stack"><div><div class="eyebrow">لكل البحار</div><h1 class="h1">الدليل العالمي</h1></div>' + seg([['tech', 'التقنيات'], ['knots', 'العقد'], ['gear', 'الخيوط والعدة']], worldTab, 'world') + body + '</div>';
  };

  /* ---------- الأدوات ---------- */
  let toolTab = 'gear';
  const CONV = {
    'الطول': { u: { 'سم': 0.01, 'م': 1, 'مم': 0.001, 'بوصة': 0.0254, 'قدم': 0.3048 } },
    'الوزن': { u: { 'كجم': 1, 'جم': 0.001, 'رطل': 0.45359237, 'أونصة': 0.028349523 } },
    'العمق': { u: { 'متر': 1, 'قدم': 0.3048, 'قامة (fathom)': 1.8288 } },
    'السرعة': { u: { 'عقدة': 1.852, 'كم/س': 1, 'م/ث': 3.6, 'ميل/س': 1.609344 } },
    'الحرارة': { temp: true, u: { '°م': 1, '°ف': 1 } },
    'قوة الخيط': { u: { 'كجم': 1, 'رطل (lb)': 0.45359237 } }
  };
  V.tools = function (a, qs) {
    if (qs.t) toolTab = qs.t;
    return '<div class="stack"><div><div class="eyebrow">تعمل من أي مكان</div><h1 class="h1">الأدوات</h1></div>' +
      seg([['gear', 'أدوات الصياد'], ['today', 'اليوم'], ['sea', 'البحر'], ['bft', 'بوفورت'], ['conv', 'محوّلات'], ['log', 'سجل الصيد'], ['chk', 'قائمة الخروج']], toolTab, 'tools') + '<div id="toolbody"></div></div>';
  };
  function drawTool() {
    const el = $('#toolbody'); if (!el) return;
    ({ gear: toolGear, today: toolToday, sea: toolSea, bft: toolBft, conv: toolConv, log: toolLog, chk: toolChk }[toolTab] || toolToday)(el);
  }
  function toolGear(el) {
    el.innerHTML = '<div class="stack"><p class="muted" style="margin:0">كل اللي بيستخدمه الصياد، مرتّب من أصغر قطعة لأكبرها: شكلها، وبتستخدم في إيه.</p><div class="geargrid">' +
      GEAR.map((g, i) => '<article class="card gearcard"><div class="gearimg">' + (g.img && IMGS['gear_' + g.id] ? '<img loading="lazy" alt="' + esc(g.t) + '" src="' + IMGS['gear_' + g.id] + '">' : '<svg viewBox="0 0 120 120" role="img" aria-label="' + esc(g.t) + '">' + GEAR_SVG[g.id] + '</svg>') + '</div>' +
        '<div class="stack" style="gap:6px"><h2 class="h3"><span class="gearn">' + (i + 1) + '</span>' + esc(g.t) + '</h2><p style="margin:0">' + esc(g.d) + '</p><p class="muted small" style="margin:0"><b>الاستخدام: </b>' + esc(g.u) + '</p></div></article>').join('') + '</div></div>';
  }
  function toolToday(el) {
    const loc = getLoc(), di = dayInfo(loc), sun = di.sun;
    const slots = di.slots.map(s => '<div class="slot ' + s.kind + '"><span>' + esc(s.label) + '<br><span class="muted small">' + (s.kind === 'major' ? 'فترة رئيسية ≈ ساعتان' : 'فترة ثانوية ≈ ساعة') + '</span></span><b class="num">' + T(new Date(s.t.getTime() - (s.kind === 'major' ? 3600000 : 1800000))) + ' – ' + T(new Date(s.t.getTime() + (s.kind === 'major' ? 3600000 : 1800000))) + '</b></div>').join('');
    const nx = di.next ? '<div class="muted small">' + di.next.kind + ' القادم ' + fmtD.format(di.next.at) + ' (تقريبي)</div>' : '';
    el.innerHTML = '<div class="stack">' +
      locCard(true) + locSummary(loc) +
      '<div class="card stack"><div class="row" style="flex-wrap:nowrap">' + moonSvg(di.ph) + '<div><h2 class="h2" style="margin:0">' + esc(Astro.phaseName(di.ph.phase)) + '</h2><div class="muted">إضاءة القمر ' + Math.round(di.ph.fraction * 100) + '%</div>' + nx + (hijri ? '<div class="muted small">اليوم بالتقويم الهجري: ' + esc(hijri) + ' (قد يختلف يومًا حسب الرؤية)</div>' : '') + '</div></div>' +
      (di.spring ? '<div class="notice info">القمر قريب من البدر أو المحاق: المد والجزر أكبر من المعتاد وتيار الماء أقوى في المناطق التي فيها مد وجزر ملحوظ.</div>' : '') + '</div>' +
      '<div class="card stack"><h2 class="h2" style="margin:0">الشمس</h2><div class="now"><div><b class="num">' + T(sun.dawn) + '</b><span>بداية الضوء</span></div><div><b class="num">' + T(sun.rise) + '</b><span>الشروق</span></div><div><b class="num">' + T(sun.set) + '</b><span>الغروب</span></div></div>' +
      '<div class="muted small">الأفضل عادةً ساعة قبل الشروق وساعة بعد الغروب، وهي أوقات ترشيحات الملف للقاروص والمياس والميرا.</div></div>' +
      '<div class="card stack"><h2 class="h2" style="margin:0">أوقات القمر (سولونار)</h2><div class="solunar">' + (slots || '<div class="empty">لا أحداث قمرية في هذا اليوم.</div>') + '</div>' +
      '<div class="notice warn">نظرية السولونار شائعة بين الصيادين لكن الأدلة العلمية عليها محدودة. الأهم: حالة البحر والضوء والمد والجزر ونشاط السمك في مكانك. الأوقات بتوقيت جهازك وبدقة عدة دقائق.</div></div>' +
      '<div class="notice info">المد والجزر الدقيقان يحتاجان محطة قياس قريبة: افتح <a href="#/links">قسم المد والجزر في المراجع</a>.</div></div>';
  }
  const dirs = ['شمال', 'شمال شرق', 'شرق', 'جنوب شرق', 'جنوب', 'جنوب غرب', 'غرب', 'شمال غرب'];
  const dirName = d => (d == null ? '—' : dirs[Math.round(d / 45) % 8]);
  const bftOf = kn => { if (kn == null) return null; const lim = [1, 4, 7, 11, 17, 22, 28, 34, 41, 48, 56, 64]; let n = 0; lim.forEach((l, i) => { if (kn >= l) n = i + 1; }); return n; };
  async function toolSea(el) {
    const loc = getLoc();
    const linkWindy = 'https://www.windy.com/?' + loc.lat.toFixed(3) + ',' + loc.lng.toFixed(3) + ',8';
    if (!STANDALONE) {
      el.innerHTML = '<div class="stack"><div class="notice warn">هذه النسخة المنشورة لا تسمح بالاتصال بمصادر خارجية، فتوقعات البحر الحية تعمل في النسخة المحمّلة (الملف أو تطبيق الهاتف). في هذه النسخة استخدم الروابط:</div>' +
        '<div class="card stack"><b>' + esc(loc.name) + ' — ' + loc.lat.toFixed(3) + ', ' + loc.lng.toFixed(3) + '</b><a class="btn" target="_blank" rel="noopener" href="' + linkWindy + '">افتح Windy على موقعك</a><a class="btn ghost" href="#/links">المراجع: الطقس والأمواج</a></div></div>';
      return;
    }
    el.innerHTML = '<div class="stack"><div class="card stack"><div class="row between"><h2 class="h2" style="margin:0">توقعات البحر لـ' + esc(loc.name) + '</h2><span class="tag gold">تجريبي</span></div><div id="seabox" class="muted">جارٍ التحميل…</div></div>' +
      '<div class="notice warn">نماذج الموج تقريبية، وقرب الشاطئ قد لا تتوفر بيانات موج. قارنها دائمًا بالنشرة الرسمية وبما تراه أمامك. لا تعتمد عليها وحدها في قرار السلامة.</div>' +
      '<a class="btn ghost" target="_blank" rel="noopener" href="' + linkWindy + '">افتح Windy على موقعك</a></div>';
    const key = 'sea:' + loc.lat.toFixed(2) + ',' + loc.lng.toFixed(2), box = $('#seabox');
    const draw = (c, cached) => {
      const h = c.wx && c.wx.hourly, m = c.mr && c.mr.hourly; if (!h) { box.textContent = 'لا بيانات.'; return; }
      const now = Date.now(); let i0 = 0; h.time.forEach((t, i) => { if (new Date(t).getTime() <= now) i0 = i; });
      const rows = []; for (let k = 0; k < 9; k++) { const i = i0 + k * 3; if (i >= h.time.length) break; rows.push(i); }
      const val = (arr, i, d) => (arr && arr[i] != null ? (+arr[i]).toFixed(d) : '—');
      box.innerHTML = '<div class="tablewrap"><table><thead><tr><th>الوقت</th><th>الريح (عقدة)</th><th>بوفورت</th><th>الاتجاه</th><th>الموج (م)</th><th>الدورة (ث)</th><th>حرارة الماء</th></tr></thead><tbody>' +
        rows.map(i => { const kn = h.wind_speed_10m ? h.wind_speed_10m[i] : null, b = bftOf(kn), t = new Date(h.time[i]); return '<tr><td class="num">' + fmtT.format(t) + '</td><td class="num">' + val(h.wind_speed_10m, i, 0) + (h.wind_gusts_10m && h.wind_gusts_10m[i] != null ? ' <span class="muted small">(هبّات ' + Math.round(h.wind_gusts_10m[i]) + ')</span>' : '') + '</td><td class="num">' + (b == null ? '—' : b) + '</td><td>' + dirName(h.wind_direction_10m ? h.wind_direction_10m[i] : null) + '</td><td class="num">' + val(m && m.wave_height, i, 1) + '</td><td class="num">' + val(m && m.wave_period, i, 0) + '</td><td class="num">' + val(m && m.sea_surface_temperature, i, 1) + '°</td></tr>'; }).join('') +
        '</tbody></table></div>' + (cached ? '<div class="small" style="margin-top:8px;color:var(--warn)">بيانات محفوظة من ' + fmtD.format(new Date(c.t)) + ' ' + T(new Date(c.t)) + ' (لا يوجد إنترنت الآن).</div>' : '<div class="small muted" style="margin-top:8px">المصدر: Open-Meteo. حُدّثت الآن.</div>');
    };
    const get = async u => { const ac = new AbortController(), to = setTimeout(() => ac.abort(), 12000); try { const r = await fetch(u, { signal: ac.signal }); if (!r.ok) throw new Error(r.status); return await r.json(); } finally { clearTimeout(to); } };
    try {
      const q = 'latitude=' + loc.lat + '&longitude=' + loc.lng + '&timezone=auto&forecast_days=2';
      const [wx, mr] = await Promise.all([
        get('https://api.open-meteo.com/v1/forecast?' + q + '&hourly=wind_speed_10m,wind_gusts_10m,wind_direction_10m&wind_speed_unit=kn'),
        get('https://marine-api.open-meteo.com/v1/marine?' + q + '&hourly=wave_height,wave_period,wave_direction,sea_surface_temperature').catch(() => null)
      ]);
      const c = { t: Date.now(), wx, mr }; store.set(key, c); draw(c, false);
    } catch (e) {
      const c = store.get(key, null); if (c) draw(c, true); else box.innerHTML = '<div class="notice bad">تعذّر الاتصال ولا توجد بيانات محفوظة لهذا الموقع. استخدم الروابط في قسم المراجع.</div>';
    }
  }
  function toolBft(el) {
    el.innerHTML = '<div class="stack"><p class="muted small">مقياس بوفورت يربط سرعة الريح بحالة البحر. الأرقام تقريبية لبحر مفتوح، وقرب الشاطئ الصخري يكون الموج أخطر من الجدول.</p><div class="tablewrap"><table><thead><tr><th>#</th><th>الاسم</th><th>عقدة</th><th>كم/س</th><th>الموج (م)</th><th>حالة البحر</th><th>للصيد</th></tr></thead><tbody>' +
      BEAUFORT.map(b => '<tr><td class="num"><b>' + b.n + '</b></td><td>' + esc(b.name) + '</td><td class="num">' + b.kn + '</td><td class="num">' + b.kmh + '</td><td class="num">' + b.wave + '</td><td>' + esc(b.sea) + '</td><td>' + esc(b.act) + '</td></tr>').join('') + '</tbody></table></div></div>';
  }
  function toolConv(el) {
    const cats = Object.keys(CONV), cs = store.get('conv', { c: cats[0], v: '10', a: 0, b: 1 });
    const c = CONV[cs.c] || CONV[cats[0]], us = Object.keys(c.u);
    const res = () => {
      const v = parseFloat(String(cs.v).replace(',', '.')); if (isNaN(v)) return '—';
      const A = us[cs.a] || us[0], B = us[cs.b] || us[1] || us[0]; let out;
      if (c.temp) out = A === B ? v : (A === '°م' ? v * 9 / 5 + 32 : (v - 32) * 5 / 9);
      else out = v * c.u[A] / c.u[B];
      return (Math.round(out * 1000) / 1000).toString();
    };
    el.innerHTML = '<div class="card stack"><div class="field"><label for="cc">النوع</label><select id="cc">' + cats.map(k => '<option' + (k === cs.c ? ' selected' : '') + '>' + k + '</option>').join('') + '</select></div>' +
      '<div class="grid3"><div class="field"><label for="cv">القيمة</label><input id="cv" inputmode="decimal" value="' + esc(cs.v) + '"></div><div class="field"><label for="ca">من</label><select id="ca">' + us.map((u, i) => '<option value="' + i + '"' + (i === cs.a ? ' selected' : '') + '>' + u + '</option>').join('') + '</select></div><div class="field"><label for="cb">إلى</label><select id="cb">' + us.map((u, i) => '<option value="' + i + '"' + (i === cs.b ? ' selected' : '') + '>' + u + '</option>').join('') + '</select></div></div>' +
      '<div class="flat" style="text-align:center"><div class="muted small">النتيجة</div><div class="h1 num" id="cr">' + res() + '</div></div></div>';
    const upd = () => { cs.c = $('#cc').value; cs.v = $('#cv').value; cs.a = +$('#ca').value; cs.b = +$('#cb').value; store.set('conv', cs); };
    $('#cc').onchange = () => { cs.c = $('#cc').value; cs.a = 0; cs.b = 1; store.set('conv', cs); toolConv(el); };
    ['#cv', '#ca', '#cb'].forEach(s => { $(s).oninput = $(s).onchange = () => { upd(); const cc = CONV[cs.c], u = Object.keys(cc.u); const v = parseFloat(String(cs.v).replace(',', '.')); const A = u[cs.a], B = u[cs.b]; let o; if (isNaN(v)) o = '—'; else if (cc.temp) o = A === B ? v : (A === '°م' ? v * 9 / 5 + 32 : (v - 32) * 5 / 9); else o = v * cc.u[A] / cc.u[B]; $('#cr').textContent = typeof o === 'number' ? (Math.round(o * 1000) / 1000).toString() : o; }; });
  }
  function toolLog(el) {
    const log = store.get('log', []);
    const now = new Date(NOW.getTime() - NOW.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    const item = c => '<div class="card stack" style="gap:6px"><div class="row between"><b>' + esc(c.sp || 'غير محدد') + '</b><span class="muted small num">' + esc((c.at || '').replace('T', ' ')) + '</span></div>' +
      '<div class="muted small">' + [c.len ? c.len + ' سم' : '', c.wt ? c.wt + ' كجم' : '', c.place, c.bait].filter(Boolean).map(esc).join(' · ') + '</div>' + (c.note ? '<div>' + esc(c.note) + '</div>' : '') + '<button class="btn ghost small" data-act="dellog" data-i="' + c.i + '" style="align-self:flex-start">حذف</button></div>';
    el.innerHTML = '<div class="stack"><form class="card stack" data-form="log"><h2 class="h2" style="margin:0">تسجيل صيدة</h2>' +
      '<div class="field"><label for="lsp">السمكة</label><input id="lsp" list="spl" required placeholder="اختر أو اكتب"><datalist id="spl">' + SP.map(s => '<option value="' + esc(s.name) + '">').concat(SG.map(s => '<option value="' + esc(s.ar) + '">')).join('') + '</datalist></div>' +
      '<div class="grid2"><div class="field"><label for="llen">الطول (سم)</label><input id="llen" inputmode="decimal"></div><div class="field"><label for="lwt">الوزن (كجم)</label><input id="lwt" inputmode="decimal"></div></div>' +
      '<div class="field"><label for="lat2">التاريخ والوقت</label><input id="lat2" type="datetime-local" value="' + now + '"></div>' +
      '<div class="field"><label for="lpl">المكان</label><input id="lpl"></div><div class="field"><label for="lbt">الطُّعم أو الرابلة</label><input id="lbt"></div><div class="field"><label for="lnt">ملاحظات</label><textarea id="lnt" rows="2"></textarea></div>' +
      '<button class="btn" type="submit">حفظ في السجل</button></form>' +
      (log.length ? '<div class="row between"><h2 class="h2" style="margin:0">السجل (' + log.length + ')</h2><div class="row"><button class="btn ghost small" data-act="copylog">نسخ كنص</button>' + (STANDALONE ? '<button class="btn ghost small" data-act="dllog">تنزيل CSV</button>' : '') + '</div></div>' + log.map((c, i) => item(Object.assign({ i: i }, c))).join('') :
        '<div class="card stack" style="gap:6px;opacity:.85"><span class="tag gold" style="align-self:flex-start">مثال توضيحي</span><b>القاروص</b><div class="muted small">52 سم · 1.9 كجم · الميناء الشرقي · ميدار أحمر</div><div class="muted small">هكذا ستظهر صيداتك بعد الحفظ. السجل يُحفظ على جهازك فقط.</div></div>') +
      '</div>';
  }
  function toolChk(el) {
    const st = store.get('chk', {});
    const grp = (k, t, arr) => '<div class="stack"><h2 class="h2" style="margin:0">' + t + '</h2><ul class="checklist">' + arr.map((x, i) => { const id = k + i; return '<li><label><input type="checkbox" data-chk="' + id + '"' + (st[id] ? ' checked' : '') + '><span>' + esc(x) + '</span></label></li>'; }).join('') + '</ul></div>';
    el.innerHTML = '<div class="stack-lg"><div class="row between"><p class="muted small" style="flex:1">علّم ما جهّزته. الاختيارات تُحفظ على جهازك.</p><button class="btn ghost small" data-act="resetchk">إعادة ضبط</button></div>' + grp('b', 'قبل الخروج', SAFETY.before) + grp('r', 'على الصخور والشاطئ', SAFETY.rocks) + grp('o', 'على القارب', SAFETY.boat) + '</div>';
  }

  V.safety = function () {
    return '<div class="stack-lg"><div><div class="eyebrow">اقرأها قبل أول رحلة</div><h1 class="h1">السلامة</h1></div>' +
      '<div class="notice bad"><b>لا تعتمد على هذه الصفحة وحدها.</b> هي إرشادات عامة، وليست بديلًا عن الطبيب أو خفر السواحل أو النشرة الرسمية. في الطوارئ البحرية استخدم قناة VHF رقم 16 أو رقم الطوارئ المحلي.</div>' +
      '<section class="stack"><h2 class="h2" style="margin:0">أسماك وكائنات خطرة</h2>' + HAZARDS.map(h => '<div class="card hz-' + h.lvl + ' stack" style="gap:6px"><div class="row between"><h3 class="h3">' + esc(h.t) + '</h3><span class="muted small latin">' + esc(h.en) + '</span></div><p>' + esc(h.p) + '</p>' + (h.src ? '<a class="small" target="_blank" rel="noopener" href="' + h.src + '">المصدر العلمي</a>' : '') + '</div>').join('') +
      '<p class="muted small">مصدر إرشادات الإسعاف: <a target="_blank" rel="noopener" href="https://dan.org/health-medicine/health-resources/diseases-conditions/ive-been-stung-what-should-i-do/">Divers Alert Network</a>. أي أعراض شديدة (ضيق تنفس، ألم صدر، ضعف، قيء، تفاعل تحسسي) تعني الطوارئ فورًا.</p></section>' +
      '<section class="stack"><h2 class="h2" style="margin:0">الصيد المسؤول والإطلاق</h2><ul class="checklist">' + SAFETY.release.map(x => '<li><div class="card" style="padding:10px 14px">' + esc(x) + '</div></li>').join('') + '</ul></section>' +
      '<section class="stack"><h2 class="h2" style="margin:0">قوائم جاهزة</h2><a class="btn" href="#/tools?t=chk">افتح قائمة الخروج</a><a class="btn ghost" href="#/links">أدلة الفاو للسلامة (بالعربية)</a></section></div>';
  };

  let linkQ = '', linkC = 'all', linkEg = false, linkV = false;
  V.links = function (a, qs) {
    if (qs.q != null) linkQ = qs.q;
    return '<div class="stack"><div><div class="eyebrow">' + LINKS.length + ' مرجعًا</div><h1 class="h1">المراجع والمواقع المجانية</h1><p class="muted">كل رابط له علامة توضح هل فتحت الصفحة بنفسي وتأكدت منها.</p></div>' +
      '<form class="search" data-form="lq" role="search"><input id="lq" type="search" value="' + esc(linkQ) + '" placeholder="ابحث في المراجع" aria-label="بحث في المراجع"><span>' + ico('search', 20) + '</span></form>' +
      '<div class="chips" id="lc">' + [['all', 'الكل']].concat(LINK_CATS).map(([k, l]) => '<button class="chip" data-lc="' + k + '" aria-pressed="' + (linkC === k) + '">' + l + '</button>').join('') + '</div>' +
      '<div class="chips"><button class="chip" data-lf="eg" aria-pressed="' + linkEg + '">مصر والمنطقة</button><button class="chip" data-lf="v" aria-pressed="' + linkV + '">المتحقق منها فقط</button></div>' +
      '<div class="legend"><span class="v2">تحققت من الصفحة</span><span class="v1">ظهر في البحث</span><span class="v0">من المعرفة العامة</span></div>' +
      '<div id="llist" class="stack"></div></div>';
  };
  function drawLinks() {
    const el = $('#llist'); if (!el) return; const toks = norm(linkQ).split(' ').filter(Boolean);
    const list = LINKS.filter(l => (linkC === 'all' || l.c === linkC) && (!linkEg || l.eg) && (!linkV || l.v === 2) && toks.every(t => norm(l.t + ' ' + l.d).indexOf(t) > -1));
    el.innerHTML = list.length ? list.map(l => '<a class="linkitem" href="' + esc(l.u) + '" target="_blank" rel="noopener noreferrer"><div class="row between"><b>' + esc(l.t) + '</b><span class="tag">' + COST_LABEL[l.cost] + '</span></div><p style="margin-top:4px">' + esc(l.d) + '</p><div class="row small muted" style="margin-top:6px"><span class="v' + l.v + '">' + V_LABEL[l.v] + '</span><span>·</span><span>' + ({ ar: 'عربي', 'ar+en': 'عربي وإنجليزي', en: 'إنجليزي' }[l.lang]) + '</span></div><div class="url">' + esc(l.u.replace(/^https?:\/\//, '').slice(0, 80)) + '</div></a>').join('') : '<div class="empty">لا نتائج.</div>';
  }

  V.about = function () {
    const gap = f => SP.filter(f).map(s => s.name).join('، ') || 'لا شيء';
    return '<div class="stack-lg"><div><div class="eyebrow">عن الدليل</div><h1 class="h1">المصادر والملاحظات</h1></div>' +
      '<section class="card prose"><p>هذا الدليل مبني على ملف «مساعد الصيد» (280 شريحة): الجداول الشهرية وبروفايلات الأنواع وطرق الصيد والأرمات ومعلومات الترقيد والسبحة. أُضيف إليه قسم عالمي ومحوّلات وحسابات شمس وقمر وقوائم سلامة ومكتبة مراجع.</p>' +
      '<p>الصور والأرمات مأخوذة من الملف الأصلي، وبعضها يحمل شعارات صفحات صيد على فيسبوك ومواقع أخرى. راجع حقوقها قبل أي نشر عام.</p></section>' +
      '<section class="stack"><h2 class="h2" style="margin:0">أخطاء وجدتها في الملف الأصلي</h2>' + (DATA.issues.length ? '<ul style="margin:0;padding-inline-start:20px;display:flex;flex-direction:column;gap:6px">' + DATA.issues.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '<p class="muted">لا شيء.</p>') +
      '<ul style="margin:0;padding-inline-start:20px;display:flex;flex-direction:column;gap:6px"><li>رابط «ملاحظات في صيد الأنش» في الملف يشير إلى ملاحظات المياس، فلم أعرضه مع الأنش.</li><li>رابط «الطريقة الثانية» للقرموط يشير لطريقة صيد جرم البياض، فلم أعرضه.</li><li>اسم «الحلابيش / وقار 111» في الملف بدا خطأ طباعة، فسميتها «الحلابيشي».</li></ul></section>' +
      '<section class="stack"><h2 class="h2" style="margin:0">ما ينقص الملف (لأتمّه لاحقًا)</h2><div class="prose">' +
      '<p><span class="lbl">بدون طرق صيد</span>' + esc(gap(s => !s.methods.length)) + '</p>' +
      '<p><span class="lbl">بدون صور أرمات</span>' + esc(gap(s => !s.rigs.length)) + '</p>' +
      '<p><span class="lbl">بدون قوة موسم (نجوم)</span>' + esc(gap(s => !(s.levels || []).some(Boolean))) + '</p>' +
      '<p><span class="lbl">بدون أماكن</span>' + esc(gap(s => !s.places)) + '</p>' +
      '<p><span class="lbl">بدون صورة للسمكة</span>' + esc(gap(s => !s.photo)) + '</p></div></section>' +
      '<section class="card prose"><p><b>القسم العالمي: كيف يعمل.</b> تختار موقعك (GPS أو مدينة من القائمة أو إحداثيات) فيحدد التطبيق: هل أنت على بحر أم يابسة داخلية، وفي أي نصف كرة، وأي أقاليم صيد قريبة منك. ثم يقلب مواسم الأنواع تلقائيًا بين الشمال والجنوب (الموسم الجنوبي = الشمالي بعد 6 أشهر ما لم يُذكر غير ذلك)، ويحسب من الشمس والقمر أوقات الفجر والغروب والفترات الأنسب (سولونار) لتوقيتك المحلي. قاعدة بيانات واسعة من الأنواع البحرية والنهرية حول العالم، بأسمائها العلمية والإنجليزية.</p>' +
      '<p><b>نشاط السمك المتوقع.</b> في تبويب «مد وجزر» تقدير بالساعة (0 إلى 100) يجمع قرب الفجر أو الغروب، الفترات القمرية الرئيسية والثانوية وقرب المحاق أو البدر، سرعة تحرك المد أو الجزر، سرعة الرياح، واتجاه الضغط الجوي. هذا مزيج اجتهادي شبيه بجداول السولونار التجارية وليس معادلة علمية مثبتة؛ استخدمه كمؤشر إضافي لا كضمان.</p>' +
      '<p><b>الصور والخريطة والمد.</b> كل الأنواع تظهر بصورة حقيقية للنوع، لا رسم توضيحي. أسماك «ملف مصر» صورها من ملفك الأصلي. أنواع القاعدة العالمية تُجلب صورتها الحقيقية تلقائيًا من ويكيبيديا عند توفر الإنترنت وتُحفظ على جهازك (نقاط تحميل مؤقتة تظهر لحين وصول الصورة)، مع رابط لصفحتها وحقوقها لأصحابها. الخريطة مرسومة داخل التطبيق بلا إنترنت من قناع يابسة بدقة درجة واحدة. منحنى المد والموج والرياح والضغط (تبويب «مد وجزر») يأتي من Open-Meteo في النسخة المحمّلة فقط، وهو نموذج عالمي دقته قرب السواحل محدودة.</p>' +
      '<p><b>ما تحقّقتُ منه وما لم أتحقق.</b> راجعتُ بمصادر رسمية أو إرشادية مواسم: النمر الإفريقي (تايغرفش) في الزامبيزي، والباراموندي في كوينزلاند وفترات الحظر عندها، والمارلن المخطّط، وسمك مراي كود في نيو ساوث ويلز وحظره من سبتمبر إلى نوفمبر، وسمك ماكو. أما بقية الأنواع فمواسمها إرشاد عام من معرفة عامة ولم يُتحقق منها نوعًا نوعًا، وتختلف محليًا حسب الماء والطقس. تحقّق من مصدر رسمي في منطقتك (راجع تبويب المراجع: FishBase وIUCN وهيئات الصيد الوطنية) قبل أي قرار.</p></section>' +
      '<section class="card prose"><p><b>حدود الدقة.</b> جداول الملف تقديرات ميدانية لمصر. حسابات الشمس والقمر تقريبية بدقة عدة دقائق. الأقاليم العالمية صناديق إحداثيات تقريبية وقناع اليابسة بدقة درجة واحدة، فقد تقع أنت قرب الحد بين إقليمين. بعض الأسماء العربية للأنواع الأجنبية حروف عربية للاسم وليست اسمًا متداولًا. درجة حرارة سطح البحر الحية تعمل في النسخة المحمّلة فقط. المعلومات العالمية عامة ولا تغني عن قوانين بلدك وفترات المنع والمقاسات الدنيا. إرشادات الإسعاف للتوعية وليست علاجًا.</p></section>' +
      '<section class="card prose"><p><b>الخصوصية.</b> سجل الصيد والموقع وإعداداتك تُحفظ على جهازك فقط. في النسخة المحمّلة فقط يُرسل التطبيق إحداثيات موقعك إلى Open-Meteo لجلب حرارة الماء والمد والموج والرياح، ويطلب من ويكيبيديا صورة كل نوع باسمه العلمي دون أي بيانات عنك. الصفحة المنشورة لا ترسل شيئًا.</p></section>' +
      (STANDALONE ? '<section class="card prose"><p><b>التثبيت على الهاتف.</b> افتح الملف أو الرابط في المتصفح ثم «إضافة إلى الشاشة الرئيسية». عند الاستضافة على رابط https يُخزَّن التطبيق كاملًا للعمل بدون إنترنت.</p></section>' : '') +
      '<section class="card prose" style="display:flex;align-items:center;gap:14px;flex-wrap:wrap"><div style="flex:none">' + LOGO_MARK(34, 'about') + '</div><div style="min-width:200px;flex:1"><p><b>© ' + new Date().getFullYear() + ' الصنّارة. جميع الحقوق محفوظة.</b> هذا التطبيق وتصميمه وشعاره وشيفرته البرمجية ملك لصاحب المشروع، ولا يجوز نسخه أو إعادة توزيعه أو انتحاله باسم آخر دون إذن كتابي.</p>' +
      '<p class="muted small">بصمة هذه النسخة: <span class="fid latin">' + esc(BUILD_ID) + '</span></p></div></section></div>';
  };

  /* ================= المحرك العالمي: الموقع ← الأقاليم ← الموسم ← التوقيت ================= */
  const SG = SPECIES_G, BYG = {};
  const ALLREG = Object.keys(REG);
  const expandR = arr => { const o = new Set(); (arr || []).forEach(t => (t[0] === '@' ? RG[t] : [t]).forEach(x => o.add(x))); return o; };
  const HAB_L = { m: 'بحري', f: 'مياه عذبة', a: 'بحري ونهري' };
  SG.forEach(s => {
    BYG[s.id] = s; s.R = expandR(s.r); s.YR = expandR(s.yr);
    const altNames = s.names ? Object.values(s.names).join(' ') : '';
    s.hay = norm([s.ar, altNames, s.en, s.sci, s.n, (s.how || '').split(',').map(k => HOW[k]).join(' '), (s.bt || '').split(',').map(k => BAIT[k]).join(' ')].join(' '));
    s.nameHay = norm([s.ar, altNames, s.en, s.sci].join(' '));
  });
  /* أسماك ملف مصر المقابلة لأنواع القاعدة العالمية */
  const DECK = { seabass: 23, gilthead: 76, mullet: 42, tilapia: 58, clarias: 168, barracuda: 36, squid: 129, octopus: 30, lobster: 31, sardine: 93, dorado: 22, spanishmackerel: 19, emperor: 155, rabbitfish: 54 };
  /* درجة حذر كل نوع (1 جريء إلى 4 حذر جدًا) — تقدير عام مبني على سلوك معروف لكل فصيلة، وليس قياسًا دقيقًا لكل سمكة بعينها. مبدئي وقابل للتصحيح. */
  const CAUTION = {
    17: 2, 18: 2, 19: 1, 20: 2, 21: 3, 22: 1, 23: 3, 24: 2, 29: 2, 30: 2, 31: 3, 36: 1, 42: 4, 48: 2, 54: 2, 58: 2,
    62: 3, 66: 1, 72: 2, 76: 4, 82: 1, 86: 3, 93: 3, 95: 1, 97: 3, 107: 2, 112: 2, 124: 3, 126: 2, 128: 2, 129: 2,
    132: 2, 137: 2, 143: 2, 144: 1, 146: 1, 147: 3, 151: 2, 152: 1, 155: 2, 159: 2, 162: 1, 168: 1
  };
  const CAUTION_L = { 1: 'جريء', 2: 'حذر متوسط', 3: 'حذر', 4: 'حذر جدًا' };
  const CAUTION_TXT = {
    1: 'يهاجم الطعم أو الغزل بسهولة، ويعض حتى مع تمويه بسيط أو سنارة شبه مكشوفة.',
    2: 'حذره عادي؛ تمويه بسيط للسنارة وهدوء متوسط كافيان غالبًا.',
    3: 'يحتاج هدوءًا وتمويهًا جيدًا للسنارة والقرمة؛ يفزع من الظل والحركة القريبة.',
    4: 'من أشد الأسماك حذرًا؛ يفزع بسرعة من أي شيء غريب. يحتاج أرفع خيط ممكن وأقصى هدوء وابتعادًا عن حافة الماء وقت الرمي.'
  };
  const SC_L = ['غير متاح غالبًا', 'ضعيف', 'جيد', 'ذروة'];
  const SC_CLS = ['bad', '', 'ok', 'gold'];
  const WARN_L = { cr: ['قوانين أو حصص أو حماية: راجع قانون بلدك قبل الصيد أو الإبقاء', 'warn'], cig: ['قد يحمل سم السيجواتيرا في بعض المناطق (الكبيرة خصوصًا)', 'warn'], tox: ['سام: لا تأكله', 'bad'], inv: ['نوع دخيل أو مقلق بيئيًا: اتبع الإرشاد المحلي', 'warn'] };

  const inBox = (b, la, lo) => la >= b[0] && la <= b[1] && lo >= b[2] && lo <= b[3];
  const boxDist = (b, la, lo) => {
    const dy = la < b[0] ? b[0] - la : la > b[1] ? la - b[1] : 0, dx = lo < b[2] ? b[2] - lo : lo > b[3] ? lo - b[3] : 0;
    return Math.hypot(dy, dx * Math.cos(la * Math.PI / 180));
  };
  /* قناع اليابسة (1°): يحدد هل الموقع بحر أو ساحل أو يابسة داخلية */
  const LMB = (() => { const b = atob(LAND_MASK), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; })();
  const cellT = (i, j) => { i = Math.max(0, Math.min(179, i)); j = ((j % 360) + 360) % 360; const k = i * 360 + j; return (LMB[k >> 2] >> ((k & 3) * 2)) & 3; };
  function surface(loc) {
    const i = Math.floor(loc.lat + 90), j = Math.floor(loc.lng + 180), t = cellT(i, j);
    let sea = t !== 1;
    for (let di = -1; di <= 1 && !sea; di++) for (let dj = -1; dj <= 1 && !sea; dj++) {
      if ((!di && !dj) || cellT(i + di, j + dj) === 1) continue;
      if (boxDist([i + di - 90, i + di - 89, j + dj - 180, j + dj - 179], loc.lat, loc.lng) <= 0.5) sea = true;
    }
    return { sea, land: t !== 0, t };
  }
  function regionsAt(loc) {
    const out = { m: [], f: [], approx: false, sf: surface(loc) };
    ALLREG.forEach(c => { const r = REG[c]; if (r.b.some(b => inBox(b, loc.lat, loc.lng))) out[r.k].push(c); });
    if (!out.sf.sea) out.m = [];
    if (!out.sf.land) out.f = [];
    if (out.sf.sea && !out.m.length) {
      let best = null, bd = 1e9;
      ALLREG.forEach(c => { if (REG[c].k !== 'm') return; REG[c].b.forEach(b => { const d = boxDist(b, loc.lat, loc.lng); if (d < bd) { bd = d; best = c; } }); });
      if (best && bd <= 10) { out.m.push(best); out.approx = true; }
    }
    return out;
  }
  const isSouth = loc => loc.lat < 0;
  const seasonName = loc => {
    const a = Math.abs(loc.lat); if (a < 23.5) return 'منطقة مدارية (الفصول ضعيفة)';
    const m = NOW.getMonth(), n = isSouth(loc) ? (m + 6) % 12 : m; /* الشهر المكافئ شماليًا */
    return ['الشتاء', 'الشتاء', 'الربيع', 'الربيع', 'الربيع', 'الصيف', 'الصيف', 'الصيف', 'الخريف', 'الخريف', 'الخريف', 'الشتاء'][n];
  };
  /* درجات الشهور 0..3 لنوع في موقع؛ null = غير مسجَّل في المنطقة */
  function monthScores(s, loc, regs, seaT) {
    const cand = s.h === 'f' ? regs.f : s.h === 'm' ? regs.m : regs.m.concat(regs.f);
    if (!cand.some(c => s.R.has(c))) return null;
    const yr = cand.some(c => s.YR.has(c)), south = isSouth(loc), eq = Math.abs(loc.lat) < 6;
    const mths = south && s.pks ? s.pks : south ? s.pk.map(m => ((m + 5) % 12) + 1) : s.pk;
    const out = MONTHS.map((_, i) => {
      const m = i + 1;
      if (s.cl && s.cl.indexOf(m) > -1) return 0;
      if (eq || !mths.length) return 2;
      if (mths.indexOf(m) > -1) return 3;
      if (mths.indexOf(((m + 10) % 12) + 1) > -1 || mths.indexOf((m % 12) + 1) > -1) return 2;
      return yr ? 2 : (s.o ? 0 : 1);
    });
    if (seaT != null && s.sst && s.h !== 'f' && (seaT < s.sst[0] - 3 || seaT > s.sst[1] + 3)) out[CUR] = Math.max(0, out[CUR] - 1);
    return out;
  }
  /* نوافذ اليوم بحسب سلوك النوع (فجر/غروب/نهار/ليل) وتوافقها مع الفترات القمرية الرئيسية */
  function windows(s, di) {
    const H = 3600000, sun = di.sun, out = [], t = s.tod || 'dk';
    const add = (key, lab, a, b) => { if (a && b && b > a) out.push({ key, lab, a, b }); };
    if (t.indexOf('d') > -1 && sun.rise) add('d', 'الفجر', sun.dawn || new Date(sun.rise.getTime() - 0.5 * H), new Date(sun.rise.getTime() + H));
    if (t.indexOf('y') > -1 && sun.rise && sun.set) add('y', 'النهار', new Date(sun.rise.getTime() + H), new Date(sun.set.getTime() - H));
    if (t.indexOf('k') > -1 && sun.set) add('k', 'الغروب', new Date(sun.set.getTime() - H), sun.dusk || new Date(sun.set.getTime() + 0.5 * H));
    if (t.indexOf('n') > -1 && sun.set) out.push({ key: 'n', lab: 'الليل', a: sun.dusk || sun.set, b: null });
    const majors = di.slots.filter(x => x.kind === 'major');
    out.forEach(w => { const b = w.b || new Date(w.a.getTime() + 6 * H); w.moon = majors.some(m => m.t.getTime() + H > w.a.getTime() && m.t.getTime() - H < b.getTime()); });
    return out;
  }
  const winHtml = (ws, sun) => {
    if (!ws.length) return sun.rise ? '' : '<span class="muted small">لا شروق أو غروب اليوم هنا (نهار أو ليل قطبي).</span>';
    return ws.map(w => '<span class="win"><span>' + w.lab + '</span> <b class="num">' + (w.b ? T(w.a) + '–' + T(w.b) : 'بعد ' + T(w.a) + ' حتى الفجر') + '</b>' + (w.moon ? ' <i class="star" title="يتزامن مع فترة قمرية رئيسية">★</i>' : '') + '</span>').join('');
  };
  const todText = s => (s.tod || '').split('').map(k => TOD_L[k]).join(' + ');
  const listNames = (str, dict) => (str || '').split(',').filter(Boolean).map(k => dict[k]).filter(Boolean);
  /* يجمّع أكواد طرق الصيد (how) حسب الفئة (سنارة/رمح/شبكة/فخ/يد) لعرضها مبوّبة بدل قائمة واحدة مسطّحة */
  const howGroupsHtml = str => {
    const codes = (str || '').split(',').filter(Boolean);
    if (!codes.length) return '';
    return HOWCAT_ORDER.map(cat => {
      const ks = codes.filter(k => (HOW_CAT[k] || 'rod') === cat);
      if (!ks.length) return '';
      return '<div class="howgrp"><b class="small">' + esc(HOWCAT_L[cat]) + '</b><div class="chips">' + ks.map(k => HOW[k] ? (HOW_LINK[k] ? '<a class="tag" href="' + esc(HOW_LINK[k]) + '" target="_blank" rel="noopener">' + esc(HOW[k]) + '</a>' : '<span class="tag">' + esc(HOW[k]) + '</span>') : '').join('') + '</div></div>';
    }).filter(Boolean).join('');
  };
  const stripG = sc => '<div class="strip" aria-hidden="true">' + sc.map((l, i) => '<i class="l' + l + (i === CUR ? ' cur' : '') + '"></i>').join('') + '</div>';

  /* حرارة سطح البحر الحية (النسخة المحمّلة فقط) */
  let seaT = null, seaKey = '';
  async function loadSST(loc) {
    if (!STANDALONE) return;
    const key = 'sst:' + loc.lat.toFixed(1) + ',' + loc.lng.toFixed(1);
    if (seaKey === key && seaT != null) return;
    seaKey = key; seaT = null;
    const c = store.get(key, null);
    if (c && Date.now() - c.t < 6 * 3600000) { seaT = c.v; return; }
    try {
      const ac = new AbortController(), to = setTimeout(() => ac.abort(), 9000);
      const r = await fetch('https://marine-api.open-meteo.com/v1/marine?latitude=' + loc.lat + '&longitude=' + loc.lng + '&hourly=sea_surface_temperature&forecast_days=1&timezone=auto', { signal: ac.signal });
      clearTimeout(to); if (!r.ok) throw 0;
      const j = await r.json(), h = j.hourly; if (!h || !h.sea_surface_temperature) throw 0;
      const now = Date.now(); let i0 = 0; h.time.forEach((t, i) => { if (new Date(t).getTime() <= now) i0 = i; });
      const v = h.sea_surface_temperature[i0]; if (v == null) throw 0;
      seaT = +v; store.set(key, { t: Date.now(), v: seaT });
    } catch (e) { seaT = null; }
  }

  /* ---------- الموقع: بطاقة مشتركة ---------- */
  function locCard(open) {
    const loc = getLoc(), regs = regionsAt(loc);
    return '<details class="acc" id="locd"' + (open ? ' open' : '') + '><summary><span>' + ico('pin', 18) + ' ' + esc(loc.name) + ' <span class="muted small num">' + loc.lat.toFixed(2) + '، ' + loc.lng.toFixed(2) + '</span></span></summary><div class="body stack">' +
      '<div class="row"><button class="btn" data-act="geo">' + ico('pin', 20) + ' استخدم موقعي</button></div>' +
      '<div class="field"><label for="preset">أو اختر مدينة أو منطقة صيد</label><select id="preset"><option value="">— اختر —</option>' + PRESETS.map((p, i) => '<option value="' + i + '">' + esc(p[0]) + '</option>').join('') + '</select></div>' +
      '<div class="grid2"><div class="field"><label for="lat">خط العرض</label><input id="lat" inputmode="decimal" value="' + loc.lat.toFixed(4) + '"></div><div class="field"><label for="lng">خط الطول</label><input id="lng" inputmode="decimal" value="' + loc.lng.toFixed(4) + '"></div></div>' +
      '<button class="btn ghost" data-act="setll">تطبيق الإحداثيات</button>' +
      '<div class="muted small">الأوقات بتوقيت ' + (loc.tz ? 'المدينة المختارة' : 'جهازك') + '. الإحداثيات المخصصة تُعرض بتوقيت جهازك.</div></div></details>';
  }
  const locSummary = loc => {
    const regs = regionsAt(loc), names = regs.m.concat(regs.f).map(c => REG[c].l);
    const kind = regs.sf.t === 0 ? 'في عرض البحر' : regs.sf.t === 2 ? 'ساحل' : regs.sf.sea ? 'قرب الساحل' : 'داخل اليابسة (مياه عذبة)';
    return '<div class="muted small">' + kind + ' · ' + (isSouth(loc) ? 'نصف الكرة الجنوبي' : 'نصف الكرة الشمالي') + ' · ' + seasonName(loc) + (names.length ? ' · ' + esc(names.slice(0, 3).join(' · ')) : ' · لا إقليم مسجَّل قريب') + (regs.approx ? ' <span class="tag warn">أقرب إقليم تقريبًا</span>' : '') + '</div>';
  };

  /* ---------- الصفحة: هنا الآن ---------- */
  let hereTab = 'now', hereH = 'all', hereAll = false;
  V.here = function (a, qs) {
    if (qs.t) hereTab = qs.t;
    const loc = getLoc();
    return '<div class="stack"><div><div class="eyebrow">من أي مكان في العالم</div><h1 class="h1">هنا الآن</h1></div>' + locCard(!!loc.def) + locSummary(loc) +
      seg([['now', 'الآن'], ['week', 'الأسبوع'], ['year', 'السنة'], ['map', 'الخريطة'], ['tide', 'مد وجزر']], hereTab, 'here').replace('class="seg"', 'class="seg tight"') + '<div id="herebody"></div></div>';
  };
  function candidates(loc, opt) {
    const regs = regionsAt(loc), out = [];
    SG.forEach(s => {
      if (opt.h !== 'all' && (opt.h === 'm' ? s.h === 'f' : s.h === 'm')) return;
      if (s.w && s.w.indexOf('tox') > -1) return;
      const sc = monthScores(s, loc, regs, opt.sst); if (!sc) return;
      out.push({ s, sc });
    });
    const DPR = { sh: 0, es: 0, fw: 0, rf: 1, of: 2, dp: 3 };
    out.sort((x, y) => (y.sc[CUR] - x.sc[CUR]) || ((DPR[x.s.dp] || 0) - (DPR[y.s.dp] || 0)) || (y.sc.reduce((p, q) => p + q, 0) - x.sc.reduce((p, q) => p + q, 0)) || x.s.ar.localeCompare(y.s.ar, 'ar'));
    return out;
  }
  const gcard = (c, di) => {
    const s = c.s, cur = c.sc[CUR], ws = di ? windows(s, di) : [];
    return '<a class="card gcard stack" href="#/sp/' + s.id + '" style="gap:6px"><div class="gtop">' + gthumb(s) + '<div class="gnm"><div class="row between"><b class="h3" style="margin:0">' + esc(s.ar) + '</b><span class="tag ' + SC_CLS[cur] + '">' + SC_L[cur] + '</span></div>' +
      '<div class="muted small latin">' + esc(s.en) + '</div></div></div>' +
      (ws.length ? '<div class="wins">' + winHtml(ws, di.sun) + '</div>' : '') +
      stripG(c.sc) +
      '<div class="row small muted" style="gap:6px"><span>' + HAB_L[s.h] + '</span>' + (s.dp ? '<span>·</span><span>' + DP_L[s.dp] + '</span>' : '') + (s.w ? '<span>·</span>' + s.w.split(',').map(w => '<span class="tag ' + WARN_L[w][1] + '">' + ({ cr: 'منظَّم', cig: 'سيجواتيرا', tox: 'سام', inv: 'دخيل' })[w] + '</span>').join(' ') : '') + '</div></a>';
  };
  function drawHere() {
    const el = $('#herebody'); if (!el) return;
    const loc = getLoc();
    if (hereTab === 'week') return hereWeek(el, loc);
    if (hereTab === 'year') return hereYear(el, loc);
    if (hereTab === 'map') return hereMap(el, loc);
    if (hereTab === 'tide') return hereTide(el, loc);
    const di = dayInfo(loc), list = candidates(loc, { h: hereH, sst: seaT });
    const good = list.filter(c => c.sc[CUR] >= 2), other = list.filter(c => c.sc[CUR] < 2);
    const showN = hereAll ? 999 : 6;
    const seaHere = regionsAt(loc).sf.sea, isSea = c => c.s.h === 'm' || (c.s.h === 'a' && seaHere);
    const secs = hereH === 'all' ? [['في البحر', good.filter(isSea)], ['في المياه العذبة', good.filter(c => !isSea(c))]] : [[hereH === 'm' ? 'في البحر' : 'في المياه العذبة', good]];
    el.innerHTML = '<div class="stack">' +
      '<div class="chips" id="hf">' + [['all', 'الكل'], ['m', 'بحري'], ['f', 'مياه عذبة']].map(([k, l]) => '<button class="chip" data-hf="' + k + '" aria-pressed="' + (hereH === k) + '">' + l + '</button>').join('') + '</div>' +
      '<div class="card stack"><div class="row" style="flex-wrap:nowrap">' + moonSvg(di.ph) + '<div class="now" style="flex:1;min-width:0"><div><b class="num">' + T(di.sun.rise) + '</b><span>الشروق</span></div><div><b class="num">' + T(di.sun.set) + '</b><span>الغروب</span></div><div><b>' + esc(Astro.phaseName(di.ph.phase).split(' ')[0]) + '</b><span>القمر ' + Math.round(di.ph.fraction * 100) + '%</span></div></div></div>' +
      (di.spring ? '<div class="notice info">قمر جديد أو بدر تقريبًا: مد وجزر أكبر وتيار أقوى في المناطق التي فيها مد وجزر ملحوظ.</div>' : '') +
      (seaT != null ? '<div class="small"><span class="tag ok">حرارة الماء الآن ≈ ' + seaT.toFixed(1) + '°م</span> <span class="muted">(Open-Meteo) وتُستخدم لتعديل ترتيب الأنواع البحرية.</span></div>' : '') + '</div>' +
      '<h2 class="h2" style="margin:0">الأنسب هذا الشهر (' + MONTHS[CUR] + ')' + (good.length ? ' <span class="muted small">' + good.length + ' نوعًا</span>' : '') + '</h2>' +
      (good.length ? secs.filter(x => x[1].length).map(x => (secs.filter(y => y[1].length).length > 1 ? '<h3 class="h3" style="margin:6px 0 0">' + x[0] + '</h3>' : '') + '<div class="gridg">' + x[1].slice(0, showN).map(c => gcard(c, di)).join('') + '</div>' + (x[1].length > showN ? '<button class="btn ghost" data-act="hereall">عرض كل ' + x[1].length + ' نوعًا</button>' : '')).join('') : '<div class="empty">لا أنواع مسجَّلة لهذا الموقع والشهر. جرّب موقعًا قريبًا أو غيّر النوع (بحري/عذب).</div>') +
      (other.length ? '<details class="acc"><summary>خارج الذروة أو قليلة الآن (' + other.length + ')</summary><div class="body"><div class="gridg">' + other.map(c => gcard(c, null)).join('') + '</div></div></details>' : '') +
      '<div class="notice warn">الأوقات المقترحة تجمع سلوك النوع مع شروق وغروب الشمس في موقعك اليوم. النجمة ★ تعني تزامنها مع فترة قمرية رئيسية (نظرية جدلية). مواسم الأنواع إرشاد عام مبني على أدبيات الصيد ومصادر مثل FishBase وليست بديلًا عن الصيادين المحليين وقوانين بلدك.</div>' +
      '<section class="card stack"><h2 class="h2" style="margin:0">قواعد عامة للتوقيت</h2><ul style="margin:0;padding-inline-start:20px;display:flex;flex-direction:column;gap:6px">' + TIMING_RULES.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul></section></div>';
    if (STANDALONE && seaKey !== 'sst:' + loc.lat.toFixed(1) + ',' + loc.lng.toFixed(1) && hereH !== 'f') loadSST(loc).then(() => { if (seaT != null && hereTab === 'now' && $('#herebody')) drawHere(); });
  }
  function hereWeek(el, loc) {
    const t0 = dayStart(loc.tz, new Date()), rows = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(t0 + i * 86400000 + 12 * 3600000), di = dayInfo(loc, d), s = di.sun;
      const near = t => [s.rise, s.set].some(x => x && Math.abs(t - x) < 5400000);
      const majors = di.slots.filter(x => x.kind === 'major'), minors = di.slots.filter(x => x.kind === 'minor');
      const rate = (di.spring ? 1 : 0) + (majors.some(m => near(m.t)) ? 1 : 0) + (minors.some(m => near(m.t)) ? 1 : 0);
      rows.push('<tr><td><b>' + esc(tfmt(loc.tz, { weekday: 'long', day: 'numeric', month: 'short' }, 'w').format(d)) + '</b></td><td>' + moonSvg(di.ph).replace('class="moonicon"', 'class="moonicon sm"') + '<div class="muted small">' + esc(Astro.phaseName(di.ph.phase).split(' ')[0]) + '</div></td>' +
        '<td class="num">' + T(s.rise) + '<br><span class="muted small">' + T(s.set) + '</span></td><td class="num small">' + (majors.map(m => T(m.t)).join('<br>') || '—') + '</td>' +
        '<td><span class="dots" aria-label="مؤشر ' + rate + ' من 3">' + '●'.repeat(rate) + '○'.repeat(3 - rate) + '</span>' + (di.spring ? '<div class="muted small">مد كبير</div>' : '') + '</td></tr>');
    }
    el.innerHTML = '<div class="stack"><p class="muted small">أسبوع من الأيام لموقعك. المؤشر (0–3) نقطة لكل: قمر جديد/بدر (مد كبير)، فترة قمرية رئيسية قرب الشروق أو الغروب، فترة ثانوية قرب الشروق أو الغروب. هو مؤشر تقريبي لنظرية السولونار وليس علمًا مؤكدًا.</p>' +
      '<div class="tablewrap"><table><thead><tr><th>اليوم</th><th>القمر</th><th>الشروق / الغروب</th><th>ذروة القمر</th><th>المؤشر</th></tr></thead><tbody>' + rows.join('') + '</tbody></table></div>' +
      '<div class="notice info">لمواعيد المد والجزر الدقيقة لموقعك افتح <a href="#/links">قسم المد والجزر في المراجع</a>.</div></div>';
  }
  function hereYear(el, loc) {
    const list = candidates(loc, { h: hereH, sst: null }).slice(0, 40);
    const head = '<div class="hm head"><span></span>' + MONTHS.map((m, i) => '<span class="' + (i === CUR ? 'cur' : '') + '">' + m.slice(0, 3) + '</span>').join('') + '</div>';
    el.innerHTML = '<div class="stack"><div class="chips" id="hf">' + [['all', 'الكل'], ['m', 'بحري'], ['f', 'مياه عذبة']].map(([k, l]) => '<button class="chip" data-hf="' + k + '" aria-pressed="' + (hereH === k) + '">' + l + '</button>').join('') + '</div>' +
      '<p class="muted small">أقوى الأنواع في ' + esc(loc.name) + ' على مدار السنة (الشهور تنقلب حسب نصف الكرة الذي تقع فيه).</p>' +
      (list.length ? '<div class="hmwrap">' + head + list.map(c => '<a class="hm" href="#/sp/' + c.s.id + '"><span class="nm">' + esc(c.s.ar) + '</span>' + c.sc.map((l, i) => '<i class="c' + l + (i === CUR ? ' cur' : '') + '"></i>').join('') + '</a>').join('') + '</div>' +
        '<div class="legend"><span><i style="background:var(--lv0)"></i>غير متاح غالبًا</span><span><i style="background:var(--lv1)"></i>ضعيف</span><span><i style="background:var(--lv2)"></i>جيد</span><span><i style="background:var(--lv3)"></i>ذروة</span></div>' : '<div class="empty">لا أنواع مسجَّلة لهذا الموقع.</div>') + '</div>';
  }

  /* ---------- الأنواع العالمية ---------- */
  let spQ = '', spF = 'all';
  /* اسم النوع باللهجة المختارة: مصر/الخليج (الافتراضي) أو المغرب العربي إن وُجد بديل موثّق له، وإلا نرجع للاسم الأساسي */
  let dialect = store.get('dialect', 'eg');
  const dispName = s => (dialect === 'mag' && s.names && s.names.mag) || s.ar;
  V.species = function (a, qs) {
    if (qs.q != null) spQ = qs.q;
    return '<div class="stack"><div class="row between"><div><div class="eyebrow">قاعدة أنواع عالمية</div><h1 class="h1">الأنواع</h1></div><a class="btn ghost small" href="#/compare">' + ico('search', 16) + ' قارن بين الأنواع</a></div>' +
      searchForm('sq', spQ, 'اسم عربي أو إنجليزي أو علمي أو طُعم', 'بحث في الأنواع') +
      '<div class="row between" style="flex-wrap:wrap;gap:8px"><div class="chips" id="sf">' + [['all', 'الكل'], ['mine', 'في منطقتي'], ['now', 'ذروتها الآن'], ['m', 'بحري'], ['f', 'مياه عذبة']].map(([k, l]) => '<button class="chip" data-sf="' + k + '" aria-pressed="' + (spF === k) + '">' + l + '</button>').join('') + '</div>' +
      '<div class="chips" id="dl"><span class="muted small" style="align-self:center">الأسماء بلهجة:</span>' + [['eg', 'مصر والخليج'], ['mag', 'المغرب العربي']].map(([k, l]) => '<button class="chip" data-dl="' + k + '" aria-pressed="' + (dialect === k) + '">' + l + '</button>').join('') + '</div></div>' +
      '<p class="muted small">أسماء المغرب العربي موثّقة حاليًا لعدد محدود من الأنواع الشائعة (كاللوب والدوراد والروجي)، وتُستكمل تباعًا لباقي الأنواع.</p>' +
      '<div id="splist" class="gridg"></div>' +
      '<a class="tile wide" href="#/fish">' + ico('fish', 30) + '<div><b>ملف مساعد الصيد (مصر)</b><span>بأرماتها وصورها وجداولها الشهرية</span></div></a></div>';
  };
  function drawSpList() {
    const el = $('#splist'); if (!el) return;
    const loc = getLoc(), regs = regionsAt(loc), toks = norm(spQ).split(' ').filter(Boolean), qf = norm(spQ).replace(/ /g, '').length <= 2 ? 'nameHay' : 'hay';
    let rows = SG.filter(s => toks.every(t => s[qf].indexOf(t) > -1)).map(s => ({ s, sc: monthScores(s, loc, regs, null) }));
    if (spF === 'mine') rows = rows.filter(r => r.sc); else if (spF === 'now') rows = rows.filter(r => r.sc && r.sc[CUR] === 3); else if (spF === 'm') rows = rows.filter(r => r.s.h !== 'f'); else if (spF === 'f') rows = rows.filter(r => r.s.h !== 'm');
    rows.sort((x, y) => ((y.sc ? y.sc[CUR] : -1) - (x.sc ? x.sc[CUR] : -1)) || x.s.ar.localeCompare(y.s.ar, 'ar'));
    el.innerHTML = rows.length ? rows.map(r => { const s = r.s, sc = r.sc;
      return '<a class="card gcard stack" href="#/sp/' + s.id + '" style="gap:6px"><div class="gtop">' + gthumb(s) + '<div class="gnm"><div class="row between"><b class="h3" style="margin:0">' + esc(dispName(s)) + '</b>' + (sc ? '<span class="tag ' + SC_CLS[sc[CUR]] + '">' + SC_L[sc[CUR]] + '</span>' : '<span class="tag">خارج منطقتك</span>') + '</div><div class="muted small latin">' + esc(s.en) + ' · <i>' + esc(s.sci) + '</i></div></div></div>' + (sc ? stripG(sc) : '') + '</a>'; }).join('') : '<div class="empty" style="grid-column:1/-1">لا نتائج. جرّب كلمة أقصر أو فلترًا آخر.</div>';
  }

  V.sp = function (a, qs) {
    const s = BYG[a[0]]; if (!s) return '<div class="empty">لم أجد هذا النوع. <a href="#/species">كل الأنواع</a></div>';
    const loc = getLoc(), regs = regionsAt(loc), real = monthScores(s, loc, regs, null);
    const hem = qs.h === 's' ? 's' : qs.h === 'n' ? 'n' : (isSouth(loc) ? 's' : 'n');
    const fake = Object.assign({}, loc, { lat: hem === 's' ? -30 : 30 });
    const linkedEgypt = DECK[s.id] && BY[DECK[s.id]];
    const egyptReal = linkedEgypt && Array.isArray(linkedEgypt.levels) && linkedEgypt.levels.length === 12;
    const sc = (egyptReal && hem === 'n') ? linkedEgypt.levels.slice() :
      (monthScores(s, fake, { m: s.h === 'f' ? [] : Array.from(s.R).filter(c => REG[c].k === 'm'), f: Array.from(s.R).filter(c => REG[c].k === 'f') }, null) || new Array(12).fill(2));
    const di = dayInfo(loc), ws = real ? windows(s, di) : [];
    const cur = sc[CUR];
    const regList = Array.from(s.R).map(c => REG[c].l);
    const primary = s.sci.split(' / ')[0], species = /^[A-Z][a-z]+ [a-z]+$/.test(primary);
    const fb = species ? 'https://www.fishbase.se/summary/' + primary.replace(' ', '-') + '.html' : 'https://www.fishbase.se/search.php';
    const iu = species ? 'https://www.iucnredlist.org/search?query=' + encodeURIComponent(primary) : 'https://www.iucnredlist.org/';
    const bts = listNames(s.bt, BAIT);
    const facts = [['أفضل وقت في اليوم', todText(s)], ['ماء الصيد', s.dp ? DP_L[s.dp] : ''], ['الأفضل مع', s.tide ? TIDE_L[s.tide] : ''], ['حرارة الماء المثلى', s.sst ? s.sst[0] + '–' + s.sst[1] + '°م' : ''], ['الحجم المعتاد', s.sz], ['الطُّعم', bts.join('، ')]].filter(x => x[1]);
    const howHtml = howGroupsHtml(s.how);
    return '<div class="stack-lg"><div class="row between"><a class="btn ghost small" href="#/species">كل الأنواع</a>' + (real ? '<span class="tag ' + SC_CLS[real[CUR]] + '">' + SC_L[real[CUR]] + ' الآن هنا</span>' : '') + '</div>' +
      '<header class="stack"><div><h1 class="h1">' + esc(dispName(s)) + '</h1>' + (dialect === 'mag' && s.names && s.names.mag ? '<div class="muted small">الاسم الأساسي: ' + esc(s.ar) + '</div>' : '') + '<div class="muted latin" style="margin-top:2px">' + esc(s.en) + '</div><div class="muted small latin"><i>' + esc(s.sci) + '</i></div>' + (s.fam ? '<div class="muted small">' + esc(s.fam) + '</div>' : '') + '</div><div class="chips"><span class="tag">' + HAB_L[s.h] + '</span>' + (s.o ? '<span class="tag gold">موسمي صارم</span>' : '') + '</div></header>' +
      '<div class="sphero">' + gthumb(s, true) + '<div class="muted small" id="phcredit" data-sp="' + esc(s.id) + '">' + (deckPhoto(s) ? 'الصورة من ملف «مساعد الصيد».' : IMGS['sp_' + s.id] ? credit('sp_' + s.id) : (STANDALONE ? 'جارٍ تحميل صورة حقيقية للنوع من ويكيبيديا…' : 'الصورة الحقيقية تظهر في النسخة المحمّلة عند الاتصال بالإنترنت.')) + '</div></div>' + vidHtml(s.id) +
      (s.w ? s.w.split(',').map(w => '<div class="notice ' + (WARN_L[w][1] === 'bad' ? 'bad' : 'warn') + '">' + esc(WARN_L[w][0]) + '.</div>').join('') : '') +
      (real ? '' : '<div class="notice info">هذا النوع <b>غير مسجَّل في منطقتك الحالية</b>. الأرقام في الجدول أدناه افتراضية لموطنه الأصلي حسب نصف الكرة المختار فقط، وليست تقييمًا لفرصك الفعلية عندك. <a href="#/here">غيّر موقعك</a></div>') +
      '<section class="card stack"><div class="row between"><h2 class="h2" style="margin:0">' + (real ? 'الموسم على مدار السنة' : 'موسمه الافتراضي في موطنه الأصلي (ليس عندك)') + '</h2><div class="chips"><a class="chip" href="#/sp/' + s.id + '?h=n" aria-pressed="' + (hem === 'n') + '">شمال</a><a class="chip" href="#/sp/' + s.id + '?h=s" aria-pressed="' + (hem === 's') + '">جنوب</a></div></div>' +
      '<div class="bars' + (real ? '' : ' hyp') + '" role="img" aria-label="نسبة ذروة موسم ' + esc(s.ar) + (real ? '' : ' (افتراضي لموطنه الأصلي)') + '">' + sc.map((l, i) => { const pct = Math.round(l * 100 / 3); return '<div class="col l' + l + (i === CUR ? ' cur' : '') + '"><b class="pct">' + pct + '%</b><div class="batt"><i style="height:' + pct + '%"></i></div><span>' + MONTHS[i].slice(0, 3) + '</span></div>'; }).join('') + '</div>' +
      (real ? '<div class="legend"><span><i style="background:var(--lv0)"></i>0%</span><span><i style="background:var(--lv1)"></i>33%</span><span><i style="background:var(--lv2)"></i>66%</span><span><i style="background:var(--lv3)"></i>100%</span></div>' : '<div class="muted small">تدرّج رمادي عمدًا لأنه تقدير افتراضي غير مرتبط بمنطقتك الحالية.</div>') +
      '<div class="muted small">' + (egyptReal && hem === 'n' ? 'هذه نسب ميدانية حقيقية من ملف «مساعد الصيد» في مصر (نفس بيانات صفحته التفصيلية)، وليست تقديرًا عامًا — لذلك قد تختلف عن أنواع أخرى تعرض تقديرًا تقريبيًا فقط. ' : 'الشهور ' + (hem === 's' ? 'مقلوبة لنصف الكرة الجنوبي.' : 'لنصف الكرة الشمالي.')) + (Math.abs(loc.lat) < 6 && real && !egyptReal ? ' قرب خط الاستواء الموسمية ضعيفة فتُعرض متوسطة طوال السنة.' : '') + '</div></section>' +
      '<section class="card stack"><h2 class="h2" style="margin:0">أين يعيش؟</h2>' + mapHtml('map-sp', { sp: s.id, span: 360, h: 330 }) + legendMap + '<div class="muted small">الظل الذهبي أقاليم تواجد النوع (صناديق تقريبية، والحدود الفعلية أدق منها). النقطة الذهبية موقعك.</div></section>' +
      (howHtml ? '<section class="card stack"><h2 class="h2" style="margin:0">طريقة الصيد</h2>' + howHtml + '</section>' : '') +
      (real ? '<section class="card stack"><h2 class="h2" style="margin:0">اليوم في ' + esc(loc.name) + '</h2><div class="wins">' + (winHtml(ws, di.sun) || '<span class="muted small">لا نوافذ محددة لليوم.</span>') + '</div><div class="muted small">النجمة ★ = تتزامن مع فترة قمرية رئيسية. الأوقات تقريبية وبتوقيت ' + (loc.tz ? 'المدينة' : 'جهازك') + '.</div></section>' : '') +
      '<section class="card"><dl class="kv" style="margin:0">' + facts.map(f => '<dt>' + f[0] + '</dt><dd>' + esc(f[1]) + '</dd>').join('') + '<dt>يتواجد في</dt><dd>' + esc(regList.slice(0, 8).join('، ') + (regList.length > 8 ? '… و' + (regList.length - 8) + ' مناطق أخرى' : '')) + '</dd></dl></section>' +
      (s.n ? '<div class="card prose"><p>' + esc(s.n) + '</p></div>' : '') +
      (DECK[s.id] && BY[DECK[s.id]] ? '<a class="btn" href="#/fish/' + DECK[s.id] + '">صفحته التفصيلية في ملف مصر (أرمات وصور)</a>' : '') +
      '<section class="stack"><h2 class="h2" style="margin:0">تحقق وتوسّع</h2><a class="btn ghost" target="_blank" rel="noopener" href="' + fb + '">FishBase: بيانات علمية</a><a class="btn ghost" target="_blank" rel="noopener" href="' + iu + '">IUCN: حالة الحفظ</a><a class="btn ghost" href="#/links">قوانين الصيد في بلدك (المراجع)</a></section>' +
      '<p class="muted small">الأسماء العربية تختلف بين البلدان؛ الاسم العلمي هو المرجع. الموسم إرشاد عام وليس جدول قانون.</p></div>';
  };

  /* ================= مقارنة الأنواع (حتى 3 أنواع) ================= */
  let CMP = { a: '', b: '', c: '' };
  V.compare = function (a, qs) {
    if (qs.a != null || qs.b != null || qs.c != null) CMP = { a: qs.a || '', b: qs.b || '', c: qs.c || '' };
    const opts = SG.slice().sort((x, y) => x.ar.localeCompare(y.ar, 'ar'));
    const sel = (id, val) => '<select id="' + id + '" class="cmpsel"><option value="">— اختر نوعًا —</option>' + opts.map(s => '<option value="' + s.id + '"' + (s.id === val ? ' selected' : '') + '>' + esc(dispName(s)) + '</option>').join('') + '</select>';
    return '<div class="stack"><div class="row between"><div><div class="eyebrow">أداة مقارنة</div><h1 class="h1">قارن بين الأنواع</h1></div><a class="btn ghost small" href="#/species">كل الأنواع</a></div>' +
      '<p class="muted small">اختر حتى 3 أنواع لمقارنة حجمها ومكان عيشها وطُعمها وطرق صيدها وكل شيء عنها جنبًا إلى جنب.</p>' +
      '<div class="cmppick">' + sel('cmpA', CMP.a) + sel('cmpB', CMP.b) + sel('cmpC', CMP.c) + '</div>' +
      '<div id="cmptbl"></div></div>';
  };
  function drawCompare() {
    const el = $('#cmptbl'); if (!el) return;
    const ids = [CMP.a, CMP.b, CMP.c].filter(Boolean), items = ids.map(id => BYG[id]).filter(Boolean);
    if (!items.length) { el.innerHTML = '<div class="empty">اختر نوعين أو أكثر من القوائم فوق لتبدأ المقارنة.</div>'; return; }
    const loc = getLoc();
    const rows = [
      ['الاسم', s => esc(dispName(s))],
      ['بالإنجليزية', s => '<span class="latin">' + esc(s.en) + '</span>'],
      ['الاسم العلمي', s => '<i class="latin">' + esc(s.sci) + '</i>'],
      ['الفصيلة', s => esc(s.fam || '—')],
      ['الموطن', s => esc(HAB_L[s.h])],
      ['الحجم المعتاد', s => esc(s.sz || '—')],
      ['ماء الصيد', s => esc(s.dp ? DP_L[s.dp] : '—')],
      ['أفضل وقت في اليوم', s => esc(todText(s))],
      ['حرارة الماء المثلى', s => esc(s.sst ? s.sst[0] + '–' + s.sst[1] + '°م' : '—')],
      ['الطُّعم', s => esc(listNames(s.bt, BAIT).join('، ') || '—')],
      ['طرق الصيد', s => esc(listNames(s.how, HOW).join('، ') || '—')],
      ['موسمي صارم', s => s.o ? 'نعم' : 'لا'],
      ['تحذيرات', s => s.w ? s.w.split(',').map(w => esc(WARN_L[w][0])).join('، ') : '—'],
      ['موسمها عندك الآن', s => { const regs = regionsAt(loc), sc = monthScores(s, loc, regs, null); return sc ? '<span class="tag ' + SC_CLS[sc[CUR]] + '">' + SC_L[sc[CUR]] + '</span>' : '<span class="muted">خارج منطقتك</span>'; }]
    ];
    el.innerHTML = '<div class="tablewrap"><table><thead><tr><th></th>' + items.map(s => '<th><a href="#/sp/' + s.id + '">' + esc(dispName(s)) + '</a></th>').join('') + '</tr></thead><tbody>' +
      rows.map(([label, fn]) => '<tr><td><b>' + esc(label) + '</b></td>' + items.map(s => '<td>' + fn(s) + '</td>').join('') + '</tr>').join('') +
      '</tbody></table></div>';
  }

  /* ================= الصور والرسوم التوضيحية ================= */
  const deckPhoto = s => { const d = DECK[s.id]; return d && BY[d] && BY[d].photo && !/^sp_/.test(BY[d].photo) ? img(BY[d].photo) : ''; };
  /* صور حقيقية مضمّنة دائمًا (imgs.json بمفتاح sp_<id>)، بدون علامات مائية أو أشخاص — بياناتها في data_credits.js */
  const gPhoto = s => deckPhoto(s) || img('sp_' + s.id);
  /* مقطع فيديو قصير حقيقي للنوع (vids.json) — صامت ويتكرر، بلا علامات مائية ولا أشخاص */
  const vidHtml = id => id && VIDS[id] ? '<figure class="spvid" style="margin:0"><video autoplay muted loop playsinline preload="metadata" controls style="width:100%;border-radius:16px;display:block;background:#000" aria-label="فيديو قصير للنوع"><source src="' + VIDS[id].webm + '" type="video/webm"><source src="' + VIDS[id].mp4 + '" type="video/mp4"></video>' + (VIDEO_CREDITS[id] && VIDEO_CREDITS[id].by ? '<figcaption class="muted small">فيديو: ' + esc(VIDEO_CREDITS[id].by) + '.</figcaption>' : '') + '</figure>' : '';
  const gthumb = (s, big) => {
    const dp = gPhoto(s);
    return '<span class="gthumb' + (big ? ' big' : '') + ' hab-' + s.h + (dp ? ' has' : '') + '" data-ph="' + s.id + '"' + (big ? ' data-big="1"' : '') + '>' + artSvg(s.id, big ? 'b' : 's') + (dp ? '<img alt="" src="' + dp + '">' : '') + '</span>';
  };
  const PH = { mem: store.get('ph', {}), q: [], busy: 0, t: 0, off: 0 };
  const phTitle = s => s.sci.split(' / ')[0].replace(/\s+spp\.?$/, '').replace(/\s*\(.*\)\s*$/, '').trim();
  const phSave = () => { clearTimeout(PH.t); PH.t = setTimeout(() => store.set('ph', PH.mem), 800); };
  function phApply(el, m) {
    if (!m || !m.u || el.querySelector('img')) return;
    const big = el.dataset.big, im = new Image();
    im.alt = ''; im.decoding = 'async';
    im.onload = () => { el.classList.add('has'); };
    im.onerror = () => { im.remove(); };
    im.src = big ? m.u.replace(/\/\d+px-/, '/900px-') : m.u;
    el.appendChild(im);
    if (big) { const c = $('#phcredit'); if (c && m.p) c.innerHTML = 'صورة من <a href="' + esc(m.p) + '" target="_blank" rel="noopener">ويكيبيديا: ' + esc(m.t || '') + '</a>. حقوقها لأصحابها وفق الرخصة المذكورة في صفحتها.'; }
  }
  async function wikiPhoto(titles) {
    for (const t of titles.filter(Boolean)) {
      try {
        const r = await fetch('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(t.replace(/ /g, '_')));
        if (!r.ok) continue;
        const j = await r.json();
        if (j.type === 'disambiguation') continue;
        if (j.thumbnail && j.thumbnail.source) return { u: j.thumbnail.source, p: (j.content_urls && j.content_urls.desktop && j.content_urls.desktop.page) || '', t: j.title || t };
      } catch (e) { return 'err'; }
    }
    return null;
  }
  const phFetch = s => wikiPhoto([phTitle(s), s.en.replace(/\s*\(.*\)\s*/g, '').trim()]);
  /* ---- صور حقيقية لأسماك ملف مصر التي بلا صورة موثوقة، بالاعتماد على الاسم الإنجليزي الموثّق (من الملف نفسه أو من رابط DECK بقاعدة الأنواع العالمية) وليس تخمين اسم عربي ---- */
  const DECK_REV = {}; Object.keys(DECK).forEach(k => { DECK_REV[DECK[k]] = k; });
  function fishPhotoTitles(s) {
    const wid = DECK_REV[s.id];
    if (wid && BYG[wid]) return [phTitle(BYG[wid]), BYG[wid].en.replace(/\s*\(.*\)\s*/g, '').trim()];
    if (s.en) return [s.en.replace(/\s*\(.*\)\s*/g, '').trim()];
    return null;
  }
  const FPH = { mem: store.get('fph', {}), q: [], busy: 0, off: 0, t: 0 };
  const fphSave = () => { clearTimeout(FPH.t); FPH.t = setTimeout(() => store.set('fph', FPH.mem), 800); };
  function fphApply(el, m) {
    if (el.querySelector('img')) return;
    const im = new Image(); im.alt = ''; im.decoding = 'async';
    im.onload = () => { el.classList.add('has'); const ph = el.querySelector('.fphload'); if (ph) ph.remove(); };
    im.onerror = () => { im.remove(); };
    im.src = m.u.replace(/\/\d+px-/, '/900px-');
    el.appendChild(im);
    if (!el.querySelector('.figmag')) el.insertAdjacentHTML('beforeend', '<span class="figmag">' + ico('search', 18) + '</span>');
    el.dataset.zoom = m.u;
    if (m.p) el.insertAdjacentHTML('afterend', '<div class="muted small">صورة من <a href="' + esc(m.p) + '" target="_blank" rel="noopener">ويكيبيديا: ' + esc(m.t || '') + '</a>. حقوقها لأصحابها وفق الرخصة المذكورة في صفحتها.</div>');
  }
  function hydrateFishPhotos() {
    if (!STANDALONE) return;
    $$('[data-fph]:not([data-fpd])').forEach(el => {
      el.dataset.fpd = '1'; const id = el.dataset.fph, s = BY[id]; if (!s) return;
      const titles = fishPhotoTitles(s); if (!titles) return;
      const m = FPH.mem[id];
      if (m && m.u) { fphApply(el, m); return; }
      if (m && m.x && Date.now() - m.x < 14 * 864e5) { el.outerHTML = '<div class="notice">لسه ما لقيناش صورة حقيقية موثوقة لهذا النوع؛ هنجرّب تاني بعد شوية. <button class="btn ghost small" data-fph-retry="' + id + '" type="button">جرّب دلوقتي</button></div>'; return; }
      if (FPH.off && Date.now() - FPH.off < 60000) return;
      FPH.q.push({ el, id, titles });
    });
    fphPump();
  }
  function fphPump() {
    while (FPH.busy < 3 && FPH.q.length) {
      const job = FPH.q.shift(); FPH.busy++;
      wikiPhoto(job.titles).then(m => {
        if (m === 'err') { FPH.off = Date.now(); const ph = job.el.querySelector('.fphload'); if (ph) ph.textContent = 'تعذّر تحميل صورة حقيقية الآن — تأكد إنك فاتح رابط الموقع المنشور (مش ملف محلي)، أو إن اتصالك بالإنترنت ميحجبش ويكيبيديا، وجرّب تاني.'; return; }
        FPH.mem[job.id] = m || { x: Date.now() }; fphSave();
        if (m) fphApply(job.el, m);
        else job.el.outerHTML = '<div class="notice">لسه ما لقيناش صورة حقيقية موثوقة لهذا النوع؛ هنجرّب تاني بعد شوية. <button class="btn ghost small" data-fph-retry="' + job.id + '" type="button">جرّب دلوقتي</button></div>';
      }).then(() => { FPH.busy--; fphPump(); }, () => { FPH.busy--; fphPump(); });
    }
  }
  function phPump() {
    while (PH.busy < 3 && PH.q.length) {
      const el = PH.q.shift(), s = BYG[el.dataset.ph];
      if (!s) continue;
      PH.busy++;
      phFetch(s).then(m => {
        if (m === 'err') { PH.off = Date.now(); const c = $('#phcredit'); if (c && c.dataset.sp === String(s.id)) c.innerHTML = 'تعذّر تحميل صورة حقيقية الآن — تأكد إنك فاتح رابط الموقع المنشور (مش ملف محلي)، أو إن اتصالك بالإنترنت ميحجبش ويكيبيديا. <button class="btn ghost small" data-ph-retry="' + s.id + '" type="button">جرّب دلوقتي</button>'; return; }
        PH.mem[s.id] = m || { x: Date.now() }; phSave();
        if (m) $$('[data-ph="' + s.id + '"]').forEach(e => phApply(e, m));
        else { const c = $('#phcredit'); if (c && c.dataset.sp === String(s.id)) c.innerHTML = 'لسه ما لقيناش صورة حقيقية موثوقة لهذا النوع. <button class="btn ghost small" data-ph-retry="' + s.id + '" type="button">جرّب دلوقتي</button>'; }
      }).then(() => { PH.busy--; phPump(); }, () => { PH.busy--; phPump(); });
    }
  }
  function hydratePhotos() {
    if (!STANDALONE) return;
    $$('.gthumb[data-ph]:not([data-pd])').forEach(el => {
      el.dataset.pd = '1'; const s = BYG[el.dataset.ph];
      if (!s || gPhoto(s)) return;
      const m = PH.mem[s.id];
      if (m && m.u) return phApply(el, m);
      if (m && m.x && Date.now() - m.x < 14 * 864e5) {
        if (el.dataset.big) { const c = $('#phcredit'); if (c && c.dataset.sp === String(s.id)) c.innerHTML = 'لسه ما لقيناش صورة حقيقية موثوقة لهذا النوع. <button class="btn ghost small" data-ph-retry="' + s.id + '" type="button">جرّب دلوقتي</button>'; }
        return;
      }
      if (PH.off && Date.now() - PH.off < 60000) return;
      PH.q.push(el);
    });
    phPump();
  }

  /* ================= الخريطة (مرسومة من قناع اليابسة، تعمل بلا إنترنت) ================= */
  const MAPST = {};
  const rgb = v => { v = String(v).trim(); const m = /^#([0-9a-f]{6})$/i.exec(v); if (m) return [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4), 16)]; const n = /(\d+)[, ]+(\d+)[, ]+(\d+)/.exec(v); return n ? [+n[1], +n[2], +n[3]] : [128, 128, 128]; };
  const cssv = n => getComputedStyle(document.documentElement).getPropertyValue(n);
  const CVAL = [0, 1, 0.55];
  const GRD = new Float32Array(180 * 360); for (let i = 0; i < 180; i++) for (let j = 0; j < 360; j++) GRD[i * 360 + j] = CVAL[cellT(i, j)];
  const crW = t => [(-t * t * t + 2 * t * t - t) / 2, (3 * t * t * t - 5 * t * t + 2) / 2, (-3 * t * t * t + 4 * t * t + t) / 2, (t * t * t - t * t) / 2];
  const wrapLng = lo => ((lo + 540) % 360) - 180;
  function spBoxes(id) {
    const s = BYG[id]; if (!s) return [];
    return Array.from(s.R).filter(c => REG[c] && (s.h === 'a' || (s.h === 'f' ? REG[c].k === 'f' : REG[c].k === 'm'))).map(c => ({ k: REG[c].k, b: REG[c].b }));
  }
  function mapDraw(cv) {
    const st = MAPST[cv.id]; if (!st) return;
    const W = cv.width, H = cv.height, ctx = cv.getContext('2d'), im = ctx.createImageData(W, H), d = im.data;
    const sea = rgb(cssv('--sea')), gold = rgb(cssv('--gold')), land = rgb(cssv(sea[0] + sea[1] + sea[2] < 150 ? '--lv2' : '--lv1'));
    const dpp = st.span / W, cl = st.span <= 120 ? Math.max(0.15, Math.cos(st.lat * Math.PI / 180)) : 1;
    const wrapEl = cv.closest('.mapbox'), boxes = spBoxes((wrapEl && wrapEl.dataset.sp) || ''), lons = new Float64Array(W);
    const cols = new Int32Array(W * 4), wxs = new Float32Array(W * 4);
    for (let x = 0; x < W; x++) {
      const lo = wrapLng(st.lng + (x - W / 2 + 0.5) * dpp); lons[x] = lo;
      const fj = lo + 179.5, j0 = Math.floor(fj), w = crW(fj - j0);
      for (let c = 0; c < 4; c++) { cols[x * 4 + c] = (((j0 - 1 + c) % 360) + 360) % 360; wxs[x * 4 + c] = w[c]; }
    }
    const rix = [0, 0, 0, 0];
    for (let y = 0; y < H; y++) {
      const la = st.lat + (H / 2 - y - 0.5) * dpp * cl, out = la > 90 || la < -90;
      const fi = la + 89.5, i0 = Math.floor(fi), wy = crW(fi - i0);
      for (let r = 0; r < 4; r++) rix[r] = Math.max(0, Math.min(179, i0 - 1 + r)) * 360;
      for (let x = 0; x < W; x++) {
        const o = (y * W + x) * 4; let c0 = sea[0], c1 = sea[1], c2 = sea[2];
        if (out) { c0 = sea[0] * 0.6; c1 = sea[1] * 0.6; c2 = sea[2] * 0.6; }
        else {
          const lo = lons[x], k4 = x * 4;
          let v = 0; for (let r = 0; r < 4; r++) { const rb = rix[r]; v += wy[r] * (wxs[k4] * GRD[rb + cols[k4]] + wxs[k4 + 1] * GRD[rb + cols[k4 + 1]] + wxs[k4 + 2] * GRD[rb + cols[k4 + 2]] + wxs[k4 + 3] * GRD[rb + cols[k4 + 3]]); }
          const isL = v > 0.5;
          if (isL) { c0 = land[0]; c1 = land[1]; c2 = land[2]; }
          if (boxes.length) {
            let hit = false;
            for (let q = 0; q < boxes.length && !hit; q++) {
              const bb = boxes[q]; if (bb.k === 'm' ? isL : !isL) continue;
              for (let z = 0; z < bb.b.length; z++) { const b = bb.b[z]; if (la >= b[0] && la <= b[1] && lo >= b[2] && lo <= b[3]) { hit = true; break; } }
            }
            if (hit) { c0 = c0 * 0.42 + gold[0] * 0.58; c1 = c1 * 0.42 + gold[1] * 0.58; c2 = c2 * 0.42 + gold[2] * 0.58; }
          }
        }
        d[o] = c0; d[o + 1] = c1; d[o + 2] = c2; d[o + 3] = 255;
      }
    }
    ctx.putImageData(im, 0, 0);
    const px = lo => W / 2 + wrapLng(lo - st.lng) / dpp, py = la => H / 2 - (la - st.lat) / (dpp * cl), S = W / 600;
    const gs = st.span > 200 ? 30 : st.span > 60 ? 10 : st.span > 20 ? 5 : 1;
    ctx.strokeStyle = 'rgba(255,255,255,.16)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let la = -90; la <= 90; la += gs) { const y = py(la); if (y >= 0 && y <= H) { ctx.moveTo(0, y + .5); ctx.lineTo(W, y + .5); } }
    for (let lo = -180; lo < 180; lo += gs) { const dl = wrapLng(lo - st.lng); if (Math.abs(dl) <= st.span / 2 + gs) { const x = W / 2 + dl / dpp; ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, H); } }
    ctx.stroke();
    if (st.span <= 90) {
      ctx.font = (11 * S) + 'px "IBM Plex Sans Arabic",Tahoma,sans-serif'; ctx.textAlign = 'center';
      PRESETS.forEach(p => {
        const x = px(p[2]), y = py(p[1]); if (x < 4 || x > W - 4 || y < 4 || y > H - 4) return;
        ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.beginPath(); ctx.arc(x, y, 2.2 * S, 0, 6.3); ctx.fill();
        if (st.span <= 36) { ctx.lineWidth = 3 * S; ctx.strokeStyle = 'rgba(6,32,44,.75)'; ctx.strokeText(p[0], x, y - 6 * S); ctx.fillStyle = '#fff'; ctx.fillText(p[0], x, y - 6 * S); }
      });
    }
    const lc = getLoc(), x = px(lc.lng), y = py(lc.lat);
    if (x > -20 && x < W + 20 && y > -20 && y < H + 20) {
      ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(x, y + 1 * S, 8 * S, 3 * S, 0, 0, 6.3); ctx.fill();
      ctx.fillStyle = cssv('--gold') || '#E8A800'; ctx.strokeStyle = '#06202C'; ctx.lineWidth = 2 * S;
      ctx.beginPath(); ctx.arc(x, y - 9 * S, 7 * S, 0, 6.3); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 5 * S, y - 5 * S); ctx.lineTo(x, y); ctx.lineTo(x + 5 * S, y - 5 * S); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#06202C'; ctx.beginPath(); ctx.arc(x, y - 9 * S, 2.4 * S, 0, 6.3); ctx.fill();
    }
    const cap = $('#mapcap'); if (cap && cv.id === 'map-here') cap.textContent = 'عرض الخريطة ≈ ' + Math.round(st.span * 111 * (st.span <= 120 ? cl : 1)).toLocaleString('en') + ' كم · المركز ' + st.lat.toFixed(2) + '، ' + st.lng.toFixed(2);
  }
  const LMAP = {};
  const zoomFromSpan = sp => Math.max(1, Math.min(18, Math.round(Math.log2(360 / sp) + 1)));
  const spanFromZoom = z => 360 / Math.pow(2, z - 1);
  const mapHtml = (id, o) => '<div class="mapbox" data-mapid="' + id + '" data-tap="' + (o.tap ? 1 : 0) + '" data-sp="' + (o.sp || '') + '">' +
    '<div class="mapc leafwrap" id="' + id + '-leaf" style="height:' + (o.h || 360) + 'px"></div>' +
    '<canvas class="mapc mapfallback" id="' + id + '" width="600" height="' + (o.h || 360) + '" style="height:' + (o.h || 360) + 'px" data-span="' + (o.span || 40) + '" role="img" aria-label="خريطة العالم (بلا إنترنت)"></canvas>' +
    '<div class="mapctl">' + [['in', '+'], ['out', '−'], ['r', 'منطقة'], ['w', 'العالم'], ['c', 'موقعي']].map(b => '<button class="btn ghost small" data-mz="' + b[0] + '" data-for="' + id + '"' + (b[0] === 'in' || b[0] === 'out' ? ' aria-label="' + (b[0] === 'in' ? 'تكبير' : 'تصغير') + '"' : '') + '>' + b[1] + '</button>').join('') + '</div>' +
    '<div class="chips maplayer" data-for="' + id + '"><button class="chip" data-ml="street" data-for="' + id + '" aria-pressed="true">خريطة</button><button class="chip" data-ml="sat" data-for="' + id + '" aria-pressed="false">قمر صناعي</button></div>' +
    '<div class="muted small mapoff" id="' + id + '-off" hidden>لا إنترنت الآن: عرض خريطة تقريبية تعمل بلا اتصال. الأجزاء اللي زرتها قبل كده بالخريطة الحقيقية بتفضل محفوظة.</div></div>';
  function tzGuess(la, lo) {
    let best = null, bd = 1e9;
    PRESETS.forEach(p => { if (!p[3]) return; const d = Math.hypot(p[1] - la, wrapLng(p[2] - lo) * Math.cos(la * Math.PI / 180)); if (d < bd) { bd = d; best = p; } });
    if (best && bd <= 3) return best[3];
    const h = Math.round(lo / 15); return h === 0 ? 'Etc/GMT' : 'Etc/GMT' + (h > 0 ? '-' + h : '+' + (-h));
  }
  function mapTap(id, la, lo) {
    la = Math.max(-89, Math.min(89, la)); lo = wrapLng(lo);
    MAPST[id].lat = la; MAPST[id].lng = lo;
    const sy = window.scrollY;
    setLoc({ name: 'نقطة على الخريطة', lat: +la.toFixed(3), lng: +lo.toFixed(3), tz: tzGuess(la, lo) });
    window.scrollTo(0, sy);
    toast('تم تحديد الموقع. الأوقات تقديرية لمنطقتك الزمنية.');
  }
  function mapDrawSpRects(id) {
    const L2 = LMAP[id]; if (!L2) return;
    (L2.rects || []).forEach(r => L2.map.removeLayer(r)); L2.rects = [];
    spBoxes($('.mapbox[data-mapid="' + id + '"]').dataset.sp || '').forEach(bb => bb.b.forEach(b => {
      const r = L.rectangle([[b[0], b[2]], [b[1], b[3]]], { color: '#E8A800', weight: 1, fillColor: '#E8A800', fillOpacity: .35, interactive: false }).addTo(L2.map);
      L2.rects.push(r);
    }));
  }
  function mapInit(wrap) {
    if (wrap.dataset.mi) return; wrap.dataset.mi = '1';
    const id = wrap.dataset.mapid, cv = $('#' + id), leafEl = $('#' + id + '-leaf'), offNote = $('#' + id + '-off');
    const loc = getLoc();
    if (!MAPST[id]) MAPST[id] = { lat: id === 'map-sp' ? 5 : loc.lat, lng: id === 'map-sp' ? 10 : loc.lng, span: +cv.dataset.span };
    const st = MAPST[id]; let raf = 0, drag = null;
    const redraw = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; mapDraw(cv); }); };
    cv._redraw = redraw;
    cv.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, lat: st.lat, lng: st.lng, moved: false }; try { cv.setPointerCapture(e.pointerId); } catch (x) {} });
    cv.addEventListener('pointermove', e => {
      if (!drag) return;
      const r = cv.getBoundingClientRect(), k = cv.width / r.width, dx = (e.clientX - drag.x) * k, dy = (e.clientY - drag.y) * k;
      if (Math.abs(dx) + Math.abs(dy) > 6) drag.moved = true;
      if (!drag.moved) return;
      const dpp = st.span / cv.width, cl = st.span <= 120 ? Math.max(0.15, Math.cos(drag.lat * Math.PI / 180)) : 1;
      st.lng = wrapLng(drag.lng - dx * dpp); st.lat = Math.max(-80, Math.min(80, drag.lat + dy * dpp * cl)); redraw();
    });
    const end = e => {
      if (!drag) return; const d = drag; drag = null;
      if (!d.moved && wrap.dataset.tap === '1' && e.type === 'pointerup') {
        const r = cv.getBoundingClientRect(), k = cv.width / r.width, dpp = st.span / cv.width, cl = st.span <= 120 ? Math.max(0.15, Math.cos(st.lat * Math.PI / 180)) : 1;
        const x = (e.clientX - r.left) * k, y = (e.clientY - r.top) * k;
        mapTap(id, st.lat + (cv.height / 2 - y) * dpp * cl, st.lng + (x - cv.width / 2) * dpp);
      }
    };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    mapDraw(cv);
    /* خريطة حقيقية عالمية (Leaflet) فوق البديل المرسوم؛ لو مفيش إنترنت أو الخرائط ما وصلتش يفضل ظاهر البديل */
    if (typeof L === 'undefined') { cv.hidden = false; if (offNote) offNote.hidden = false; return; }
    try {
      const map = L.map(leafEl, { zoomControl: false, attributionControl: true, worldCopyJump: true }).setView([st.lat, st.lng], zoomFromSpan(st.span));
      const street = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', { maxZoom: 18, attribution: 'Esri' });
      const sat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 18, attribution: 'Esri, Maxar, Earthstar Geographics' });
      street.addTo(map);
      const marker = L.circleMarker([loc.lat, loc.lng], { radius: 7, color: '#06202C', weight: 2, fillColor: '#E8A800', fillOpacity: 1 }).addTo(map);
      LMAP[id] = { map, street, sat, cur: 'street', marker, rects: [] };
      mapDrawSpRects(id);
      let shown = false;
      let hadError = false, settled = false;
      const showLeaf = () => { if (settled) return; settled = true; shown = true; leafEl.hidden = false; cv.hidden = true; if (offNote) offNote.hidden = true; };
      const showFallback = () => { if (settled) return; settled = true; shown = true; leafEl.hidden = true; cv.hidden = false; if (offNote) offNote.hidden = false; };
      street.on('tileload', showLeaf);
      street.on('tileerror', () => { hadError = true; if (!settled) showFallback(); });
      street.on('load', () => { if (!hadError) showLeaf(); });
      if (wrap.dataset.tap === '1') map.on('click', e => mapTap(id, e.latlng.lat, e.latlng.lng));
      map.on('moveend', () => { const c = map.getCenter(); st.lat = c.lat; st.lng = wrapLng(c.lng); st.span = spanFromZoom(map.getZoom()); });
      setTimeout(() => map.invalidateSize(), 60);
    } catch (e) { cv.hidden = false; if (offNote) offNote.hidden = false; }
  }
  function mapZoom(id, k) {
    const cv = $('#' + id), st = MAPST[id]; if (!cv || !st) return; const loc = getLoc();
    if (k === 'in') st.span = Math.max(spanFromZoom(18), st.span / 2); else if (k === 'out') st.span = Math.min(360, st.span * 2);
    else if (k === 'w') { st.span = 360; st.lat = 5; } else if (k === 'r') st.span = 40; else if (k === 'c') { st.lat = loc.lat; st.lng = loc.lng; if (st.span > 120) st.span = 40; }
    mapDraw(cv);
    const L2 = LMAP[id]; if (L2) L2.map.setView([st.lat, st.lng], zoomFromSpan(st.span));
  }
  function mapLayer(id, which) {
    const L2 = LMAP[id]; if (!L2 || L2.cur === which) return;
    L2.map.removeLayer(which === 'sat' ? L2.street : L2.sat); (which === 'sat' ? L2.sat : L2.street).addTo(L2.map); L2.cur = which;
  }
  const legendMap = '<div class="legend"><span><i style="background:var(--gold)"></i>نطاق انتشار النوع (تقريبي)</span></div>';
  let mapSp = '';
  function hereMap(el, loc) {
    const old = MAPST['map-here']; MAPST['map-here'] = { lat: loc.lat, lng: loc.lng, span: old ? old.span : 40 };
    const ll = loc.lat.toFixed(4) + ',' + loc.lng.toFixed(4), la = loc.lat.toFixed(4), lo = loc.lng.toFixed(4);
    const sorted = SG.slice().sort((a, b) => a.ar.localeCompare(b.ar, 'ar'));
    el.innerHTML = '<div class="stack"><p class="muted small">اضغط على الخريطة لتحديد موقعك، واسحب للتحريك، واستخدم + و − للتكبير. النقطة الذهبية هي موقعك الحالي.</p>' +
      mapHtml('map-here', { tap: 1, sp: mapSp, span: 40, h: 380 }) + '<div id="mapcap" class="muted small num"></div>' +
      '<div class="field"><label for="mapsp">أظهر على الخريطة نطاق انتشار نوع</label><select id="mapsp"><option value="">— بدون —</option>' + sorted.map(s => '<option value="' + s.id + '"' + (s.id === mapSp ? ' selected' : '') + '>' + esc(s.ar + ' · ' + s.en) + '</option>').join('') + '</select></div>' + legendMap +
      '<section class="card stack"><h2 class="h2" style="margin:0">افتح موقعك في خرائط تفصيلية</h2><div class="chips">' +
      '<a class="chip" target="_blank" rel="noopener" href="https://www.openstreetmap.org/?mlat=' + la + '&mlon=' + lo + '#map=9/' + la + '/' + lo + '">OpenStreetMap</a>' +
      '<a class="chip" target="_blank" rel="noopener" href="https://www.google.com/maps/@' + ll + ',9z">Google Maps</a>' +
      '<a class="chip" target="_blank" rel="noopener" href="https://www.windy.com/?' + ll + ',8">Windy (رياح وأمواج)</a>' +
      '<a class="chip" target="_blank" rel="noopener" href="https://tidecheck.com/">TideCheck (مد وجزر)</a></div></section>' +
      '<div class="notice info">الخريطة مرسومة داخل التطبيق من قناع يابسة بدقة درجة واحدة (نحو 110 كم)، وأقاليم الأنواع صناديق تقريبية، فلا تعتمد عليها في الملاحة أو لتحديد حدود المياه والقوانين.</div></div>';
  }

  /* ================= المد والجزر والطقس البحري (النسخة المحمّلة فقط: مصدر Open-Meteo) ================= */
  const TD = { days: 3, res: null, tok: 0 };
  const DIRS = ['الشمال', 'الشمال الشرقي', 'الشرق', 'الجنوب الشرقي', 'الجنوب', 'الجنوب الغربي', 'الغرب', 'الشمال الغربي'];
  const compass = d => d == null ? '' : 'من ' + DIRS[Math.round(((d % 360) + 360) % 360 / 45) % 8];
  const KN = 0.539957;
  async function loadMarine(loc) {
    const key = loc.lat.toFixed(2) + ',' + loc.lng.toFixed(2), c = store.get('mar', null);
    if (c && c.key === key && c.d && Date.now() - c.t < 3 * 3600000) return { d: c.d, t: c.t, stale: false };
    try {
      const ac = new AbortController(), to = setTimeout(() => ac.abort(), 14000), q = 'latitude=' + loc.lat + '&longitude=' + loc.lng + '&timezone=auto&forecast_days=8';
      const get = u => fetch(u, { signal: ac.signal }).then(r => r.ok ? r.json() : null).catch(() => null);
      const [a, b] = await Promise.all([
        get('https://marine-api.open-meteo.com/v1/marine?' + q + '&hourly=sea_level_height_msl,wave_height,wave_period,wave_direction,swell_wave_height,sea_surface_temperature,ocean_current_velocity,ocean_current_direction'),
        get('https://api.open-meteo.com/v1/forecast?' + q + '&hourly=temperature_2m,relative_humidity_2m,uv_index,wind_speed_10m,wind_gusts_10m,wind_direction_10m,pressure_msl,precipitation_probability')
      ]);
      clearTimeout(to);
      if (!a && !b) throw 0;
      const d = { m: a, f: b }; store.set('mar', { key, t: Date.now(), d });
      return { d, t: Date.now(), stale: false };
    } catch (e) { if (c && c.key === key && c.d) return { d: c.d, t: c.t, stale: true }; return null; }
  }
  function series(d) {
    const base = d.m && d.m.hourly ? d.m : d.f, m = d.m && d.m.hourly, off = base.utc_offset_seconds || 0;
    const t = base.hourly.time.map(s => { const p = s.split(/[-T:]/).map(Number); return Date.UTC(p[0], p[1] - 1, p[2], p[3], p[4] || 0) - off * 1000; });
    const f = d.f && d.f.hourly && d.f.hourly.time.length === t.length ? d.f.hourly : null;
    return { t, m: m ? d.m.hourly : null, f, tz: base.timezone || undefined };
  }
  function extrema(t, v) {
    const ex = [];
    for (let i = 1; i < v.length - 1; i++) {
      if (v[i] == null || v[i - 1] == null || v[i + 1] == null) continue;
      const hi = v[i] > v[i - 1] && v[i] >= v[i + 1], lo = v[i] < v[i - 1] && v[i] <= v[i + 1];
      if (!hi && !lo) continue;
      const den = v[i - 1] - 2 * v[i] + v[i + 1], dl = den ? 0.5 * (v[i - 1] - v[i + 1]) / den : 0;
      const e = { t: t[i] + dl * 3600000, v: v[i] - 0.25 * (v[i - 1] - v[i + 1]) * dl, hi };
      const last = ex[ex.length - 1];
      if (last && last.hi === e.hi) { if ((e.hi && e.v > last.v) || (!e.hi && e.v < last.v)) ex[ex.length - 1] = e; continue; }
      if (last && Math.abs(last.v - e.v) < 0.03) continue;
      ex.push(e);
    }
    return ex;
  }
  /* ---------- نشاط السمك المتوقع: يجمع القمر والمد والرياح والضغط (تقدير عام غير علمي) ---------- */
  const UV_L = v => v == null ? '' : v < 3 ? 'منخفض' : v < 6 ? 'متوسط' : v < 8 ? 'مرتفع' : v < 11 ? 'مرتفع جدًا' : 'شديد';
  function actDetail(i, S, loc, cache) {
    const H = 3600000, t = S.t[i], ds = dayStart(loc.tz, new Date(t));
    let di = cache[ds]; if (!di) { di = dayInfo(loc, new Date(ds + 12 * H)); cache[ds] = di; }
    let sc = 30; const reasons = [];
    const sun = di.sun;
    if (sun.rise) { const d = Math.abs(t - sun.rise.getTime()); if (d < 1.5 * H) { sc += 18 * (1 - d / (1.5 * H)); if (d < 0.75 * H) reasons.push('قرب الفجر'); } }
    if (sun.set) { const d = Math.abs(t - sun.set.getTime()); if (d < 1.5 * H) { sc += 18 * (1 - d / (1.5 * H)); if (d < 0.75 * H) reasons.push('قرب الغروب'); } }
    let nearMoon = false;
    di.slots.forEach(sl => { const win = sl.kind === 'major' ? 2 * H : 1 * H, w = sl.kind === 'major' ? 26 : 14; const d = Math.abs(t - sl.t.getTime()); if (d < win) { sc += w * (1 - d / win); if (d < win * 0.5) nearMoon = true; } });
    if (nearMoon) reasons.push('فترة قمرية رئيسية أو ثانوية قريبة');
    if (di.spring) { sc += 8; reasons.push('قرب محاق أو بدر (مد أكبر)'); }
    const m = S.m, f = S.f;
    if (m && m.sea_level_height_msl) {
      const lvl = m.sea_level_height_msl, a = lvl[i - 1], b = lvl[i + 1];
      if (a != null && b != null) { const rate = Math.abs(b - a) / 2; const add = Math.min(16, rate * 45); sc += add; if (add > 8) reasons.push('الماء يتحرك بسرعة (مد أو جزر)'); }
    }
    if (f && f.wind_speed_10m) {
      const w = f.wind_speed_10m[i];
      if (w != null) { if (w >= 6 && w <= 22) { sc += 10; reasons.push('رياح خفيفة مناسبة'); } else if (w > 38) { sc -= 22; reasons.push('رياح قوية جدًا'); } else if (w > 28) sc -= 10; else if (w < 3) sc -= 3; }
    }
    if (f && f.pressure_msl) {
      const p1 = f.pressure_msl[i], p0 = f.pressure_msl[Math.max(0, i - 6)];
      if (p1 != null && p0 != null) { const d = p1 - p0; if (d <= -1 && d >= -5) { sc += 9; reasons.push('الضغط يهبط تدريجيًا'); } else if (d < -5) { sc -= 10; reasons.push('هبوط ضغط حاد (طقس متقلب)'); } else if (d > 5) sc -= 6; }
    }
    return { score: Math.max(2, Math.min(98, Math.round(sc))), reasons: reasons.slice(0, 3) };
  }
  const actBucket = sc => sc >= 70 ? 3 : sc >= 50 ? 2 : sc >= 30 ? 1 : 0;
  const ACT_L = ['ضعيف', 'متوسط', 'جيد', 'ممتاز']; const ACT_CLS = ['bad', '', 'ok', 'gold'];
  function actStrip(S, loc, cache, ni, hf) {
    const n = Math.min(S.t.length, ni + 61), out = [];
    const aho = tfmt(S.tz, { hour: 'numeric', hour12: true }, 'aho');
    let prevDay = null;
    for (let i = ni; i < n; i++) {
      const d = actDetail(i, S, loc, cache), b = actBucket(d.score);
      const day = dayStart(loc.tz, new Date(S.t[i])), dl = i > ni && day !== prevDay; prevDay = day;
      const showLbl = (i - ni) % 3 === 0;
      out.push('<div class="ach' + (dl ? ' dayline' : '') + '"><i class="ac c' + b + (i === ni ? ' now' : '') + '" title="' + esc(hf.format(new Date(S.t[i]))) + ' — ' + ACT_L[b] + ' (' + d.score + '/100)"></i>' + (showLbl ? '<b class="aho">' + esc(aho.format(new Date(S.t[i]))) + '</b>' : '') + '</div>');
    }
    return out.join('');
  }

  function tideSvg(S, loc, days, hf) {
    const v = S.m && S.m.sea_level_height_msl; if (!v || v.every(x => x == null)) return null;
    const tz = S.tz, n = Math.min(v.length, days * 24), t0 = S.t[0], t1 = S.t[n - 1];
    const cw = ($('#herebody') || {}).clientWidth || 360, W = Math.max(300, Math.min(720, cw - 34)), H = Math.max(230, Math.round(W * 0.42)), pl = 40, pr = 12, pt = 40, pb = 46;
    let mn = 1e9, mx = -1e9; for (let i = 0; i < n; i++) if (v[i] != null) { mn = Math.min(mn, v[i]); mx = Math.max(mx, v[i]); }
    const span = Math.max(mx - mn, 0.2), stp = [0.05, 0.1, 0.2, 0.25, 0.5, 1, 2].find(s => span / s <= 6) || 2;
    mn = Math.floor((mn - span * 0.12) / stp) * stp; mx = Math.ceil((mx + span * 0.18) / stp) * stp;
    const X = t => pl + (t - t0) / (t1 - t0) * (W - pl - pr), Y = z => pt + (mx - z) / (mx - mn) * (H - pt - pb);
    let g = '';
    /* ليل */
    let prevSet = null;
    for (let k = 0; k <= days; k++) {
      const ds = t0 + k * 86400000, su = Astro.sunTimes(new Date(ds + 12 * 3600000), loc.lat, loc.lng);
      if (!su.rise || !su.set) { prevSet = null; continue; }
      const a = k === 0 ? t0 : prevSet, b = su.rise.getTime();
      if (a != null && b > a) { const xa = X(Math.max(a, t0)), xb = X(Math.min(b, t1)); if (xb > xa) g += '<rect x="' + xa.toFixed(1) + '" y="' + pt + '" width="' + (xb - xa).toFixed(1) + '" height="' + (H - pt - pb) + '" class="tnight"/>'; }
      prevSet = su.set.getTime();
    }
    if (prevSet != null && prevSet < t1) g += '<rect x="' + X(prevSet).toFixed(1) + '" y="' + pt + '" width="' + (X(t1) - X(prevSet)).toFixed(1) + '" height="' + (H - pt - pb) + '" class="tnight"/>';
    for (let z = Math.ceil(mn / stp) * stp; z <= mx + 1e-9; z += stp) g += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + Y(z).toFixed(1) + '" y2="' + Y(z).toFixed(1) + '" class="tgrid' + (Math.abs(z) < 1e-9 ? ' zero' : '') + '"/><text x="' + (pl - 6) + '" y="' + (Y(z) + 4).toFixed(1) + '" class="tax n" text-anchor="end">' + (z > 1e-9 ? '+' : '') + z.toFixed(2).replace(/0$/, '') + '</text>';
    const dfmt = tfmt(tz, { weekday: 'short', day: 'numeric' }, 'tk');
    for (let k = 0; k < days; k++) {
      const ds = t0 + k * 86400000, x = X(ds);
      g += '<line x1="' + x.toFixed(1) + '" x2="' + x.toFixed(1) + '" y1="' + pt + '" y2="' + (H - pb) + '" class="tday"/><text x="' + X(ds + 12 * 3600000).toFixed(1) + '" y="' + (H - 14) + '" class="tax" text-anchor="middle">' + esc(dfmt.format(new Date(ds + 12 * 3600000))) + '</text>';
    }
    let p = '', pts = []; for (let i = 0; i < n; i++) if (v[i] != null) pts.push([X(S.t[i]), Y(v[i])]);
    pts.forEach((q, i) => {
      if (!i) { p = 'M' + q[0].toFixed(1) + ' ' + q[1].toFixed(1); return; }
      const p0 = pts[i - 2] || pts[i - 1], p1 = pts[i - 1], p3 = pts[i + 1] || q;
      p += 'C' + (p1[0] + (q[0] - p0[0]) / 6).toFixed(1) + ' ' + (p1[1] + (q[1] - p0[1]) / 6).toFixed(1) + ' ' + (q[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ' ' + (q[1] - (p3[1] - p1[1]) / 6).toFixed(1) + ' ' + q[0].toFixed(1) + ' ' + q[1].toFixed(1);
    });
    g += '<path d="' + p + ' L' + pts[pts.length - 1][0].toFixed(1) + ' ' + Y(mn).toFixed(1) + ' L' + pts[0][0].toFixed(1) + ' ' + Y(mn).toFixed(1) + 'Z" class="tfill"/><path d="' + p + '" class="tline"/>';
    const showV = (W - pl - pr) / n * 6.2 >= 30;
    extrema(S.t.slice(0, n), v.slice(0, n)).forEach(e => { const x = X(e.t), y = Y(e.v), dy = e.hi ? -8 : 16, dy2 = e.hi ? -20 : 28; g += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="3" class="tdot ' + (e.hi ? 'hi' : 'lo') + '"/>' + (!showV ? '' : '<text x="' + x.toFixed(1) + '" y="' + (y + dy).toFixed(1) + '" class="tval n" text-anchor="middle">' + (e.v < 0 ? '-' : '') + Math.abs(e.v).toFixed(2).replace(/0$/, '') + '</text><text x="' + x.toFixed(1) + '" y="' + (y + dy2).toFixed(1) + '" class="ttime n" text-anchor="middle">' + esc(hf ? hf.format(new Date(e.t)) : '') + '</text>'); });
    const now = Date.now();
    if (now >= t0 && now <= t1) g += '<line x1="' + X(now).toFixed(1) + '" x2="' + X(now).toFixed(1) + '" y1="' + pt + '" y2="' + (H - pb) + '" class="tnow"/><rect x="' + (X(now) - 22).toFixed(1) + '" y="6" width="44" height="18" rx="9" class="tnowp"/><text x="' + X(now).toFixed(1) + '" y="19" text-anchor="middle" class="tnowt">الآن</text>';
    return '<svg class="tide" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="منحنى ارتفاع سطح البحر لأيام قادمة">' + g + '</svg>';
  }
  const tideLinks = loc => '<section class="card stack" id="tlinks"><h2 class="h2" style="margin:0">مصادر مد وجزر دقيقة لمرفأك</h2><p class="muted small">للصيد الجاد من الشاطئ أو القارب، خذ مواعيد المد من محطة قريبة لأن نماذج الطقس العامة تخطئ قرب السواحل والمضائق.</p><div class="chips"><a class="chip" target="_blank" rel="noopener" href="https://tidecheck.com/">TideCheck</a><a class="chip" target="_blank" rel="noopener" href="https://tides4fishing.com/">Tides4Fishing</a><a class="chip" target="_blank" rel="noopener" href="https://www.tide-forecast.com/">Tide-Forecast</a><a class="chip" target="_blank" rel="noopener" href="https://www.windy.com/?' + loc.lat.toFixed(3) + ',' + loc.lng.toFixed(3) + ',8">Windy</a><a class="chip" href="#/links">كل المراجع</a></div></section>';
  function hereTide(el, loc) {
    const tok = ++TD.tok;
    const di = dayInfo(loc);
    const links = tideLinks(loc);
    if (!STANDALONE) {
      el.innerHTML = '<div class="stack"><section class="card stack"><h2 class="h2" style="margin:0">المد والموج والرياح الحية</h2><p>منحنى المد وارتفاع الموج والرياح وحرارة الماء والضغط لثمانية أيام تُجلب من الإنترنت، وهذه الصفحة المنشورة لا تستطيع الاتصال بمصادر خارجية. <b>افتح النسخة المحمّلة</b> (ملف HTML أو تطبيق الهاتف) لتظهر هذه البيانات هنا لأي نقطة في العالم.</p>' +
        '<div class="notice info">ما تحسبه هذه الصفحة بلا إنترنت: ' + (di.spring ? 'اليوم قمر جديد أو بدر تقريبًا فالمد والجزر أكبر من المعتاد في المناطق التي فيها مد ملحوظ.' : 'اليوم لا يقع في أيام المد الكبير (قمر جديد أو بدر). راجع تبويب «الأسبوع» لأيام المد الكبير القادمة.') + '</div></section>' + links + '</div>';
      return;
    }
    el.innerHTML = '<div class="stack"><div class="card"><div class="muted">جارٍ جلب بيانات المد والبحر لموقعك…</div></div>' + links + '</div>';
    loadMarine(loc).then(res => {
      if (tok !== TD.tok || hereTab !== 'tide' || !$('#herebody')) return;
      TD.res = res; drawTide();
    });
  }
  function drawTide() {
    const el = $('#herebody'), loc = getLoc(), res = TD.res; if (!el || hereTab !== 'tide') return;
    const links = tideLinks(loc);
    if (!res) { el.innerHTML = '<div class="stack"><div class="notice warn">تعذّر جلب البيانات (لا اتصال بالإنترنت أو الخدمة غير متاحة الآن). جرّب لاحقًا.</div>' + links + '</div>'; return; }
    if (!TD.set) { TD.set = 1; TD.days = (el.clientWidth || 360) < 500 ? 2 : 3; }
    const S = series(res.d), now = Date.now(); let ni = 0; S.t.forEach((t, i) => { if (t <= now) ni = i; });
    const A = (o, i) => (o && o[i] != null ? o[i] : null), fmt = (x, dg) => x == null ? '—' : x.toFixed(dg == null ? 1 : dg);
    const m = S.m, f = S.f, tz = S.tz;
    const hf = tfmt(tz, { hour: '2-digit', minute: '2-digit', hour12: true }, 'h'), df = tfmt(tz, { weekday: 'long', hour: '2-digit', minute: '2-digit', hour12: true }, 'dh');
    const svg = tideSvg(S, loc, TD.days, hf), lvl = m && m.sea_level_height_msl;
    let ex = []; if (lvl && !lvl.every(x => x == null)) ex = extrema(S.t, lvl).filter(e => e.t >= now - 3600000).slice(0, 6);
    const rangeAll = lvl ? Math.max.apply(null, lvl.filter(x => x != null)) - Math.min.apply(null, lvl.filter(x => x != null)) : 0;
    /* حكم عام على الساعات الـ 12 القادمة */
    let maxW = 0, maxG = 0; for (let i = ni; i < Math.min(ni + 12, S.t.length); i++) { maxW = Math.max(maxW, A(m && m.wave_height, i) || 0); maxG = Math.max(maxG, A(f && f.wind_gusts_10m, i) || 0); }
    const lev = (maxG >= 45 || maxW >= 2.5) ? ['bad', 'ظروف صعبة على معظم القوارب الصغيرة: رياح أو موج عاليان في الساعات القادمة.'] : (maxG >= 30 || maxW >= 1.25) ? ['warn', 'ظروف متوسطة: احذر في القوارب الصغيرة وراجع التوقعات المحلية.'] : ['ok', 'الرياح والموج هادئان نسبيًا في الساعات الـ 12 القادمة.'];
    const tile = (lab, val, sub) => '<div class="stat"><span>' + lab + '</span><b class="num">' + val + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</div>';
    const pr = A(f && f.pressure_msl, ni), pr3 = A(f && f.pressure_msl, Math.max(0, ni - 3)), wsp = A(f && f.wind_speed_10m, ni), wg = A(f && f.wind_gusts_10m, ni);
    const stats = '<div class="stats">' +
      tile('الموج', m ? fmt(A(m.wave_height, ni)) + ' م' : '—', m && A(m.wave_period, ni) != null ? 'كل ' + fmt(A(m.wave_period, ni), 0) + ' ث · ' + compass(A(m.wave_direction, ni)) : '') +
      tile('الرياح', wsp != null ? fmt(wsp * KN, 0) + ' عقدة' : '—', wsp != null ? fmt(wsp, 0) + ' كم/س · ' + compass(A(f.wind_direction_10m, ni)) : '') +
      tile('الهبّات', wg != null ? fmt(wg * KN, 0) + ' عقدة' : '—', wg != null ? fmt(wg, 0) + ' كم/س' : '') +
      tile('حرارة الماء', m && A(m.sea_surface_temperature, ni) != null ? '<bdi dir="ltr">' + fmt(A(m.sea_surface_temperature, ni)) + '°C</bdi>' : '—', '') +
      tile('التيار', m && A(m.ocean_current_velocity, ni) != null ? fmt(A(m.ocean_current_velocity, ni)) + ' كم/س' : '—', m && A(m.ocean_current_direction, ni) != null ? compass(A(m.ocean_current_direction, ni)) : '') +
      tile('الرطوبة', f && A(f.relative_humidity_2m, ni) != null ? fmt(A(f.relative_humidity_2m, ni), 0) + '%' : '—', '') +
      tile('أشعة UV', f && A(f.uv_index, ni) != null ? fmt(A(f.uv_index, ni), 1) + ' (' + UV_L(A(f.uv_index, ni)) + ')' : '—', '') +
      tile('الضغط', pr != null ? '<bdi dir="ltr">' + fmt(pr, 0) + ' hPa</bdi>' : '—', pr != null && pr3 != null ? (pr - pr3 > 1 ? 'يرتفع' : pr - pr3 < -1 ? 'يهبط' : 'ثابت تقريبًا') + ' (3 ساعات)' : '') +
      tile('الهواء', A(f && f.temperature_2m, ni) != null ? '<bdi dir="ltr">' + fmt(A(f.temperature_2m, ni), 0) + '°C</bdi>' : '—', A(f && f.precipitation_probability, ni) != null ? 'احتمال مطر ' + fmt(A(f.precipitation_probability, ni), 0) + '%' : '') + '</div>';
    const rowCache = {}; let rows = ''; for (let i = ni; i < Math.min(ni + 25, S.t.length); i += 3) { const rb = actBucket(actDetail(i, S, loc, rowCache).score); rows += '<tr><td class="num">' + esc(hf.format(new Date(S.t[i]))) + '</td><td><span class="tag ' + ACT_CLS[rb] + '">' + ACT_L[rb] + '</span></td><td class="num">' + (m && A(m.wave_height, i) != null ? fmt(A(m.wave_height, i)) : '—') + '</td><td class="num">' + (f && A(f.wind_speed_10m, i) != null ? fmt(A(f.wind_speed_10m, i) * KN, 0) : '—') + '</td><td class="num">' + (f && A(f.wind_gusts_10m, i) != null ? fmt(A(f.wind_gusts_10m, i) * KN, 0) : '—') + '</td><td class="num">' + (f && A(f.pressure_msl, i) != null ? fmt(A(f.pressure_msl, i), 0) : '—') + '</td><td class="num">' + (f && A(f.precipitation_probability, i) != null ? fmt(A(f.precipitation_probability, i), 0) + '%' : '—') + '</td><td class="num">' + (f && A(f.relative_humidity_2m, i) != null ? fmt(A(f.relative_humidity_2m, i), 0) + '%' : '—') + '</td><td class="num">' + (f && A(f.uv_index, i) != null ? fmt(A(f.uv_index, i), 1) : '—') + '</td></tr>'; }
    const actCache = {}, actNow = actDetail(ni, S, loc, actCache), ab = actBucket(actNow.score);
    const actCard = '<div class="card stack"><div class="row between" style="align-items:center"><div><div class="muted small">نشاط السمك المتوقع الآن</div><div class="h2 num" style="margin:0">' + actNow.score + '<span class="muted small">/100</span></div></div><span class="tag ' + ACT_CLS[ab] + '" style="font-size:1rem;padding:8px 14px">' + ACT_L[ab] + '</span></div>' + (actNow.reasons.length ? '<div class="chips">' + actNow.reasons.map(r => '<span class="chip" style="pointer-events:none">' + esc(r) + '</span>').join('') + '</div>' : '<div class="muted small">لا عوامل قوية الآن.</div>') + '</div>';
    el.innerHTML = '<div class="stack">' + actCard +
      '<div class="notice ' + lev[0] + '">' + lev[1] + '</div>' + stats +
      (svg ? '<section class="card stack"><div class="row between"><h2 class="h2" style="margin:0">منحنى المد والجزر</h2><div class="chips">' + [2, 3, 5, 8].map(d => '<button class="chip" data-td="' + d + '" aria-pressed="' + (TD.days === d) + '">' + d + ' أيام</button>').join('') + '</div></div>' +
        '<div class="tidewrap">' + svg + '</div><div class="muted small">الارتفاع بالمتر عن متوسط سطح البحر. الخلفية الداكنة = الليل، والخط العمودي = الآن. الأوقات بتوقيت الموقع (' + esc(tz || 'جهازك') + ').</div>' +
        (rangeAll < 0.5 ? '<div class="notice info">المدى هنا صغير (أقل من نصف متر: بحر شبه مغلق أو موقع بعيد عن مد المحيط)، فالرياح والضغط تغيّر مستوى الماء وتياره أكثر من القمر.</div>' : '') + '</section>' +
        (ex.length ? '<section class="card stack"><h2 class="h2" style="margin:0">القادم من مد وجزر</h2><div class="tbl"><table><thead><tr><th>الحالة</th><th>الوقت</th><th>الارتفاع</th></tr></thead><tbody>' + ex.map(e => '<tr><td>' + (e.hi ? '<span class="tag ok">مد عالٍ</span>' : '<span class="tag">جزر</span>') + '</td><td>' + esc(df.format(new Date(e.t))) + '</td><td class="num">' + (e.v > 0 ? '+' : '') + e.v.toFixed(2) + ' م</td></tr>').join('') + '</tbody></table></div></section>' : '') :
        '<div class="notice info">لا بيانات مد لهذا الموقع (غالبًا يابسة داخلية أو بحيرة). الرياح والضغط والمطر أدناه ما زالت مفيدة لصيد المياه العذبة.</div>') +
      '<section class="card stack"><h2 class="h2" style="margin:0">نشاط السمك بالساعة (على طريقة جداول السولونار)</h2><div class="actwrap">' + actStrip(S, loc, actCache, ni, hf) + '</div>' +
      '<div class="legend"><span><i style="background:var(--lv0)"></i>ضعيف</span><span><i style="background:var(--lv1)"></i>متوسط</span><span><i style="background:var(--lv2)"></i>جيد</span><span><i style="background:var(--lv3)"></i>ممتاز</span></div>' +
      '<div class="muted small">يجمع تقدير كل ساعة: القمر (فترات رئيسية وثانوية وقرب المحاق أو البدر)، الفجر والغروب، حركة المد أو الجزر، سرعة الرياح، واتجاه الضغط. مرّر يمينًا أو يسارًا لرؤية الساعات القادمة، والإطار الذهبي هو الآن. تقدير عام وليس مضمونًا؛ الأدلة العلمية على نظرية السولونار محدودة.</div></section>' +
      '<section class="card stack"><h2 class="h2" style="margin:0">الـ 24 ساعة القادمة (كل 3 ساعات)</h2><div class="muted small">الرياح والهبّات بالعقدة، والضغط بالهكتوباسكال.</div><div class="tbl"><table><thead><tr><th>الوقت</th><th>النشاط</th><th>موج م</th><th>رياح</th><th>هبّات</th><th>ضغط</th><th>مطر</th><th>رطوبة</th><th>UV</th></tr></thead><tbody>' + rows + '</tbody></table></div></section>' +
      '<div class="notice warn">المصدر: Open-Meteo (نماذج عالمية بدقة نحو 8 كم للمد والتيار). دقتها قرب السواحل والخلجان محدودة وقد تختلف عن جداول المحطات الرسمية، ولا تصلح للملاحة. ' + (res.stale ? '<b>هذه بيانات محفوظة قبل ' + Math.max(1, Math.round((now - res.t) / 3600000)) + ' ساعة (لا اتصال الآن).</b>' : 'آخر تحديث الآن.') + '</div>' + links + '</div>';
  }

  /* ================= مراقب الصفحة: صور وخرائط بعد كل رسم ================= */
  function obsMain() {
    let pending = 0;
    const run = () => { pending = 0; hydratePhotos(); hydrateFishPhotos(); $$('.mapbox:not([data-mi])').forEach(mapInit); };
    new MutationObserver(() => { if (!pending) pending = requestAnimationFrame(run); }).observe($('#main'), { childList: true, subtree: true });
    window.addEventListener('resize', () => { $$('canvas.mapc').forEach(c => c._redraw && c._redraw()); Object.keys(LMAP).forEach(k => LMAP[k].map.invalidateSize()); });
    if (window.matchMedia) { try { window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => $$('canvas.mapc').forEach(c => c._redraw && c._redraw())); } catch (e) {} }
    run();
  }

  /* شريط التنقل السفلي: يختفي وانت بتنزل (بتقرا)، ويظهر تاني وانت بتطلع لفوق أو قريب من أول الصفحة. */
  function obsNav() {
    let last = window.scrollY || 0, tick = false;
    window.addEventListener('scroll', () => {
      if (tick) return; tick = true;
      requestAnimationFrame(() => {
        tick = false;
        const y = window.scrollY || 0, nav = $('.nav');
        if (nav) {
          if (y < 40 || y < last - 4) nav.classList.remove('nav-hide');
          else if (y > last + 4) nav.classList.add('nav-hide');
        }
        last = y;
      });
    }, { passive: true });
  }

  /* ---------- الموجّه ---------- */
  const NAVS = [['#/', 'home', 'الرئيسية', 'home'], ['#/here', 'pin', 'هنا الآن', 'here'], ['#/species', 'fish', 'الأنواع', 'species|sp|fish|fishlist|tech|months|month|compare'], ['#/tools', 'tools', 'الأدوات', 'tools|world|safety'], ['#/links', 'book', 'المراجع', 'links|about']];
  function parse() {
    const h = location.hash.replace(/^#\/?/, ''), qi = h.indexOf('?'), path = qi < 0 ? h : h.slice(0, qi), qs = {};
    if (qi >= 0) h.slice(qi + 1).split('&').forEach(p => { const [k, v] = p.split('='); if (k) qs[k] = decodeURIComponent(v || ''); });
    const seg = path.split('/').filter(Boolean);
    return { name: seg[0] || 'home', args: seg.slice(1), qs };
  }
  function render() {
    const r = parse(); let name = r.name;
    if (name === 'fish' && !r.args.length) name = 'fishlist';
    const view = V[name] || V.home;
    const main = $('#main'); main.innerHTML = view(r.args, r.qs);
    const nm = name;
    $$('.nav a').forEach(a => a.setAttribute('aria-current', a.dataset.m.split('|').indexOf(nm) > -1 ? 'page' : 'false'));
    if (nm === 'fishlist') drawFishList(); if (nm === 'tools') drawTool(); if (nm === 'links') drawLinks(); if (nm === 'here') drawHere(); if (nm === 'species') drawSpList(); if (nm === 'compare') drawCompare();
    window.scrollTo(0, 0);
    document.title = nm === 'fish' && BY[+r.args[0]] ? BY[+r.args[0]].name + ' — الصنّارة' : nm === 'sp' && BYG[r.args[0]] ? BYG[r.args[0]].ar + ' — الصنّارة' : 'الصنّارة';
  }

  /* ---------- الأحداث ---------- */
  function setLoc(l) { store.set('loc', l); drawTool(); const n = parse().name; if (['home', 'here', 'species', 'sp'].indexOf(n) > -1) render(); }
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-zoom],[data-zoom-close],[data-act],[data-seg],[data-ff],[data-lc],[data-lf],[data-hf],[data-sf],[data-dl],[data-mz],[data-ml],[data-td],[data-fph-retry],[data-ph-retry]');
    if (!t) return;
    if (t.dataset.phRetry) {
      const id = t.dataset.phRetry;
      delete PH.mem[id]; phSave();
      const c = $('#phcredit');
      if (c && c.dataset.sp === id) c.textContent = 'جارٍ تحميل صورة حقيقية للنوع من ويكيبيديا…';
      $$('.gthumb[data-ph="' + id + '"]').forEach(el => { delete el.dataset.pd; });
      hydratePhotos();
      return;
    }
    if (t.dataset.fphRetry) {
      const id = t.dataset.fphRetry, s = BY[id];
      delete FPH.mem[id]; fphSave();
      if (s) {
        const btn = t.closest('.notice');
        const html = '<button class="fishhero figure" data-fph="' + id + '" aria-label="صورة ' + esc(s.name) + '"><span class="muted small fphload" style="display:block;padding:24px;text-align:center">جارٍ تحميل صورة حقيقية موثوقة…</span></button>';
        if (btn) btn.outerHTML = html;
        hydrateFishPhotos();
      }
      return;
    }
    if (t.dataset.zoomClose) { const box = t.closest('.inlinezoom'); if (box) box.remove(); return; }
    if (t.dataset.zoom) {
      const z = t.dataset.zoom, src = /^https?:/.test(z) ? z : img(z);
      const open = t.nextElementSibling && t.nextElementSibling.classList && t.nextElementSibling.classList.contains('inlinezoom') ? t.nextElementSibling : null;
      $$('.inlinezoom').forEach(el => { if (el !== open) el.remove(); });
      if (open) { open.remove(); return; }
      const div = document.createElement('div');
      div.className = 'inlinezoom';
      div.innerHTML = '<button class="iconbtn x" data-zoom-close="1" aria-label="إغلاق الصورة المكبّرة">' + ico('x', 18) + '</button><img src="' + src + '" alt="">';
      t.insertAdjacentElement('afterend', div);
      div.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }
    if (t.dataset.seg) { const k = t.dataset.k, s = t.dataset.seg; if (s === 'tools') toolTab = k; else if (s === 'tech') techTab = k; else if (s === 'here') { hereTab = k; try { history.replaceState(null, '', '#/here' + (k === 'now' ? '' : '?t=' + k)); } catch (x) {} } else worldTab = k; if (s === 'tools' || s === 'here') { $$('.seg button').forEach(b => b.setAttribute('aria-selected', b === t ? 'true' : 'false')); if (s === 'tools') drawTool(); else drawHere(); } else render(); return; }
    if (t.dataset.mz) {
      const id = t.dataset.for;
      if (t.dataset.mz === 'c' && navigator.geolocation) {
        toast('جارٍ تحديد موقعك…');
        navigator.geolocation.getCurrentPosition(
          p => { setLoc({ name: 'موقعي', lat: p.coords.latitude, lng: p.coords.longitude }); mapZoom(id, 'c'); },
          () => { toast('تعذّر تحديد موقعك الحالي، استخدمنا آخر موقع معروف.'); mapZoom(id, 'c'); },
          { timeout: 12000, maximumAge: 60000 }
        );
      } else mapZoom(id, t.dataset.mz);
      return;
    }
    if (t.dataset.ml) { mapLayer(t.dataset.for, t.dataset.ml); $$('.maplayer[data-for="' + t.dataset.for + '"] .chip').forEach(c => c.setAttribute('aria-pressed', c === t)); return; }
    if (t.dataset.td) { TD.days = +t.dataset.td; drawTide(); return; }
    if (t.dataset.hf) { hereH = t.dataset.hf; $$('#hf .chip').forEach(c => c.setAttribute('aria-pressed', c === t)); drawHere(); return; }
    if (t.dataset.sf) { spF = t.dataset.sf; $$('#sf .chip').forEach(c => c.setAttribute('aria-pressed', c === t)); drawSpList(); return; }
    if (t.dataset.dl) { dialect = t.dataset.dl; store.set('dialect', dialect); $$('#dl .chip').forEach(c => c.setAttribute('aria-pressed', c === t)); drawSpList(); return; }
    if (t.dataset.ff) { fishF = t.dataset.ff; $$('#ff .chip').forEach(c => c.setAttribute('aria-pressed', c === t)); drawFishList(); return; }
    if (t.dataset.lc) { linkC = t.dataset.lc; $$('#lc .chip').forEach(c => c.setAttribute('aria-pressed', c === t)); drawLinks(); return; }
    if (t.dataset.lf) { if (t.dataset.lf === 'eg') linkEg = !linkEg; else linkV = !linkV; t.setAttribute('aria-pressed', t.dataset.lf === 'eg' ? linkEg : linkV); drawLinks(); return; }
    const act = t.dataset.act;
    if (act === 'photoqclear') { const p = t.closest('.photoqprev'); if (p) p.remove(); return; }
    if (act === 'geo') {
      if (!navigator.geolocation) return toast('المتصفح لا يدعم تحديد الموقع.');
      toast('جارٍ تحديد موقعك…');
      navigator.geolocation.getCurrentPosition(p => setLoc({ name: 'موقعي', lat: p.coords.latitude, lng: p.coords.longitude }), () => toast('تعذّر تحديد الموقع. اختر مدينة أو اكتب الإحداثيات.'), { timeout: 12000, maximumAge: 600000 });
    } else if (act === 'setll') {
      const la = parseFloat($('#lat').value.replace(',', '.')), lo = parseFloat($('#lng').value.replace(',', '.'));
      if (isNaN(la) || isNaN(lo) || Math.abs(la) > 90 || Math.abs(lo) > 180) return toast('إحداثيات غير صحيحة.');
      setLoc({ name: 'موقع مخصص', lat: la, lng: lo });
    } else if (act === 'dellog') { const l = store.get('log', []); l.splice(+t.dataset.i, 1); store.set('log', l); drawTool(); toast('تم الحذف.'); }
    else if (act === 'copylog' || act === 'dllog') {
      const l = store.get('log', []), csv = ['التاريخ,السمكة,الطول سم,الوزن كجم,المكان,الطعم,ملاحظات'].concat(l.map(c => [c.at, c.sp, c.len, c.wt, c.place, c.bait, c.note].map(x => '"' + String(x || '').replace(/"/g, '""') + '"').join(','))).join('\n');
      if (act === 'dllog') { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' })); a.download = 'fishing-log.csv'; a.click(); }
      else { (navigator.clipboard ? navigator.clipboard.writeText(csv) : Promise.reject()).then(() => toast('تم النسخ.'), () => { const ta = document.createElement('textarea'); ta.value = csv; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); toast('تم النسخ.'); } catch (x) { toast('تعذّر النسخ.'); } ta.remove(); }); }
    } else if (act === 'hereall') { hereAll = true; drawHere();
    } else if (act === 'resetchk') { store.set('chk', {}); drawTool(); toast('أُعيد الضبط.'); }
  });
  document.addEventListener('change', e => {
    if (e.target.id === 'preset' && e.target.value !== '') { const p = PRESETS[+e.target.value]; hereH = p[4] || 'all'; setLoc({ name: p[0], lat: p[1], lng: p[2], tz: p[3], h: p[4] }); }
    if (e.target.id === 'mapsp') { mapSp = e.target.value; const cv = $('#map-here'), wrap = $('.mapbox[data-mapid="map-here"]'); if (cv) mapDraw(cv); if (wrap) { wrap.dataset.sp = mapSp; mapDrawSpRects('map-here'); } }
    if (e.target.id === 'cmpA' || e.target.id === 'cmpB' || e.target.id === 'cmpC') { CMP = { a: $('#cmpA').value, b: $('#cmpB').value, c: $('#cmpC').value }; try { history.replaceState(null, '', '#/compare?a=' + CMP.a + '&b=' + CMP.b + '&c=' + CMP.c); } catch (x) {} drawCompare(); }
    if (e.target.dataset && e.target.dataset.chk) { const st = store.get('chk', {}); st[e.target.dataset.chk] = e.target.checked; store.set('chk', st); }
    if (e.target.classList && e.target.classList.contains('photoq') && e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]), form = e.target.closest('form.search');
      if (form) {
        let prev = form.nextElementSibling;
        if (!prev || !prev.classList || !prev.classList.contains('photoqprev')) { prev = document.createElement('div'); prev.className = 'photoqprev card stack'; form.insertAdjacentElement('afterend', prev); }
        prev.innerHTML = '<img src="' + url + '" alt="صورة سمكتك" style="width:100%;max-height:240px;object-fit:contain;border-radius:12px;border:1px solid var(--line)">' +
          '<div class="notice">لسه مفيش تعرّف تلقائي بالذكاء الاصطناعي على الصورة. قارن صورتك بصور النتائج تحت أو دوّر بالاسم، ولما تلاقي النوع هتلاقي في صفحته لو سام أو غير صالح للأكل.</div>' +
          '<button class="btn ghost small" data-act="photoqclear">مسح الصورة</button>';
        prev.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  });
  document.addEventListener('input', e => {
    if (e.target.id === 'fq') { fishQ = e.target.value; drawFishList(); }
    if (e.target.id === 'lq') { linkQ = e.target.value; drawLinks(); }
    if (e.target.id === 'sq') { spQ = e.target.value; drawSpList(); }
  });
  document.addEventListener('submit', e => {
    const f = e.target.closest('form'); if (!f) return; const k = f.dataset.form; if (!k) return; e.preventDefault();
    if (k === 'q') { location.hash = '#/species?q=' + encodeURIComponent($('#q0').value); }
    else if (k === 'qq' || k === 'lq') { document.activeElement && document.activeElement.blur(); }
    else if (k === 'log') {
      const g = id => $('#' + id).value.trim(), l = store.get('log', []);
      l.unshift({ sp: g('lsp'), len: g('llen'), wt: g('lwt'), at: g('lat2'), place: g('lpl'), bait: g('lbt'), note: g('lnt') });
      if (store.set('log', l)) { toast('تم الحفظ.'); drawTool(); } else toast('تعذّر الحفظ في هذا المتصفح.');
    }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') $$('.inlinezoom').forEach(el => el.remove()); });
  window.addEventListener('hashchange', render);

  /* ---------- الهيكل ---------- */
  function shell() {
    const app = $('#app');
    app.innerHTML = '<div class="wmark-tile" aria-hidden="true"></div>' +
      '<header class="top"><div class="wrap"><a class="brand" href="#/">' + LOGO_MARK(24, 'hdr') + '<span>الصنّارة</span></a>' +
      (STANDALONE ? '<button class="iconbtn" id="themebtn" aria-label="تبديل الوضع الليلي">' + ico('theme', 22) + '</button>' : '') + '</div></header>' +
      '<main class="wrap" id="main"></main>' +
      '<nav class="nav" aria-label="التنقل الرئيسي"><ul>' + NAVS.map(n => '<li><a href="' + n[0] + '" data-m="' + n[3] + '">' + ico(n[1], 24) + '<span>' + n[2] + '</span></a></li>').join('') + '</ul></nav>' +
      '<div class="wmark-sig" aria-hidden="true">' + LOGO_MARK(15, 'sig') + '<span>الصنّارة</span></div>' +
      '<div class="lightbox" id="lb" role="dialog" aria-label="عرض الصورة"><button class="iconbtn x" aria-label="إغلاق">' + ico('x', 22) + '</button><img alt=""></div>';
    const tb = $('#themebtn');
    if (tb) {
      const apply = m => { if (m === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', m); };
      apply(store.get('theme', 'auto'));
      tb.onclick = () => { const cur = store.get('theme', 'auto'), nx = cur === 'auto' ? 'dark' : cur === 'dark' ? 'light' : 'auto'; store.set('theme', nx); apply(nx); toast('الوضع: ' + { auto: 'تلقائي', dark: 'ليلي', light: 'نهاري' }[nx]); };
    }
  }
  shell();
  obsMain();
  render();
  if (STANDALONE && 'serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(() => {});
})();

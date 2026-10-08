/* =========================================================
   موصل — منطق التطبيق
   البيانات في data/conditions.js (window.MOSEL_DATA)
   ========================================================= */
(function () {
"use strict";

const { TRIAGE, ZONES, ZONE_SOURCES, DATA, REGIONS, RISK_FACTORS, version } = window.MOSEL_DATA;
const ZONE = Object.fromEntries(ZONES.map(z => [z.key, z]));

/* ---------- إعدادات ---------- */
const EMERGENCY_NUMBER = "123";                 // إسعاف مصر
const MENTAL_HOTLINE = "08008880700";           // الخط الساخن للصحة النفسية — الأمانة العامة للصحة النفسية (مصر)
const PROFILE_KEY = "moselProfile";
const MAX_FOLLOWUP_ROUNDS = 4;
const QUICK_ACCESS = [
  { key: "skin", title: "مشكلة في الجلد أو الشعر؟", sub: "حكة، طفح، حبوب، تساقط شعر" },
  { key: "mental", title: "الصحة النفسية", sub: "قلق، اكتئاب، نوم، نوبات هلع" },
  { key: "geriatric", title: "كبار السن", sub: "نسيان، توازن، وقعات، لخبطة مفاجئة" },
  { key: "congenital", title: "عيوب خلقية ووراثية", sub: "أعراض من الولادة أو تاريخ عائلي" }
];
const CHRONIC_OPTIONS = ["سكر", "ضغط", "قلب", "ربو", "كلى", "كبد", "حساسية مزمنة"];

/* ---------- أيقونات ---------- */
const I = {
  pulse: '<path d="M3 12h4l2-7 4 14 3-10 2 3h3"/>',
  back: '<path d="M9 6l6 6-6 6"/>',
  chevL: '<path d="M15 18l-6-6 6-6"/>',
  chevD: '<path d="M6 9l6 6 6-6"/>',
  check: '<path d="M4 12l5 5L20 6"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  alert: '<path d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/>',
  phone: '<path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.4 1.8.7 2.7a2 2 0 01-.5 2.1L8 9.8a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.4c.9.3 1.8.6 2.7.7a2 2 0 011.7 2z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 016.5 17H20V3H6.5A2.5 2.5 0 004 5.5v14z"/><path d="M20 17v4H6.5A2.5 2.5 0 014 18.5"/>',
  ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/>',
  share: '<path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M16 6l-4-4-4 4M12 2v14"/>',
  print: '<path d="M6 9V3h12v6M6 18H4a1 1 0 01-1-1v-6a1 1 0 011-1h16a1 1 0 011 1v6a1 1 0 01-1 1h-2"/><rect x="6" y="14" width="12" height="7"/>',
  restart: '<path d="M3 12a9 9 0 109-9 9 9 0 00-6.4 2.6L3 8"/><path d="M3 3v5h5"/>',
  steth: '<path d="M6 3v6a5 5 0 0010 0V3"/><path d="M11 14v2a5 5 0 0010 0v-3"/><circle cx="21" cy="11" r="2"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
  heart: '<path d="M12 21s-7-4.5-9.5-9C.5 8 2 4 6 4c2 0 3.5 1.2 4 2.2C10.5 5.2 12 4 14 4c4 0 5.5 4 3.5 8-2.5 4.5-9.5 9-9.5 9z"/>',
  bulb: '<path d="M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'
};
const ico = (p, sw = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const normAr = s => String(s || "").toLowerCase()
  .replace(/[ً-ْـ]/g, "").replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/ؤ/g, "و").replace(/ئ/g, "ي");

/* =========================================================
   رسمة الجسم (SVG) — viewBox 300×700، منظر أمامي
   يمين المريض = شمال الصورة (زي أي أطلس تشريح)
   ========================================================= */
const G = {
  torso: "M150 94 C128 94 104 96 94 108 C86 118 88 134 94 152 C100 176 110 200 113 222 C112 246 104 266 103 286 L105 302 C122 310 140 309 150 303 C160 309 178 310 195 302 L197 286 C196 266 188 246 187 222 C190 200 200 176 206 152 C212 134 214 118 206 108 C196 96 172 94 150 94 Z",
  neck: "M137 70 L163 70 L167 102 C156 106 144 106 133 102 Z",
  arm: "M98 105 C85 107 77 120 75 138 L60 228 C56 262 50 296 46 326 L60 328 C64 298 70 264 76 234 L98 158 Z",
  leg: "M103 282 C100 340 104 400 110 452 C105 492 108 545 117 600 L134 601 C136 552 141 500 141 452 C143 400 148 345 150 300 Z",
  hair: "M122 46 C120 22 135 13 150 13 C165 13 180 22 178 46 C174 33 162 26 150 27 C138 26 126 33 122 46 Z",
  briefs: "M103 280 C125 287 175 287 197 280 L197 300 C182 311 162 313 150 320 C138 313 118 311 103 300 Z"
};
const MIRROR = 'transform="translate(300 0) scale(-1 1)"';

function bodyFigure(id, detailed) {
  const side = `
    <path d="${G.arm}" fill="url(#${id}-limb)"/>
    <ellipse cx="52" cy="342" rx="9.5" ry="15" transform="rotate(8 52 342)" fill="url(#${id}-limb)"/>
    <path d="${G.leg}" fill="url(#${id}-limb)"/>
    <ellipse cx="124" cy="611" rx="16" ry="8.5" fill="url(#${id}-skin)"/>`;
  const sideDetail = `
    <g stroke="url(#${id}-limb)" stroke-width="4.5" stroke-linecap="round" fill="none">
      <path d="M45 352 L41 366"/><path d="M50 355 L48 371"/><path d="M55 355 L56 370"/><path d="M59 351 L62 364"/><path d="M60 334 L66 346"/>
    </g>
    <g fill="var(--skin-lo)"><circle cx="112" cy="614" r="2.6"/><circle cx="118" cy="617" r="2.6"/><circle cx="124" cy="618" r="2.6"/><circle cx="130" cy="617" r="2.6"/></g>
    <g stroke="var(--skin-line)" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".55">
      <path d="M62 228 q7 6 14 2"/><path d="M116 450 q10 8 21 0"/><path d="M120 104 Q134 111 147 106"/>
      <path d="M114 150 Q130 161 146 153" opacity=".7"/><path d="M121 262 Q134 284 146 296" opacity=".6"/>
    </g>`;
  return `
    <defs>
      <radialGradient id="${id}-skin" cx="40%" cy="22%" r="85%"><stop offset="0%" stop-color="var(--skin-hi)"/><stop offset="100%" stop-color="var(--skin-lo)"/></radialGradient>
      <linearGradient id="${id}-limb" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="var(--skin-lo)"/><stop offset="50%" stop-color="var(--skin-hi)"/><stop offset="100%" stop-color="var(--skin)"/></linearGradient>
      <linearGradient id="${id}-torso" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="var(--skin-lo)"/><stop offset="35%" stop-color="var(--skin-hi)"/><stop offset="70%" stop-color="var(--skin)"/><stop offset="100%" stop-color="var(--skin-lo)"/></linearGradient>
    </defs>
    <ellipse cx="150" cy="652" rx="78" ry="10" fill="#000" opacity=".07"/>
    <g>${side}${detailed ? sideDetail : ""}</g>
    <g ${MIRROR}>${side}${detailed ? sideDetail : ""}</g>
    <path d="${G.neck}" fill="url(#${id}-limb)"/>
    <path d="${G.torso}" fill="url(#${id}-torso)"/>
    <path d="${G.briefs}" fill="#7F93A8"/>
    <ellipse cx="123" cy="50" rx="4.5" ry="8" fill="var(--skin-lo)"/><ellipse cx="177" cy="50" rx="4.5" ry="8" fill="var(--skin-lo)"/>
    <ellipse cx="150" cy="48" rx="27" ry="33" fill="url(#${id}-skin)"/>
    <path d="${G.hair}" fill="#4A3628"/>
    ${detailed ? `
    <g fill="#5A4030"><circle cx="139" cy="47" r="2.3"/><circle cx="161" cy="47" r="2.3"/></g>
    <g stroke="var(--skin-line)" fill="none" stroke-linecap="round">
      <path d="M134 40 q5 -3 10 0" stroke="#5A4030" stroke-width="1.6"/><path d="M156 40 q5 -3 10 0" stroke="#5A4030" stroke-width="1.6"/>
      <path d="M150 50 q-3 7 0 10 q2 1 3 0" stroke-width="1.4"/><path d="M142 66 q8 4 16 0" stroke-width="1.8" stroke="#B0735A"/>
      <path d="M150 108 L150 172" stroke-width="1.4" opacity=".35"/>
    </g>
    <g ${MIRROR} stroke="var(--skin-line)" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".55">
      <path d="M120 104 Q134 111 147 106"/><path d="M114 150 Q130 161 146 153" opacity=".7"/><path d="M121 262 Q134 284 146 296" opacity=".6"/>
    </g>
    <circle cx="150" cy="232" r="2.6" fill="var(--skin-line)" opacity=".7"/>` : ""}`;
}

function bodyMapSvg() {
  const id = "bm";
  const r = Object.fromEntries(REGIONS.map(x => [x.key, x]));
  const reg = (key, inner) => `<g class="region" data-region="${key}" tabindex="0" role="button" aria-label="${esc(r[key].name)}" fill="${r[key].color}">${inner}</g>`;
  return `<svg viewBox="0 0 300 700" role="group" aria-label="خريطة الجسم — دوس على مكان الألم">
    ${bodyFigure(id, true)}
    <defs>
      <clipPath id="${id}-cT"><path d="${G.torso}"/></clipPath>
      <clipPath id="${id}-cP"><path d="${G.torso}"/><path d="${G.leg}"/><path d="${G.leg}" ${MIRROR}/></clipPath>
    </defs>
    ${reg("leg", `<path d="${G.leg}"/><ellipse cx="124" cy="611" rx="16" ry="8.5"/><g ${MIRROR}><path d="${G.leg}"/><ellipse cx="124" cy="611" rx="16" ry="8.5"/></g>`)}
    ${reg("arm", `<path d="${G.arm}"/><ellipse cx="52" cy="342" rx="11" ry="17" transform="rotate(8 52 342)"/><g ${MIRROR}><path d="${G.arm}"/><ellipse cx="52" cy="342" rx="11" ry="17" transform="rotate(8 52 342)"/></g>`)}
    ${reg("head", `<ellipse cx="150" cy="50" rx="36" ry="44"/><rect x="134" y="80" width="32" height="22" rx="6"/>`)}
    ${reg("chest", `<rect x="80" y="100" width="140" height="84" clip-path="url(#${id}-cT)"/>`)}
    ${reg("abdomen", `<rect x="80" y="184" width="140" height="84" clip-path="url(#${id}-cT)"/>`)}
    ${reg("pelvis", `<rect x="90" y="268" width="120" height="58" clip-path="url(#${id}-cP)"/>`)}
    <g class="pulse-g" aria-hidden="true">
      ${REGIONS.map(x => `
        <line class="leader" x1="${x.anchor.x}" y1="${x.anchor.y}" x2="${x.label.x}" y2="${x.label.y}"/>
        <circle class="pulse-ring" cx="${x.anchor.x}" cy="${x.anchor.y}" r="5" style="animation-delay:${(REGIONS.indexOf(x) * .37).toFixed(2)}s"/>
        <circle class="pulse-dot" cx="${x.anchor.x}" cy="${x.anchor.y}" r="4.5"/>`).join("")}
    </g>
  </svg>`;
}

/* رسمة صغيرة لمكان العضو — نفس الجسم بالظبط عشان التناسق */
const ORGANS = {
  kidney: { label: "مكان الكلى: في الضهر تحت آخر ضلوع، ناحيتين", m: [{ cx: 130, cy: 214, rx: 9, ry: 13 }, { cx: 170, cy: 214, rx: 9, ry: 13 }] },
  appendix: { label: "مكان الزائدة: أسفل يمين البطن", m: [{ cx: 128, cy: 254, rx: 8, ry: 8 }] },
  gallbladder: { label: "مكان المرارة: تحت الضلوع يمين، تحت الكبد", m: [{ cx: 133, cy: 192, rx: 8, ry: 10 }] },
  liver: { label: "مكان الكبد: أعلى يمين البطن", m: [{ cx: 136, cy: 182, rx: 22, ry: 14 }] },
  stomach: { label: "مكان المعدة: أعلى نص البطن مايل للشمال", m: [{ cx: 164, cy: 192, rx: 14, ry: 12 }] },
  heart: { label: "مكان القلب: نص الصدر مايل للشمال", m: [{ cx: 158, cy: 150, rx: 13, ry: 15 }] },
  lungs: { label: "مكان الرئتين: ناحيتين الصدر", m: [{ cx: 127, cy: 148, rx: 13, ry: 26 }, { cx: 173, cy: 148, rx: 13, ry: 26 }] }
};
let organSeq = 0;
function organTag(key) {
  const o = ORGANS[key];
  if (!o) return "";
  const id = "og" + (organSeq++);
  const marks = o.m.map(m => `<ellipse cx="${m.cx}" cy="${m.cy}" rx="${m.rx}" ry="${m.ry}" fill="#C2414B" opacity=".9"/><ellipse cx="${m.cx}" cy="${m.cy}" rx="${m.rx + 12}" ry="${m.ry + 12}" fill="none" stroke="#E5484D" stroke-width="4" opacity=".45"/>`).join("");
  return `<div class="organ"><svg viewBox="40 0 220 660" aria-hidden="true">${bodyFigure(id, false)}${marks}</svg><span>${o.label}</span></div>`;
}

/* =========================================================
   الحالة
   ========================================================= */
let saved = null;
try { const raw = localStorage.getItem(PROFILE_KEY); if (raw) saved = JSON.parse(raw); } catch (e) { /* تخزين مقفول */ }
if (saved && !Array.isArray(saved.chronic)) saved.chronic = [];

const state = {
  screen: saved ? "home" : "onboarding",
  profile: saved || { gender: null, age: "", height: "", weight: "", chronic: [] },
  consent: !!saved,
  editingProfile: false,
  region: null, zone: null,
  checked: new Set(), denied: new Set(), asked: new Set(),
  answers: {}, followup: [], round: 0,
  openCond: null, query: ""
};
const resetCase = () => { state.checked = new Set(); state.denied = new Set(); state.asked = new Set(); state.answers = {}; state.followup = []; state.round = 0; state.openCond = null; };

const $content = document.getElementById("content");
const $topbar = document.getElementById("topbar");
const $ctaBar = document.getElementById("ctaBar");
const $ctaBtn = document.getElementById("ctaBtn");

function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 2200);
}

/* =========================================================
   البروفايل
   ========================================================= */
const LIMITS = { age: [1, 120], height: [50, 230], weight: [3, 300] };
function fieldError(f, v) {
  if (v === "" || v == null) return null;
  const n = Number(v), [lo, hi] = LIMITS[f];
  return (!Number.isFinite(n) || n < lo || n > hi) ? `من ${lo} لـ ${hi}` : null;
}
const profileValid = p => p.gender && ["age", "height", "weight"].every(f => p[f] !== "" && !fieldError(f, p[f]));

function bmiOf(p) {
  const h = parseFloat(p.height), w = parseFloat(p.weight);
  if (!h || !w) return null;
  const v = w / Math.pow(h / 100, 2);
  let cat, color;
  if (v < 18.5) { cat = "نقص في الوزن"; color = "var(--warn-ink)"; }
  else if (v < 25) { cat = "وزن طبيعي"; color = "var(--ok-ink)"; }
  else if (v < 30) { cat = "زيادة في الوزن"; color = "var(--warn-ink)"; }
  else { cat = "سمنة"; color = "var(--danger-ink)"; }
  const pct = Math.min(Math.max((v - 15) / (40 - 15) * 100, 2), 98);
  return { value: v, text: v.toFixed(1), cat, color, pct };
}

function profileCtx(p) {
  const b = bmiOf(p);
  const chronic = p.chronic || [];
  return { age: parseFloat(p.age) || 0, sex: p.gender, bmi: b ? b.value : 0, has: c => chronic.includes(c) };
}

/* =========================================================
   محرك التقييم
   ---------------------------------------------------------
   coverage  = مجموع أوزان الأعراض المطابقة ÷ مجموع أوزان المرض
   explained = نسبة الأعراض المختارة اللي المرض بيفسرها
   denied    = أعراض اتسألت والمريض قال "لا" → بتقلل النسبة
   strength  = متوسط وزن الأعراض المطابقة ÷ 3
   النتيجة   = coverage × (0.6 + 0.4 × explained) × (0.5 + 0.5 × strength) − 0.5 × denied
   بعدين مكافأة عوامل الخطورة (بترفع بس) والسقف 95% —
   عمر الأعراض لوحدها ما تكفي لتأكيد 100%.
   ========================================================= */
function scoreZone(zoneKey) {
  const d = DATA[zoneKey];
  const ctx = profileCtx(state.profile);
  const checked = state.checked, denied = state.denied;
  return d.conditions.map(c => {
    const entries = Object.entries(c.weights);
    const total = entries.reduce((a, [, w]) => a + w, 0) || 1;
    let matched = 0, deniedW = 0, nExplained = 0;
    for (const [sid, w] of entries) {
      if (checked.has(sid)) { matched += w; nExplained++; }
      if (denied.has(sid)) deniedW += w;
    }
    const coverage = matched / total;
    const explained = checked.size ? nExplained / checked.size : 0;
    const strength = nExplained ? matched / nExplained / 3 : 0;   // متوسط وزن الأعراض المطابقة: عرض مميز (3) أقوى من عرض عام (1)
    let raw = coverage * (0.6 + 0.4 * explained) * (0.5 + 0.5 * strength) - 0.5 * (deniedW / total);
    let pct = Math.round(Math.max(0, Math.min(1, raw)) * 100);
    let reasons = [];
    if (pct > 0 && RISK_FACTORS[c.id] && ctx.age) {
      reasons = RISK_FACTORS[c.id](ctx).filter(Boolean);
      if (reasons.length) pct += Math.min(reasons.length * 5, 10);
    }
    pct = Math.min(pct, 95);
    const matchedSyms = d.symptoms.filter(s => checked.has(s.id) && c.weights[s.id]);
    const deniedSyms = d.symptoms.filter(s => denied.has(s.id) && c.weights[s.id]);
    return { ...c, pct, reasons, matchedSyms, deniedSyms };
  }).filter(c => c.pct > 0).sort((a, b) => b.pct - a.pct || (b.flag ? 1 : 0) - (a.flag ? 1 : 0));
}

const level = p => p >= 70 ? "تطابق قوي" : p >= 40 ? "تطابق متوسط" : "تطابق ضعيف";
const TRIAGE_ORDER = ["self", "doctor", "urgent", "emergency"];

function pickQuestions(zoneKey, top) {
  const d = DATA[zoneKey];
  return d.symptoms
    .filter(s => !state.checked.has(s.id) && !state.asked.has(s.id))
    .map(s => {
      const ws = top.map(c => c.weights[s.id] || 0);
      return { ...s, spread: Math.max(...ws) - Math.min(...ws), hits: ws.filter(Boolean).length };
    })
    .filter(s => s.spread > 0)
    .sort((a, b) => b.spread - a.spread || a.hits - b.hits)
    .slice(0, 3);
}

function evaluate() {
  const scored = scoreZone(state.zone);
  const top = scored.slice(0, 3);
  const ambiguous = top.length >= 2 && (top[0].pct - top[1].pct) < 25;
  if (ambiguous && state.round < MAX_FOLLOWUP_ROUNDS) {
    const qs = pickQuestions(state.zone, top);
    if (qs.length) {
      state.followup = qs; state.round++;
      go("followup"); return;
    }
  }
  state.openCond = null;
  go("results");
}

function answer(id, val) {
  state.answers[id] = state.answers[id] === val ? undefined : val;
  render();
}
function commitAnswers() {
  for (const q of state.followup) {
    const a = state.answers[q.id];
    state.asked.add(q.id);
    state.checked.delete(q.id); state.denied.delete(q.id);
    if (a === "yes") state.checked.add(q.id);
    else if (a === "no") state.denied.add(q.id);
  }
  evaluate();
}

/* =========================================================
   التنقل
   ========================================================= */
function go(screen) { state.screen = screen; render(); }
function back() {
  const s = state.screen;
  if (s === "about") go(state.prev || "home");
  else if (s === "results" || s === "followup") { state.round = 0; state.asked = new Set(); state.denied = new Set(); state.answers = {}; go("symptoms"); }
  else if (s === "symptoms") { resetCase(); state.zone = null; go(state.region ? "sections" : "home"); }
  else if (s === "sections") { state.region = null; go("home"); }
  else go("home");
}
function pickRegion(key) { state.region = key; go("sections"); }
function pickZone(key, preset) {
  state.zone = key; resetCase();
  if (preset) state.checked.add(preset);
  go("symptoms");
}
function restart() { resetCase(); state.zone = null; state.region = null; state.query = ""; go("home"); }
function allowedZone(k) {
  const z = ZONE[k];
  return !z.sex || !state.profile.gender || z.sex === state.profile.gender;
}

/* =========================================================
   الشريط العلوي
   ========================================================= */
const STEPS = ["المكان", "التخصص", "الأعراض", "النتيجة"];
function stepIndex() {
  return { sections: 1, symptoms: 2, followup: 2, results: 3 }[state.screen];
}
function renderTopbar() {
  if (state.screen === "onboarding") { $topbar.hidden = true; return; }
  $topbar.hidden = false;
  if (state.screen === "home") {
    $topbar.innerHTML = `<div class="bar-row">
      <div class="brand"><div class="logo">${ico(I.pulse, 2.4).replace('stroke="currentColor"', 'stroke="#fff"')}</div>
        <div><div class="brand-name">موصل</div><div class="brand-sub">حدد مكان الألم واعرف تتوجه لمين</div></div></div>
      <button class="icon-btn" data-act="about" aria-label="عن موصل والمصادر">${ico(I.info)}</button>
    </div>`;
    return;
  }
  const z = ZONE[state.zone], r = REGIONS.find(x => x.key === state.region);
  const title = {
    sections: `اختار القسم — ${r ? r.name : ""}`,
    symptoms: z ? z.name : "",
    followup: "أسئلة للتأكيد",
    results: "النتيجة",
    about: "عن موصل والمصادر"
  }[state.screen] || "";
  const si = stepIndex();
  $topbar.innerHTML = `<div class="bar-row">
      <button class="icon-btn" data-act="back" aria-label="رجوع">${ico(I.back)}</button>
      <div class="bar-title">${esc(title)}</div>
      ${state.screen === "results" ? `<button class="icon-btn" data-act="home" aria-label="الرئيسية">${ico(I.home)}</button>` : ""}
    </div>
    ${si != null ? `<div class="stepper" aria-hidden="true">${STEPS.map((_, i) => `<i class="${i <= si ? "on" : ""}"></i>`).join("")}</div>
    <div class="step-caption"><span>خطوة ${si + 1} من ${STEPS.length}: ${STEPS[si]}</span>${state.screen === "followup" ? `<span>جولة ${state.round} من ${MAX_FOLLOWUP_ROUNDS}</span>` : ""}</div>` : ""}`;
}

function setCta(text, onClick, disabled) {
  if (!text) { $ctaBar.hidden = true; return; }
  $ctaBar.hidden = false;
  $ctaBtn.innerHTML = text;
  $ctaBtn.disabled = !!disabled;
  $ctaBtn.onclick = onClick;
}

/* =========================================================
   الشاشات
   ========================================================= */
function renderOnboarding() {
  const p = state.profile;
  const fld = (f, label, unit, ph) => {
    const e = fieldError(f, p[f]);
    return `<div class="num"><label for="f-${f}">${label}</label>
      <input id="f-${f}" type="number" inputmode="numeric" placeholder="${ph}" value="${esc(p[f])}" data-field="${f}" aria-invalid="${!!e}" aria-describedby="u-${f}">
      <div class="unit" id="u-${f}">${e ? `<span class="err">${e}</span>` : unit}</div></div>`;
  };
  $content.innerHTML = `<div class="fade-in">
    <div class="onb-hero">
      <div class="brand"><div class="logo">${ico(I.pulse, 2.4)}</div><div class="brand-name">موصل</div></div>
      <h1>${state.editingProfile ? "تعديل بياناتك" : "اعرف أعراضك بتشاور على إيه — وتروح لمين"}</h1>
      <p>3 خطوات: حدد مكان الألم، اختار أعراضك، وخد احتمالات مرتبة بمستوى الاستعجال والتخصص المناسب.</p>
      <div class="trust-row">
        <span>${ico(I.lock)} بياناتك على جهازك بس</span>
        <span>${ico(I.book)} أكواد ICD-10 ومراجع</span>
        <span>${ico(I.clock)} أقل من دقيقتين</span>
      </div>
    </div>
    <div class="field"><span class="flabel" id="lg">النوع</span>
      <div class="seg" role="group" aria-labelledby="lg">
        <button data-gender="male" aria-pressed="${p.gender === "male"}">ذكر</button>
        <button data-gender="female" aria-pressed="${p.gender === "female"}">أنثى</button>
      </div></div>
    <div class="field"><div class="nums">
      ${fld("age", "العمر", "سنة", "35")}${fld("height", "الطول", "سم", "170")}${fld("weight", "الوزن", "كجم", "70")}
    </div></div>
    <div class="field"><span class="flabel" id="lc">أمراض مزمنة <span class="muted small">(اختياري — بتحسّن دقة الترشيح)</span></span>
      <div class="chips" role="group" aria-labelledby="lc">${CHRONIC_OPTIONS.map(c => `<button class="chip" data-chronic="${esc(c)}" aria-pressed="${p.chronic.includes(c)}">${esc(c)}</button>`).join("")}</div></div>
    ${state.editingProfile ? "" : `<label class="consent"><input type="checkbox" id="consent" ${state.consent ? "checked" : ""}>
      <span>فاهم إن موصل <b>أداة توجيه أولية مش تشخيص طبي</b>، ومايغنيش عن الكشف. في الطوارئ هتصل بالإسعاف ${EMERGENCY_NUMBER}.</span></label>`}
    ${state.editingProfile ? `<div style="text-align:center;margin-top:8px"><button class="link-btn" data-act="cancel-edit">رجوع من غير حفظ</button></div>` : ""}
  </div>`;
  updateOnboardCta();
}
function updateOnboardCta() {
  const ok = profileValid(state.profile) && (state.editingProfile || state.consent);
  setCta(state.editingProfile ? "حفظ التعديلات" : "يلا نبدأ", submitProfile, !ok);
}
function submitProfile() {
  if (!profileValid(state.profile)) return;
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(state.profile)); } catch (e) { /* ignore */ }
  const wasEditing = state.editingProfile;
  state.editingProfile = false;
  go("home");
  if (wasEditing) toast("اتحفظت بياناتك");
}

function renderHome() {
  const p = state.profile, b = bmiOf(p);
  const chronic = (p.chronic || []);
  const quick = QUICK_ACCESS.filter(q => allowedZone(q.key)).map(q => `
    <button class="quick" data-zone="${q.key}"><span class="qi">${ico(ZONE[q.key].icon)}</span>
      <span class="t"><b>${q.title}</b><span>${q.sub}</span></span>${ico(I.chevL).replace("<svg", '<svg class="chev"')}</button>`).join("");

  $content.innerHTML = `<div class="fade-in">
    <div class="card">
      <div class="profile-strip">
        <div class="avatar">${ico(I.user)}</div>
        <div class="meta"><b>${p.gender === "male" ? "ذكر" : "أنثى"} · ${esc(p.age)} سنة</b>
          <span class="muted small">${esc(p.height)} سم · ${esc(p.weight)} كجم${chronic.length ? " · " + chronic.map(esc).join("، ") : ""}</span></div>
        <button class="btn btn-ghost" style="padding:8px 12px;font-size:13px" data-act="edit">تعديل</button>
      </div>
      ${b ? `<div class="bmi"><div class="bmi-val">${b.text}<small>مؤشر كتلة الجسم</small></div>
        <div style="flex:1"><div class="bmi-scale" role="img" aria-label="مؤشر كتلة الجسم ${b.text}: ${b.cat}"><div class="bmi-mark" style="right:${b.pct}%"></div></div>
        <div class="bmi-cat" style="color:${b.color};margin-top:6px">${b.cat}</div></div></div>` : ""}
    </div>

    <div class="search" role="search">
      ${ico(I.search)}
      <label for="q" class="sr-only">ابحث عن عرض</label>
      <input id="q" type="search" placeholder="ابحث عن عرض… مثلًا: حرقان، دوخة، ألم صدر" value="${esc(state.query)}" autocomplete="off">
      <div id="qres" aria-live="polite"></div>
    </div>

    <div class="stage">
      <div class="stage-head"><b>فين الألم؟</b><span>دوس على المكان في الجسم</span></div>
      <div class="body-wrap">${bodyMapSvg()}
        <div class="tag-layer">${REGIONS.map(r => `<button class="tag" data-region="${r.key}" style="left:${r.label.x / 300 * 100}%;top:${r.label.y / 700 * 100}%"><i style="background:${r.color}"></i>${esc(r.name)}</button>`).join("")}</div>
      </div>
    </div>

    <div class="label">أو اختار من غير ما تحدد مكان</div>
    ${quick}

    <details class="redflags">
      <summary>${ico(I.alert)}علامات خطر — اتصل بالإسعاف ${EMERGENCY_NUMBER} فورًا${ico(I.chevD).replace("<svg", '<svg class="chev"')}</summary>
      <ul>
        <li>ألم أو ضغط في الصدر أكتر من 15 دقيقة، أو بيوصل للدراع أو الفك مع عرق بارد</li>
        <li>اعوجاج مفاجئ في الوش، ضعف أو تنميل في ناحية واحدة من الجسم، أو صعوبة في الكلام</li>
        <li>صعوبة شديدة في التنفس، أو تورم في الشفايف أو اللسان</li>
        <li>نزيف شديد مش بيقف، أو ترجيع دم، أو براز أسود</li>
        <li>إغماء أو تشنجات أو لخبطة مفاجئة في الوعي</li>
        <li>أفكار عن إيذاء النفس</li>
      </ul>
      <a class="btn btn-danger btn-block" href="tel:${EMERGENCY_NUMBER}">${ico(I.phone)} اتصل بالإسعاف ${EMERGENCY_NUMBER}</a>
    </details>

    <div class="disclaimer">${ico(I.shield)}<span>موصل أداة توجيه أولية وليست تشخيصًا طبيًا. النتايج مبنية على الأعراض اللي بتختارها ومراجع طبية عامة، والقرار النهائي للطبيب. <button class="link-btn" style="padding:0" data-act="about">إزاي بيشتغل؟</button></span></div>
    <div class="foot">الإصدار ${version}</div>
  </div>`;
  setCta(null);
  renderSearch();
}

function renderSearch() {
  const box = document.getElementById("qres");
  if (!box) return;
  const q = normAr(state.query.trim());
  if (q.length < 2) { box.innerHTML = ""; return; }
  const words = q.split(/\s+/).filter(Boolean);
  const hits = [];
  for (const z of ZONES) {
    if (!allowedZone(z.key)) continue;
    for (const s of DATA[z.key].symptoms) {
      const n = normAr(s.label);
      if (words.every(w => n.includes(w))) hits.push({ z, s, i: n.indexOf(words[0]) });
    }
    for (const c of DATA[z.key].conditions) {
      const n = normAr(c.name + " " + c.en);
      if (words.every(w => n.includes(w))) hits.push({ z, c, i: -1 });
    }
  }
  hits.sort((a, b) => (a.c ? 1 : 0) - (b.c ? 1 : 0) || a.i - b.i);
  const hl = label => {
    // تمييز أول كلمة متطابقة
    const n = normAr(label), i = n.indexOf(words[0]);
    if (i < 0) return esc(label);
    return esc(label.slice(0, i)) + "<mark>" + esc(label.slice(i, i + words[0].length)) + "</mark>" + esc(label.slice(i + words[0].length));
  };
  box.innerHTML = `<div class="results-pop">${hits.length ? hits.slice(0, 8).map(h => h.s
    ? `<button data-zone="${h.z.key}" data-preset="${h.s.id}"><span>${hl(h.s.label)}</span><span class="z">${esc(h.z.name)}</span></button>`
    : `<button data-zone="${h.z.key}"><span>${ico(I.book).replace("<svg", '<svg style="width:16px;height:16px;flex:0 0 auto;color:var(--ink-3)"')} ${hl(h.c.name)}</span><span class="z">${esc(h.z.name)}</span></button>`
  ).join("") : `<div class="empty">مالقيناش "${esc(state.query)}". جرّب كلمة تانية أو دوس على مكان الألم في الجسم.</div>`}</div>`;
}

function renderSections() {
  const r = REGIONS.find(x => x.key === state.region);
  const zones = r.specialties.filter(allowedZone);
  $content.innerHTML = `<div class="fade-in">
    <h1 class="h1">${esc(r.name)}: الأقرب لعرضك إيه؟</h1>
    <p class="lead">اختار التخصص اللي شبه شكوتك. مش متأكد؟ ابدأ بالأول وتقدر ترجع.</p>
    <div class="zone-grid">${zones.map(k => {
      const z = ZONE[k];
      return `<button class="zone" data-zone="${k}"><span class="zi">${ico(z.icon)}</span><b>${esc(z.name)}</b>
        <small>${DATA[k].conditions.length} حالة · ${DATA[k].symptoms.length} عرض</small>${statusBadge(z)}</button>`;
    }).join("")}</div>
  </div>`;
  setCta(null);
}
const statusBadge = z => z.status === "validated"
  ? `<span class="badge ok">${ico(I.check, 3)}متراجع على مصادر</span>`
  : `<span class="badge pending">${ico(I.clock)}قيد المراجعة الطبية</span>`;

function symButton(s, attr) {
  return `<button class="sym" role="checkbox" aria-checked="${state.checked.has(s.id)}" ${attr}="${s.id}">
    <span class="box">${ico(I.check, 3)}</span><span class="txt">${esc(s.label)}</span>${s.red ? `<span class="rf">علامة خطر</span>` : ""}</button>`;
}

function renderSymptoms() {
  const d = DATA[state.zone], z = ZONE[state.zone];
  $content.innerHTML = `<div class="fade-in">
    <h1 class="h1">إيه الأعراض اللي عندك؟</h1>
    <p class="lead">اختار كل اللي ينطبق عليك — كل ما تختار أدق، النتيجة تبقى أدق.</p>
    ${z.status !== "validated" ? `<div class="info-note">${ico(I.info)}<span>القسم ده لسه قيد المراجعة الطبية — استخدم النتيجة كتوجيه مبدئي بس.</span></div>` : ""}
    <div role="group" aria-label="الأعراض">${d.symptoms.map(s => symButton(s, "data-sym")).join("")}</div>
  </div>`;
  const n = state.checked.size;
  setCta(n ? `شوف النتيجة (${n} ${n === 1 ? "عرض" : "أعراض"})` : "اختار عرض واحد على الأقل", evaluate, !n);
}

function renderFollowup() {
  $content.innerHTML = `<div class="fade-in">
    <h1 class="h1">كام سؤال عشان نفرّق بين الاحتمالات</h1>
    <div class="info-note">${ico(I.bulb)}<span>فيه أكتر من احتمال قريب من بعض. إجابتك هنا — حتى لو "لأ" — بتساعد نستبعد اللي مش مناسب.</span></div>
    ${state.followup.map(q => {
      const a = state.answers[q.id];
      return `<div class="q"><p>${esc(q.label)}${q.red ? ` <span class="badge pending" style="background:var(--danger-bg);color:var(--danger-ink)">علامة خطر</span>` : ""}</p>
        <div class="opts" role="group" aria-label="${esc(q.label)}">
          <button class="yes" data-ans="yes" data-q="${q.id}" aria-pressed="${a === "yes"}">أيوه</button>
          <button class="no" data-ans="no" data-q="${q.id}" aria-pressed="${a === "no"}">لأ</button>
          <button class="unsure" data-ans="unsure" data-q="${q.id}" aria-pressed="${a === "unsure"}">مش متأكد</button>
        </div></div>`;
    }).join("")}
    <div style="text-align:center"><button class="link-btn" data-act="skip">تخطّى وشوف النتيجة دلوقتي</button></div>
  </div>`;
  setCta("حدّث النتيجة", commitAnswers, false);
}

/* المراجع: روابط بحث مباشر في مصادر موثوقة (مابتتكسرش) + كود ICD-10 */
function refsFor(c) {
  const q = encodeURIComponent(c.en);
  const list = [
    { name: `ICD-10 · ${c.icd10}`, src: "منظمة الصحة العالمية (WHO)", url: `https://icd.who.int/browse10/2019/en#/${c.icd10}` },
    { name: "MedlinePlus", src: "المكتبة الوطنية الأمريكية للطب (NIH)", url: `https://vsearch.nlm.nih.gov/vivisimo/cgi-bin/query-meta?v%3Aproject=medlineplus&v%3Asources=medlineplus-bundle&query=${q}` },
    { name: "NHS Health A–Z", src: "هيئة الصحة البريطانية", url: `https://www.nhs.uk/search/results?q=${q}` },
    { name: "Mayo Clinic", src: "مايو كلينك", url: `https://www.mayoclinic.org/search/search-results?q=${q}` },
    { name: "StatPearls", src: "NCBI Bookshelf — مرجع للأطباء", url: `https://www.ncbi.nlm.nih.gov/books/?term=${q}+StatPearls` }
  ];
  if (c.cui) list.push({ name: `UMLS · ${c.cui}`, src: "Unified Medical Language System", url: `https://uts.nlm.nih.gov/uts/umls/concept/${c.cui}` });
  return `<details class="refs"><summary>${ico(I.book)}المراجع والأكواد (${list.length})</summary><ul>
    ${list.map(r => `<li>${ico(I.ext)}<a href="${r.url}" target="_blank" rel="noopener noreferrer">${esc(r.name)}</a><small>${esc(r.src)}</small></li>`).join("")}
  </ul></details>`;
}

function condCard(c, rank, isTop) {
  const open = isTop || state.openCond === c.id;
  const reviewPending = ZONE[state.zone].status !== "validated" || c.review === "pending";
  return `<article class="cond ${isTop ? "top" : ""} ${c.flag ? "flag" : ""} ${open ? "open" : ""}">
    <${isTop ? "div" : "button"} class="cond-head" ${isTop ? "" : `data-open="${c.id}" aria-expanded="${open}"`}>
      <div class="kicker">
        <span class="rank">${isTop ? "الاحتمال الأقرب" : "#" + rank}</span>
        <span class="badge code">ICD-10 ${esc(c.icd10)}</span>
        ${c.flag ? `<span class="badge" style="background:var(--danger-bg);color:var(--danger-ink)">${ico(I.alert)}ممكن تكون طارئة</span>` : ""}
        ${!isTop ? ico(I.chevD).replace("<svg", '<svg class="expand" style="margin-inline-start:auto"') : ""}
      </div>
      <h3 class="cond-name">${esc(c.name)}</h3>
      <div class="cond-en">${esc(c.en)}</div>
      <div class="meter"><div class="track"><div class="fill" style="width:${c.pct}%"></div></div><span class="pct">${c.pct}%</span><span class="lvl">${level(c.pct)}</span></div>
    </${isTop ? "div" : "button"}>
    ${open ? `<div class="cond-body">
      ${c.reasons.length ? `<span class="risk">${ico(I.user)}زادت شوية بسبب: ${c.reasons.map(esc).join("، ")}</span>` : ""}
      ${c.organ ? organTag(c.organ) : ""}
      <div class="blk why"><span class="bl">${ico(I.list)}ليه رشحناه؟</span>
        ${c.note ? esc(c.note) : "بناءً على تطابق الأعراض دي:"}
        <div class="matched">${c.matchedSyms.map(s => `<span>✓ ${esc(s.label)}</span>`).join("")}${c.deniedSyms.map(s => `<span class="miss">${esc(s.label)}</span>`).join("")}</div>
      </div>
      <div class="blk def"><span class="bl">${ico(I.info)}إيه هو؟</span>${esc(c.def)}</div>
      <div class="blk tx"><span class="bl">${ico(I.steth)}إزاي بيتعالج؟</span>${esc(c.treatment)}</div>
      <div class="small muted" style="margin-top:8px">مستوى الاستعجال المعتاد: <b>${TRIAGE[c.triage].label}</b>${reviewPending ? " · المحتوى قيد المراجعة الطبية" : ""}</div>
      ${refsFor(c)}
    </div>` : ""}
  </article>`;
}

function overallTriage(scored) {
  const redSym = DATA[state.zone].symptoms.filter(s => s.red && state.checked.has(s.id));
  let t = scored.length ? scored[0].triage : "doctor";
  for (const c of scored) {
    if (c.pct >= 50 && TRIAGE_ORDER.indexOf(c.triage) > TRIAGE_ORDER.indexOf(t) && (c.flag || c.triage === "urgent")) t = c.triage;
  }
  if (redSym.length) t = "emergency";
  return { key: t, redSym, crisis: redSym.some(s => s.crisis) };
}

function renderResults() {
  const d = DATA[state.zone], z = ZONE[state.zone];
  const scored = scoreZone(state.zone);
  const tri = overallTriage(scored);
  const T = TRIAGE[tri.key];
  const toneIcon = { danger: I.alert, warn: I.clock, info: I.steth, ok: I.heart }[T.tone];
  const top = scored[0], rest = scored.slice(1, 6);
  const picked = d.symptoms.filter(s => state.checked.has(s.id));
  const isEmergency = tri.key === "emergency" && !tri.crisis;

  $content.innerHTML = `<div class="fade-in">
    <div class="print-only"><h2>تقرير موصل — ${new Date().toLocaleDateString("ar-EG")}</h2></div>
    ${tri.crisis ? `<div class="alert crisis" role="alert">${ico(I.heart).replace("<svg", '<svg class="ai"')}<div>
      <b>إنت مش لوحدك — ومحتاج تتكلم مع حد دلوقتي</b>
      <p>الأفكار دي ليها علاج ومساعدة. كلم الخط الساخن للصحة النفسية (مجاني وسري)، أو حد بتثق فيه. لو في خطر حالًا اتصل بالإسعاف ${EMERGENCY_NUMBER}.</p>
      <div class="btn-row"><a class="btn" href="tel:${MENTAL_HOTLINE}">${ico(I.phone)} ${MENTAL_HOTLINE}</a><a class="btn" href="tel:${EMERGENCY_NUMBER}">${ico(I.phone)} ${EMERGENCY_NUMBER}</a></div></div></div>` : ""}
    ${isEmergency ? `<div class="alert danger" role="alert">${ico(I.alert).replace("<svg", '<svg class="ai"')}<div>
      <b>الأعراض دي محتاجة طوارئ</b>
      <p>${tri.redSym.length ? "اخترت علامة خطر: " + tri.redSym.map(s => esc(s.label)).join("، ") + "." : "فيه احتمال لحالة طارئة."} ماتستناش — اتصل بالإسعاف أو روح أقرب مستشفى.</p>
      <a class="btn" href="tel:${EMERGENCY_NUMBER}">${ico(I.phone)} اتصل ${EMERGENCY_NUMBER}</a></div></div>` : ""}

    <section class="triage t-${T.tone}" aria-label="الخطوة الجاية">
      <div class="tl">${ico(toneIcon)}الخطوة الجاية</div>
      <h2>${T.label}</h2>
      <p>${T.action}</p>
      <div class="spec">${ico(I.steth)}<span>التخصص المقترح: <b>${esc(z.name)}</b></span></div>
    </section>

    <div class="summary-card">
      <div class="sh"><span>الأعراض اللي اخترتها (${picked.length})</span><button class="link-btn" style="padding:0;font-size:12.5px" data-act="edit-sym">تعديل</button></div>
      <div class="sel-chips">${picked.map(s => `<span class="sel-chip">${esc(s.label)}<button data-remove="${s.id}" aria-label="شيل ${esc(s.label)}">${ico(I.x, 2.6)}</button></span>`).join("")}</div>
    </div>

    ${top ? condCard(top, 1, true) : `<div class="card"><b>مفيش تطابق واضح</b><p class="muted small" style="margin:6px 0 0">الأعراض اللي اخترتها مش بتشاور على حالة محددة في القسم ده. جرّب ترجع وتختار أعراض تانية، أو اكشف عند ${esc(z.name)}.</p></div>`}

    ${rest.length ? `<div class="more-hd"><b>احتمالات تانية</b><span class="muted small">دوس عشان التفاصيل</span></div>
      ${rest.map((c, i) => condCard(c, i + 2, false)).join("")}` : ""}

    <div class="btn-row no-print" style="margin-top:16px">
      <button class="btn btn-ghost" data-act="share">${ico(I.share)} شارك التقرير</button>
      <button class="btn btn-ghost" data-act="print">${ico(I.print)} اطبع للدكتور</button>
    </div>
    <button class="btn btn-primary btn-block no-print" style="margin-top:10px" data-act="restart">${ico(I.restart)} فحص جديد</button>

    <div class="disclaimer">${ico(I.shield)}<span>النسب دي درجة تطابق بين أعراضك والأعراض المعروفة لكل حالة — مش احتمال إحصائي ولا تشخيص. ${z.status === "validated" ? "القسم ده اتراجع على مصادر طبية" : "القسم ده لسه قيد المراجعة الطبية"}. افتح "المراجع" تحت أي حالة عشان تقرا من المصدر.</span></div>
  </div>`;
  setCta(null);
}

function renderAbout() {
  const zoneRows = ZONES.map(z => `<tr><td>${esc(z.name)}</td><td>${DATA[z.key].conditions.length}</td><td>${z.status === "validated" ? `<span class="badge ok">متراجع</span>` : `<span class="badge pending">قيد المراجعة</span>`}</td></tr>`).join("");
  const total = ZONES.reduce((a, z) => a + DATA[z.key].conditions.length, 0);
  const sources = Object.entries(ZONE_SOURCES).flatMap(([k, arr]) => arr.map(s => `<li><a href="${s.url}" target="_blank" rel="noopener noreferrer">${esc(s.name)}</a> <span class="muted small">(${esc(ZONE[k].name)})</span></li>`)).join("");
  $content.innerHTML = `<div class="fade-in about">
    <h1 class="h1">إزاي موصل بيشتغل؟</h1>
    <p>موصل بيقارن الأعراض اللي بتختارها بمكتبة فيها <b>${total} حالة</b> في <b>${ZONES.length} تخصص</b>، كل حالة مربوطة بكود <b>ICD-10</b> العالمي من منظمة الصحة العالمية.</p>
    <h2>خطوات التقييم</h2>
    <ol>
      <li><b>التطابق:</b> كل عرض ليه وزن (1–3) حسب قد إيه هو مميز للحالة.</li>
      <li><b>التفسير:</b> الحالة اللي بتفسر أعراض أكتر من اللي اخترتها بتاخد درجة أعلى.</li>
      <li><b>الاستبعاد:</b> لو جاوبت "لأ" على سؤال تأكيدي، الحالات اللي بتعتمد على العرض ده بتنزل.</li>
      <li><b>عوامل الخطورة:</b> السن والنوع والوزن والأمراض المزمنة بتزوّد الدرجة شوية (لحد 10%) — وبس لو فيه تطابق أعراض أصلًا.</li>
      <li><b>الحد الأقصى 95%:</b> الأعراض لوحدها عمرها ما تأكد تشخيص — الفحص والتحاليل هم اللي بيأكدوا.</li>
    </ol>
    <h2>مستويات الاستعجال</h2>
    <div class="legend-t">${Object.values(TRIAGE).map(t => `<div class="t-${t.tone}"><b>${t.label}:</b> ${t.action}</div>`).join("")}</div>
    <h2>حالة المراجعة</h2>
    <table class="tbl"><thead><tr><th>التخصص</th><th>حالات</th><th>الحالة</th></tr></thead><tbody>${zoneRows}</tbody></table>
    <h2>المصادر</h2>
    <ul>
      <li>تصنيف الأمراض: <a href="https://icd.who.int/browse10/2019/en" target="_blank" rel="noopener noreferrer">ICD-10 — WHO</a>، ومصطلحات <a href="https://www.nlm.nih.gov/research/umls/" target="_blank" rel="noopener noreferrer">UMLS — NLM</a></li>
      <li>معلومات المرضى: <a href="https://medlineplus.gov/" target="_blank" rel="noopener noreferrer">MedlinePlus</a>، <a href="https://www.nhs.uk/conditions/" target="_blank" rel="noopener noreferrer">NHS</a>، <a href="https://www.mayoclinic.org/diseases-conditions" target="_blank" rel="noopener noreferrer">Mayo Clinic</a></li>
      <li>مرجع الأطباء: <a href="https://www.ncbi.nlm.nih.gov/books/NBK430685/" target="_blank" rel="noopener noreferrer">StatPearls — NCBI</a></li>
      ${sources}
    </ul>
    <h2>خصوصيتك</h2>
    <p>بياناتك (السن والطول والوزن والأمراض المزمنة) بتتحفظ على جهازك بس ومش بتتبعت لأي سيرفر. الأعراض مش بتتحفظ خالص.</p>
    <div class="btn-row"><button class="btn btn-ghost" data-act="edit">${ico(I.user)} تعديل بياناتي</button><button class="btn btn-ghost" data-act="wipe">${ico(I.x)} امسح بياناتي</button></div>
    <div class="disclaimer">${ico(I.shield)}<span>موصل أداة توجيه وتثقيف صحي، مش جهاز طبي ومش بديل عن الطبيب. المحتوى محتاج مراجعة واعتماد أطباء متخصصين قبل الاستخدام الواسع.</span></div>
    <div class="foot">الإصدار ${version}</div>
  </div>`;
  setCta(null);
}

/* ---------- التقرير ---------- */
function reportText() {
  const p = state.profile, z = ZONE[state.zone], d = DATA[state.zone];
  const scored = scoreZone(state.zone).slice(0, 3);
  const tri = TRIAGE[overallTriage(scoreZone(state.zone)).key];
  return [
    `تقرير موصل — ${new Date().toLocaleDateString("ar-EG")}`,
    `${p.gender === "male" ? "ذكر" : "أنثى"}، ${p.age} سنة، ${p.height} سم، ${p.weight} كجم${p.chronic.length ? "، أمراض مزمنة: " + p.chronic.join("، ") : ""}`,
    `التخصص: ${z.name}`,
    `الأعراض: ${d.symptoms.filter(s => state.checked.has(s.id)).map(s => s.label).join("، ")}`,
    state.denied.size ? `نفى: ${d.symptoms.filter(s => state.denied.has(s.id)).map(s => s.label).join("، ")}` : "",
    `الاحتمالات: ${scored.map(c => `${c.name} (${c.en}, ICD-10 ${c.icd10}) ${c.pct}%`).join(" | ")}`,
    `الخطوة الجاية: ${tri.label}`,
    `— أداة توجيه وليست تشخيصًا.`
  ].filter(Boolean).join("\n");
}
async function shareReport() {
  const text = reportText();
  try {
    if (navigator.share) { await navigator.share({ title: "تقرير موصل", text }); return; }
  } catch (e) { if (e && e.name === "AbortError") return; }
  try { await navigator.clipboard.writeText(text); toast("اتنسخ التقرير — الصقه في أي رسالة"); }
  catch (e) { toast("مقدرناش ننسخ — جرّب الطباعة"); }
}

/* =========================================================
   الرسم + الأحداث
   ========================================================= */
function render() {
  renderTopbar();
  const s = state.screen;
  if (s === "onboarding") renderOnboarding();
  else if (s === "home") renderHome();
  else if (s === "sections") renderSections();
  else if (s === "symptoms") renderSymptoms();
  else if (s === "followup") renderFollowup();
  else if (s === "results") renderResults();
  else if (s === "about") renderAbout();
  if (render.last !== s) { window.scrollTo(0, 0); render.last = s; }
}

document.addEventListener("click", e => {
  const t = e.target.closest("button, [data-region]");
  if (!t) return;
  const ds = t.dataset;
  if (ds.region) return pickRegion(ds.region);
  if (ds.zone) return pickZone(ds.zone, ds.preset);
  if (ds.sym) { state.checked.has(ds.sym) ? state.checked.delete(ds.sym) : state.checked.add(ds.sym); return render(); }
  if (ds.ans) return answer(ds.q, ds.ans);
  if (ds.open) { state.openCond = state.openCond === ds.open ? null : ds.open; return render(); }
  if (ds.remove) {
    state.checked.delete(ds.remove);
    if (!state.checked.size) return go("symptoms");
    return render();
  }
  if (ds.gender) { state.profile.gender = ds.gender; return render(); }
  if (ds.chronic) {
    const c = ds.chronic, arr = state.profile.chronic;
    state.profile.chronic = arr.includes(c) ? arr.filter(x => x !== c) : [...arr, c];
    return render();
  }
  switch (ds.act) {
    case "back": return back();
    case "home": return restart();
    case "about": state.prev = state.screen; return go("about");
    case "edit": state.editingProfile = true; return go("onboarding");
    case "cancel-edit":
      try { state.profile = JSON.parse(localStorage.getItem(PROFILE_KEY)) || state.profile; } catch (err) { /* ignore */ }
      state.editingProfile = false; return go("home");
    case "skip": state.openCond = null; return go("results");
    case "edit-sym": state.round = 0; state.asked = new Set(); state.denied = new Set(); state.answers = {}; return go("symptoms");
    case "restart": return restart();
    case "share": return shareReport();
    case "print": return window.print();
    case "wipe":
      if (!confirm("هتمسح بياناتك من الجهاز ده؟")) return;
      try { localStorage.removeItem(PROFILE_KEY); } catch (err) { /* ignore */ }
      state.profile = { gender: null, age: "", height: "", weight: "", chronic: [] };
      state.consent = false; resetCase(); return go("onboarding");
  }
});

document.addEventListener("keydown", e => {
  const g = e.target.closest && e.target.closest("g.region");
  if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); pickRegion(g.dataset.region); }
});

/* تمييز المنطقة لما المستخدم يقف على التاج بتاعها */
document.addEventListener("pointerover", e => {
  const tag = e.target.closest && e.target.closest(".tag");
  document.querySelectorAll("g.region.hot").forEach(g => g.classList.remove("hot"));
  if (tag) document.querySelector(`g.region[data-region="${tag.dataset.region}"]`)?.classList.add("hot");
});

document.addEventListener("input", e => {
  const t = e.target;
  if (t.id === "q") { state.query = t.value; return renderSearch(); }
  if (t.dataset && t.dataset.field) {
    state.profile[t.dataset.field] = t.value;
    const err = fieldError(t.dataset.field, t.value);
    t.setAttribute("aria-invalid", !!err);
    const u = document.getElementById("u-" + t.dataset.field);
    if (u) u.innerHTML = err ? `<span class="err">${err}</span>` : { age: "سنة", height: "سم", weight: "كجم" }[t.dataset.field];
    updateOnboardCta();
  }
  if (t.id === "consent") { state.consent = t.checked; updateOnboardCta(); }
});
document.addEventListener("change", e => { if (e.target.id === "consent") { state.consent = e.target.checked; updateOnboardCta(); } });

render();

/* PWA: يشتغل من غير نت بعد أول فتح */
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}

/* للاختبارات الآلية */
window.__mosel = { state, scoreZone, evaluate, render };
})();

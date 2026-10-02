/* حسابات الشمس والقمر بدون إنترنت (معادلات ميوس المبسطة). دقة الأوقات في حدود دقائق. */
const Astro = (() => {
  const RAD = Math.PI / 180, DAY = 86400000, J1970 = 2440588, J2000 = 2451545, E = RAD * 23.4397;
  const toDays = d => d.valueOf() / DAY - 0.5 + J1970 - J2000;
  const fromDays = t => new Date((t + J2000 + 0.5 - J1970) * DAY);
  const ra = (l, b) => Math.atan2(Math.sin(l) * Math.cos(E) - Math.tan(b) * Math.sin(E), Math.cos(l));
  const dec = (l, b) => Math.asin(Math.sin(b) * Math.cos(E) + Math.cos(b) * Math.sin(E) * Math.sin(l));
  const alt = (H, phi, d) => Math.asin(Math.sin(phi) * Math.sin(d) + Math.cos(phi) * Math.cos(d) * Math.cos(H));
  const sidereal = (d, lw) => RAD * (280.16 + 360.9856235 * d) - lw;
  const solarM = d => RAD * (357.5291 + 0.98560028 * d);
  const eclLon = M => M + RAD * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M)) + RAD * 102.9372 + Math.PI;
  const sunCoords = d => { const L = eclLon(solarM(d)); return { dec: dec(L, 0), ra: ra(L, 0) }; };
  const moonCoords = d => {
    const L = RAD * (218.316 + 13.176396 * d), M = RAD * (134.963 + 13.064993 * d), F = RAD * (93.272 + 13.22935 * d);
    const l = L + RAD * 6.289 * Math.sin(M), b = RAD * 5.128 * Math.sin(F);
    return { ra: ra(l, b), dec: dec(l, b), dist: 385001 - 20905 * Math.cos(M), lon: l };
  };
  const J0 = 0.0009;
  const cycle = (d, lw) => Math.round(d - J0 - lw / (2 * Math.PI));
  const approx = (Ht, lw, n) => J0 + (Ht + lw) / (2 * Math.PI) + n;
  const transitJ = (ds, M, L) => J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
  const hourAngle = (h, phi, d) => Math.acos((Math.sin(h) - Math.sin(phi) * Math.sin(d)) / (Math.cos(phi) * Math.cos(d)));

  /* شروق وغروب الشمس وذروتها لليوم الذي يقع فيه التاريخ */
  function sunTimes(date, lat, lng) {
    const lw = RAD * -lng, phi = RAD * lat, d = toDays(date), n = cycle(d, lw), ds = approx(0, lw, n);
    const M = solarM(ds), L = eclLon(M), de = dec(L, 0), Jn = transitJ(ds, M, L);
    const at = h => {
      const w = hourAngle(h * RAD, phi, de);
      if (isNaN(w)) return null;
      const Js = transitJ(approx(w, lw, n), M, L);
      return { set: Js, rise: Jn - (Js - Jn) };
    };
    const jd = j => new Date((j + 0.5 - J1970) * DAY);
    const s = at(-0.833), civ = at(-6);
    return {
      noon: jd(Jn),
      rise: s ? jd(s.rise) : null, set: s ? jd(s.set) : null,
      dawn: civ ? jd(civ.rise) : null, dusk: civ ? jd(civ.set) : null
    };
  }

  function moonAlt(date, lat, lng) {
    const lw = RAD * -lng, phi = RAD * lat, d = toDays(date), c = moonCoords(d);
    const H = sidereal(d, lw) - c.ra;
    let h = alt(H, phi, c.dec);
    h += RAD * 0.0002967 / Math.tan(h + 0.00312536 / (h + 0.08901179)); /* انكسار جوي */
    return h;
  }

  /* الطور: 0 محاق، .25 تربيع أول، .5 بدر، .75 تربيع أخير */
  function moonPhase(date) {
    const d = toDays(date), s = sunCoords(d), m = moonCoords(d), sd = 149598000;
    const phi = Math.acos(Math.sin(s.dec) * Math.sin(m.dec) + Math.cos(s.dec) * Math.cos(m.dec) * Math.cos(s.ra - m.ra));
    const inc = Math.atan2(sd * Math.sin(phi), m.dist - sd * Math.cos(phi));
    const ang = Math.atan2(Math.cos(s.dec) * Math.sin(s.ra - m.ra), Math.sin(s.dec) * Math.cos(m.dec) - Math.cos(s.dec) * Math.sin(m.dec) * Math.cos(s.ra - m.ra));
    return { fraction: (1 + Math.cos(inc)) / 2, phase: 0.5 + 0.5 * inc * (ang < 0 ? -1 : 1) / Math.PI };
  }

  /* أحداث القمر خلال 24 ساعة من بداية اليوم المحلي: شروق وغروب وعبور علوي وسفلي */
  function moonEvents(date, lat, lng, start) {
    const t0 = start != null ? start : new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const step = 6 * 60000, N = 24 * 10 + 1, h0 = 0.133 * RAD;
    const v = [];
    for (let i = 0; i < N + 12; i++) v.push(moonAlt(new Date(t0 + i * step), lat, lng));
    const ev = { rise: [], set: [], upper: [], lower: [] };
    const refine = (f, a, b) => { /* بحث ثلاثي لأقصى/أدنى قيمة */
      for (let k = 0; k < 24; k++) { const m1 = a + (b - a) / 3, m2 = b - (b - a) / 3; if (f(m1) < f(m2)) a = m1; else b = m2; }
      return (a + b) / 2;
    };
    for (let i = 1; i < N; i++) {
      const a = v[i - 1] - h0, b = v[i] - h0;
      if (a < 0 && b >= 0) ev.rise.push(new Date(t0 + (i - 1 + (0 - a) / (b - a)) * step));
      if (a >= 0 && b < 0) ev.set.push(new Date(t0 + (i - 1 + a / (a - b)) * step));
      if (v[i] > v[i - 1] && v[i] >= v[i + 1]) {
        const x = refine(t => moonAlt(new Date(t), lat, lng), t0 + (i - 1) * step, t0 + (i + 1) * step); ev.upper.push(new Date(x));
      }
      if (v[i] < v[i - 1] && v[i] <= v[i + 1]) {
        const x = refine(t => -moonAlt(new Date(t), lat, lng), t0 + (i - 1) * step, t0 + (i + 1) * step); ev.lower.push(new Date(x));
      }
    }
    return ev;
  }

  /* اسم الطور بالعربية */
  function phaseName(p) {
    const i = ((p * 8 + 0.5) | 0) % 8;
    return ['محاق (قمر جديد)', 'هلال متزايد', 'تربيع أول', 'أحدب متزايد', 'بدر', 'أحدب متناقص', 'تربيع أخير', 'هلال متناقص'][i];
  }

  /* أقرب بدر أو محاق قادم بحسب فرق خط الطول الكسوفي بين القمر والشمس (± ساعة تقريبًا) */
  const elong = date => {
    const d = toDays(date), l = moonCoords(d).lon, ls = eclLon(solarM(d));
    let x = (l - ls) % (2 * Math.PI); if (x < 0) x += 2 * Math.PI; return x;
  };
  function nextSyzygy(date) {
    let prev = elong(date);
    for (let m = 10; m <= 60 * 24 * 31; m += 10) {
      const d = new Date(date.getTime() + m * 60000), x = elong(d);
      if (prev < Math.PI && x >= Math.PI) return { kind: 'بدر', at: d };
      if (prev > Math.PI && x < prev - Math.PI) return { kind: 'محاق', at: d };
      prev = x;
    }
    return null;
  }
  return { sunTimes, moonEvents, moonPhase, phaseName, nextSyzygy, moonAlt };
})();
if (typeof module !== 'undefined') module.exports = Astro;

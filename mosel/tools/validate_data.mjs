#!/usr/bin/env node
/* فحص آلي لمكتبة الأمراض — شغّله بعد أي تعديل في data/conditions.js:
     node tools/validate_data.mjs
   بيطلع بكود 1 لو فيه أي خطأ (ينفع يتحط في CI). */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const file = fileURLToPath(new URL("../data/conditions.js", import.meta.url));
const ctx = { window: {} };
vm.runInNewContext(readFileSync(file, "utf8"), ctx);
const { TRIAGE, ZONES, DATA, REGIONS, RISK_FACTORS } = ctx.window.MOSEL_DATA;

const errors = [], warnings = [];
const ICD10 = /^[A-Z]\d{2}(\.\d{1,2})?$/;
const ids = new Set();
let total = 0;

for (const z of ZONES) {
  const d = DATA[z.key];
  if (!d) { errors.push(`zone ${z.key}: مفيش بيانات في DATA`); continue; }
  const symIds = new Set();
  for (const s of d.symptoms) {
    if (symIds.has(s.id)) errors.push(`${z.key}: عرض مكرر ${s.id}`);
    symIds.add(s.id);
    if (!s.label?.trim()) errors.push(`${z.key}/${s.id}: من غير label`);
  }
  const used = new Set();
  for (const c of d.conditions) {
    total++;
    const where = `${z.key}/${c.id || c.name}`;
    if (!c.id?.startsWith(z.key + ".")) errors.push(`${where}: id لازم يبدأ بـ "${z.key}."`);
    if (ids.has(c.id)) errors.push(`${where}: id مكرر`);
    ids.add(c.id);
    for (const f of ["name", "en", "def", "treatment"]) if (!c[f]?.trim()) errors.push(`${where}: الحقل ${f} فاضي`);
    if (!ICD10.test(c.icd10 || "")) errors.push(`${where}: كود ICD-10 مش صحيح (${c.icd10})`);
    if (!TRIAGE[c.triage]) errors.push(`${where}: triage مش معروف (${c.triage})`);
    if (c.flag && !["emergency", "urgent"].includes(c.triage)) warnings.push(`${where}: flag بس triage = ${c.triage}`);
    const w = Object.entries(c.weights || {});
    if (!w.length) errors.push(`${where}: من غير أوزان`);
    for (const [sid, val] of w) {
      if (!symIds.has(sid)) errors.push(`${where}: الوزن بيشاور على عرض مش موجود ${sid}`);
      if (![1, 2, 3].includes(val)) errors.push(`${where}: وزن ${sid}=${val} لازم 1 أو 2 أو 3`);
      used.add(sid);
    }
    if (!w.some(([, v]) => v === 3)) warnings.push(`${where}: مفيش عرض مميز (وزن 3)`);
  }
  for (const sid of symIds) if (!used.has(sid)) warnings.push(`${z.key}/${sid}: عرض مش مربوط بأي مرض`);

  // أمراض ليها نفس بصمة الأوزان بالظبط = مستحيل التفريق بينها
  const sig = new Map();
  for (const c of d.conditions) {
    const k = JSON.stringify(Object.entries(c.weights).sort());
    if (sig.has(k)) errors.push(`${z.key}: ${sig.get(k)} و${c.id} ليهم نفس الأوزان بالظبط`);
    sig.set(k, c.id);
  }
}
for (const r of REGIONS) for (const k of r.specialties) if (!DATA[k]) errors.push(`region ${r.key}: تخصص مش موجود ${k}`);
for (const k of Object.keys(RISK_FACTORS)) if (!ids.has(k)) errors.push(`RISK_FACTORS: ${k} مش موجود`);

console.log(`✔ ${ZONES.length} تخصص · ${total} مرض · ${Object.values(DATA).reduce((a, d) => a + d.symptoms.length, 0)} عرض`);
warnings.forEach(w => console.log("⚠ " + w));
errors.forEach(e => console.error("✘ " + e));
if (errors.length) { console.error(`\n${errors.length} خطأ`); process.exit(1); }
console.log("كل الفحوصات نجحت.");

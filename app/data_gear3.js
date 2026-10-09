/*! الصنّارة (دليل الصياد) — © 2026 Maro Shahaly. جميع الحقوق محفوظة. يُمنع النسخ أو إعادة النشر دون إذن كتابي. */
/* أشكال أنواع كل أداة (رسم + اسم + وصف + المقاس/الاستخدام)، طريقة صب الرصاص، وجدول ترشيح العدة لكل سمكة بالأوزان.
   الرسومات توضيحية بخط currentColor عشان تبان على أي خلفية؛ الذهبي = الطُّعم/المعدن اللامع. القيم إرشادية وبتختلف بالماركة. */
const SG_ = (p) => '<svg viewBox="0 0 120 80" role="img" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' + p + '</g></svg>';
const G_ = '#F5C542';
const GEAR_SHAPES = {
  hook: [
    ['J المعتادة', SG_('<circle cx="60" cy="10" r="5"/><path d="M60 15v38c0 14 22 14 22 0v-8"/><path d="M82 45l-6 5"/>'), 'الشكل الكلاسيكي لكل أنواع الطُّعم الطبيعي.', 'مقاسات 14 لحد 6/0'],
    ['الدائرية (سيركل)', SG_('<circle cx="60" cy="10" r="5"/><path d="M60 15v30c0 18 28 18 26 0c-1-8-10-10-14-4"/>'), 'السن بيلف جوه، فبتشبك في جنب البوق وماتتبلعش.', 'للطُّعم الحي والإطلاق، 1/0–8/0'],
    ['طويلة الساق', SG_('<circle cx="60" cy="6" r="4"/><path d="M60 10v50c0 10 18 10 18 0v-6"/><path d="M78 54l-5 4"/>'), 'ساق طويلة بتسهّل الفك وبتبعد الخيط عن الأسنان.', 'للدود والأسماك أبو أسنان والبطاطا'],
    ['المثلثة (ترَبل)', SG_('<circle cx="60" cy="8" r="4"/><path d="M60 12v40"/><path d="M60 52c-14 0-16 14-6 16"/><path d="M60 52c14 0 16 14 6 16"/><path d="M60 52v14"/>'), '3 سنون في سنارة واحدة.', 'في الرابلات والملاعق، مقاس 2–8'],
    ['أوفست / وورم', SG_('<circle cx="60" cy="8" r="4"/><path d="M60 12v8l-8 6v26c0 14 22 14 22 0v-6"/>'), 'ثنية قرب العين بتثبّت الكاوتش وتخبي السن.', 'للطُّعم البلاستيك الطري، 2–5/0'],
    ['جيج هيد', SG_('<circle cx="52" cy="30" r="12" fill="' + G_ + '" stroke="none"/><path d="M52 30h20v20c0 12 18 12 18 0"/><circle cx="48" cy="26" r="2" fill="currentColor"/>'), 'سنارة ليها راس رصاص.', 'مع الكاوتش، 1–40 جم']
  ],
  swivel: [
    ['البرميلية', SG_('<circle cx="20" cy="40" r="8"/><rect x="40" y="32" width="40" height="16" rx="8"/><circle cx="100" cy="40" r="8"/><path d="M28 40h12M80 40h12"/>'), 'الأبسط والأرخص.', 'مقاس 14 (صغير) لحد 1/0 (كبير)'],
    ['الكروية (بولّ بيرنج)', SG_('<circle cx="18" cy="40" r="8"/><circle cx="60" cy="40" r="14"/><circle cx="102" cy="40" r="8"/><path d="M26 40h20M74 40h20"/>'), 'جواها بلي فبتلف أنعم ومابتلفّش الخيط.', 'للجرّ والملاعق والسبنر'],
    ['بكلّابة (سناب)', SG_('<circle cx="18" cy="40" r="8"/><rect x="34" y="32" width="28" height="16" rx="8"/><path d="M26 40h8M62 40h10"/><path d="M72 40c0-14 34-14 34 0s-34 14-34 0"/><path d="M90 26v28"/>'), 'بتفتح وتقفل لتغيير الطُّعم بسرعة.', 'للرابلات والملاعق'],
    ['ثلاثية الأفرع', SG_('<circle cx="60" cy="40" r="10"/><circle cx="60" cy="12" r="6"/><circle cx="60" cy="68" r="6"/><circle cx="96" cy="40" r="6"/><path d="M60 18v12M60 50v12M70 40h20"/>'), 'بتطلع فرع جانبي من الخيط الرئيسي.', 'للترقيد والسبحة']
  ],
  sinker: [
    ['الهرمية', SG_('<path d="M60 14l-22 52h44z" fill="currentColor" fill-opacity=".25"/><circle cx="60" cy="8" r="5"/>'), 'أطرافها بتغرز في الرمل وماتتدحرجش.', 'شط رملي وتيار، 60–200 جم'],
    ['البيضاوي المنزلق', SG_('<ellipse cx="60" cy="40" rx="30" ry="18" fill="currentColor" fill-opacity=".25"/><path d="M10 40h100"/>'), 'الخيط بيعدّي جواه فالسمكة ماتحسّش بالتقل.', 'ترقيد على الصخر، 10–100 جم'],
    ['الكور الصغيرة (رش)', SG_('<path d="M10 40h100"/><circle cx="35" cy="40" r="7" fill="currentColor" fill-opacity=".35"/><circle cx="60" cy="40" r="5" fill="currentColor" fill-opacity=".35"/><circle cx="80" cy="40" r="4" fill="currentColor" fill-opacity=".35"/>'), 'بتتقفل على الخيط بالبنسة.', 'لضبط الفلّة، 0.1–3 جم'],
    ['أبو مخالب (جرابنل)', SG_('<path d="M60 10v40" /><path d="M48 50h24l-12-34z" fill="currentColor" fill-opacity=".25"/><path d="M48 50l-14 14M72 50l14 14M54 52l-6 18M66 52l6 18"/>'), 'سلوك بتمسك في القاع في الموج العالي.', 'سيرف وموج، 120–200 جم'],
    ['المسطحة', SG_('<rect x="30" y="28" width="60" height="24" rx="10" fill="currentColor" fill-opacity=".25"/><circle cx="60" cy="20" r="5"/>'), 'مسطحة فبتنام على القاع وماتتدحرجش.', 'صخر وتيار'],
    ['الزيتونة / الأنبوبة', SG_('<rect x="30" y="32" width="60" height="16" rx="8" fill="currentColor" fill-opacity=".25"/><path d="M10 40h100"/>'), 'بيعدّي فيها الخيط، رفيعة وبتقل التشبيك.', 'نيل وترع وترقيد خفيف']
  ],
  float: [
    ['القلم الرفيع', SG_('<path d="M60 4v72"/><path d="M60 14c6 6 6 34 0 46c-6-12-6-40 0-46z" fill="' + G_ + '"/><path d="M20 40h80" stroke-dasharray="4 5" opacity=".5"/>'), 'حساس جدًا لأي لمسة.', 'البوري والبلطي، حمولة 0.5–3 جم'],
    ['البيضاوي', SG_('<path d="M60 4v72"/><ellipse cx="60" cy="36" rx="14" ry="20" fill="' + G_ + '"/><path d="M20 40h80" stroke-dasharray="4 5" opacity=".5"/>'), 'ثابت في الموج والريح.', 'البحر، 5–20 جم'],
    ['المنزلق', SG_('<path d="M60 4v72"/><path d="M52 14h16"/><path d="M60 22c8 6 8 26 0 34c-8-8-8-28 0-34z" fill="' + G_ + '"/><path d="M60 62l-5 4h10z" fill="currentColor"/>'), 'بيتحرك على الخيط وعقدة صغيرة بتحدد العمق.', 'للأعماق الكبيرة'],
    ['المضيء (كيميائي)', SG_('<path d="M60 4v72"/><path d="M60 16c7 6 7 30 0 40c-7-10-7-34 0-40z" fill="' + G_ + '"/><path d="M60 4v14" stroke="#7CFFB2" stroke-width="5"/>'), 'عصاية ضوء فوق الفلّة.', 'الصيد بالليل']
  ],
  line: [
    ['نايلون (مونو)', SG_('<circle cx="40" cy="40" r="26"/><circle cx="40" cy="40" r="8"/><path d="M66 40c20 0 30 10 44 30" stroke-width="2"/>'), 'خيط واحد شفاف، بيمتد ويمتص الشد.', '0.18–0.60 مم'],
    ['فلوروكربون', SG_('<circle cx="40" cy="40" r="26" stroke-dasharray="2 4"/><circle cx="40" cy="40" r="8"/><path d="M66 40c20 0 30 10 44 30" stroke-width="2" stroke-dasharray="2 3"/>'), 'شبه مخفي في المياه، تقيل ومقاوم للاحتكاك.', 'كليدر 0.25–1.00 مم'],
    ['بريد (PE مضفّر)', SG_('<circle cx="40" cy="40" r="26" stroke="' + G_ + '"/><circle cx="40" cy="40" r="8"/><path d="M66 40c20 0 30 10 44 30" stroke="' + G_ + '" stroke-width="2"/><path d="M80 44l4 4M88 50l4 4M96 58l4 4" stroke-width="1.5"/>'), 'خيوط متضفرة، مابيمتدش ورفيع بالنسبة لقوته.', 'PE 0.6–8']
  ],
  leader: [
    ['فلوروكربون', SG_('<circle cx="14" cy="40" r="6"/><path d="M20 40h70" stroke-dasharray="3 3"/><path d="M90 40c0 14 18 14 18 0v-6"/>'), 'للأسماك الحذرة في المياه الصافية.', '0.30–1.00 مم'],
    ['واير (سلك)', SG_('<circle cx="14" cy="40" r="6"/><path d="M20 40h70" stroke="#C9D3DA" stroke-width="2"/><rect x="22" y="36" width="8" height="8" fill="currentColor"/><rect x="80" y="36" width="8" height="8" fill="currentColor"/><path d="M90 40c0 14 18 14 18 0v-6"/>'), 'للأسنان القاطعة: المياس والباراكودا والكنعد.', '15–90 رطل'],
    ['نايلون تقيل (شوك ليدر)', SG_('<circle cx="14" cy="40" r="6"/><path d="M20 40h70" stroke-width="5"/><path d="M90 40c0 14 18 14 18 0v-6"/>'), 'بيستحمل الاحتكاك بالصخر وصدمة القذف.', '0.50–0.80 مم']
  ],
  spoons: [
    ['ملعقة القذف', SG_('<path d="M24 40c10-22 62-22 72 0c-10 22-62 22-72 0z" fill="' + G_ + '" fill-opacity=".85"/><circle cx="16" cy="40" r="5"/><path d="M96 40c6 0 10 8 6 14M96 40c6 0 10-8 6-14"/>'), 'تقيلة وضيقة للقذف لمسافة بعيدة.', '10–80 جم'],
    ['ملعقة الجرّ', SG_('<path d="M20 40c14-30 70-24 80 0c-12 20-66 26-80 0z" fill="' + G_ + '" fill-opacity=".6"/><circle cx="12" cy="40" r="5"/><path d="M100 40c6 0 10 8 6 14"/>'), 'رفيعة وعريضة، بتترقص ببطء خلف القارب.', '5–30 جم'],
    ['السبنر', SG_('<path d="M10 40h60"/><ellipse cx="40" cy="26" rx="10" ry="16" fill="' + G_ + '" transform="rotate(-30 40 26)"/><rect x="62" y="34" width="22" height="12" rx="6" fill="currentColor" fill-opacity=".3"/><path d="M84 40c6 0 10 8 6 14M84 40c6 0 10-8 6-14"/>'), 'ريشة بتلف وتعمل لمعان واهتزاز.', 'أنهار وبحيرات، 3–20 جم']
  ],
  wobbler: [
    ['المينو الطافي', SG_('<path d="M16 40c20-20 70-18 86 0c-16 18-66 20-86 0z" fill="' + G_ + '" fill-opacity=".55"/><path d="M16 40l-10 8h14z" fill="currentColor"/><circle cx="92" cy="38" r="3" fill="currentColor"/><path d="M102 44l12 8"/><path d="M50 56c0 8 10 8 10 0M80 56c0 8 10 8 10 0"/>'), 'بيطفى ولما تلمّه بيغطس شوية بلسانه.', '7–14 سم، 5–25 جم'],
    ['الغاطس (سينكينج)', SG_('<path d="M16 40c20-20 70-18 86 0c-16 18-66 20-86 0z" fill="currentColor" fill-opacity=".35"/><circle cx="92" cy="38" r="3" fill="currentColor"/><path d="M50 56c0 8 10 8 10 0M80 56c0 8 10 8 10 0"/><path d="M60 66v10M56 72l4 4 4-4"/>'), 'بينزل لعمق أكبر قبل ما تبدأ تلم.', '10–40 جم'],
    ['البوبر', SG_('<path d="M20 40c14-18 64-18 84-6v12c-20 12-70 12-84-6z" fill="' + G_ + '" fill-opacity=".55"/><path d="M104 34c-6 6-6 6 0 12" /><path d="M20 40l-12 8h14z" fill="currentColor"/><path d="M56 54c0 8 10 8 10 0"/>'), 'بقه مقعّر بيعمل فقاعات وصوت على السطح.', 'سطحي، 10–80 جم'],
    ['الستيكبيت', SG_('<path d="M10 40c20-10 80-10 100 0c-20 10-80 10-100 0z" fill="currentColor" fill-opacity=".3"/><path d="M40 46c0 8 10 8 10 0M80 46c0 8 10 8 10 0"/>'), 'رفيع من غير لسان، بيمشي «زجزاج».', 'سطحي، 10–120 جم'],
    ['الكرانك بيت', SG_('<path d="M24 40c10-22 56-22 66 0c-10 22-56 22-66 0z" fill="' + G_ + '" fill-opacity=".55"/><path d="M90 46l18 16" stroke-width="5"/><path d="M50 58c0 8 10 8 10 0"/>'), 'جسم تخين ولسان كبير بيغطس بسرعة.', 'أنهار وبحيرات، 3–6 م عمق']
  ],
  rod: [
    ['السبينينج', SG_('<path d="M6 70L114 10"/><path d="M6 70l14-8" stroke-width="7"/><circle cx="40" cy="51" r="4"/><circle cx="62" cy="39" r="3"/><circle cx="82" cy="28" r="2.5"/><circle cx="100" cy="18" r="2"/><rect x="22" y="58" width="12" height="10" rx="3" fill="currentColor" fill-opacity=".3"/>'), 'الحلقات تحت، معاها مكنة دوّارة؛ الأكثر استخدامًا.', '1.8–3 م، رمي 5–60 جم'],
    ['السيرف (الشط)', SG_('<path d="M2 76L118 4"/><path d="M2 76l20-12" stroke-width="7"/><circle cx="44" cy="50" r="5"/><circle cx="74" cy="31" r="3"/><circle cx="100" cy="15" r="2"/>'), 'طويلة جدًا للرمي البعيد من الشط.', '3.9–4.5 م، رمي 100–250 جم'],
    ['التلسكوبي', SG_('<path d="M6 70L114 10"/><path d="M30 57v-6M54 44v-6M78 31v-6M100 19v-6"/><path d="M6 70l12-7" stroke-width="7"/>'), 'بتتقفل جوه بعضها، سهلة الشيل والسفر.', '2.4–6 م للعوامة والترع'],
    ['القارب / الجيجينج', SG_('<path d="M20 70L100 22" stroke-width="5"/><path d="M20 70l16-10" stroke-width="9"/><circle cx="62" cy="45" r="4"/><circle cx="86" cy="31" r="3"/>'), 'قصيرة وقوية جدًا للأعماق والأسماك التقيلة.', '1.6–2.1 م، PE 2–8'],
    ['البيت كاستر', SG_('<path d="M6 70L114 10"/><path d="M6 70l14-8" stroke-width="7"/><path d="M40 51l-3-6M62 39l-3-6M82 28l-3-6M100 18l-2-5"/><rect x="22" y="52" width="12" height="8" rx="3" fill="currentColor" fill-opacity=".3"/>'), 'الحلقات فوق، ليها زناد تحت المسكة.', 'للطعوم التقيلة والتحكم الدقيق'],
    ['الفلاي (الذبابة)', SG_('<path d="M6 70L114 10" stroke-width="2"/><path d="M6 70l10-6" stroke-width="6"/><path d="M114 10c-10 20-40 30-60 26" stroke="' + G_ + '" stroke-width="2"/>'), 'خفيفة جدًا وبيترمي بيها الخيط نفسه مش الطُّعم.', 'تراوت وأنهار، وزن خيط 3–10']
  ],
  reel: [
    ['الدوّارة (سبينينج)', SG_('<path d="M60 8v20M44 8h32"/><rect x="40" y="28" width="40" height="18" rx="5"/><rect x="36" y="46" width="48" height="22" rx="7" fill="currentColor" fill-opacity=".2"/><path d="M84 54h14l6 10"/><circle cx="104" cy="66" r="4"/>'), 'البكرة ثابتة والخيط بيتلف حواليها؛ الأسهل.', 'مقاس 1000–14000'],
    ['البيت كاستر', SG_('<path d="M10 30h100"/><rect x="34" y="34" width="52" height="26" rx="12" fill="currentColor" fill-opacity=".2"/><path d="M86 46h14"/><circle cx="104" cy="46" r="5"/><path d="M40 60l-6 10M80 60l6 10"/>'), 'البكرة بتلف مع الرمية؛ تحكم أعلى ودقة.', 'للطعوم التقيلة والمحترفين'],
    ['الكونفنشنال (التقليدية)', SG_('<path d="M10 26h100"/><circle cx="60" cy="48" r="20" fill="currentColor" fill-opacity=".2"/><circle cx="60" cy="48" r="6"/><path d="M80 48h16"/><circle cx="100" cy="48" r="5"/>'), 'بكرة كبيرة قوية للقارب والأسماك التقيلة.', 'للتونة والهامور والأعماق']
  ],
  sabiki: [
    ['سبيكي جلد سمك', SG_('<path d="M60 4v70"/><path d="M60 18h14M60 34h14M60 50h14"/><path d="M74 18c0 6 6 6 6 0M74 34c0 6 6 6 6 0M74 50c0 6 6 6 6 0"/><path d="M76 12l8 2M76 28l8 2M76 44l8 2" stroke="#F9C8D0" stroke-width="5"/>'), 'سنانير صغيرة عليها جلد سمك لامع.', 'للماكريل والسردين والطُّعم'],
    ['سبحة ريش', SG_('<path d="M60 4v70"/><path d="M60 22h14M60 44h14"/><path d="M74 22c0 6 6 6 6 0M74 44c0 6 6 6 6 0"/><path d="M76 14l12 4M76 36l12 4" stroke="' + G_ + '" stroke-width="6"/>'), 'سنانير أكبر عليها ريش ملوّن.', 'للماكريل الكبير والبلاميطا'],
    ['سبحة طُعم طبيعي', SG_('<path d="M60 4v70"/><path d="M60 20h18M60 42h18"/><path d="M78 20c0 8 8 8 8 0M78 42c0 8 8 8 8 0"/><path d="M80 24c4 4 10 4 12 0" stroke="#F49" stroke-width="4"/><path d="M80 46c4 4 10 4 12 0" stroke="#F49" stroke-width="4"/><path d="M54 70h12l-6 8z" fill="currentColor"/>'), 'أفرع بسنانير عادية تتطعّم جمبري أو دود.', 'للترقيد: دنيس، شراغيش، مليطة']
  ]
};
/* السبحة بشكل أقرب للحقيقة: خيط رئيسي، مدوّرة، 6 أفرع بسنانير عليها جلد سمك، ورصاصة تحت، والمياه حواليها */
const SABIKI_REAL = '<svg viewBox="0 0 320 420" role="img" aria-label="سبحة سبيكي"><defs><linearGradient id="sbw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2F7FB0"/><stop offset="1" stop-color="#0A2342"/></linearGradient><linearGradient id="sbs" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#F9C8D0"/><stop offset="1" stop-color="#E8F7FF"/></linearGradient></defs>' +
  '<rect width="320" height="420" rx="18" fill="url(#sbw)"/><path d="M0 34c40-10 80 10 120 0s80-10 120 0 60 10 80 0" stroke="#9FE3F2" stroke-width="2" fill="none" opacity=".6"/>' +
  '<path d="M160 0v36" stroke="#E6F1F4" stroke-width="2"/><circle cx="160" cy="42" r="6" fill="none" stroke="#C9D3DA" stroke-width="3"/><rect x="154" y="48" width="12" height="16" rx="5" fill="#C9D3DA"/><circle cx="160" cy="70" r="6" fill="none" stroke="#C9D3DA" stroke-width="3"/>' +
  '<path d="M160 76v290" stroke="#E6F1F4" stroke-width="1.6"/>' +
  [0, 1, 2, 3, 4, 5].map(i => { const y = 100 + i * 44, s = i % 2 ? -1 : 1, x2 = 160 + s * 56; return '<circle cx="160" cy="' + y + '" r="3" fill="#F5C542"/><path d="M160 ' + y + 'L' + x2 + ' ' + (y + 10) + '" stroke="#E6F1F4" stroke-width="1.2"/>' +
    '<path d="M' + x2 + ' ' + (y + 10) + 'c' + (s * 8) + ' 2 ' + (s * 10) + ' 12 ' + (s * 2) + ' 16c' + (-s * 6) + ' 3 ' + (-s * 10) + ' -2 ' + (-s * 8) + ' -8" stroke="#D9E2E8" stroke-width="2" fill="none"/>' +
    '<path d="M' + (x2 - s * 2) + ' ' + (y + 4) + 'q' + (s * 14) + ' -4 ' + (s * 24) + ' 6q' + (-s * 10) + ' 6 ' + (-s * 24) + ' 4z" fill="url(#sbs)" opacity=".95"/><circle cx="' + (x2 - s * 4) + '" cy="' + (y + 8) + '" r="2.4" fill="#F5C542"/>'; }).join('') +
  '<path d="M146 366h28l-14 34z" fill="#8A97A3" stroke="#C9D3DA" stroke-width="2"/><circle cx="160" cy="364" r="5" fill="none" stroke="#C9D3DA" stroke-width="2.5"/>' +
  '<g fill="#E6F1F4" font-size="13" font-family="IBM Plex Sans Arabic, Tahoma" direction="ltr" text-anchor="end"><text x="146" y="60">مدوّرة</text><text x="312" y="156">فرع قصير 4–6 سم</text><text x="312" y="246">سنارة بجلد سمك</text><text x="312" y="334">6–10 سنانير</text><text x="140" y="394">رصاصة 20–80 جم</text></g>' +
  '<path d="M60 404c10-6 20 0 30-4" stroke="#9FE3F2" opacity=".5" fill="none"/><path d="M250 120c6-4 12-2 16 2c-6 3-10 4-16-2z" fill="#9FE3F2" opacity=".55"/><path d="M40 230c6-4 12-2 16 2c-6 3-10 4-16-2z" fill="#9FE3F2" opacity=".55"/></svg>';
/* صب الرصاص في البيت (للتثقيلات) */
const SINKER_CAST = {
  warn: 'الرصاص سام: بخاره وبودرته بيضروا المخ والكلى خصوصًا للأطفال والحوامل. اشتغل في مكان مفتوح، والبس جوانتي وكمامة ونضارة، وماتاكلش أو تشرب وانت شغال، واغسل إيدك كويس بعدها. البديل الأأمن: تثقيلات حديد أو قصدير جاهزة.',
  steps: [
    ['جهّز القالب', 'قالب ألومنيوم جاهز للأشكال (هرمي، بيضاوي، كور)، أو قالب جبس/رمل مبلول مدكوك تعمل فيه الشكل بقطعة خشب.'],
    ['حط العين', 'سلك ستانلس أو نحاس مثني على شكل عين، متثبّت في نص القالب (للهرمي والمسطح). للبيضاوي المنزلق حط مسمار مدهون زيت يعمل خرم بعرض القالب.'],
    ['دفّي القالب', 'سخّن القالب شوية قبل الصب: القالب البارد أو المبلول بيخلّي الرصاص يطرطش أو يطلع بفقاعات.'],
    ['دوّب الرصاص', 'في كوز حديد على نار برّه البيت (حوالي 330°م). اشيل الشوائب اللي بتطفى على الوش بمعلقة حديد. ممنوع أي مياه أو رطوبة تقرب من الرصاص السايح: بتعمل انفجار.'],
    ['اصب على مرة واحدة', 'صب بسرعة وثبات لحد ما يتملي القالب، وسيبه يبرد 2–3 دقايق.'],
    ['فك ونضّف', 'افتح القالب، قص الزوايد بزرادية أو مبرد، ولو عاوز لوّن الرصاصة بدهان مقاوم للمياه.'],
    ['زن ورقّم', 'وزن كل رصاصة واكتب الوزن عليها أو رتبهم في علب بالأوزان: 20، 40، 60، 80، 100، 120، 150 جم.']
  ]
};
/* ترشيح العدة لكل سمكة: [معرّف، الوزن الشائع، الخيط الرئيسي، الليدر، السنارة، مقاس المكنة، الرصاص/الطُّعم الصناعي] */
const FISH_TACKLE = [
  ['mullet', '0.2–2 كجم', 'نايلون 0.18–0.25 مم', 'نايلون 0.16–0.20', '10–14', '2000–3000', 'فلّة قلم 1–3 جم'],
  ['tilapia', '0.2–1.5 كجم', 'نايلون 0.20–0.25 مم', '—', '8–12', '1000–2500', 'فلّة 1–3 جم'],
  ['seabass', '0.5–8 كجم', 'PE 1–1.5 / نايلون 0.30', 'فلورو 0.35–0.45', '1/0–3/0', '3000–5000', 'رابلة 9–14 سم'],
  ['gilthead', '0.3–3 كجم', 'نايلون 0.28–0.35 مم', 'فلورو 0.30–0.40', '2–1/0', '4000–5000', 'رصاص 60–120 جم'],
  ['sargo', '0.2–1.5 كجم', 'نايلون 0.25–0.30 مم', 'فلورو 0.25–0.30', '4–1', '3000–4000', 'رصاص 40–80 جم'],
  ['bluefish', '1–8 كجم', 'PE 1.5–2 / نايلون 0.35', 'واير 20–40 رطل', '1/0–4/0', '4000–6000', 'ملعقة 30–60 جم أو بوبر'],
  ['grouper_dusky', '2–25 كجم', 'PE 3–6', 'نايلون 0.80–1.00', '4/0–8/0', '8000–14000 / تقليدية', 'رصاص 100–300 جم'],
  ['amberjack', '3–40 كجم', 'PE 3–6', 'فلورو 0.70–1.20', '5/0–8/0', '10000–18000', 'جيج 100–250 جم'],
  ['bonito', '1–5 كجم', 'PE 1.5–2', 'فلورو 0.40–0.50', '1/0–2/0', '4000–6000', 'ملعقة 20–40 جم'],
  ['littletunny', '2–8 كجم', 'PE 2–3', 'فلورو 0.50–0.60', '2/0–4/0', '5000–8000', 'ملعقة / جيج 30–60 جم'],
  ['barracuda', '1–15 كجم', 'PE 2–3', 'واير 40–60 رطل', '2/0–5/0', '5000–8000', 'رابلة / جرّ'],
  ['spanishmackerel', '2–20 كجم', 'PE 2–4', 'واير 40–90 رطل', '3/0–6/0', '6000–10000', 'جرّ أو طُعم حي'],
  ['emperor', '0.5–5 كجم', 'PE 1.5–3', 'فلورو 0.45–0.60', '1/0–4/0', '4000–6000', 'رصاص 60–150 جم'],
  ['grouper', '1–30 كجم', 'PE 3–6', 'نايلون 0.80–1.20', '4/0–8/0', '8000–14000', 'رصاص 150–400 جم'],
  ['snapper', '0.5–10 كجم', 'PE 2–4', 'فلورو 0.50–0.80', '2/0–6/0', '5000–10000', 'جيج 60–200 جم'],
  ['squid', '0.2–2 كجم', 'PE 0.6–1', 'فلورو 0.20–0.25', 'إيجي 2.5–3.5', '2500–3000', 'إيجي'],
  ['sardine', '20–80 جم', 'نايلون 0.20 مم', '—', 'سبيكي 4–8', '2000–3000', 'سبيكي + رصاص 10–20 جم'],
  ['clarias', '0.5–10 كجم', 'نايلون 0.35–0.45 مم', 'نايلون 0.40', '1/0–4/0', '4000–6000', 'رصاص 30–80 جم'],
  ['nileperch', '2–100 كجم', 'PE 4–8', 'نايلون 1.00+', '5/0–8/0', '10000+ / تقليدية', 'رابلة كبيرة / جرّ'],
  ['carp', '1–15 كجم', 'نايلون 0.30–0.40 مم', 'نايلون 0.30', '6–2', '4000–6000', 'رصاص 40–100 جم'],
  ['redmullet', '50–300 جم', 'نايلون 0.20–0.25 مم', 'نايلون 0.18', '8–12', '2000–3000', 'رصاص 20–60 جم'],
  ['yellowfin', '20–200 كجم', 'PE 6–10', 'فلورو 1.20–2.00', '7/0–10/0', '18000+ / تقليدية 50–80', 'بوبر / جرّ / طُعم حي']
];
/* أوزان الأسماك لجداول المكن والخيط */
Object.assign(GEAR_INFO, {
  reel: Object.assign({}, GEAR_INFO.reel, { sizes: { h: ['المقاس', 'الخيط المناسب', 'وزن السمك', 'الاستخدام'], r: [
    ['1000–2500', 'نايلون 0.18–0.25 / PE 0.6–1', 'حتى 1–2 كجم', 'بوري، بلطي، LRF'], ['3000–4000', 'نايلون 0.25–0.30 / PE 1–1.5', '1–5 كجم', 'دنيس، شراغيش، قاروص صغير'],
    ['5000–6000', 'نايلون 0.30–0.40 / PE 1.5–2', '3–10 كجم', 'قاروص، مياس، بلاميطا'], ['8000–14000', 'PE 2–4', '8–25 كجم', 'سيرف، جيج، هامور متوسط'], ['18000 فأكبر', 'PE 4–8', '20–60 كجم وأكتر', 'تونة، أمبرجاك، بوبر تقيل']] } }),
  line: Object.assign({}, GEAR_INFO.line, { sizes: { h: ['نايلون: القطر', 'قوة', 'بريد: المقاس', 'قوة', 'وزن السمك المناسب'], r: [
    ['0.18 مم', '3 كجم', 'PE 0.8', '7 كجم', 'حتى 1 كجم'], ['0.25 مم', '6 كجم', 'PE 1', '9 كجم', '0.5–3 كجم'], ['0.30 مم', '8 كجم', 'PE 1.5', '12 كجم', '1–5 كجم'],
    ['0.35 مم', '10 كجم', 'PE 2', '15 كجم', '3–8 كجم'], ['0.40 مم', '12 كجم', 'PE 3', '20 كجم', '5–12 كجم'], ['0.50 مم', '18 كجم', 'PE 4', '25 كجم', '8–20 كجم'],
    ['0.60 مم', '25 كجم', 'PE 6', '35 كجم', '15–35 كجم'], ['0.80 مم', '40 كجم', 'PE 8', '45 كجم', '25 كجم فأكتر']] } })
});
/* رسومات واقعية أكتر (تدرّج معدني وخشب) للأدوات اللي مفيش لها صور حرة واضحة */
const SR_ = (p) => '<svg viewBox="0 0 120 80" role="img" aria-hidden="true"><defs><linearGradient id="mtl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F4F7F9"/><stop offset=".5" stop-color="#9AA7B1"/><stop offset="1" stop-color="#5D6B75"/></linearGradient><linearGradient id="wd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D9A86C"/><stop offset="1" stop-color="#8A5A2B"/></linearGradient><linearGradient id="cf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5B6770"/><stop offset="1" stop-color="#1C2329"/></linearGradient></defs>' + p + '</svg>';
Object.assign(GEAR_SHAPES, {
  gaff: [
    ['جاف يد قصير', SR_('<rect x="6" y="36" width="58" height="10" rx="5" fill="url(#cf)"/><rect x="10" y="36" width="26" height="10" rx="5" fill="#E8B04A" opacity=".9"/><path d="M62 41h26c18 0 22-30 4-30c-8 0-10 8-6 12" fill="none" stroke="#C3CDD5" stroke-width="5" stroke-linecap="round"/><path d="M86 23l-3-6" stroke="#F4F7F9" stroke-width="3" stroke-linecap="round"/>'), 'مسكة مطاط وخطاف ستانلس، للرفع من على الصخر أو قارب واطي.', '50–90 سم، خطاف 5–8 سم'],
    ['جاف طويل (للقارب)', SR_('<rect x="2" y="38" width="86" height="7" rx="3.5" fill="url(#cf)"/><path d="M86 41h10c14 0 18-24 2-24c-6 0-8 6-5 9" fill="none" stroke="#C3CDD5" stroke-width="4.5" stroke-linecap="round"/><rect x="4" y="37" width="18" height="9" rx="4" fill="#E8B04A"/>'), 'عصاية ألومنيوم أو فايبر للأسماك الكبيرة جنب القارب العالي.', '1.5–2.5 م، خطاف 8–12 سم'],
    ['الجاف الطاير (Flying gaff)', SR_('<rect x="2" y="40" width="64" height="7" rx="3.5" fill="url(#cf)"/><path d="M66 43h8" stroke="#9AA7B1" stroke-width="4"/><path d="M76 43c18 0 24-28 6-28c-8 0-10 7-6 10" fill="none" stroke="#C3CDD5" stroke-width="6" stroke-linecap="round"/><path d="M76 43c-6 10-2 26 14 30" fill="none" stroke="#F5C542" stroke-width="2" stroke-dasharray="3 2"/>'), 'الخطاف بيفك من العصاية ومربوط بحبل في القارب.', 'للتونة والأسماك الضخمة'],
    ['جاف مسنن (Lip gaff / جريبر)', SR_('<rect x="10" y="44" width="40" height="12" rx="6" fill="url(#cf)"/><path d="M50 50h14l18-14M64 50l18 14" stroke="#C3CDD5" stroke-width="5" stroke-linecap="round" fill="none"/><circle cx="82" cy="36" r="4" fill="#9AA7B1"/><circle cx="82" cy="64" r="4" fill="#9AA7B1"/>'), 'كلّابة بتمسك الشفة من غير ما تجرح السمكة.', 'للصيد والإطلاق']
  ],
  polespear: [
    ['الحربة (Pole spear)', SR_('<rect x="18" y="38" width="80" height="5" rx="2.5" fill="url(#cf)"/><path d="M98 40.5h10" stroke="#C3CDD5" stroke-width="3"/><path d="M106 34l10 6.5-10 6.5" fill="url(#mtl)"/><path d="M104 36l6 4.5M104 45l6-4.5" stroke="#5D6B75" stroke-width="1.5"/><path d="M18 40.5c-10 0-14 8-8 12s14-4 8-12" fill="none" stroke="#F5C542" stroke-width="4"/>'), 'عصاية كربون أو ألومنيوم، في آخرها أستك بتشده بإيدك وتسيبه.', '1.5–3 م، سن 3 شوك أو سهم'],
    ['النبلة الهاوايّ (Hawaiian sling)', SR_('<rect x="30" y="34" width="34" height="13" rx="6" fill="url(#wd)"/><path d="M30 40.5c-12-14-24-6-24 0s12 14 24 0" fill="none" stroke="#F5C542" stroke-width="4"/><path d="M6 40.5h108" stroke="#C3CDD5" stroke-width="2.5"/><path d="M108 36l8 4.5-8 4.5" fill="url(#mtl)"/>'), 'أنبوبة بأستك؛ السهم بيعدّي جواها وبيتشد زي القوس.', 'مدى 2–4 م، للأسماك القريبة'],
    ['سن 3 شوك (Paralyzer)', SR_('<path d="M10 40h64" stroke="#46525B" stroke-width="7" stroke-linecap="round"/><path d="M74 40h36M74 34l36-8M74 46l36 8" stroke="#C3CDD5" stroke-width="3" stroke-linecap="round"/><path d="M108 22l6 4-7 2M108 58l6-4-7-2" fill="#9AA7B1"/>'), 'شوك متفرقة بتمسك السمكة الصغيرة بدل ما تخترقها.', 'للأسماك الصغيرة والمتوسطة'],
    ['سن سهم بلسان (Flopper)', SR_('<path d="M10 40h80" stroke="#46525B" stroke-width="7" stroke-linecap="round"/><path d="M90 40h18" stroke="#C3CDD5" stroke-width="4"/><path d="M106 33l12 7-12 7z" fill="url(#mtl)"/><path d="M98 40l-8-10" stroke="#9AA7B1" stroke-width="3" stroke-linecap="round"/>'), 'لسان بيتفتح جوه السمكة فماتفلتش.', 'للأسماك الأكبر']
  ],
  speargun: [
    ['بندقية أستك (Band gun)', SR_('<rect x="30" y="36" width="78" height="8" rx="4" fill="url(#wd)"/><path d="M14 36h20l-2 22h-10z" fill="url(#cf)"/><path d="M8 40h108" stroke="#C3CDD5" stroke-width="2"/><path d="M104 32c-20 0-50 8-56 8M104 48c-20 0-50-8-56-8" stroke="#F5C542" stroke-width="3" fill="none"/>'), 'خشب أو ألومنيوم بأستك؛ هادية ودقيقة.', '50–130 سم حسب صفاء المياه'],
    ['بندقية هوا (Pneumatic)', SR_('<rect x="30" y="34" width="70" height="12" rx="6" fill="url(#cf)"/><path d="M14 36h20l-2 22h-10z" fill="url(#cf)"/><path d="M8 40h108" stroke="#C3CDD5" stroke-width="2"/>'), 'هوا مضغوط جوه الأنبوبة؛ قوية وقصيرة.', 'للكهوف والمياه العكرة']
  ],
  bowfish: [
    ['قوس صيد السمك ببكرة', SR_('<path d="M60 6c26 10 26 58 0 68" fill="none" stroke="#46525B" stroke-width="6" stroke-linecap="round"/><path d="M60 6v68" stroke="#E6F1F4" stroke-width="1.2"/><rect x="34" y="34" width="14" height="14" rx="4" fill="#E8B04A"/><path d="M10 40h104" stroke="#C3CDD5" stroke-width="2.5"/><path d="M108 35l8 5-8 5" fill="url(#mtl)"/><path d="M48 41c8 10 30 12 50 0" stroke="#F5C542" stroke-width="1.2" fill="none" stroke-dasharray="3 2"/>'), 'قوس عادي عليه بكرة خيط، والسهم مربوط بالخيط.', 'شد 20–50 رطل'],
    ['سهم صيد السمك', SR_('<path d="M6 40h96" stroke="#46525B" stroke-width="4"/><path d="M100 33l14 7-14 7z" fill="url(#mtl)"/><path d="M98 40l-8-8M98 40l-8 8" stroke="#9AA7B1" stroke-width="2.5"/><circle cx="8" cy="40" r="3" fill="#F5C542"/>'), 'سهم تقيل من غير ريش، وسنّه بشوكة بتمسك.', 'فايبر جلاس، 80–90 سم']
  ],
  lifering: [
    ['طوق النجاة الدائري', SR_('<circle cx="60" cy="40" r="30" fill="none" stroke="#E53935" stroke-width="16"/><path d="M60 10a30 30 0 0 1 30 30M60 70a30 30 0 0 1-30-30" fill="none" stroke="#fff" stroke-width="16" stroke-dasharray="20 74"/><circle cx="60" cy="40" r="38" fill="none" stroke="#E6F1F4" stroke-width="1.5" stroke-dasharray="4 4"/>'), 'بيترمي للغريق ومعاه حبل 25–30 م.', 'قطر 60–75 سم، طفو 2.5 كجم+'],
    ['سترة النجاة', SR_('<path d="M40 10h12l8 14 8-14h12l8 20v40H32V30z" fill="#FF7A1A"/><path d="M60 24v46" stroke="#B34700" stroke-width="2"/><path d="M34 46h52" stroke="#1C2329" stroke-width="4"/><rect x="56" y="43" width="8" height="6" fill="#9AA7B1"/>'), 'لازم تكون مقاسك وتتقفل كويس.', 'طفو 100N للساحل، 150N للبحر المفتوح']
  ]
});
/* صور حقيقية لكل نوع (بنفس ترتيب GEAR_SHAPES)؛ لو مفيش صورة بيظهر الرسم */
const TYPE_PH = {
  hook: ['gt_hook_j', 'gt_hook_circle', 'gt_hook_long', 'gt_hook_treble', 'gt_hook_worm', 'gt_hook_jig'],
  swivel: ['gt_sw_barrel', 'gt_sw_ball', 'gt_sw_snap', 'gt_sw_3way'],
  sinker: ['gt_sk_pyramid', 'gt_sk_egg', 'gt_sk_split', 'gt_sk_grapnel', 'gt_sk_flat', 'gt_sk_tube'],
  float: ['gt_float_pencil', 'gt_float_oval', 'gt_float_slide', 'gt_float_light'],
  line: ['gt_line_mono', 'gt_line_fluoro', 'gt_line_braid'],
  leader: ['gt_ld_fluoro', 'gt_ld_wire', 'gt_ld_mono'],
  spoons: ['gt_spoon_cast', 'gt_spoon_troll', 'gt_spoon_spinner'],
  wobbler: ['gt_wob_minnow', 'gt_wob_sink', 'gt_wob_popper', 'gt_wob_stick', 'gt_wob_crank'],
  rod: ['gt_rod_spin', 'gt_rod_surf', 'gt_rod_tele', 'gt_rod_boat', 'gt_rod_bc', 'gt_rod_fly'],
  reel: ['gt_reel_spin', 'gt_reel_bc', 'gt_reel_conv'],
  sabiki: ['gt_sab_skin', 'gt_sab_feather', 'gt_sab_bait'],
  gaff: ['gt_gaff_hand', 'gt_gaff_long', 'gt_gaff_fly', 'gt_gaff_lip']
};
/* صور إضافية لكل أداة: [مفتاح الصورة، التعليق] */
const GEAR_MORE_PH = {
  float: [['gt_float_all', 'تشكيلة فلّات بأشكال ومقاسات مختلفة'], ['gt_float_sea', 'فلّات تقيلة للسمك المفترس والتيار']],
  hook: [['gt_hook_sizes', 'فرق المقاسات: سنارة 11/0 جنب 6/0 وعملة للمقارنة']],
  sinker: [['gt_sk_all', 'تشكيلة رصاص بأحجام وأشكال مختلفة']],
  spoons: [['gt_pilker', 'جيج معدني (بيلكر) للأعماق والقارب'], ['gt_spoon_trout', 'ملاعق صغيرة للمياه العذبة والبحيرات'], ['gt_lure_spinner2', 'سبنر بريش'], ['gt_egi', 'إيجي: طُعم الكاليماري والسبيط الصناعي']],
  jighead: [['gt_hook_jig', 'رؤوس جيج بأوزان وأشكال مختلفة'], ['gt_soft', 'طعوم سيليكون (كاوتش) بتتركب على رأس الجيج']],
  rod: [['gt_rod_tele2', 'قصبة تلسكوبية بالفلّة على الشط']],
  line: [['gt_ld_mono', 'أطراف نايلون جاهزة بالسنارة']]
};

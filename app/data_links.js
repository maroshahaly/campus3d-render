/*! الصنّارة (دليل الصياد) — © 2026 Maro Shahaly. جميع الحقوق محفوظة. يُمنع النسخ أو إعادة النشر دون إذن كتابي. */
/* مكتبة المراجع المجانية — v: 2 = فتحت الصفحة وتأكدت من محتواها، 1 = ظهرت في نتائج البحث ولم أستطع فتحها آليًا، 0 = من المعرفة العامة ولم أتحقق منها */
const LINK_CATS = [
  ['plan', 'الطقس والأمواج'],
  ['tide', 'المد والجزر'],
  ['sea', 'حرارة الماء والأقمار الصناعية'],
  ['map', 'الخرائط والأعماق'],
  ['id', 'تعريف الأسماك'],
  ['skill', 'التقنيات والأخلاقيات'],
  ['law', 'القوانين والتراخيص'],
  ['safe', 'السلامة والإسعاف'],
  ['pro', 'للمحترفين والدراسة']
];
const LINKS = [
  /* ---------- الطقس والأمواج ---------- */
  { c: 'plan', t: 'Windy', u: 'https://www.windy.com/', d: 'خرائط رياح وأمواج وحرارة سطح البحر وتيارات، تعمل من المتصفح مجانًا. أفضل نقطة بداية لتقرير الخروج أو عدمه.', cost: 'free', lang: 'en', v: 1 },
  { c: 'plan', t: 'Windguru', u: 'https://www.windguru.cz/', d: 'توقعات رياح وأمواج مفصلة لآلاف المواقع. الأساسي مجاني وفيه مزايا مدفوعة.', cost: 'freemium', lang: 'en', v: 1 },
  { c: 'plan', t: 'Windfinder', u: 'https://www.windfinder.com/', d: 'خريطة وتقارير رياح وتوقعات للسواحل والمرافئ حول العالم.', cost: 'freemium', lang: 'en', v: 1 },
  { c: 'plan', t: 'Open-Meteo — واجهة البحر البرمجية', u: 'https://open-meteo.com/en/docs/marine-weather-api', d: 'واجهة مجانية لغير الأغراض التجارية تعطي ارتفاع الموج والمد (مستوى سطح البحر) والتيار وحرارة سطح البحر لثمانية أيام بدقة نحو 8 كم. تُستخدم في تبويب «مد وبحر» بالنسخة المحمّلة. دقتها قرب السواحل محدودة.', cost: 'free', lang: 'en', v: 2 },
  { c: 'plan', t: 'الهيئة العامة للأرصاد الجوية المصرية', u: 'https://ema.gov.eg/', d: 'الجهة الرسمية للنشرات والتحذيرات الجوية والبحرية في مصر. تابع تحذيرات ارتفاع الأمواج قبل أي خروج.', cost: 'free', lang: 'ar', v: 0, eg: 1 },

  /* ---------- المد والجزر ---------- */
  { c: 'tide', t: 'Tides4Fishing', u: 'https://tides4fishing.com/', d: 'جداول مد وجزر مع شروق وغروب الشمس والقمر وطور القمر ونشاط الأسماك (سولونار) لمواقع في القارات الست، بدون حساب.', cost: 'free', lang: 'en', v: 2 },
  { c: 'tide', t: 'Tide-Forecast', u: 'https://www.tide-forecast.com/', d: 'مواعيد المد والجزر لنحو 10 آلاف موقع في 194 دولة حسب الصفحة، مع اقتراح أقرب محطة لموقعك.', cost: 'free', lang: 'en', v: 2 },
  { c: 'tide', t: 'TideCheck', u: 'https://tidecheck.com/', d: 'تنبؤات مد وجزر لمحطات حول العالم (محطات توافقية مرجعية مثل الإسكندرية من نموذج TICON-4) مع منحنى لأيام قادمة وخريطة للمحطة ومستويات مرجعية LAT وMLLW وMSL. مجاني.', cost: 'free', lang: 'en', v: 2 },
  { c: 'tide', t: 'FreeTides', u: 'https://freetides.com/', d: 'مواعيد وجداول المد والجزر حول العالم.', cost: 'free', lang: 'en', v: 1 },
  { c: 'tide', t: 'NOAA Tides & Currents', u: 'https://tidesandcurrents.noaa.gov/', d: 'المرجع الرسمي الأمريكي للمد والتيارات. تغطيته الأساسية محطات الولايات المتحدة.', cost: 'free', lang: 'en', v: 1 },
  { c: 'tide', t: 'XTide', u: 'https://flaterco.com/xtide/', d: 'برنامج مفتوح المصدر للتنبؤ بالمد والجزر يمكن تشغيله بدون إنترنت.', cost: 'oss', lang: 'en', v: 0 },

  /* ---------- حرارة الماء والأقمار الصناعية ---------- */
  { c: 'sea', t: 'NOAA CoastWatch — بوابة البيانات', u: 'https://coastwatch.noaa.gov/cw_html/cwViewer.html', d: 'صور أقمار صناعية لحرارة سطح البحر والكلوروفيل (مؤشر على تجمع الغذاء والأسماك) وارتفاع الموج والرياح. عالمية ومجانية بدون تسجيل حسب الصفحة.', cost: 'free', lang: 'en', v: 2 },
  { c: 'sea', t: 'Copernicus Marine — عارض MyOcean', u: 'https://data.marine.copernicus.eu/viewer', d: 'عارض بيانات المحيطات لخدمة كوبرنيكوس البحرية (حرارة وتيارات ومستوى البحر وغيرها). لم أستطع قراءة تفاصيل الصفحة آليًا.', cost: 'free', lang: 'en', v: 1 },
  { c: 'sea', t: 'Global Fishing Watch — الخريطة', u: 'https://globalfishingwatch.org/our-map/', d: 'خريطة مفتوحة لنشاط سفن الصيد التجارية (حوالي 70 ألف سفينة تبث إشارات AIS/VMS). مجانية بدون تسجيل، وتفيد المحترف في فهم مناطق الجهد. تعرض النشاط الظاهر فقط.', cost: 'free', lang: 'en', v: 2 },

  /* ---------- الخرائط والأعماق ---------- */
  { c: 'map', t: 'OpenSeaMap', u: 'https://map.openseamap.org/', d: 'خريطة ملاحية حرة مبنية على OpenStreetMap: علامات بحرية وموانئ وأعماق. الترخيص CC BY-SA وتتوفر صيغ للتحميل لـ OpenCPN وأجهزة Garmin وNavico.', cost: 'oss', lang: 'en', v: 2 },
  { c: 'map', t: 'GEBCO — خرائط قاع المحيطات', u: 'https://www.gebco.net/', d: 'شبكة أعماق عالمية مجانية للتحميل (وعرض عبر WMS). مفيدة لمعرفة الحيود والمنحدرات العميقة.', cost: 'free', lang: 'en', v: 2 },
  { c: 'map', t: 'EMODnet Bathymetry', u: 'https://emodnet.ec.europa.eu/en/bathymetry', d: 'أعماق تفصيلية للبحار الأوروبية ومنها المتوسط.', cost: 'free', lang: 'en', v: 1 },
  { c: 'map', t: 'OpenCPN', u: 'https://opencpn.org/', d: 'برنامج ملاحة (Chart Plotter) حر ومفتوح المصدر يعمل على ويندوز وماك ولينكس وRaspberry Pi.', cost: 'oss', lang: 'en', v: 2 },
  { c: 'map', t: 'OsmAnd', u: 'https://osmand.net/', d: 'خرائط بدون إنترنت. فيه نسخة مجانية محدودة.', cost: 'freemium', lang: 'en', v: 0 },
  { c: 'map', t: 'Organic Maps', u: 'https://organicmaps.app/', d: 'خرائط أوفلاين مفتوحة المصدر مبنية على OpenStreetMap.', cost: 'oss', lang: 'en', v: 0 },

  /* ---------- تعريف الأسماك ---------- */
  { c: 'id', t: 'FishBase', u: 'https://www.fishbase.se/home.htm', d: 'أكبر قاعدة بيانات للأسماك: أكثر من 33 ألف نوع و306 آلاف اسم شائع بـ344 لغة. ابحث بالاسم أو بالبلد أو بمنطقة الفاو. مجانية.', cost: 'free', lang: 'en', v: 2 },
  { c: 'id', t: 'WoRMS — السجل العالمي للكائنات البحرية', u: 'https://www.marinespecies.org/', d: 'التصنيف العلمي المعتمد للأنواع البحرية ومرادفاتها (حوالي 250 ألف نوع مقبول).', cost: 'free', lang: 'en', v: 2 },
  { c: 'id', t: 'iNaturalist', u: 'https://www.inaturalist.org/', d: 'صوّر السمكة فيقترح التطبيق نوعها ويؤكده مجتمع من المتخصصين. مجاني وبدون هدف ربحي.', cost: 'free', lang: 'ar+en', v: 2 },
  { c: 'id', t: 'دليل الفاو الميداني لموارد البحر المتوسط الشرقي والجنوبي', u: 'https://www.fao.org/4/i1276b/i1276b00.htm', d: '372 نوعًا بالعربية والإنجليزية (2012)، وتغطي شواطئ مصر. التحميل كامل مجاني (PDF حوالي 95 ميجا).', cost: 'free', lang: 'ar+en', v: 2, eg: 1 },
  { c: 'id', t: 'قائمة أسماك البحر المتوسط المصري — NIOF', u: 'https://niof-eg.com/Publication/check-list-of-the-bony-fish-species-in-the-mediterranean-waters-of-egypt/', d: '202 نوعًا من 64 فصيلة بأسمائها اللاتينية والإنجليزية والعربية المحلية (المعهد القومي لعلوم البحار والمصايد). لم أتأكد إن كان التحميل متاحًا مجانًا.', cost: 'free', lang: 'ar+en', v: 2, eg: 1 },
  { c: 'id', t: 'أسماء الأسماك الشائعة في البحر الأحمر (Sea Around Us)', u: 'https://www.seaaroundus.org/doc/publications/chapters/2012/Tesfamichael-Local-name.pdf', d: 'فصل بحثي يجمع الأسماء المحلية للأسماك واللافقاريات المستغلة في البحر الأحمر.', cost: 'free', lang: 'en', v: 1, eg: 1 },
  { c: 'id', t: 'FAO FishFinder', u: 'https://www.fao.org/fishery/en/topic/18079', d: 'أدلة الفاو الميدانية لتعريف الأنواع حسب مناطق الصيد.', cost: 'free', lang: 'en', v: 1 },
  { c: 'id', t: 'NOAA Seafood Profiles', u: 'https://www.fisheries.noaa.gov/topic/sustainable-seafood/seafood-profiles', d: 'ملفات تعريف لأكثر من 100 نوع (حالة المخزون وأدوات الصيد وطرق الإدارة). تركّز على المياه الأمريكية.', cost: 'free', lang: 'en', v: 2 },

  /* ---------- التقنيات والأخلاقيات ---------- */
  { c: 'skill', t: 'Animated Knots by Grog — عقد الصيد', u: 'https://www.animatedknots.com/fishing-knots', d: '26 عقدة صيد بالرسوم المتحركة خطوة بخطوة. الموقع مجاني وله تطبيق مجاني على iOS وأندرويد.', cost: 'free', lang: 'en', v: 2 },
  { c: 'skill', t: 'قواعد IGFA للصيد الرياضي', u: 'https://igfa.org/international-angling-rules/', d: 'قواعد الصيد الرياضي الأخلاقي وشروط الأرقام القياسية. ملفات PDF متاحة مجانًا بعدة لغات منها العربية.', cost: 'free', lang: 'ar+en', v: 2 },
  { c: 'skill', t: 'NOAA — الصيد والإطلاق بأمان', u: 'https://www.fisheries.noaa.gov/national/resources-fishing/catch-and-release-fishing-best-practices', d: 'ممارسات إعادة السمكة للماء بأقل ضرر: سنانير بلا شوكة، شبك مطاطي مبلل، أقل من 60 ثانية خارج الماء، وأجهزة إنزال للأسماك العميقة.', cost: 'free', lang: 'en', v: 2 },
  { c: 'skill', t: 'الفاو — إرشادات الصيد الترفيهي (رقم 13)', u: 'https://www.fao.org/4/i2708e/i2708e00.htm', d: 'إرشادات فنية من 176 صفحة: الإدارة والترخيص والأدوات ورفاهية الأسماك والصيد والإطلاق.', cost: 'free', lang: 'en', v: 2 },
  { c: 'skill', t: 'مدونة الفاو لقواعد الصيد المسؤول', u: 'https://www.fao.org/4/v9878e/v9878e00.htm', d: 'الإطار الدولي للصيد المسؤول، يفيد الصياد المحترف وصاحب القرار.', cost: 'free', lang: 'en', v: 1 },

  /* ---------- القوانين والتراخيص ---------- */
  { c: 'law', t: 'FAOLEX — تشريعات الدول', u: 'https://www.fao.org/faolex/en/', d: 'قاعدة عالمية للتشريعات الوطنية في الزراعة والموارد الطبيعية ومنها المصايد. ابحث بالدولة لتجد قوانين بلدك.', cost: 'free', lang: 'en', v: 2 },
  { c: 'law', t: 'FAOLEX — تشريعات مصر في المصايد', u: 'https://www.fao.org/faolex/country-profiles/general-profile/en/?iso3=EGY', d: 'صفحة مصر في فاولكس: قوانين وقرارات المصايد حسب فهرس الفاو (الرابط بنفس نمط صفحات الدول المؤكدة).', cost: 'free', lang: 'en', v: 1, eg: 1 },
  { c: 'law', t: 'قرار رئيس الجمهورية 190 لسنة 1983 (إنشاء هيئة الثروة السمكية)', u: 'https://faolex.fao.org/docs/pdf/egy122312.pdf', d: 'نص القرار الذي أنشأ الهيئة العامة لتنمية الثروة السمكية وحدد اختصاصاتها: الإشراف على الصيد وتراخيص المسطحات والأبحاث والتدريب.', cost: 'free', lang: 'en', v: 2, eg: 1 },
  { c: 'law', t: 'GFCM — المفوضية العامة لمصايد البحر المتوسط', u: 'https://www.fao.org/gfcm/en/', d: 'هيئة إقليمية بـ23 دولة عضوًا والاتحاد الأوروبي. تصدر توصيات ملزمة وخرائط مناطق مقيدة وتقارير حالة المصايد.', cost: 'free', lang: 'en', v: 2, eg: 1 },
  { c: 'law', t: 'GFCM — برنامج الصيد الترفيهي', u: 'https://www.fao.org/gfcm/activities/fisheries/scientific-advice/research-programmes/recreational-fisheries/en/', d: 'يعرض التوصية GFCM/45/2022/12 بشأن الحد الأدنى من قواعد الصيد الترفيهي المستدام في المتوسط، ودليل جمع البيانات.', cost: 'free', lang: 'en', v: 2, eg: 1 },
  { c: 'law', t: 'PERSGA — منظمة البحر الأحمر وخليج عدن', u: 'https://persga.org/', d: 'منظمة إقليمية من 7 دول منها مصر، لها منشورات ونظام معلومات إقليمي عن الموارد البحرية والمصايد.', cost: 'free', lang: 'ar+en', v: 2, eg: 1 },

  /* ---------- السلامة والإسعاف ---------- */
  { c: 'safe', t: 'الفاو — السلامة في البحر لصغار الصيادين', u: 'https://www.fao.org/fishing-safety/news-events/news/detail/en/c/1470187/', d: 'دليل مصور مجاني بـ16 لغة منها العربية: الحريق ومعدات النجاة والإضاءة والملاحة وقوائم فحص قبل الرحلة والنجاة في البحر.', cost: 'free', lang: 'ar+en', v: 2, eg: 1 },
  { c: 'safe', t: 'الفاو/ILO/IMO — توصيات سلامة المراكب الصغيرة', u: 'https://www.fao.org/3/i3108e/i3108e00.htm', d: 'وثيقة من 254 صفحة عن سلامة المراكب أقل من 12 مترًا: الثبات والحريق ومعدات النجاة والاتصال والملاحة وتدريب الطاقم.', cost: 'free', lang: 'en', v: 2 },
  { c: 'safe', t: 'DAN — إسعاف إصابات الكائنات البحرية', u: 'https://dan.org/health-medicine/health-resources/diseases-conditions/ive-been-stung-what-should-i-do/', d: 'خطوات الإسعاف الأولي للسع أسماك العقرب واللاذعة وقنافذ البحر والراي وقناديل البحر ومتى تطلب الطوارئ.', cost: 'free', lang: 'en', v: 2 },
  { c: 'safe', t: 'ANZCOR — إرشادات إسعاف التسمم البحري', u: 'https://www.anzcor.org/home/first-aid/guideline-9-4-5-first-aid-management-of-marine-envenomation', d: 'إرشاد إسعاف أولي مرجعي من أستراليا ونيوزيلندا لإصابات الكائنات البحرية السامة.', cost: 'free', lang: 'en', v: 1 },
  { c: 'safe', t: 'Cospas-Sarsat — أجهزة الاستغاثة 406 ميجاهرتز', u: 'https://www.cospas-sarsat.int/en/', d: 'النظام الدولي للبحث والإنقاذ عبر الأقمار الصناعية، وتعمل معه أجهزة EPIRB وPLB.', cost: 'free', lang: 'en', v: 0 },
  { c: 'safe', t: 'السمكة المنتفخة الفضية (Lagocephalus sceleratus)', u: 'https://neobiota.pensoft.net/article/71767/', d: 'دراسة عن سمكة سامة (تحتوي التترودوتوكسين) دخلت المتوسط عبر قناة السويس. الصيد والأكل ممنوعان في معظم دول المتوسط حسب الدراسة، وتتلف الشباك والأدوات.', cost: 'free', lang: 'en', v: 2, eg: 1 },

  /* ---------- للمحترفين والدراسة ---------- */
  { c: 'pro', t: 'الفاو — تصنيف أدوات الصيد (ISSCFG)', u: 'https://www.fao.org/cwp-on-fishery-statistics/handbook/capture-fisheries-statistics/fishing-gear-classification/en/', d: 'التصنيف الدولي الموحد لأدوات الصيد (نسخة 2016). يوجّه لأوراق بيانات كل أداة.', cost: 'free', lang: 'en', v: 2 },
  { c: 'pro', t: 'الفاو — أوراق أنواع أدوات الصيد', u: 'https://www.fao.org/fishery/en/geartype/search', d: 'قاعدة أوراق تعريفية لأنواع أدوات الصيد. الرابط ورد في صفحة الفاو ولم أستطع فتحه آليًا.', cost: 'free', lang: 'en', v: 1 },
  { c: 'pro', t: 'FAO FishStat — إحصاءات الصيد العالمية', u: 'https://www.fao.org/fishery/statistics-query/en/capture', d: 'استعلام مجاني عن إنتاج المصايد حسب الدولة والنوع والسنة، مفيد لدراسة الجدوى.', cost: 'free', lang: 'en', v: 1 },
  { c: 'pro', t: 'الفاو — أكاديمية التعلم الإلكتروني', u: 'https://elearning.fao.org/', d: 'دورات مجانية معتمدة بعدة لغات منها العربية في 25 مجالًا، منها المصايد وتربية الأحياء المائية، مع شارات إتمام.', cost: 'free', lang: 'ar+en', v: 2, eg: 1 },
  { c: 'pro', t: 'Global Fishing Watch — البيانات والأكواد', u: 'https://globalfishingwatch.org/datasets-and-code/', d: 'تحميل بيانات جهد الصيد للتحليل.', cost: 'free-reg', lang: 'en', v: 1 },
  { c: 'pro', t: 'الفاو — ملف مصر للمصايد', u: 'https://www.fao.org/fishery/countrysector/eg/en', d: 'نظرة عامة عن قطاع المصايد وتربية الأسماك في مصر. الرابط ظهر في البحث.', cost: 'free', lang: 'en', v: 1, eg: 1 },
  /* ---------- مضافة للنسخة العالمية (بحث الويب: ظهرت نتائجها ولم أفتحها آليًا، v:1) ---------- */
  { c: 'id', t: 'FishBase — قاعدة بيانات الأسماك العالمية', u: 'https://fishbase.org/', d: 'أكبر قاعدة مجانية عن أسماك العالم: الاسم العلمي والأسماء المحلية والانتشار بالبلد والحجم والغذاء. مرجع التحقق من أي نوع في التطبيق.', cost: 'free', lang: 'en', v: 1 },
  { c: 'id', t: 'GBIF — مشاهدات الأنواع حسب المكان', u: 'https://www.gbif.org/', d: 'خرائط وسجلات لملايين المشاهدات: تعرف بها هل النوع مسجَّل قرب منطقتك فعلًا.', cost: 'free', lang: 'en', v: 1 },
  { c: 'id', t: 'OBIS — نظام معلومات التنوع البحري', u: 'https://obis.org/', d: 'مشاهدات وتوزيعات الكائنات البحرية عالميًا، متاحة مجانًا وبواجهة برمجية.', cost: 'free', lang: 'en', v: 1 },
  { c: 'id', t: 'IUCN — القائمة الحمراء', u: 'https://iucn.org/resources/conservation-tool/iucn-red-list-threatened-species', d: 'حالة الحفظ لكل نوع (مهدد أو مستقر). راجعها قبل الإبقاء على أي سمكة كبيرة أو نادرة.', cost: 'free', lang: 'en', v: 1 },
  { c: 'id', t: 'Seafood Watch — دليل الاستدامة', u: 'https://www.seafoodwatch.org/recommendations/search', d: 'بحث مجاني عن مدى استدامة الأنواع والمصايد (أمريكا الشمالية أساسًا) لتختار ما تصيده وتأكله.', cost: 'free', lang: 'en', v: 1 },
  { c: 'pro', t: 'IGFA — الأرقام القياسية العالمية', u: 'https://igfa.org/member-services/world-record/search', d: 'أرقام قياسية لأنواع الصيد الرياضي ومقاييس العدة (خيوط وأوزان). مفيدة لمعرفة الأحجام القصوى.', cost: 'free', lang: 'en', v: 1 },
  { c: 'pro', t: 'الفاو — مناطق الصيد الكبرى (FAO Major Fishing Areas)', u: 'https://www.fao.org/cwp-on-fishery-statistics/handbook/general-concepts/main-water-areas/en/', d: 'التقسيم الدولي للمحيطات والبحار (27 منطقة). تستخدمه الإحصاءات والقوانين لتحديد أين صدتَ.', cost: 'free', lang: 'en', v: 1 },
  { c: 'law', t: 'GFCM — مناطق وفترات المنع الوطنية في المتوسط', u: 'https://www.fao.org/gfcm/data/maps/nfclosures/en/', d: 'خريطة الإغلاقات الوطنية للصيد في دول المتوسط. للتحقق من فترات المنع قبل الصيد.', cost: 'free', lang: 'en', v: 1 },
  { c: 'law', t: 'NOAA — الإغلاقات الموسمية جنوب الأطلسي (أمريكا)', u: 'https://www.fisheries.noaa.gov/southeast/rules-regulations/south-atlantic-fishing-seasonal-closures', d: 'مواسم منع الأنواع في المياه الفدرالية جنوب شرق الولايات المتحدة. للولايات الأخرى راجع صفحاتها.', cost: 'free', lang: 'en', v: 1 },
  { c: 'law', t: 'المملكة المتحدة — إرشادات قاروص البحر', u: 'https://www.gov.uk/government/publications/bass-industry-guidance-2025', d: 'قواعد رسمية للقاروص (حصص وأحجام وأشهر) في إنجلترا. مثال على قواعد أوروبا؛ فراجع بلدك.', cost: 'free', lang: 'en', v: 1 },
  { c: 'law', t: 'كندا — لوائح الصيد الترفيهي (DFO)', u: 'https://www.dfo-mpo.gc.ca/fisheries-peches/recreational-recreative/regs-eng.html', d: 'الجهة الفدرالية للصيد الترفيهي البحري في كندا مع روابط لكل إقليم.', cost: 'free', lang: 'en', v: 1 },
  { c: 'law', t: 'نيوزيلندا — قواعد الصيد (MPI)', u: 'https://www.mpi.govt.nz/fishing-aquaculture/recreational-fishing/fishing-rules', d: 'حدود الأعداد والأحجام لكل منطقة في نيوزيلندا، مع تطبيق رسمي.', cost: 'free', lang: 'en', v: 1 },
  { c: 'law', t: 'أستراليا — الصيد الترفيهي (وزارة الزراعة الفدرالية)', u: 'https://www.agriculture.gov.au/agriculture-land/fisheries/recreational', d: 'نقطة بداية للقواعد الأسترالية؛ ولاية كل منطقة تضع تراخيصها وأحجامها (نيو ساوث ويلز وكوينزلاند وغيرهما).', cost: 'free', lang: 'en', v: 1 },
  { c: 'law', t: 'جنوب إفريقيا — تراخيص الصيد الترفيهي البحري (DFFE)', u: 'https://www.dffe.gov.za/fim_permitconditions', d: 'شروط ورخصة الصيد الترفيهي البحري وحدود الأنواع، مع طلب الرخصة إلكترونيًا.', cost: 'free', lang: 'en', v: 1 },
  { c: 'law', t: 'FAOLEX — قوانين الصيد بالبلد', u: 'https://faolex.fao.org/', d: 'قاعدة قوانين الفاو: ابحث باسم بلدك عن قوانين المصايد والصيد الترفيهي بلغتها الأصلية غالبًا.', cost: 'free', lang: 'en', v: 1 }
];
const COST_LABEL = { free: 'مجاني', 'free-reg': 'مجاني بتسجيل', freemium: 'مجاني + مدفوع', oss: 'مفتوح المصدر' };
const V_LABEL = { 2: 'تحققت من الصفحة', 1: 'ظهر في البحث — لم أفتحه', 0: 'من المعرفة العامة — لم أتحقق' };

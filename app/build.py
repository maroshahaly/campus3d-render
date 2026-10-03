import json, os, zipfile, shutil, hashlib, subprocess, datetime
try:
    import cairosvg  # اختياري: لتوليد أيقونات PNG من الشعار. لو مش متثبّتة (pip install cairosvg) هيتخطّى توليد الأيقونات فقط من غير ما يوقف البناء كله
except Exception:
    cairosvg = None
# المسارات نسبية لمكان هذا الملف (app/build.py)، فيشتغل من أي فولدر تنسخ فيه المشروع
SP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = SP + '/app'; OUT = SP + '/out'; LOGO = SP + '/logo'
TERSER = SP + '/node_modules/.bin/terser'  # اختياري: لو مش موجود (npm i terser) هيبني بدون تصغير، بدون خطأ
os.makedirs(OUT, exist_ok=True)
rd = lambda p: open(p, encoding='utf-8').read()
def js_json(obj):
    s = json.dumps(obj, ensure_ascii=False, separators=(',', ':'))
    return s.replace('</', '<\\/').replace('<!--', '<\\!--')
data = js_json(json.load(open(SP + '/data.json', encoding='utf-8')))
imgs = js_json(json.load(open(SP + '/imgs.json', encoding='utf-8')))
vids = js_json(json.load(open(SP + '/vids.json', encoding='utf-8'))) if os.path.exists(SP + '/vids.json') else '{}'  # مقاطع فيديو قصيرة مضمّنة (data URI)
css = rd(A + '/leaflet.css') + '\n' + rd(A + '/style.css')
code = rd(A + '/leaflet.js') + '\n' + '\n'.join(rd(A + '/' + f) for f in ['astro.js', 'data_mask.js', 'data_geo.js', 'data_species.js', 'data_art.js', 'data_links.js', 'data_world.js', 'data_credits.js', 'data_gear.js', 'rigs.js', 'data_rigs.js', 'data_variants.js', 'data_knots.js', 'data_occ.js'])
app = rd(A + '/app.js')
# module.exports guard in astro is harmless in browsers

# بصمة إصدار: تاريخ البناء + هاش قصير من محتوى الشيفرة، لإثبات ملكية أي نسخة موزّعة عند التنازع
_fp = hashlib.sha256((code + app + css).encode('utf-8')).hexdigest()[:8].upper()
BUILD_ID = 'SYD-' + datetime.date.today().strftime('%Y%m%d') + '-' + _fp

def minify_js(src):
    """تصغير وتعتيم بسيط للشيفرة قبل التوزيع (terser)، مع سقوط آمن للمصدر الأصلي لو الأداة غير متاحة."""
    if not os.path.exists(TERSER):
        return src
    try:
        r = subprocess.run([TERSER, '--compress', '--mangle', '--toplevel'], input=src, capture_output=True, text=True, timeout=60)
        return r.stdout if r.returncode == 0 and r.stdout.strip() else src
    except Exception:
        return src

FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Noto+Kufi+Arabic:wght@500;600;700&display=swap">'
def body(standalone, minify=False):
    pre = '<script>window.__STANDALONE__=true;</script>\n' if standalone else ''
    bid = '<script>window.__BUILD_ID__=' + json.dumps(BUILD_ID) + ';</script>\n'
    payload = code + '\n' + app
    if minify: payload = minify_js(payload)
    return ('<style>\n' + css + '\n</style>\n<div id="app" dir="rtl" lang="ar"></div>\n'
            '<script type="application/json" id="data-json">' + data + '</script>\n'
            '<script type="application/json" id="imgs-json">' + imgs + '</script>\n'
            '<script type="application/json" id="vids-json">' + vids + '</script>\n'
            + pre + bid + '<script>\n' + payload + '\n</script>\n')
TITLE = 'الصنّارة'
# 1) Artifact fragment
frag = '<title>' + TITLE + '</title>\n' + FONTS + '\n' + body(False)
open(OUT + '/artifact.html', 'w', encoding='utf-8').write(frag)
# 2) Standalone
head = ('<!doctype html>\n<html lang="ar" dir="rtl">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
        '<meta name="theme-color" content="#0A3B4C">\n<title>' + TITLE + '</title>\n'
        '<meta name="mobile-web-app-capable" content="yes">\n'
        '<meta name="apple-mobile-web-app-capable" content="yes">\n'
        '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n'
        '<meta name="apple-mobile-web-app-title" content="' + TITLE + '">\n'
        '<meta name="description" content="دليل صيد عالمي: مواسم الأسماك وأوقاتها ومد وجزر وخريطة، يعمل بلا إنترنت">\n'
        '<link rel="manifest" href="manifest.webmanifest">\n<link rel="icon" href="icon-192.png">\n'
        '<link rel="apple-touch-icon" href="icon-180.png">\n' + FONTS + '\n</head>\n<body>\n')
html = head + body(True, minify=True) + '</body>\n</html>\n'
pw = OUT + '/pwa'; shutil.rmtree(pw, ignore_errors=True); os.makedirs(pw)
open(pw + '/index.html', 'w', encoding='utf-8').write(html)
open(OUT + '/sayad-guide.html', 'w', encoding='utf-8').write(html)
json.dump({"name": "الصنّارة — دليل صيد عالمي", "short_name": "الصنّارة", "description": "دليل صيد عالمي: مواسم الأسماك وأوقاتها ومد وجزر وخريطة، يعمل بلا إنترنت", "lang": "ar", "dir": "rtl", "start_url": "./index.html",
           "scope": "./", "display": "standalone", "orientation": "portrait", "background_color": "#071319", "theme_color": "#0A3B4C",
           "icons": [{"src": "icon-180.png", "sizes": "180x180", "type": "image/png"},
                     {"src": "icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any"},
                     {"src": "icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable"},
                     {"src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any"},
                     {"src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}]},
          open(pw + '/manifest.webmanifest', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
open(pw + '/sw.js', 'w').write('''const V='sayad-v5',TILES='sayad-tiles-v1',CORE=['./','index.html','manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png'];
const TILE_HOSTS=/(server\\.arcgisonline\\.com)$/;
const TILE_CAP=600; /* أقصى عدد بلاطات خريطة محفوظة، لمنع تضخّم التخزين */
async function trimTiles(){const c=await caches.open(TILES),ks=await c.keys();if(ks.length>TILE_CAP)for(const k of ks.slice(0,ks.length-TILE_CAP))await c.delete(k);}
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V&&x!==TILES).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET')return; const u=new URL(r.url);
  if(u.hostname.endsWith('open-meteo.com'))return;              /* التوقعات الحية: بدون تخزين هنا */
  if(TILE_HOSTS.test(u.hostname)){                               /* بلاطات الخريطة الحقيقية وصور الأقمار الصناعية: تُحفظ لتظهر بلا إنترنت لاحقًا */
    e.respondWith(caches.open(TILES).then(c=>c.match(r).then(h=>{
      const n=fetch(r).then(x=>{ if(x&&x.ok) c.put(r,x.clone()).then(trimTiles); return x; }).catch(()=>h);
      return h||n;
    })));
    return;
  }
  if(u.origin===location.origin){e.respondWith(caches.match(r,{ignoreSearch:true}).then(h=>h||fetch(r).then(x=>{const c=x.clone();caches.open(V).then(k=>k.put(r,c));return x}).catch(()=>caches.match('index.html'))));return}
  if(/fonts\\.(googleapis|gstatic)\\.com$/.test(u.hostname)){e.respondWith(caches.open(V).then(c=>c.match(r).then(h=>{const n=fetch(r).then(x=>{c.put(r,x.clone());return x}).catch(()=>h);return h||n})))}
});
''')
ICON_SVG = LOGO + '/icon_hq.svg'  # الشعار الرسمي (نسخة محسّنة: لمعان معدني وظل وتوهج): خطاف وسمكة، خلفية كحلية-تركوازية متدرجة
if cairosvg and os.path.exists(ICON_SVG):
    for n in (180, 192, 512):
        cairosvg.svg2png(url=ICON_SVG, write_to=pw + '/icon-%d.png' % n, output_width=n, output_height=n)
else:
    print('تنبيه: تخطّيت توليد أيقونات PNG (cairosvg غير متاحة أو ملف الشعار غير موجود) — التطبيق هيشتغل عادي بدونها، بس أيقونة الهاتف هتكون ناقصة لحد ما تتولّد.')
with zipfile.ZipFile(OUT + '/sayad-guide-pwa.zip', 'w', zipfile.ZIP_DEFLATED) as z:
    for f in sorted(os.listdir(pw)): z.write(pw + '/' + f, 'sayad-guide/' + f)
for f in sorted(os.listdir(OUT)):
    p = OUT + '/' + f
    if os.path.isfile(p): print(f, os.path.getsize(p))
print('BUILD_ID', BUILD_ID)

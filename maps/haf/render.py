import sys
from PIL import Image, ImageDraw
from hafp import *
h = Hafp(sys.argv[1]); L = int(sys.argv[2]); out = sys.argv[3]
W, S, E, N = [float(x) for x in sys.argv[4].split(',')] if len(sys.argv) > 4 else (124, 33, 132, 39)
px = 1600; sc = px / (E - W); py = int((N - S) * sc * 1.2)
img = Image.new('RGB', (px, py), (250, 248, 240)); dr = ImageDraw.Draw(img)
def tr(lon, lat): return ((lon - W) * sc, py - (lat - S) * sc * 1.2)
stats = {}
for (i1, i2, i3), loc in h.iter_locs(L):
    if loc[1] + loc[2] > h.size: continue
    try: p = h.parcel(L, i1, i2, i3)
    except Exception: continue
    if not p or len(p) < 16: continue
    bw, bs, be, bn = parcel_bbox(h, L, i1, i2, i3)
    if be < W or bw > E or bn < S or bs > N: continue
    for typ, so, ln in layer_table(p):
        try:
            for bt, pts in section_shapes(p, so):
                stats[bt] = stats.get(bt, 0) + 1
                xy = [tr(bw + x / 11250 * (be - bw), bs + y / 7500 * (bn - bs)) for x, y in pts]
                col=[(0,0,0),(200,60,40),(40,90,200),(0,150,0)][bt]
                for a,b,(x0,y0),(x1,y1) in zip(xy,xy[1:],pts,pts[1:]):
                    if bt==2 and ((x0==x1 and x0%2250==0) or (y0==y1 and y0%1500==0)): continue
                    dr.line([a,b], fill=col, width=1)
        except Exception as ex:
            stats['err'] = stats.get('err', 0) + 1
img.save(out); print(stats)

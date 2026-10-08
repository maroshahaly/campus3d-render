import sys, struct
from PIL import Image, ImageDraw
from hafp import Hafp, parcel_bbox, layer_table, section_shapes
from hafmodel import parse
h = Hafp(sys.argv[1]); L = int(sys.argv[2]); W, S, E, N = map(float, sys.argv[4].split(','))
px = 1600; sc = px / (E - W); py = int((N - S) * sc * 1.15)
img = Image.new('RGB', (px, py), (245, 240, 225)); dr = ImageDraw.Draw(img)
tr = lambda lon, lat: ((lon - W) * sc, py - (lat - S) * sc * 1.15)
labels = []
for k, loc in h.iter_locs(L):
    if loc[2] <= 4: continue
    bw, bs, be, bn = parcel_bbox(h, L, *k)
    if be < W or bw > E or bn < S or bs > N: continue
    p = h.parcel(L, *k)
    for typ, so, ln in layer_table(p):
        for bt, pts in section_shapes(p, so):
            xy = [tr(bw + x / 11250 * (be - bw), bs + y / 7500 * (bn - bs)) for x, y in pts]
            if bt == 2 and len(xy) > 2: dr.polygon(xy, fill=(150, 190, 230))
            elif len(xy) > 1: dr.line(xy, fill=(190, 60, 50), width=1)
    lb = parse(p)['labels']
    if lb:
        bid, off, cnt = struct.unpack_from('<HHH', lb, 2 + 6)   # English block
        o = off * 2
        for _ in range(cnt):
            fl, cls, rid, x, y, n = struct.unpack_from('<HHIHHH', lb, o)
            labels.append((tr(bw + x / 11250 * (be - bw), bs + y / 7500 * (bn - bs)), lb[o + 14:o + 14 + 2 * n].decode('utf-16le'), cls))
            o += (fl & 0x3f) * 2
for (x, y), t, cls in labels:
    dr.ellipse([x - 2, y - 2, x + 2, y + 2], fill='black'); dr.text((x + 4, y - 6), t, fill=(0, 0, 0) if cls != 0x961 else (120, 0, 120))
img.save(sys.argv[3]); print('labels drawn', len(labels))

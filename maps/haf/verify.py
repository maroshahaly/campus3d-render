"""Verify a generated .hafp: index walk, parse/encode round-trip of every parcel, render one level."""
import sys, collections
from PIL import Image, ImageDraw
from hafp import Hafp, parcel_bbox, layer_table, section_shapes, u32
from hafmodel import parse, encode

path, L, out = sys.argv[1], int(sys.argv[2]), sys.argv[3]
W, S, E, N = [float(x) for x in sys.argv[4].split(',')] if len(sys.argv) > 4 else (24.5, 21.5, 37.5, 32)
h = Hafp(path)
print('bbox', [x / 360000 for x in (h.lon_min, h.lat_min, h.lon_max, h.lat_max)], 'center', [x / 360000 for x in h.center])
stats = collections.Counter()
for lv in []:
    n = bad = 0
    for k, loc in h.iter_locs(lv):
        if loc[2] <= 4:
            continue
        p = h.parcel(lv, *k); n += 1
        if encode(parse(p)) != p:
            bad += 1
    print(f'L{lv}: parcels {n}, roundtrip mismatches {bad}')
px = 1600; sc = px / (E - W); py = int((N - S) * sc * 1.1)
img = Image.new('RGB', (px, py), (245, 240, 225)); dr = ImageDraw.Draw(img)
tr = lambda lon, lat: ((lon - W) * sc, py - (lat - S) * sc * 1.1)
for k, loc in h.iter_locs(L):
    if loc[2] <= 4:
        continue
    p = h.parcel(L, *k)
    bw, bs, be, bn = parcel_bbox(h, L, *k)
    for typ, so, ln in layer_table(p):
        for bt, pts in section_shapes(p, so):
            xy = [tr(bw + x / 11250 * (be - bw), bs + y / 7500 * (bn - bs)) for x, y in pts]
            stats[bt] += 1
            if bt == 2 and len(xy) > 2:
                dr.polygon(xy, fill=(120, 170, 225))
            elif len(xy) > 1:
                dr.line(xy, fill=(200, 50, 40), width=1)
img.save(out)
print('rendered', dict(stats))

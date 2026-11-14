"""Build an Egypt HM_LE_3D.hafp (MnSoft HAF Gen3 main map) from Overture/OSM data.

Usage: python3 egypt_build.py <korean_hafp_head> <out.hafp> [levels]
Background layers only (polygons + lines). Layout and encoding follow the
decoded Korean file; parcels are written with hafmodel.encode (verified
byte-identical on 745 Korean parcels).
"""
import sys, struct, math, time, pickle, os, collections
import numpy as np
import shapely
import pyarrow.parquet as pq
import mapbox_earcut as earcut
from hafp import Hafp
from hafmodel import encode, CELL_ORDER

D = '/root/egypt/'
UNIT = 360000                      # HAF coordinate unit = 1/360000 degree
LON_MIN, LAT_MIN = 16 * UNIT, 4920000          # same span as Korean file (32 x 21.333 deg)
LON_MAX, LAT_MAX = LON_MIN + 11520000, LAT_MIN + 7680000
CENTER = (int(31.2357 * UNIT), int(30.0444 * UNIT))   # Cairo
TW, TH = 11250, 7500               # tile-local extent
CW, CH = 2250, 1500                # 5x5 cells

# ---- category -> per-level (class, btype, style); None = not drawn at that level
# btype 2 = polygon, 1 = line
R = lambda cls, st: (cls, 1, st)
P = lambda cls, st: (cls, 2, st)
CATS = {
    #               L0               L1               L2               L3               L4               L5               L6
    'sea':        [P(5, 0x8410),   P(5, 0x8410),   P(4, 0x6310),   P(4, 0x6310),   P(4, 0x6310),   P(4, 0x6310),   P(4, 0x6310)],
    'water_big':  [None,           None,           P(80, 0x6110),  P(80, 0x6110),  P(80, 0x6110),  P(80, 0x6110),  P(80, 0x6110)],
    'water':      [None,           None,           None,           None,           P(80, 0x6110),  P(80, 0x6110),  P(80, 0x6110)],
    'river_line': [R(80, 0x6120),  R(80, 0x6120),  None,           None,           None,           None,           None],
    'urban':      [None, None, None, None, None, P(33, 0x7110), P(33, 0x7110)],
    'park':       [None, None, None, None, None, P(35, 0x7310), P(35, 0x7310)],
    'admin1':     [R(101, 0x9110), R(101, 0x9110), R(101, 0x9110), R(101, 0x9110), R(101, 0x9110), R(101, 0x9110), R(101, 0x9110)],
    'admin2':     [None,           None,           None,           R(101, 0x9210), R(101, 0x9210), R(101, 0x9210), R(101, 0x9210)],
    'rail':       [None,           None,           None,           None,           R(90, 0x3210),  R(90, 0x3210),  R(90, 0x3210)],
    'subway':     [None, None, None, None, None, R(88, 0x411e), R(88, 0x411e)],
    'ferry':      [None,           None,           R(103, 0x13c0), R(103, 0x13c0), R(103, 0x13c0), R(103, 0x13c0), R(103, 0x13c0)],
    'motorway':   [R(109, 0x1310), R(109, 0x1310), R(109, 0x1310), R(109, 0x1310), R(109, 0x1310), R(109, 0x1310), R(109, 0x1310)],
    'trunk':      [R(109, 0x1310), R(109, 0x1310), R(109, 0x1320), R(109, 0x1320), R(109, 0x1320), R(109, 0x1320), R(109, 0x1320)],
    'primary':    [None,           None,           R(108, 0x1330), R(108, 0x1330), R(108, 0x1330), R(108, 0x1330), R(108, 0x1330)],
    'secondary':  [None,           None,           None,           R(108, 0x1360), R(108, 0x1360), R(108, 0x1360), R(108, 0x1360)],
    'tertiary':   [None, None, None, None, None, R(107, 0x1350), R(107, 0x1350)],
    'minor':      [None,           None,           None,           None,           None,           R(107, 0x1370), R(107, 0x1370)],
    'local':      [None, None, None, None, None, None, R(106, 0x1390)],
    'service':    [None, None, None, None, None, None, R(106, 0x1380)],
}


def load():
    cache = D + 'prep.pkl'
    if os.path.exists(cache):
        return pickle.load(open(cache, 'rb'))
    t0 = time.time()
    da = pq.read_table(D + 'division_area.parquet').to_pydict()
    eg = [shapely.from_wkb(g) for g, s in zip(da['geometry'], da['subtype']) if s == 'country']
    eg.sort(key=lambda g: g.area)
    land_eg, terr_eg = eg[0], eg[-1]
    region = shapely.make_valid(terr_eg.buffer(0.15))
    shapely.prepare(region)
    feats = collections.defaultdict(list)          # cat -> list of geoms

    def keep(geoms):
        geoms = np.array(geoms, dtype=object)
        m = shapely.intersects(region, geoms)
        return geoms[m]

    # admin
    land_buf = land_eg.buffer(0.002)
    for g, s in zip(da['geometry'], da['subtype']):
        if s in ('region', 'county'):
            gg = shapely.from_wkb(g)
            b = shapely.intersection(shapely.boundary(gg), land_buf)
            if not b.is_empty:
                feats['admin1' if s == 'region' else 'admin2'].append(b)
    feats['admin1'].append(shapely.boundary(land_eg))
    # water
    w = pq.read_table(D + 'water.parquet', columns=['subtype', 'class', 'geometry']).to_pydict()
    wg = shapely.from_wkb(w['geometry'])
    ocean = [g for g, s in zip(wg, w['subtype']) if s == 'ocean']
    feats['sea'] = [shapely.intersection(shapely.union_all(ocean), region)]
    for g, s, c in zip(wg, w['subtype'], w['class']):
        if s == 'ocean' or c in ('swimming_pool', 'reflecting_pool'):
            continue
        t = g.geom_type
        if t in ('Polygon', 'MultiPolygon'):
            a = g.area * 111 * 111 * 0.87  # km2 approx
            feats['water_big' if a > 0.5 else 'water'].append(g)
        elif t in ('LineString', 'MultiLineString') and s == 'river':
            feats['river_line'].append(g)
    # land use
    lu = pq.read_table(D + 'land_use.parquet', columns=['subtype', 'class', 'geometry']).to_pydict()
    for g, s, c in zip(lu['geometry'], lu['subtype'], lu['class']):
        if s in ('residential', 'developed'):
            feats['urban'].append(shapely.from_wkb(g))
        elif s in ('park',) or c in ('garden', 'grass', 'village_green'):
            feats['park'].append(shapely.from_wkb(g))
    # transportation
    seg = pq.read_table(D + 'segment.parquet', columns=['subtype', 'class', 'geometry']).to_pydict()
    rmap = {'motorway': 'motorway', 'trunk': 'trunk', 'primary': 'primary', 'secondary': 'secondary',
            'tertiary': 'tertiary', 'unclassified': 'minor', 'residential': 'local', 'living_street': 'local',
            'service': 'service', 'unknown': 'local'}
    railmap = {'standard_gauge': 'rail', 'narrow_gauge': 'rail', 'unknown': 'rail', 'subway': 'subway',
               'light_rail': 'subway', 'monorail': 'subway', 'tram': 'subway'}
    for g, s, c in zip(seg['geometry'], seg['subtype'], seg['class']):
        cat = rmap.get(c) if s == 'road' else railmap.get(c) if s == 'rail' else 'ferry' if s == 'water' else None
        if cat:
            feats[cat].append(g)       # keep WKB, decode later in bulk
    for k in list(feats):
        v = feats[k]
        if v and isinstance(v[0], bytes):
            v = shapely.from_wkb(v)
        feats[k] = keep(v)
        print(f'  {k}: {len(feats[k])}', flush=True)
    out = (feats, region)
    pickle.dump(out, open(cache, 'wb'))
    print('prep', round(time.time() - t0), 's')
    return out


class Grid:
    def __init__(self, tmpl):
        self.dims = [lv[0] for lv in tmpl.levels]

    def tiles_per_axis(self, L):
        d = self.dims[L]
        return d[0][0] * d[1][0] * d[2][0], d[0][1] * d[1][1] * d[2][1]

    def tile_size_deg(self, L):
        nx, ny = self.tiles_per_axis(L)
        return (LON_MAX - LON_MIN) / UNIT / nx, (LAT_MAX - LAT_MIN) / UNIT / ny

    def key(self, L, gx, gy):
        """global tile (gx,gy) -> (i1,i2,i3) and tier3 (x3,y3)"""
        d = self.dims[L]
        (n1x, n1y), (n2x, n2y), (n3x, n3y) = d[0], d[1], d[2]
        x3, y3 = gx % n3x, gy % n3y
        x2, y2 = (gx // n3x) % n2x, (gy // n3y) % n2y
        x1, y1 = gx // (n3x * n2x), gy // (n3y * n2y)
        return (y1 * n1x + x1, y2 * n2x + x2, y3 * n3x + x3), (x3, y3)


def tile_size_m(w_deg, h_deg, lat_s):
    a = 6378137.0
    w = math.radians(w_deg) * a * math.cos(math.radians(lat_s))
    h = math.radians(h_deg) * 6356752.0
    enc = lambda v: (0x8000 | int(round(v))) if v < 32767 else int(round(v / 200)) & 0x7fff
    return enc(w), enc(h)


def split_holes(poly):
    """Return hole-free polygons covering poly (split vertically through holes)."""
    out, stack = [], [poly]
    while stack:
        p = stack.pop()
        if p.is_empty:
            continue
        if p.geom_type == 'MultiPolygon' or p.geom_type == 'GeometryCollection':
            stack.extend(g for g in p.geoms if g.geom_type in ('Polygon', 'MultiPolygon'))
            continue
        if p.geom_type != 'Polygon':
            continue
        if not p.interiors:
            out.append(p)
            continue
        hx = p.interiors[0].centroid.x
        minx, miny, maxx, maxy = p.bounds
        left = shapely.box(minx - 1, miny - 1, hx, maxy + 1)
        right = shapely.box(hx, miny - 1, maxx + 1, maxy + 1)
        stack.append(shapely.intersection(p, left))
        stack.append(shapely.intersection(p, right))
    return out


def drop_holes(g, amin):
    if g.geom_type != 'Polygon' or not g.interiors:
        return g
    keep = [r for r in g.interiors if shapely.Polygon(r).area > amin]
    return shapely.Polygon(g.exterior, keep)


def build_level(L, feats, grid, xr=None, rb=None, only=None, deg=0):
    tw, th = grid.tile_size_deg(L)
    cw, ch = tw / 5, th / 5
    lon0, lat0 = LON_MIN / UNIT, LAT_MIN / UNIT
    unit_deg = tw / TW
    tol = unit_deg * (1.5 if L >= 6 else 2.5 if L == 5 else 4.0) * (2 ** deg)
    dropped = set(DROP_ORDER[:DROP_STEPS[min(deg, len(DROP_STEPS) - 1)]])
    # (gx,gy) -> cell(0..24) -> cls -> {'poly': [...], 'line': [...]}
    tiles = collections.defaultdict(lambda: collections.defaultdict(lambda: collections.defaultdict(lambda: ([], []))))
    for cat, spec in CATS.items():
        sp = spec[L]
        if sp is None or len(feats.get(cat, [])) == 0 or cat in dropped:
            continue
        cls, bt, style = sp
        geoms = feats[cat]
        if only is not None:
            ob = shapely.bounds(geoms)
            ogx0 = np.floor((ob[:, 0] - lon0) / tw).astype(np.int64); ogx1 = np.floor((ob[:, 2] - lon0) / tw).astype(np.int64)
            ogy0 = np.floor((ob[:, 1] - lat0) / th).astype(np.int64); ogy1 = np.floor((ob[:, 3] - lat0) / th).astype(np.int64)
            ox0 = min(t[0] for t in only); ox1 = max(t[0] for t in only); oy0 = min(t[1] for t in only); oy1 = max(t[1] for t in only)
            geoms = geoms[(ogx1 >= ox0) & (ogx0 <= ox1) & (ogy1 >= oy0) & (ogy0 <= oy1)]
            if len(geoms) == 0:
                continue
        if L <= 5:   # size filter
            if bt == 1:
                geoms = geoms[shapely.length(geoms) > unit_deg * 40]
            else:
                amin = (unit_deg * 30) ** 2 * (4 ** deg)
                geoms = shapely.get_parts(geoms)
                geoms = geoms[shapely.area(geoms) > amin]
                geoms = np.array([drop_holes(g, amin) for g in geoms], dtype=object)
        if len(geoms) == 0:
            continue
        geoms = shapely.simplify(geoms, tol, preserve_topology=(bt == 2))
        b = shapely.bounds(geoms)
        cx0 = np.floor((b[:, 0] - lon0) / cw).astype(np.int64)
        cx1 = np.floor((b[:, 2] - lon0) / cw).astype(np.int64)
        cy0 = np.floor((b[:, 1] - lat0) / ch).astype(np.int64)
        cy1 = np.floor((b[:, 3] - lat0) / ch).astype(np.int64)
        nx = cx1 - cx0 + 1; ny = cy1 - cy0 + 1; n = nx * ny
        small = n <= 64
        # pairs for small features
        idx = np.repeat(np.nonzero(small)[0], n[small])
        off = np.arange(len(idx)) - np.repeat(np.cumsum(n[small]) - n[small], n[small])
        px = cx0[idx] + off % nx[idx]
        py = cy0[idx] + off // nx[idx]
        rx0 = int(np.floor((rb[0] - lon0) / cw)); rx1 = int(np.floor((rb[2] - lon0) / cw))
        ry0 = int(np.floor((rb[1] - lat0) / ch)); ry1 = int(np.floor((rb[3] - lat0) / ch))
        rx0 = max(rx0, 0); ry0 = max(ry0, 0)
        if xr is not None:
            rx0 = max(rx0, xr[0] * 5); rx1 = min(rx1, xr[1] * 5 - 1)
        m = (px >= rx0) & (px <= rx1) & (py >= ry0) & (py <= ry1)
        gi, px, py = idx[m], px[m], py[m]
        if only is not None:
            okeys = np.array([a * 1000003 + b for a, b in only], dtype=np.int64)
            mm = np.isin((px // 5) * 1000003 + (py // 5), okeys)
            gi, px, py = gi[mm], px[mm], py[mm]

        def emit(part, X, Y):
            if part is None or part.is_empty:
                return
            if only is not None and (X // 5, Y // 5) not in only:
                return
            gx, gy = X // 5, Y // 5
            cell = (Y % 5) * 5 + (X % 5)
            tx0 = lon0 + gx * tw; ty0 = lat0 + gy * th
            ccol, crow = X % 5, Y % 5
            lo = (ccol * CW, crow * CH, (ccol + 1) * CW, (crow + 1) * CH)
            bucket = tiles[(gx, gy)][cell][(cls, style)]
            if bt == 2:
                for poly in split_holes(part):
                    ring = np.asarray(poly.exterior.coords)
                    q = quant(ring, tx0, ty0, tw, th, lo)
                    if q is not None and len(q) >= 4:
                        bucket[0].append(q)
            else:
                lines = [part] if part.geom_type == 'LineString' else [g for g in getattr(part, 'geoms', []) if g.geom_type == 'LineString']
                for ln in lines:
                    q = quant(np.asarray(ln.coords), tx0, ty0, tw, th, lo)
                    if q is not None and len(q) >= 2:
                        bucket[1].append(q)

        def rec(g, x0, y0, x1, y1):
            """clip g to cell range [x0..x1]x[y0..y1] recursively (quadrants) and emit cell pieces"""
            if g is None or g.is_empty:
                return
            if x0 == x1 and y0 == y1:
                emit(g, x0, y0); return
            if x1 - x0 >= y1 - y0:
                xm = (x0 + x1) // 2; halves = [(x0, y0, xm, y1), (xm + 1, y0, x1, y1)]
            else:
                ym = (y0 + y1) // 2; halves = [(x0, y0, x1, ym), (x0, ym + 1, x1, y1)]
            for a0, b0, a1, b1 in halves:
                part = shapely.clip_by_rect(g, lon0 + a0 * cw, lat0 + b0 * ch, lon0 + (a1 + 1) * cw, lat0 + (b1 + 1) * ch)
                if not part.is_empty:
                    rec(part, a0, b0, a1, b1)

        nbig = 0
        for bi in np.nonzero(~small)[0]:
            a0, a1 = max(cx0[bi], rx0), min(cx1[bi], rx1); b0, b1 = max(cy0[bi], ry0), min(cy1[bi], ry1)
            if a0 > a1 or b0 > b1:
                continue
            nbig += 1
            rec(geoms[bi], int(a0), int(b0), int(a1), int(b1))
        print(f'   L{L} {cat}: {len(geoms)} geoms -> {len(gi)} small pieces + {nbig} big', flush=True)
        CH_ = 400000
        for s0 in range(0, len(gi), CH_):
            g_, x_, y_ = gi[s0:s0 + CH_], px[s0:s0 + CH_], py[s0:s0 + CH_]
            boxes = shapely.box(lon0 + x_ * cw, lat0 + y_ * ch, lon0 + (x_ + 1) * cw, lat0 + (y_ + 1) * ch)
            parts = shapely.intersection(geoms[g_], boxes)
            for part, X, Y in zip(parts, x_, y_):
                emit(part, int(X), int(Y))
    return tiles


def quant(c, tx0, ty0, tw, th, lo):
    x = np.rint((c[:, 0] - tx0) / tw * TW).astype(np.int64)
    y = np.rint((c[:, 1] - ty0) / th * TH).astype(np.int64)
    x = np.clip(x, lo[0], lo[2]); y = np.clip(y, lo[1], lo[3])
    keep = np.ones(len(x), bool)
    keep[1:] = (x[1:] != x[:-1]) | (y[1:] != y[:-1])
    x, y = x[keep], y[keep]
    if len(x) < 2:
        return None
    return np.stack([x, y], 1)


def make_items(cls, style, polys, lines, lo):
    blocks = []
    if polys:
        pts, tris, items = [], [], []
        for ring in polys:
            if not (ring[0] == ring[-1]).all():
                ring = np.vstack([ring, ring[:1]])
            uniq = ring[:-1]
            if len(uniq) < 3:
                continue
            t = earcut.triangulate_int32(uniq.astype(np.int32), np.array([len(uniq)], dtype=np.uint32))
            if len(t) == 0:
                continue
            for s0 in range(0, 1, 1):
                pass
            if len(pts) + len(ring) > 60000 or len(items) > 16000:
                blocks.append((2, {'pts': pts, 'tris': tris, 'items': items})); pts, tris, items = [], [], []
            fp, ft = len(pts), len(tris)
            pts.extend(map(tuple, ring.tolist()))
            tt = (t.reshape(-1, 3) + fp).tolist()
            tris.extend(map(tuple, tt))
            border = bool(((uniq[:, 0] == lo[0]) | (uniq[:, 0] == lo[2]) | (uniq[:, 1] == lo[1]) | (uniq[:, 1] == lo[3])).any())
            b0 = 0x2a | (0x40 if border else 0)
            mn = ring.min(0); mx = ring.max(0)
            items.append(struct.pack('<BBHHHHH4H', b0, 0, fp, len(ring), ft, len(tt), style, mn[0], mn[1], mx[0], mx[1]))
        if items:
            blocks.append((2, {'pts': pts, 'tris': tris, 'items': items}))
    if lines:
        pts, items = [], []
        for ln in lines:
            for s0 in range(0, len(ln) - 1, 2000):
                seg = ln[s0:s0 + 2001]
                if len(pts) + len(seg) > 60000 or len(items) > 16000:
                    blocks.append((1, {'pts': pts, 'tris': None, 'items': items})); pts, items = [], []
                fp = len(pts)
                pts.extend(map(tuple, seg.tolist()))
                mn = seg.min(0); mx = seg.max(0)
                items.append(struct.pack('<BBHHH4H', 0x28, 0, fp, len(seg), style, mn[0], mn[1], mx[0], mx[1]))
        if items:
            blocks.append((1, {'pts': pts, 'tris': None, 'items': items}))
    return blocks


def make_parcel(L, gx, gy, cells, grid):
    tw, th = grid.tile_size_deg(L)
    (i1, i2, i3), (x3, y3) = grid.key(L, gx, gy)
    lat_s = LAT_MIN / UNIT + gy * th
    wm, hm = tile_size_m(tw, th, lat_s)
    hdr = bytearray(struct.pack('<IIIBBBBHH', 0x00041c0a, 0xff00000a, 0xffffffff, x3, y3, 0x00, 0xc1, wm, hm))
    sections = []
    for ci, ctype in enumerate(CELL_ORDER):
        col, row = (ctype >> 13) & 7, (ctype >> 10) & 7
        lo = (col * CW, row * CH, (col + 1) * CW, (row + 1) * CH)
        cell = cells.get(row * 5 + col)
        groups = []
        if cell:
            bycls = collections.defaultdict(list)
            for (cls, style), (polys, lines) in cell.items():
                bycls[cls].append((style, polys, lines))
            for cls in sorted(bycls):
                blocks_poly, blocks_line = [], []
                for style, polys, lines in bycls[cls]:
                    for bt, pool in make_items(cls, style, polys, lines, lo):
                        (blocks_poly if bt == 2 else blocks_line).append((bt, pool))
                blocks = blocks_poly + blocks_line
                if blocks:
                    groups.append({'cls': cls, 'flag': 0, 'blocks': blocks})
        sections.append({'type': ctype, 'groups': groups, 'empty_v': 2 if not groups else None, 'v_extra': 0})
    m = {'raw_hdr': bytes(hdr), 'tbl_b1': 0, 'sections': sections, 'labels': None}
    return (i1, i2, i3), encode(m)


def write_file(out, tmpl, parcels, grid):
    """parcels: dict L -> dict (i1,i2,i3) -> bytes"""
    H = bytearray(tmpl.H)
    struct.pack_into('<4i', H, 0x80, LON_MIN, LAT_MIN, LON_MAX, LAT_MAX)
    struct.pack_into('<2i', H, 0xa6, *CENTER)
    extra = tmpl.read(tmpl.hdr_size, 0x100)       # flag 0x40 table
    I_old = tmpl.I
    # ---- build index: same header & level records, new tier1/tier2 tables
    nlev = len(grid.dims)
    I = bytearray(I_old[:0xa + nlev * 20 + 2])
    I += b'\0' * ((-len(I)) % 4)
    t1pos = {}
    for L in range(nlev):
        n1 = grid.dims[L][0][0] * grid.dims[L][0][1]
        t1pos[L] = len(I)
        struct.pack_into('<H', I, 0x1e + L * 20, len(I) // 2)
        I += b'\0' * (8 * n1)
    t2pos = {}
    for L in range(nlev):
        n1 = grid.dims[L][0][0] * grid.dims[L][0][1]; n2 = grid.dims[L][1][0] * grid.dims[L][1][1]
        for i1 in range(n1):
            t2pos[(L, i1)] = len(I)
            old = I_old[t1pos_old(tmpl, L) + i1 * 8: t1pos_old(tmpl, L) + i1 * 8 + 8] if i1 < 4 else b'\0' * 8
            struct.pack_into('<BBiH', I, t1pos[L] + i1 * 8, i1, ((L + 1) << 3), len(I) // 2, n2 * 3)
            I += b'\0' * (6 * n2)
    index_off = tmpl.hdr_size + 0x100
    struct.pack_into('<IH', H, 0x200, index_off // 4, len(I) // 2)
    struct.pack_into('<H', I, 0, len(I) // 2)
    # ---- layout: header | extra | index | tier3 tables | stub | parcels
    pos = index_off + len(I)
    pos += (-pos) % 4
    t3 = {}
    for L in range(nlev):
        n3 = grid.dims[L][2][0] * grid.dims[L][2][1]
        for (i1, i2) in sorted({(k[0], k[1]) for k in parcels.get(L, {})}):
            t3[(L, i1, i2)] = (pos, bytearray(4 + 8 * n3))
            pos += 4 + 8 * n3
    stub = pos; pos += 4
    data = []
    for L in range(nlev):
        for k in sorted(parcels.get(L, {})):
            p = parcels[L][k]
            off, tb = t3[(L, k[0], k[1])]
            struct.pack_into('<iI', tb, 4 + k[2] * 8, pos // 4, len(p))
            data.append((pos, p)); pos += len(p); pos += (-pos) % 4
    for (L, i1, i2), (off, tb) in t3.items():
        n3 = grid.dims[L][2][0] * grid.dims[L][2][1]
        for i3 in range(n3):
            if struct.unpack_from('<I', tb, 4 + i3 * 8 + 4)[0] == 0:
                struct.pack_into('<iI', tb, 4 + i3 * 8, stub // 4, 4)
        struct.pack_into('<iH', I, t2pos[(L, i1)] + i2 * 6, off // 4, len(tb) // 2)
    # empty tier2 slots: -1 with code 2 (same as Korean "no data")
    for L in range(nlev):
        n1 = grid.dims[L][0][0] * grid.dims[L][0][1]; n2 = grid.dims[L][1][0] * grid.dims[L][1][1]
        for i1 in range(n1):
            for i2 in range(n2):
                if (L, i1, i2) not in t3:
                    struct.pack_into('<iH', I, t2pos[(L, i1)] + i2 * 6, -1, 2)
    with open(out, 'wb') as f:
        f.write(H); f.write(extra); f.write(I)
        f.write(b'\0' * ((-f.tell()) % 4))
        for (L, i1, i2), (off, tb) in sorted(t3.items(), key=lambda kv: kv[1][0]):
            assert f.tell() == off, (f.tell(), off)
            f.write(tb)
        assert f.tell() == stub
        f.write(bytes.fromhex('02400000'))
        for off, p in data:
            assert f.tell() == off
            f.write(p); f.write(b'\0' * ((-f.tell()) % 4))
    return pos


def t1pos_old(tmpl, L):
    return tmpl.levels[L][1]


G = {}

BUDGET = {0: 150000, 1: 150000, 2: 240000, 3: 200000, 4: 64000, 5: 400000, 6: 1000000}
DROP_ORDER = ['park', 'service', 'local', 'urban', 'minor', 'tertiary', 'water', 'subway',
              'secondary', 'admin2', 'rail', 'river_line', 'primary', 'ferry']
DROP_STEPS = [0, 3, 7, 11, 13, 14, 14, 14, 14]


MAX_POOL_PTS, MAX_POOL_ITEMS, MAX_CELL_PTS = 2400, 400, 4000


def too_big(L, p):
    if len(p) > BUDGET[L]:
        return True
    from hafmodel import parse
    for s in parse(p)['sections']:
        tot = 0
        for g in s['groups']:
            for bt, pl in g['blocks']:
                if len(pl['pts']) > MAX_POOL_PTS or len(pl['items']) > MAX_POOL_ITEMS:
                    return True
                tot += len(pl['pts'])
        if tot > MAX_CELL_PTS:
            return True
    return False


def worker(args):
    L, xr = args
    feats, grid, rb = G['feats'], G['grid'], G['rb']
    tiles = build_level(L, feats, grid, xr, rb)
    res = {}; over = set()
    for (gx, gy), cells in tiles.items():
        k, p = make_parcel(L, gx, gy, cells, grid)
        res[k] = p
        if too_big(L, p):
            over.add((gx, gy))
    deg = 0
    while over and deg < 8:
        deg += 1
        t2 = build_level(L, feats, grid, xr, rb, only=over, deg=deg)
        nover = set()
        for (gx, gy) in over:
            k, p = make_parcel(L, gx, gy, t2.get((gx, gy), {}), grid)
            res[k] = p
            if too_big(L, p):
                nover.add((gx, gy))
        over = nover
    return res


def main():
    import multiprocessing as mp
    tmpl = Hafp(sys.argv[1]); out = sys.argv[2]
    levels = [int(x) for x in sys.argv[3].split(',')] if len(sys.argv) > 3 else list(range(7))
    grid = Grid(tmpl)
    feats, region = load()
    G.update(feats=feats, grid=grid, rb=region.bounds)
    parcels = {}
    for L in range(7):
        cache = f'{D}parcels_L{L}.pkl'
        if L in levels:
            t0 = time.time()
            nx, _ = grid.tiles_per_axis(L)
            tw, _ = grid.tile_size_deg(L)
            gx0 = int((region.bounds[0] - LON_MIN / UNIT) // tw); gx1 = int((region.bounds[2] - LON_MIN / UNIT) // tw) + 1
            nchunk = 1 if L <= 2 else 16
            step = max(1, -(-(gx1 - gx0) // nchunk))
            jobs = [(L, (a, min(a + step, gx1))) for a in range(gx0, gx1, step)]
            parcels[L] = {}
            with mp.get_context('fork').Pool(4) as pool:
                for res in pool.imap_unordered(worker, jobs):
                    parcels[L].update(res)
            pickle.dump(parcels[L], open(cache, 'wb'))
            print(f'L{L}: {len(parcels[L])} parcels, {sum(map(len, parcels[L].values())) / 1e6:.1f} MB, {time.time() - t0:.0f}s', flush=True)
        elif os.path.exists(cache):
            parcels[L] = pickle.load(open(cache, 'rb'))
    size = write_file(out, tmpl, parcels, grid)
    print('written', out, size)


if __name__ == '__main__':
    main()

"""Attach English place-name labels to cached Egypt parcels and write the final .hafp.

Usage: python3 labels.py <korean_hafp_head> <out.hafp>
Label table format (decoded from Korean file):
  [u8 hdr_len_u16][u8 nblocks] + nblocks x [u16 block_id][u16 off_u16][u16 count]
  block 0x100 = native language, 0x200 = English (0x110/0x210 duplicates on some levels)
  record: [u16 flags|size_u16][u16 class][u32 id][u16 x][u16 y][u16 nchars][utf16 text]
  class 0x961 province, 0x962 city/county, 0x963 town/neighbourhood, 0x3e7 general place
"""
import sys, struct, pickle, collections, re
import pyarrow.parquet as pq
import egypt_build as eb
from hafp import Hafp
from hafmodel import parse, encode

D = eb.D


def load_places():
    rows = pq.read_table(D + 'division.parquet', columns=['subtype', 'names', 'population', 'geometry']).to_pylist()
    import shapely
    out = []
    for r in rows:
        n = r['names'] or {}
        com = dict(n.get('common') or [])
        name = com.get('en')
        if not name:
            prim = n.get('primary') or ''
            if prim and re.fullmatch(r"[\x20-\x7e]+", prim):
                name = prim
        if not name:
            continue
        name = re.sub(r'\s+', ' ', name).strip()[:24]
        p = shapely.from_wkb(r['geometry'])
        out.append((r['subtype'], name, r['population'] or 0, p.x, p.y))
    return out


def rules(L, sub, pop):
    """-> (class, flags) or None"""
    big = {'Cairo', 'Alexandria', 'Giza'}
    if L == 0:
        return (0x3e7, 0x2800) if sub == 'locality' and pop >= 3_000_000 else None
    if L == 1:
        return (0x3e7, 0x2800) if sub == 'locality' and pop >= 400_000 else None
    if sub == 'region':
        return (0x961, 0x0800) if L <= 4 else None
    if sub == 'locality':
        if L == 2:
            return (0x962, 0x0800) if pop >= 100_000 else None
        if L == 3:
            return (0x962, 0x0800) if pop >= 20_000 else None
        return (0x962, 0x0800)
    if sub == 'county':
        return (0x962, 0x0800) if L in (3, 4) else None
    if sub in ('macrohood',):
        return (0x963, 0x0800) if L >= 4 else None
    if sub in ('neighborhood', 'microhood'):
        return (0x963, 0x0800) if L >= 5 else None
    return None


def label_bytes(recs, four_blocks):
    recs.sort(key=lambda r: (r[0], r[2]))
    body = bytearray()
    for cls, fl, rid, x, y, txt in recs:
        t = txt.encode('utf-16le')
        size = (14 + len(t)) // 2
        body += struct.pack('<HHIHHH', fl | size, cls, rid, x, y, len(txt)) + t
    ids = [0x100, 0x200] + ([0x110, 0x210] if four_blocks else [])
    hl = (2 + 6 * len(ids)) // 2
    hdr = bytearray([hl, len(ids)])
    out = bytearray()
    for i, bid in enumerate(ids):
        hdr += struct.pack('<HHH', bid, (hl * 2 + len(body) * i) // 2, len(recs))
    for _ in ids:
        out += body
    return bytes(hdr + out)


CAP = {0: 3, 1: 20, 2: 30, 3: 70, 4: 60, 5: 200, 6: 400}


def main():
    tmpl = Hafp(sys.argv[1]); out = sys.argv[2]
    grid = eb.Grid(tmpl)
    places = load_places()
    print('places', len(places))
    lon0, lat0 = eb.LON_MIN / eb.UNIT, eb.LAT_MIN / eb.UNIT
    parcels = {}
    rid = 0x10000
    for L in range(7):
        parcels[L] = pickle.load(open(f'{D}parcels_L{L}.pkl', 'rb'))
        tw, th = grid.tile_size_deg(L)
        per_tile = collections.defaultdict(list)
        for sub, name, pop, x, y in places:
            r = rules(L, sub, pop)
            if not r:
                continue
            gx, gy = int((x - lon0) // tw), int((y - lat0) // th)
            k, _ = grid.key(L, gx, gy)
            if k not in parcels[L]:
                continue
            lx = min(eb.TW, max(0, round((x - lon0 - gx * tw) / tw * eb.TW)))
            ly = min(eb.TH, max(0, round((y - lat0 - gy * th) / th * eb.TH)))
            rid += 1
            per_tile[k].append((r[0], r[1], rid, lx, ly, name, pop))
        n = 0
        for k, recs in per_tile.items():
            m = parse(parcels[L][k])
            recs.sort(key=lambda r: (r[0], -r[6]))
            recs = [r[:6] for r in recs[:CAP[L]]]
            m['labels'] = label_bytes(recs, four_blocks=L in (3, 5, 6))
            p = encode(m)
            assert parse(p)['labels'] == m['labels']
            parcels[L][k] = p; n += len(recs)
        print(f'L{L}: {n} labels in {len(per_tile)} tiles', flush=True)
    size = eb.write_file(out, tmpl, parcels, grid)
    print('written', out, size)


if __name__ == '__main__':
    main()

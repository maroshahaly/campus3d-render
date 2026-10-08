"""HAF hafp L6 road table (byte[7]) parser."""
import struct
def road_groups(p):
    if p[7] == 0xff: return None
    t = p[7] * 2
    hd = struct.unpack_from('<H', p, t)[0]
    ng = (hd & 0x3c00) >> 10
    skip = (0 if hd & 0x8000 else 4) + (0 if hd & 0x4000 else 6) + (6 if hd & 0x100 else 0) + (8 if hd & 0x200 else 0)
    groups = []
    for i in range(ng):
        e = t + 2 + skip + i * 6
        off = struct.unpack_from('<i', p, e)[0]; cnt = p[e + 4] | (p[e + 5] & 0xf) << 8
        recs = []
        if off != -1 and cnt:
            o = t + off * 2 + 2
            for _ in range(cnt):
                sz = (struct.unpack_from('<I', p, o)[0] >> 14 & 0xffff) * 2
                recs.append((o, bytes(p[o:o + sz]))); o += sz
        groups.append((off, cnt, recs, p[e + 5] >> 4))
    return {'hdr': hd, 'skip_bytes': p[t + 2:t + 2 + skip], 'groups': groups, 'tbl': t}

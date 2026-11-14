"""Reader for MnSoft HAF .hafr routing file (Gen3)."""
import struct
class Hafr:
    def __init__(self, path):
        self.d = d = open(path, 'rb').read()
        self.nlev = struct.unpack_from('<H', d, 0x88)[0]; self.tot = struct.unpack_from('<H', d, 0x8a)[0]
        self.levels = [struct.unpack_from('<BBH', d, 0x94 + 4 * i) for i in range(self.nlev)]
        o = 0x94 + 4 * self.nlev; self.recs = []
        for i in range(self.tot):
            self.recs.append(struct.unpack_from('<iiiiHHHHII', d, o)); o += 32
        self.extra = [struct.unpack_from('<I', d, o + 4 * i)[0] for i in range(self.tot)]
    def block(self, ri):
        r = self.recs[ri]; return self.d[r[8] * 4: r[8] * 4 + (r[9] + self.extra[ri]) * 2]
    def bbox(self, ri):
        N, S, W, E = self.recs[ri][:4]; return W / 360000, S / 360000, E / 360000, N / 360000
    def table(self, ri):
        return struct.unpack_from('<16i', self.block(ri), 0)
    def misc(self, ri):
        b = self.block(ri); T = self.table(ri); M = T[13] * 2
        return b, M, struct.unpack_from('<IIBBHHHHB', b, M)

def node_coords(r, ri):
    """-> list of (lon,lat) per node"""
    b = r.block(ri); T = r.table(ri); M = T[13] * 2
    ex, ey, nx, ny, o1, o2, o3, cnt, w = struct.unpack_from('<IIBBHHHHB', b, M)
    n = struct.unpack_from('<H', b, T[1] * 2)[0]
    if w == 8:
        out = []
        for i in range(n):
            a, c = struct.unpack_from('<ii', b, M + o3 * 2 + 8 * i)
            out.append((c / 360000, a / 360000) if abs(a) < 90 * 360000 else (a / 360000, c / 360000))
        return out
    ncell = nx * ny
    corners = [struct.unpack_from('<ii', b, M + o1 * 2 + 8 * i) for i in range(ncell)]
    out = []
    for i in range(n):
        v = struct.unpack_from('<I', b, M + o3 * 2 + 4 * i)[0]
        lat0, lon0 = corners[v >> 24]
        out.append(((lon0 + ((v >> 12) & 0xfff) / 4096 * ex) / 360000, (lat0 + (v & 0xfff) / 4096 * ey) / 360000))
    return out

def node_refs(r, ri):
    """-> list per node of [(target_node, link_idx, flags, region_or_None)]"""
    b = r.block(ri); T = r.table(ri)
    n = struct.unpack_from('<H', b, T[1] * 2)[0]; res = []
    for i in range(n):
        f, a, cc = struct.unpack_from('<HHH', b, T[1] * 2 + 4 + 6 * i)
        base = (T[3] + (a * 2 if f & 8 else a)) * 2 + (2 if f & 0x10 else 0)
        nl = (f >> 8) & 0x1f; wide = bool(f & 0x8000); refs = []
        for j in range(nl):
            if wide:
                refs.append(struct.unpack_from('<HHHH', b, base + 8 * j))
            else:
                refs.append(struct.unpack_from('<HHH', b, base + 6 * j) + (None,))
        res.append(refs)
    return res

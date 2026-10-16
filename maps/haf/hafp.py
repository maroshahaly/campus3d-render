"""Reader for MnSoft HAF .hafp (Gen3) main-map file, derived from navi.exe (mimn*/mima*)."""
import struct, zlib

class Hafp:
    def __init__(self, path):
        self.f = open(path, 'rb')
        self.size = self.f.seek(0, 2)
        h = self.read(0x23c, 4)
        self.hdr_size = ((struct.unpack('<I', h)[0] >> 8) + 0x11e) * 2
        self.H = self.read(0, self.hdr_size)
        H = self.H
        self.lon_min, self.lat_min, self.lon_max, self.lat_max = struct.unpack_from('<4i', H, 0x80)
        self.center = struct.unpack_from('<2i', H, 0xa6)
        ioff = struct.unpack_from('<I', H, 0x200)[0] * 4
        isz = struct.unpack_from('<H', H, 0x204)[0] * 2
        self.I = self.read(ioff, isz)
        self.nlevels = 7
        self.levels = []
        for L in range(self.nlevels):
            b = L * 0x14
            dims = [(self.I[b + 0xe + 2*k] + 1, self.I[b + 0xf + 2*k] + 1) for k in range(4)]
            tbl = struct.unpack_from('<H', self.I, b + 0x1e)[0] * 2
            self.levels.append((dims, tbl))
        self._t3 = {}

    def read(self, off, n):
        self.f.seek(off)
        return self.f.read(n)

    def tier3(self, L, i1, i2):
        dims, tbl = self.levels[L]
        e = tbl + i1 * 8
        fileid = self.I[e + 1] & 7
        t2 = struct.unpack_from('<i', self.I, e + 2)[0]
        if t2 == -1:
            return None
        e2 = i2 * 6 + t2 * 2
        off, cnt = struct.unpack_from('<iH', self.I, e2)
        if off == -1:
            return None
        key = (fileid, off)
        if key not in self._t3:
            self._t3[key] = (fileid, self.read(off * 4, cnt * 2))
        return self._t3[key]

    def parcel_loc(self, L, i1, i2, i3):
        """Return (fileid, offset, size, compressed) or None."""
        t = self.tier3(L, i1, i2)
        if not t:
            return None
        fileid, T = t
        e = i3 * 8 + 4
        if e + 8 > len(T):
            return None
        off, sf = struct.unpack_from('<iI', T, e)
        if off == -1:
            return None
        size = sf & 0xffffff
        if size == 0:
            off, sf = struct.unpack_from('<iI', T, off)
            size = sf & 0xffffff
        return fileid, off * 4, size, (sf >> 24) & 3

    def parcel(self, L, i1, i2, i3):
        loc = self.parcel_loc(L, i1, i2, i3)
        if not loc:
            return None
        fileid, off, size, comp = loc
        if fileid != 0 or off + size > self.size:
            return None
        b = self.read(off, size)
        if comp == 1:
            b = zlib.decompress(b[4:])
        return b

    def iter_locs(self, L):
        dims, _ = self.levels[L]
        n1 = dims[0][0] * dims[0][1]; n2 = dims[1][0] * dims[1][1]; n3 = dims[2][0] * dims[2][1]
        for i1 in range(n1):
            for i2 in range(n2):
                try:
                    if not self.tier3(L, i1, i2):
                        continue
                except struct.error:
                    continue
                for i3 in range(n3):
                    loc = self.parcel_loc(L, i1, i2, i3)
                    if loc:
                        yield (i1, i2, i3), loc


# ---------------- parcel content ----------------
def u16(b, o): return struct.unpack_from('<H', b, o)[0]
def u32(b, o): return struct.unpack_from('<I', b, o)[0]

def layer_table(p):
    """Background layer table: list of (type, section_offset, length_bytes)."""
    if len(p) < 12 or (u32(p, 0) & 0x6000):
        return []
    t = (u32(p, 4) & 0xffffff)
    if t == 0xffffff:
        return []
    t *= 2
    n = p[t]
    out = []
    for i in range(max(n, 1) if n else 1):
        e = t + 2 + i * 10
        typ, off, ln = struct.unpack_from('<HII', p, e)
        out.append((typ, t + off * 2, ln * 2))
        if n == 0:
            break
    return out

def section_shapes(p, S, haf_flag80=True):
    """Yield (block_type, [(x,y),...]) for every item in a section at offset S."""
    ng = (u32(p, S) >> 23) & 0xff
    for g in range(ng):
        goff = u32(p, S + 4 + g * 8) * 2
        G = S + goff
        nb = p[G]
        for b in range(nb):
            e = G + 2 + b * 6
            n_items = p[e] | (p[e + 1] & 0x3f) << 8
            btype = p[e + 1] >> 6
            P = G + u32(p, e + 2) * 2
            h = u16(p, P)
            if haf_flag80 and btype == 2:
                k = u16(p, P + 2)
                it = P + 4 + 4 * h + 6 * k
            else:
                it = P + 2 + 4 * h
            for _ in range(n_items):
                sz = (p[it] & 0x1f) * 2
                start = u16(p, it + 2)
                cnt = p[it + 4] | (p[it + 5] & 7) << 8
                base = P + 4 if (haf_flag80 and btype == 2) else P + 2
                pts = [struct.unpack_from('<HH', p, base + (start + i) * 4) for i in range(cnt)
                       if base + (start + i) * 4 + 4 <= len(p)]
                yield btype, pts
                if sz == 0:
                    break
                it += sz

def parcel_bbox(h, L, i1, i2, i3):
    """lon/lat bbox in degrees (W,S,E,N), following FUN_0016c2bc/FUN_0017245c."""
    dims, _ = h.levels[L]
    (n1x, n1y), (n2x, n2y), (n3x, n3y) = dims[0], dims[1], dims[2]
    x1, y1 = i1 % n1x, i1 // n1x
    x2, y2 = i2 % n2x, i2 // n2x
    x3, y3 = i3 % n3x, i3 // n3x
    gx = (x1 * n2x + x2) * n3x + x3
    gy = (y1 * n2y + y2) * n3y + y3
    w = (h.lon_max - h.lon_min) / (n1x * n2x * n3x)
    hh = (h.lat_max - h.lat_min) / (n1y * n2y * n3y)
    W = (h.lon_min + gx * w) / 360000; S = (h.lat_min + gy * hh) / 360000
    return W, S, W + w / 360000, S + hh / 360000

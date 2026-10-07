"""Model-level parse/encode of HAF .hafp parcels (Gen3). encode(parse(p)) must equal p."""
import struct
from hafp import u16, u32

CELL_ORDER = [(col << 13) | (row << 10) for row in range(5) for col in range(5)]

def parse_pool(p, P, btype, nitems):
    npts = u16(p, P)
    if btype == 2:
        ntri = u16(p, P + 2); base = P + 4
        pts = [struct.unpack_from('<HH', p, base + 4 * i) for i in range(npts)]
        tb = base + 4 * npts
        tris = [struct.unpack_from('<HHH', p, tb + 6 * i) for i in range(ntri)]
        it = tb + 6 * ntri
    else:
        base = P + 2
        pts = [struct.unpack_from('<HH', p, base + 4 * i) for i in range(npts)]
        tris = None
        it = base + 4 * npts
    items = []
    for _ in range(nitems):
        sz = (p[it] & 0x1f) * 2
        items.append(bytes(p[it:it + sz])); it += sz
    return {'pts': pts, 'tris': tris, 'items': items}, it

def parse(p):
    m = {'raw_hdr': bytes(p[:u32(p, 4) & 0xff and (u32(p, 4) & 0xffffff) * 2])}
    t = (u32(p, 4) & 0xffffff) * 2
    m['hdr_len'] = t
    m['tbl_b1'] = p[t + 1]
    n = p[t]
    secs = []
    for i in range(n):
        typ, off, ln = struct.unpack_from('<HII', p, t + 2 + 10 * i)
        S = t + off * 2
        v = u32(p, S); ng = v >> 23 & 0xff
        groups = []
        for g in range(ng):
            goff, glen = struct.unpack_from('<II', p, S + 4 + 8 * g)
            G = S + goff * 2
            nb, cls = p[G], p[G + 1]
            blocks = []
            for b in range(nb):
                e = G + 2 + 6 * b
                nit = p[e] | (p[e + 1] & 0x3f) << 8; bt = p[e + 1] >> 6
                P = G + u32(p, e + 2) * 2
                pool, end = parse_pool(p, P, bt, nit)
                blocks.append((bt, pool))
            groups.append({'cls': cls, 'flag': glen >> 31, 'blocks': blocks})
        secs.append({'type': typ, 'v_extra': v & ~((0xff << 23) | 0x7fffff) if ng else None,
                     'groups': groups, 'empty_v': v if ng == 0 else None})
    m['sections'] = secs
    lt = u32(p, 8)
    m['labels'] = bytes(p[lt * 2:]) if lt != 0xffffffff else None
    return m

def enc_pool(bt, pool):
    out = bytearray(struct.pack('<H', len(pool['pts'])))
    if bt == 2:
        out += struct.pack('<H', len(pool['tris']))
    for x, y in pool['pts']: out += struct.pack('<HH', x, y)
    if bt == 2:
        for a, b, c in pool['tris']: out += struct.pack('<HHH', a, b, c)
    for it in pool['items']: out += it
    return bytes(out)

def enc_group(g):
    nb = len(g['blocks'])
    head = bytearray([nb, g['cls']])
    pools = [enc_pool(bt, pool) for bt, pool in g['blocks']]
    off = 2 + 6 * nb
    body = bytearray()
    for (bt, pool), pb in zip(g['blocks'], pools):
        n = len(pool['items'])
        head += bytes([n & 0xff, (n >> 8) & 0x3f | bt << 6]) + struct.pack('<I', (off + len(body)) // 2)
        body += pb
    return bytes(head + body)

def enc_section(s):
    if not s['groups']:
        return struct.pack('<I', s['empty_v'] if s['empty_v'] is not None else 2)
    ng = len(s['groups'])
    hsz = 4 + 8 * ng
    gb = [enc_group(g) for g in s['groups']]
    v = (ng << 23) | (hsz // 2) | (s.get('v_extra') or 0)
    head = bytearray(struct.pack('<I', v)); body = bytearray(); off = hsz
    for g, b in zip(s['groups'], gb):
        head += struct.pack('<II', (off + len(body)) // 2, (len(b) // 2) | (g['flag'] << 31))
        body += b
    return bytes(head + body)

def encode(m):
    out = bytearray(m['raw_hdr'])
    t = len(out)
    secs = [enc_section(s) for s in m['sections']]
    n = len(secs)
    tbl = bytearray([n, m.get('tbl_b1', 0)])
    off = 2 + 10 * n
    for s, sb in zip(m['sections'], secs):
        tbl += struct.pack('<HII', s['type'], off // 2, len(sb) // 2); off += len(sb)
    out += tbl
    for sb in secs: out += sb
    if m['labels'] is not None:
        struct.pack_into('<I', out, 8, len(out) // 2)
        out += m['labels']
    else:
        struct.pack_into('<I', out, 8, 0xffffffff)
    struct.pack_into('<I', out, 4, (u32(out, 4) & 0xff000000) | (t // 2))
    return bytes(out)

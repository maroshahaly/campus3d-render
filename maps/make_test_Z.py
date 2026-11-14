"""Header tests on the ORIGINAL Korean HM_LE_3d.hafp (the original is only read, never modified).

Usage:  python make_test_Z.py <mode> "D:\\K3\\SDHC\\map\\KOR_G30\\HM_LE_3d.hafp" "D:\\K3\\HM_LE_3D_<mode>.hafp"
modes:
  Z2  centre only -> Cairo (bounds stay Korean)
  Z3  bounds only -> Egypt (centre stays Korean)
  Z4  bounds moved by the smallest possible step (1/360000 degree) - checks for a hidden checksum
  Z5  bounds moved 32 degrees east (same size, still far from the car)
"""
import sys, shutil, struct

mode, src, dst = sys.argv[1].upper(), sys.argv[2], sys.argv[3]
KOR_BBOX = bytes.fromhex('0043510240fa9700000b0103402a0d01')
EGY_BBOX = bytes.fromhex('00e45700c0124b0000ac0701c042c000')
KOR_CTR = bytes.fromhex('00002561b9028427ce000101')
EGY_CTR = bytes.fromhex('00003495ab00f009a5000101')

if mode == 'Z2':
    bbox, ctr = KOR_BBOX, EGY_CTR
elif mode == 'Z3':
    bbox, ctr = EGY_BBOX, KOR_CTR
elif mode == 'Z4':
    v = list(struct.unpack('<4i', KOR_BBOX))
    v[2] += 1                                   # lonMax + 1/360000 degree (about 3 cm)
    bbox, ctr = struct.pack('<4i', *v), KOR_CTR
elif mode == 'Z5':
    v = list(struct.unpack('<4i', KOR_BBOX))
    v[0] += 32 * 360000; v[2] += 32 * 360000    # whole map moved 32 degrees east (Pacific), far from the car
    bbox, ctr = struct.pack('<4i', *v), KOR_CTR
else:
    sys.exit('mode must be Z2, Z3, Z4 or Z5')

with open(src, 'rb') as f:
    h = f.read(0xb0)
if not h.startswith(b'FORMAT_VERSION_03.05.05') or h[0x80:0x90] != KOR_BBOX or h[0xa4:0xb0] != KOR_CTR:
    sys.exit('ERROR: source is not the original Korean HM_LE_3d.hafp - nothing written')
print('copying', src, '->', dst)
shutil.copyfile(src, dst)
with open(dst, 'r+b') as f:
    f.seek(0x80); f.write(bbox)
    f.seek(0xa4); f.write(ctr)
with open(dst, 'rb') as f:
    h2 = f.read(0xb0)
assert h2[0x80:0x90] == bbox and h2[0xa4:0xb0] == ctr
print('OK -', mode, 'test file ready:', dst)

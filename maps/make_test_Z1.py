"""Test Z1: copy the ORIGINAL Korean HM_LE_3d.hafp and change only the map bounds and centre to Egypt (28 bytes).
Usage:  python make_test_Z1.py "D:\\K3\\SDHC\\map\\KOR_G30\\HM_LE_3d.hafp" "D:\\K3\\HM_LE_3D_Z1.hafp"
The original file is only read, never modified."""
import sys, shutil, hashlib
src, dst = sys.argv[1], sys.argv[2]
KOR_BBOX = bytes.fromhex('0043510240fa9700000b0103402a0d01'); EGY_BBOX = bytes.fromhex('00e45700c0124b0000ac0701c042c000')
KOR_CTR = bytes.fromhex('00002561b9028427ce000101');        EGY_CTR = bytes.fromhex('00003495ab00f009a5000101')
with open(src, 'rb') as f:
    h = f.read(0xb0)
if not h.startswith(b'FORMAT_VERSION_03.05.05') or h[0x80:0x90] != KOR_BBOX or h[0xa4:0xb0] != KOR_CTR:
    sys.exit('ERROR: source is not the original Korean HM_LE_3d.hafp - nothing written')
print('copying', src, '->', dst); shutil.copyfile(src, dst)
with open(dst, 'r+b') as f:
    f.seek(0x80); f.write(EGY_BBOX); f.seek(0xa4); f.write(EGY_CTR)
with open(dst, 'rb') as f:
    h2 = f.read(0xb0)
assert h2[0x80:0x90] == EGY_BBOX and h2[0xa4:0xb0] == EGY_CTR
print('OK - Z1 test file ready:', dst)

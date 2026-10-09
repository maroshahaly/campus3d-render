#!/usr/bin/env python3
# © 2026 Maro Shahaly — الصنّارة. يكشف بصمة الملكية غير المرئية في أي نص منسوخ:  python3 app/fingerprint.py <file.txt>
import re, sys
t = open(sys.argv[1], encoding='utf-8').read()
m = re.search('[\u200b\u2060]{16,}', t)
if not m: print('لا توجد بصمة'); sys.exit(1)
b = ''.join('1' if c == '\u2060' else '0' for c in m.group(0))
print('البصمة:', bytes(int(b[i:i+8], 2) for i in range(0, len(b) - 7, 8)).decode('utf-8', 'replace'))

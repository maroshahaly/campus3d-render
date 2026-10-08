#!/usr/bin/env python3
"""Read-only analysis of a Kia/Hyundai AVN Gen3 map SD card COPY.

Usage:  python3 analyze_map_card.py /path/to/card_copy > report.txt
Never run against the original card; it only reads, but work on a copy anyway.
"""
import collections
import hashlib
import math
import os
import sys

SIG_HINTS = (".sig", ".crc", ".md5", ".sha", ".cer", ".pem", ".key", ".ver",
             ".info", ".ini", ".xml", ".txt", ".lst", ".dat", ".chk")
KNOWN_MAGIC = {
    b"PK\x03\x04": "zip", b"\x1f\x8b": "gzip", b"BZh": "bzip2", b"7z\xbc\xaf": "7z",
    b"\xfd7zXZ": "xz", b"SQLite format 3": "sqlite", b"\x7fELF": "elf",
    b"MZ": "pe/exe", b"\x89PNG": "png", b"\xff\xd8\xff": "jpeg", b"BM": "bmp",
    b"RIFF": "riff/wav", b"OggS": "ogg", b"ID3": "mp3", b"\x00\x00\x01\x00": "ico",
    b"hsqs": "squashfs", b"UBI#": "ubi", b"-----BEGIN": "pem",
}


def entropy(data):
    if not data:
        return 0.0
    counts = collections.Counter(data)
    n = len(data)
    return -sum(c / n * math.log2(c / n) for c in counts.values())


def sample(path, size):
    # Head + middle + tail so large files are judged fairly without reading them fully.
    chunk = 65536
    with open(path, "rb") as f:
        if size <= chunk * 3:
            return f.read()
        parts = [f.read(chunk)]
        f.seek(size // 2)
        parts.append(f.read(chunk))
        f.seek(size - chunk)
        parts.append(f.read(chunk))
        return b"".join(parts)


def magic(head):
    for sig, name in KNOWN_MAGIC.items():
        if head.startswith(sig):
            return name
    return "?"


def main(root):
    by_ext = collections.defaultdict(lambda: [0, 0])
    rows = []
    for dirpath, _, files in os.walk(root):
        for name in sorted(files):
            p = os.path.join(dirpath, name)
            try:
                size = os.path.getsize(p)
                data = sample(p, size)
            except OSError as e:
                print(f"!! {p}: {e}", file=sys.stderr)
                continue
            ext = os.path.splitext(name)[1].lower() or "<none>"
            by_ext[ext][0] += 1
            by_ext[ext][1] += size
            rows.append((os.path.relpath(p, root), size, ext, data[:16], entropy(data), magic(data)))

    print("== FILE TREE ==")
    for rel, size, ext, head, ent, mg in rows:
        print(f"{size:>14,}  ent={ent:4.2f}  magic={mg:<8} head={head.hex(' ')}  {rel}")

    print("\n== BY EXTENSION ==")
    for ext, (cnt, tot) in sorted(by_ext.items(), key=lambda x: -x[1][1]):
        print(f"{ext:<10} files={cnt:<6} bytes={tot:,}")

    print("\n== SHARED HEADERS PER EXTENSION (first 8 bytes) ==")
    heads = collections.defaultdict(collections.Counter)
    for rel, size, ext, head, ent, mg in rows:
        heads[ext][head[:8].hex(" ")] += 1
    for ext, c in heads.items():
        print(ext, c.most_common(3))

    print("\n== LIKELY MANIFEST / SIGNATURE / TEXT FILES ==")
    for rel, size, ext, head, ent, mg in rows:
        if ext in SIG_HINTS or size < 4096:
            p = os.path.join(root, rel)
            with open(p, "rb") as f:
                blob = f.read(4096)
            printable = sum(32 <= b < 127 or b in (9, 10, 13) for b in blob) / max(len(blob), 1)
            print(f"--- {rel} ({size} B, ent={ent:.2f}, md5={hashlib.md5(blob).hexdigest()})")
            if printable > 0.9:
                print(blob.decode("latin-1")[:1500])
            else:
                print("  binary:", blob[:64].hex(" "))

    print("\n== VERDICT HINTS ==")
    hi = [r for r in rows if r[1] > 65536 and r[4] > 7.9 and r[5] == "?"]
    print(f"{len(hi)} large files with entropy > 7.9 and no known magic "
          "(=> encrypted or proprietary-compressed).")
    print("If almost all map files are in that list, the data is encrypted; "
          "generating compatible maps is not feasible without the key.")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])

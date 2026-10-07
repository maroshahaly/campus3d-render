# Kia K3 (YD.KOR) Gen3 AVN – reverse-engineering findings

## Platform
- Windows CE (B000FF nk.bin inside BSP.spd), CPU Alchemy Au13xx = **MIPS little-endian** (PE machine 0x166).
- Internal eMMC partitions: DiskA (apps), DiskA2 (MAP.spd → navi resources, 1.08 GB), DiskA3 (user/backup), DiskA4/5.
- `install.exe` / Update button FORMATS DiskA, DiskA2, DiskA4, DiskA5. Never run with modified files.

## Update package (SD root)
- `*.spd.000` = concatenated per-file zlib streams. `*.hdr` = "HACO STDAVN UPGRADE IMAGE" header + file table
  (utf-16 name, md5, compressed offset, usize, csize).
- `install.crc` = CRC32 list of package files only; `install.md5` = 16 bytes. Neither covers `map\`.
- `DFHEI5.dat`: 56-byte header (magic, usize 20,090,316, psize, MD5 of payload) + encrypted payload.

## Runtime map (read directly from \SD_CARD\map)
Config `Navi_sd.inf` (DiskA/application/navi):
- [MAP] HM_LE_3D.hafp, [REGION] .hafr, [HIGHWAY] .hafh, [HAFIMAGE] HM_LE.hafi, [HAFTRAFFIC] .haft,
  [HAFRESTRICT] .hafrd, [ADMIN_FILE_PATH] ADMIN/Admin.bin, [INDEX] KOR_G30/ (Address, Search, Telephone, Theme),
  [SMT_FILE_PATH] SMT/HM_LE_3d.hafsmt, [VOICE_FILE_PATH] RG_ADPCM/
- Default pos [LONG] 127 1 47, [LAT] 37 29 42.
- `md_3d_SD.xml`: render resources on DiskA2 (fonts hcr_*.fcf, styles *.mst, EGL_DATA) + HAFMMA archives on SD.
- Map/app match: `MAP_APP_MATCH_INFO_KOR.inf` = "103" on SD and on DiskA – must be equal. `mapmodule.bin` = "KOR.09.52.54.102".

## HAF format
- Header: "FORMAT_VERSION_xx.yy.zz" @0, "DATA_VERSION_..." @64.
- Shared dataset ID `05 71 2b 78` in hafp@128, hafr@128, haft@64.
- Coordinates in 1/360000 deg (hafp default center 0x02B96125/0x00CE2784 = 126.95E/37.53N).
  hafr bbox records 28 bytes: u16, u16 0x77a5, u32, u32, i32 latMax, latMin, lonMin, lonMax.
- TPEG posinfo.txt uses 1/36000 deg.
- Reader in navi.exe: modules mi/mima/mimn (parcel/mesh index, levels), rd (draw), rp (route), rg (guidance).
- Entropy: hafp 5.2, hafr 5.45, haft 4.8 → not encrypted. HAFMMA 7.7–7.9 = image/voice containers.
- navi.exe has checksum checks ("checksum check error", "Invalid version") – location TBD (maybe backup files only).

## Extracted
- app/navi.exe (6.4 MB, MIPS), MNSearch_DLL.dll, TrafficSumDrawEngine.dll, AuxMath.dll, ModelDef.xml, MD_3d_SD.XML, Navi_sd.inf

## .hafp main map – DECODED (verified by rendering Korea, haf/render.py)
- Header block size = ((u32@0x23c >> 8) + 0x11e) * 2. Bbox @0x80: lonMin, latMin, lonMax, latMax (i32, 1/360000 deg).
  Center @0xa6. Flags byte @0x94 (0x40: extra 0x100 table after header; 0x80: polygon pools have k field).
- Version check: first 32 bytes "FORMAT_VERSION_03.05.05" parsed and compared to app's expected version.
- Admin index from 0x246: 14-byte recs [u32 admin_code][u16][u16 0x100][u32 first][u16 count]; then
  name table [u8 len][u8 1][utf16 name][u32].
- Parcel index @ u32@0x200*4, size u16@0x204*2. 7 levels; level rec @ L*0x14: bytes +0xe..+0x15 = 4 tiers (nx-1,ny-1),
  u16 @+0x1e = tier1 table (u16 units). Tier1 8B: [?][fileid&7][i32 tier2 off(u16 units)][u16]; tier2 6B @ off*2+i2*6:
  [i32 file off/4][u16 len/2] → tier3 table in file; tier3 entry @ i3*8+4: [i32 off/4][u24 size | comp<<24]
  (size 0 → indirect). Empty parcel = shared 4-byte stub.
- Tile key: tier index = y*nx + x; global gx = (x1*n2x+x2)*n3x+x3, y from south. Tile spans bbox/(n1*n2*n3).
- Parcel: [u32 uncompressed][zlib] if comp==1 else raw. Header u32[0] flags (0x6000 must be 0; optional blocks
  0x1000,0x800 +2; 0x400 +4; 0x200,0x100,0x8000 +6 after offset 0xc), byte[7] = road table off/2,
  u32[1]&0xffffff = background table off/2, u32[2] = another table off/2.
- Background table: [u8 n][u8] + n×10B [u16 cell=(col<<13|row<<10)][u32 off/2][u32 len/2] (5x5 cells, 2250x1500 each).
- Section: u32[0]>>23 = groups; group g: u32 @S+4+8g = off/2. Group: [u8 nblocks][u8] + 6B blocks
  [u8 n][u8 n_hi|type<<6][u32 pool off/2]. type 2 = polygon (clipped to cell), 1 = polyline.
- Pool: u16 npts, (type2: u16 k), pts (u16 x,u16 y) local 0..11250 x 0..7500, (type2: k*6B), then items
  [b0&0x1f = size/2][..][u16 first pt][u11 count]...

## .hafr routing (partial)
- Loader FUN_00480e94 (navi.exe). Header @0: FORMAT/DATA version strings; @0x80 dataset id 0x782b7105 (same as hafp);
  @0x84 flags (bit30 = per-region extra size array present); @0x88 u16 nlevels(4); @0x8a u16 total regions(186);
  @0x94 level table 4B each [0x65][lvl<<2 (byte>>2 = level)][u16 count] -> counts 1,8,20,157 (levels 3..0).
- Region records @0x94+4*nlev, 32B: [i32 N,S,W,E (1/360000 deg)][u16 parent][u16 idx][u16 nchild][u16 0x77a5][u32 off/4][u32 size_u16]
  then extra u32 per region (u16 units). Region block at off*4, length (size+extra)*2, raw (no zlib).
- Region block: u32 table of (offset_u16, count) pairs: [1]=node table off, [2]=node count, [3]=link table off,
  [11]/[12]/[13]..., [0xb]=+0x2c sorted range table (binary search, entries (hdr byte3+0x10) bytes), [0xd]=+0x34 misc hdr.
- Node record 6B at (T[1]+2+3n)*2: u16 flags (0x1f00 = number of links, 0x8000 wide, 0x10 +2, 0x8, 0x4), u16 link-table index, u16 (&7 ...).
- Accessors: FUN_00483660/4836c4/48389c/483abc/483be0/483d18/483edc/483f50/484c90/484d34.

## Egypt build (v1, display only)
- Data: Overture 2026-09-23.1 (OSM-derived) via anonymous S3 (Geofabrik/OSM hosts blocked). /root/egypt/*.parquet
- haf/egypt_build.py -> parcels_L*.pkl; haf/labels.py adds English labels + writes final HM_LE_3D.hafp.
- Grid kept identical to Korean (32 x 21.333 deg), bbox shifted: lon 16..48, lat 13.667..35; center Cairo.
- Class/style mapping: see CATS in egypt_build.py.
- Verified: all generated parcels round-trip through parser; rendered L4 (Egypt) and L5 (Cairo).
- v1 keeps all other Korean files (hafr, haft, hafh, hafrd, search) unchanged -> routing/search won't work in Egypt.

## .hafr region block – more (session 2)
- T = 16 x i32 at block start. Pairs: (T1 node_tbl_off_u16, T2 node_count), T3 adjacency base (u16), T11 link table off (+0x2c),
  T12 (+0x30) link count/flag, T13 (+0x34) misc header off, T14 (+0x38) count. T0 flags (bit31 + small value).
- Misc @T13: [u32 45000][u32 30000] = region-local extent (4x hafp tile units), [u8 4][u8 3][u16 0xa][u16 0x30][u16 0x3a][u16 n][..]
  then boundary points as (i32 lat, i32 lon) in 1/360000 deg (region 60 origin 34.833N 128.875E).
- Node table @T1*2: 4-byte header, then 6B nodes [u16 flags][u16 adj_off_u16][u16 x]; flags&0x1f00>>8 = n links,
  0x8000 = wide (8B link refs incl. region id), 0x10 = +2 bytes, 0x08 = adj offset *4 instead of *2.
- Adjacency @ (T3 + node.adj [*2 if flag8])*2 (+2 if 0x10): n_links x 6B (or 8B) refs, then per-link extra.
- Link table @T11*2: [u16 count][u8][u8 esz-0x10] then esz-byte records sorted by u32 key (+u16 range) –
  key looks like hafp road-link id (binary search FUN_00483f50) => hafr routing depends on hafp road-link tables (L6 extended sections).
- Needed next: Seoul L6 hafp slice (extended sections / road table) + rest of hafr (regions beyond 16MB).

## Session 3: data received
- send/HM_LE_3d.hafr = FULL hafr (46,344,328 B, all 186 regions).
- send/hafp_0_41M.bin = hafp bytes 0..41.9M (L0-L4 complete, L5 1136 parcels). send/hafp_sparse.bin = same + Seoul L6 slice
  at 936101784 (+24MB, 161 parcels of tile (1,226)).
- hafr nodes: node count n = node_hdr u16[0]; T2 = 3n+3; T3 = T2+34 (relative offsets).
- L5: 511/1136 parcels have extended sections (section u32 bit31; header +8B [u32 off][u32 len] after group table)
  ext struct: "00 04 00 0d 06 00 00 00 [u32][u32 4][u32][u16 n]" then 12B records [u32 link-id like 0xf32fdd2c][u16 0x3800/0x4000][u32 off][u16 idx][u16 cnt] ... then point data.
- L6 parcels: hdr 0x41f10/0x41f11/0x41d0d (blocks 0x200,0x100 present, hdr size 0x10/0x11 u16), byte[7] road table present.
  Road table: u16 hdr (bits 0x3c00>>10 = n groups; 0x8000 clear:+4, 0x4000 clear:+6, 0x100:+6, 0x200:+8), then n x 6B
  [i32 off_u16 | -1][u16 count(12 bits)]; records at tbl+off*2+2, next = cur + ((u32>>14)&0xffff)*2. Flags decoded by
  FUN_001753ec / FUN_00178354 (bits 31,26-28,23,22,21,20,19). Records contain u16 local point lists (road geometry).

## Session 3b
- haf/hafr.py reader. hafr block: 16 x i32 T, then sections chained (verified 186/186):
  S1 nodes (T1=34,T2), S2 adjacency (T3,T4), S3 (T5,T6), S4 (T7,T8), S5 (T9,T10), S6 links (T11,T12), S7 misc (T13,T14);
  last ends at main size; then 'extra' area (size from per-region extra array). Empty section = (-1,0).
- Nodes: [u16 n][u16 m] + n x 6B, size rounded to even u16 (3n+2 or 3n+3).
- Link refs in adjacency: [u16 target node][u16 link idx][u16 flags] (+ [u16 region] when node flag 0x8000 'wide').
- Links table: [u16 nl][u8][u8 esz-16] + nl x 24B, sorted by u32 key (+u16 range); 2 regions use 16B.
- Misc (S7): [45000][30000][nx][ny][3 offsets][count] + sub-grid corner points (lat,lon 1/360000).
- haf/roadtbl.py: L6 road table parser (verified chaining). Seoul tile (1,226,863): 6 groups: 0 empty, 1:465, 2:164, 3:14, 4:83, 5 empty.
  Record: [u32 flags(14b) | size_u16<<14 | 2 flag bits][u16][u16][u16][u32 id-like][...attrs...][u16 x,y points].
- hafr link keys (e.g. 74099..1048489 in region 162) did NOT appear directly as u32 in hafp parcel -> mapping still unknown.
- Road record head u32: bits0-5 hdr_len(u16 units), bits6-13 n_sub (sub-links), bits14-29 rec size (u16), bits30-31 flags.
  Sub-records: equal size = u16@(rec+hdr*2+4)/n_sub, sub k at rec + hdr*2 + k*subsz (FUN_00178188).
  Sub-record decoder FUN_00178884 -> 0x68 struct: [4B][2B][n pairs of (u32,u32) where n=((flags>>26)&7)+1 if flag31]
  then optional fields by flags 0x800000(2+2),0x400000(4|8),0x100000(2),0x80000(2),0x40000((b>>24&3)+1)*4, ...
  flags come from FUN_001753ec(record hdr, sub). Shape pointer (FUN_00178354): rec + ((u15@+4)*2 + u16@+6)*2.
- First render of shapes (haf/seoul_roads_hyp.png) partially road-like -> point-count/extent still wrong.

## Session 4: ROAD RECORD + hafp<->hafr LINK DECODED
- Road record (L6 road table): [u32 head][u16 A=npts][u16 B=shape off (u16 units)][u32@8 ?][u32@10 ROAD ID][..to hdr_len]
  then n_sub sub-records (equal size), then shape at rec+B*2: A x (u16 x,u16 y) tile-local + bbox [minx,miny,maxx,maxy].
  Verified 726/726 (bbox == min/max of points, shape ends at record end). Render: haf/seoul_roads_v2.png (real Seoul streets).
- u32@10 = road id. hafr link records [u32 key][u16 range] cover road ids key..key+range (consecutive chain).
  Groups 0,2,3,4,5 -> 100% inside hafr intervals; group 1 (local streets, ids > max hafr key 1,051,518) not routable.
  Group 2 -> hafr level 0; groups 3,4,5 also in levels 1,2 (hierarchy).
- Adjacency ref = [u16 target node][u16 link idx (into region link table)][u16 flags/cost bits] (+[u16 level-0 region idx] if node wide 0x8000).
  Verified: node 152 -> (153, link 3401) and node 153 -> (152, link 3401); nodes' links share road endpoints (168 nodes, rest = data outside slice / tile-split roads).
- Link record 24B: [u32 first road id][u16 range][u16 class/flags e.g. 0x40b0][u16 0x0a00][u16 ?][u16 ?][u16 ?][u16 0xffff][u16 0/1]...
  length not directly in u16@6..14 (corr < .4) -> cost in bitfields/other table (TODO).
- NODE COORDS (verified, median err 1.8 m): misc S7 = [u32 ex=45000][u32 ey=30000][u8 nx][u8 ny][u16 o1 corners][u16 o2][u16 o3 nodes][u16 cnt=2n][u8 4]
  ex,ey = region size in 1/360000 deg (0.125 x 0.0833 for level-0 region 162). Node u32 @ misc+o3*2+4i:
  x=(v>>12)&0xfff, y=v&0xfff  (scaled 4096 over ex/ey from region SW corner), bits 24+ = cell (0 seen).
- Adjacency block per node (98% exact): [2B if f&0x10][nl x 6|8][ (cc>>8) x u16 turn codes ][u16 if cc&7][u16 if f&4][u8 k][u8 n][k x u16][n x u32]
  (rare: flag 0x20 shared blocks, flag 8 = adj offset*2 -> avoid when generating).
- Extra area after main: table of (u32 off_u16,u32 size_u16) pairs chained; sec0 = per-link shape index for route line
  (FUN_00484550: entry width byte@0x12 (2 or 4); 0xffff = straight between nodes) ; sec1/sec2 = optional sorted 6B lookup tables
  (count @+0x10 15 bits, entries @+0x14; count 0 => feature absent).
- FULL GRAPH DECODED & RENDERED (haf/korea_hafr_L0.png 1,064,299 edges; L1 129,546; L2 54,297):
  misc nx x ny = grid of corner points (lat,lon i32) listed row-major (lat rows); node cell = v>>24 indexes corner list;
  node pos = corner + (x/4096*ex, y/4096*ey) in 1/360000 deg. Region 29 (w=8, nx=ny=0): node entries are 8B (i32 lat?, i32 lon).
  hafr.py: node_coords(), node_refs().

## Session 5: semantics for generation
- Node table hdr: [u16 n][u16 m = total link refs].
- Node flags: 0x6000 junction (nl>=3 mostly), 0x4000 through/dead-end (nl 1-2); 0x8000 border(wide); 0x80 turn table; 0x40, 0x20 rare.
- Turn codes (cc>>8 count): u-turn entries per link (i<<11)|(i<<6)|0x3f e.g. 0x3f,0x87f,0x10bf,0x18ff; dead-end nl=1: 0xf81f,0x7df.
  then [u8 k=0][u8 n=0] for normal nodes.
- Adjacency flags u16: bits0-7 heading (256 = 360deg, corr .845 with straight bearing), bits 8-10 small attr (0-3),
  bit13 = direction along link, bits14-15 access: two-way ends (6,7); one-way pairs (4,3) or (2,5) in hi3 = flags>>13.
- Link record 24B: [u32 first road id][u16 range][u16@6 class bits (0x90/0x80/0xb0 + hi 0x20/0x40/0x50)][u16@8 bits11-15 level code
  (L1=3, L2=4; L0 varies 1/2/4)][u16@10 type/speed bits][u16@12 LENGTH METERS][u16@14 ?][u16@16 0xffff][u16@18 small][u32@20 0].
  Typical per (level, road group) tuples printed in session (e.g. L0 group2: 0x80/0x800/0xc860; group4: 0x2090/0x800/0x8514; group5: 0x40b0/0x1000/0x8544).
- Road groups: 1 local (non-routable, ids > hafr max), 2 collectors, 3 national?, 4 major (orange), 5 highways, 0 ferry?.
- Road record header: hdr_len 16 or 18 B; bytes 8-9 group-specific code (g1 0x9e00/0xae00/0x9e40, g2 0x8e80/0x8ec0, g4 0x5e80, g5 0x18d0..)
  sub-records (18/22/26/30 B): [u8][u8 class 0x10/0x20/0x40][0x10][flags 0/0x40/0x80][u16 size][u16 from_node][u16 to_node]...
  from/to are tile-local node ids (consecutive) -> hafp tile has its own node numbering (TODO: where node table lives: hdr blocks 0x200/0x100?).

## Session 6: device boot loop with v1 ("Preparing Navigation" -> reboot)
- v1 tiles far exceeded Korean complexity: max pts/pool L2 24805 vs KOR 2722; L5 bytes 1.88MB vs 413KB.
- Korean max per level (n, maxbytes, pts/cell, pts/pool, items/pool): L0 (4,184556,8512,6199,88) L2 (17,255448,4159,2722,579)
  L3 (49,215204,2402,1038,224) L4 (574,65000,602,382,61) L5 (2150,412716,1197,795,173) L6-Seoul (4923 pts/cell, 2599 pts/pool, 401 items/pool).
- v1.1: egypt_build.too_big(): BUDGET bytes + MAX_POOL_PTS 2400, MAX_POOL_ITEMS 400, MAX_CELL_PTS 4000, degrade deg 1..8.
- Parcel headers verified same as Korean background-only type (0x41c0a, byte7=0xff no road table) -> also exists in KOR L6.
- Diagnostic files: test_C_empty.hafp (header+index, all stubs, 110KB), test_D_L0-3.hafp (only L0-L3, 5.1MB).
- v1.1 built: polygon parts exploded + tiny parts/holes dropped (amin*4^deg), labels capped per level CAP={0:3,1:20,2:30,3:70,4:60,5:200,6:400}
  sorted by class then population. Max bytes per level now L2 104K, L3 186K, L4 63.6K, L5 296K, L6 188K (all <= Korean max).
  /root/egypt/HM_LE_3D_v11.hafp 312,439,140 B MD5 ca40978c8ccd6f5fcbc069ca53f0678d; zip MD5 1584ef5898b9f153d4896a0e601dd20e (5 parts in parts11/).
- v1.1 ALSO boot-loops on device (user report). Size is NOT (only) the cause.
- Navi_sd.inf: [WATCH_DOG_TIMER] 6000, [DEBUG_WATCH_DOG] 1 -> NaviAliveChecker.exe reboots if UI thread blocks >6s.
  CNaviWidget::Draw first MD draw retries up to 10x Sleep(1000) when draw result (FUN_00131100 -> FUN_0017d134 imdDrawMap) not 0/1 -> blocks >6s.
- Header/index diff vs Korean: ONLY bbox @0x80..0x8f and center @0xa6..0xad differ; level records + rest of header byte-identical.
- MAP.hdr covers only DiskA2 files (no SD map files) -> no checksum on hafp there.
- Diagnostic pack tests2/Egypt_Tests2.zip (MD5 179fef01...): 1_C_empty, 2_K_korean_tiles (real Korean parcels w/o road table cycled into Egypt slots),
  3_E_noL6 (v1.1 L0-L5), 4_D_L0-3. Awaiting device results.

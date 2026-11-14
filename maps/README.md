# Kia K3 (Gen3 AVN, Hyundai MnSoft HAF format) – Egypt map generator

- `haf/` – Python tools: `hafp.py` (map reader), `hafmodel.py` (parcel parse/encode, byte-identical round trip),
  `egypt_build.py` (builds Egypt .hafp from Overture Maps data), `labels.py` (English labels + final write),
  `hafr.py` / `roadtbl.py` (routing file + L6 road table readers), `verify*.py`, `render.py`.
- `ghidra/` – headless Ghidra scripts used to decompile navi.exe.
- `docs/FINDINGS.md` – full reverse-engineered format notes and device test log; `docs/*_AR.*` – Arabic install/test guides.
- No map data or firmware binaries are stored here.

Status: v1/v1.1 boot-loop on device ("Preparing Navigation" -> reboot); diagnostic test pack (tests2) awaiting results.

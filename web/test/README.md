# JS ↔ Python 一致性测试

## Project restoration, facade and plaza editing

`node web/test/batch-delete.cjs` exercises the actual viewer batch-delete and
history commands with the real generator. Batch deletion and its undo/redo use
full composition, matching project reopen: trees present in the saved ground can
return, explicit greenery clear layers still apply, and unselected placed trees
remain. Single deletion uses the same rebuild and tagged undo/redo snapshots.
`node web/test/batch-delete-browser.cjs` additionally covers real worker/sync
commands, selective deletion, tree clearing overlays, project reopen and actual
schematic downloads. It uses the same optional Playwright/browser variables below.

`node web/test/single-object-worker.cjs` checks single horizontal movement through
the actual worker handler: incremental collision checks decide acceptance before
rebuilding from saved ground. Both composition orders, missing state, tree clearing
and the default incremental path are covered. `node web/test/single-object-browser.cjs`
checks worker/sync movement and deletion, queued key repeats at collision boundaries,
queued undo/redo, real houses and a large Baroque cathedral, project reopen and
schematic exports. Movement, deletion and their history intents run in order;
other generator parameters and ordinary incremental edit calls are unchanged.

After `python build_viewer.py`, run `node web/test/project-plaza-facade.cjs`.
This checks returned cathedral specs, incremental well edits versus a full rebuild,
and real collisions with roads, houses and another well. Set `MCGEN_BASELINE` to
an unchanged checkout to additionally compare generated block geometry.

Run `node web/test/project-browser.cjs` with Playwright installed to check project
open/save/export, manual and automatic scenes, legacy projects, and well editing
with undo/redo and collision rollback. Both workers and the synchronous fallback
are exercised. `PLAYWRIGHT_MODULE`, `BROWSER_EXE` and `REGRESSION_OUT` optionally
select an existing Playwright package, browser executable and output directory.

## Texture import regression tests

Requires Node.js, Playwright, Microsoft Edge, and Python for ZIP fixtures.
Run from the project root:

```powershell
python web/test/make_texture_fixtures.py
node web/test/texture-browser.cjs out/texture-tests/stored.zip out/texture-tests/game.jar out/texture-tests/legacy.zip out/texture-tests/nested.zip out/texture-tests/flat.zip
node web/test/texture-browser.cjs "D:/美术参考/assets" "D:/美术参考/Whimscape_26.1-26.3_r2"
```

The browser tests check actual GPU texture layers, decoding failures, WebGL errors,
texture toggling, overlapping pack loads, and IndexedDB restoration. ZIP fixtures
contain a generated solid-color PNG; no game textures are bundled.
The regression was concurrent model indexing clearing decoded images before GPU
upload. Indexing must finish before the first mesh rebuild starts image decoding.

Imports now resolve texture names from the block palette before meshing, so a
pack change builds geometry once. File reads, ZIP decompression and image decoding
run through an eight-worker queue. Replaced ImageBitmaps are explicitly closed,
and persistence connections close when their transactions finish.

The browser test also alternates packs 20 times, checks read/decode concurrency,
and verifies that only the current pack's decoded bitmaps remain open. Set
`TEXTURE_BROWSER=chrome` to use Chrome instead of Edge. For per-sample timing:

```powershell
node web/test/texture-profile.cjs "D:/美术参考/assets" "D:/美术参考/Whimscape_26.1-26.3_r2"
```

### Chrome exits after textures appear

Local Chrome crash metadata on 2026-10-29 identified `ptype=browser` and
`0xe0000008` (out of memory), including a failed allocation of `0xcdec0004`
bytes. The user reported exit after rendering. This points to investigating the
post-render cache write; it does not by itself prove which Chromium function
requested the allocation. The native exit was not reproduced in isolated tests.

The legacy cache stored the entire pack as native File/Blob references in one
IndexedDB record. The replacement `mcgen-textures-v2` cache stores deduplicated
ArrayBuffer records in batches of eight and publishes a plain metadata manifest
only after all writes finish. Saves are serialized and superseded saves cancel.
The old database is left untouched and is no longer read; users must select their
pack once after upgrading. No browser profile or global settings are changed.

The browser regression checks wait for the full pack to finish saving, verify
the record count and byte-based format, and restore the entire pack before the
switching stress test. `chrome-crash-summary.py` reads exception/module metadata
from the four newest local Chrome dumps; it does not upload dumps or print page
memory. Stack module candidates are not a symbolized or unwound call stack.


在项目根目录运行：

```bash
python -X utf8 web/test/make_specs.py   # 生成 292 组参数（全部示例 + 随机组合：户型、屋顶、斜放、功能、配色、混色）
python -X utf8 web/test/py_run.py       # Python 版生成，结果写入 web/test/py.json
node web/test/js_run.js         # JS 版生成并逐格比对方块和报告
```

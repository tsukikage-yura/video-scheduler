# Assets — 成员可用的画笔库（Draw Kit）

> 来自 2026-10-10 卡通绘制实验（100 个对照实验）的公共产出。
> **成员创作时可直接复制使用**，不必从零写绘制原语。

## lib/ — 绘制原语库

| 文件 | 内容 |
| --- | --- |
| `kit.txt` | 公共函数：`hashi` / `vnoise` / `fbm` / `ridged` / `voronoi` / `rng` / `ramp` / `field` / `grain` / `vignette` / `warmLight` / `roundedPolyPath` / `blobPath` / `fuzz` |
| `lib.js` | 版式/颜色/路径基元：`taperStroke`（变宽描边）/ `shadowOf` / `lightOf` / `headPath` / `torsoPath` / `eye` / `limb` / `plate` / `sideShade` / `groundShadow` |
| `face.js` | 表情系统：`drawFace(expr("confused"))` / `lerpExpr(a,b,t)`，约 20 标量参数驱动 14 种情绪 |
| `RECIPE.md` | 材质配方速查 |
| `shoot.mjs` | 截图工具（playwright-core + chromium headless shell） |

## lib/genshin/ — 2.5D 分层过场库（原神式，2026-10-11 实验产出）

| 文件 | 内容 |
| --- | --- |
| `architecture.js` | **哥特建筑库**（32KB）：拱形（双心尖拱/火焰式/archPt 参数化取点）、母题（circlesUnion/roseWindow/fleurDeLis/vineScroll/meander）、构件（drawColumn 带 entasis/drawWindow/drawArchivolt/drawBalustrade）、透视（makeCam/floorGrid） |
| `scene-gen.mjs` | **场景生成器**（38KB）：9 个可插拔模块 + 4 套调色板 + 15 个场景配置；新增场景 = 加一行配置 |
| `light-engine.js` | **光效引擎**（18KB）：冷暖比例/光柱四层/窗光/光池/暗角/bloom |

**用法**：详见 `../references/technique-recipes.md` §19（2.5D 分层过场，含全部量化参数）。

---

## notes/ — 方向总结

| 文件 | 内容 |
| --- | --- |
| `character-summary.md` | 角色造型方向总结（15 实验） |
| `material-summary.md` | 材质质感方向总结（15 实验） |
| `genshin/_G1-summary.md` | 哥特建筑语汇总结 |
| `genshin/_G2-summary.md` | 分层与视差总结（四个差） |
| `genshin/_G5-summary.md` | 角色处理总结（含诚实边界） |
| `genshin/_G6-summary.md` + `_G6-techniques.md` | 完整场景合成总结 + 技法总表 |

## 用法

```text
1. 把 kit.txt / lib.js / face.js 内联进成员的自包含 HTML（或直接复制函数）；
2. 技法细节查 ../references/technique-recipes.md（§8-§17 是实验验证的配方）；
3. 截图用 shoot.mjs；
4. 注意：kit.txt 是 .txt 而非 .js —— 因为实验用 build.mjs 把多个片段内联成自包含 HTML。
```

## 注意

- 这些库**不是强制依赖**：成员可按需取用，也可自己写；
- `kit.txt` 里的函数默认按 1920×1080 调过参数，**换尺寸需重调频率**（见 technique-recipes §13.4）。

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

## notes/ — 方向总结

| 文件 | 内容 |
| --- | --- |
| `character-summary.md` | 角色造型方向总结（15 实验） |
| `material-summary.md` | 材质质感方向总结（15 实验） |

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

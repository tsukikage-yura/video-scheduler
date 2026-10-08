# Changelog

**Video Scheduler**（前身：Universal Realtime Music MV Skill）的版本史。

版本号遵循 `MAJOR.MINOR.PATCH`。条目按 **实际交付的 `scheduler/SKILL.md` 内容** 归类；
无归档产物的版本明确标注为 *reconstructed*，不以"已验证"呈现。

---

## [0.1.0] — 2026-10-08 · 调度器架构首发

> ⚠️ **未经验证**：本版未经端到端实测；最佳运行环境 **DSH**；想测试请自行估算价格。

### ⚠️ 上一版问题申明（为什么重写）

**上一版（双 skill 分工版，v2.4.x）与调度器早期版的实证问题：**

| # | 问题 | 证据 | 本版对策 |
| --- | --- | --- | --- |
| 1 | **缺"设计师/导演"角色**——只有工程纪律，没有视觉设计指导 | v2.4.1 公告（缺设计师角色）；风格适配器 7/8 只有 6-8 行关键词 | 调度器解压阶段含风格决策（20-50 候选 → 三维打分 → 随机定稿） |
| 2 | **丢失歌词语义理解**——直接从素材跳到风格打分，对"词汇表"反应而非对"语义"反应 | 动画11《world.execute(me);》做成"电路板"（把 execute/program 当意象）；动画12《In Hell We Live, Lament》做成"钟表地狱"（抓 clock/tick） | 新增 **§1.2 意象分析**（硬步骤，先于风格决策）：载体词 vs 意象判别 + 客观信号强制联网查证 |
| 3 | **画面不灵动、像本地播放器**——只有数据展示，没有演出 | 动画8 实测反馈（"一点也不灵动，像做了个本地音乐播放器"） | `references/camera-animation-craft.md`：每镜必须有被动机的运镜 + 经典动画原理 + reads 计时 + 每场景有事件 |
| 4 | **成员产出不可控**——模型自由发挥时跳过流程 | 动画8 脚本仅 54 行、未逐词设计 | 设计足迹门槛（文件或思考链至少一处）+ 参数清单（8 项具体值）+ 逐词画面表 |
| 5 | **外部评分模型不稳定** | Jev 持续 422，space-bunny 兜底也不稳 | **取消外部 judge，改模型自判**（留痕于 `style_decision.json`，随机用确定性 seed） |

### 新增 —— 调度器三阶段

- **第一阶段 解压**：意图识别 → **意象分析（1.2，硬步骤）** → 依赖补足 → 正式解压五小步（索引表A → 总体风格 → 局部风格 → 动画细节 → 运镜设计）→ 主风格颗粒度软规则（1.5）
- **第二阶段 调度**：3-5 槽位池分成员 → 成员隔离创作（只读批准素材 + 创作纪律摘要，可批判主 agent）→ 文件审计（固定清单）→ 拼接两路（路2 微调成员优先）
- **第三阶段 成品**：审计通过 + 拼接完成 → 交付资源清单 + 成员产出目录 + 审计记录 + 已知问题

### 新增 —— 意象分析（`references/imagery-analysis.md`）

- 两条路径：素材少→**主体联想**（列 2-3 候选并标假设，缺资料则联网/问用户）；素材多→**深层涵义解析**（默认必做）
- **载体词 vs 意象**判别表 + 两条检验（换同义词情感变没变 / 只按字面做情感成不成立）
- 文案打分：表面意思 ≤50 / 文案美感 ≤40 / 多重解读 ≤10
- 客观触发信号 6 条（技术词密集 / 双关 / 文化引用 / 歌名是句子片段 / 多语言 / 专辑背景）
- 门槛：无意象分析 = 风格决策不合格

### 新增 —— 运镜与动画工艺（`references/camera-animation-craft.md`）

蒸馏自 Opus 5.5 参考作品（ClaudeAnimationBase `ANIMATION_GUIDE.md` + PDoomVideo `STORYBOARD.md`）：
运镜（push/pull/pan/tilt/whip/shake/ride，且必须被动机）、动画原理（anticipation / squash-stretch / arcs / follow-through / anti-twinning / exaggeration）、reads 计时、每场景有事件、handmade 手感。

### 新增 —— 成员任务模板（`references/worker-prompt-template.md`）

隔离创作契约：成员只读调度器批准的素材 + 创作纪律摘要，按编号入目录，附抽帧，可批判主 agent。

### 移除

- `scripts/jev-free.mjs`、`scripts/judge.mjs`（外部评分模型方案，实测不稳定，已弃用）

---

## 历史（前身：Universal Realtime Music MV Skill）

## [2.4.0] — 2026-10-04

**证据来源：** 真实运行反馈（*"这个模型就知道猛猛干，什么都不问"*）、`world.execute(me)`
生产实录（[`Galen563/world.execute-me`](https://github.com/Galen563/world.execute-me)）以及
蒸馏进 `skill-patch-reference.md` 的 TUI MV 构建日志（单曲 6 轮交付、v1 因没有镜头脚本被
整版推翻、词级同步验收、13 处缺口审计 → 0）。

### 新增 —— 分批审批交付流程（SKILL.md 核心，开放式请求强制执行）

- **S-A 歌词分析** —— 在**任何视觉设计之前**，把整份歌词从头到尾分析完（字面义、语义角色、
  重复句组、对立词对、结构），产出可读文档。分析永不等审批；设计必须等。
- **S-B 分批设计** —— 演出设计一次只覆盖**一批约 10 句连续歌词**（Agent 声明具体批大小，
  按密度大致 6–14 句）。绝不一次设计整首歌。
- **S-C 每批一次用户审批门** —— 批次方案在**产出任何阶段产物之前**呈现；批准即锁定决策、
  驳回则重新提案、无回应走 § 21.10 兜底（默认值 + provisional + 可逆），明确说"直接干"
  本身也记为一条锁定的范围决策，但交付仍按批次进行。
- **S-D 逐批产出** —— 每批产出产物 + 同步审计结果，以
  `designed → approved → produced → audit gaps → open questions` 收口。
- 排序规则，以及与 S0–S9 状态机的显式映射（§ 27.1：S1–S3 每曲一次，S4–S8 每批准批次
  一次，S9 最后一次）。
- `§ 1.1` 硬化：渲染器内 `audio.currentTime` **只读**；`syncOffset` 加在**时钟**上，
  而不是显示的数字上。

### 新增 —— 实战蒸馏规则进 `references/`（均标注 *Added in v2.4.0*）

- `music-visual-mapping.md` —— **词级时间轴**（音节数比例切分 → ≤600ms 窗口内吸附 onset、
  单调约束；卡拉OK点亮与舞台切换共用一条时间轴：*词唱到才亮灯*）；**对立概念必须各自
  成形**（给同一张图换标签不叫演出）；**歌词时间与音乐网格保持两套来源**。
- `architecture.md` —— **歌词显示寿命** `min(间隔, 0.8 + 字数×0.09)` 秒、唱完即清
  （残留歌词 = TIMING 缺陷）；**held cue 在查找时解析**（验证规则：*每条 cue 都必须
  解析到一块画板*）；重复句组经参数化工厂 + 共享常量读作**同一个实体**。
- `workflow.md` —— **镜头脚本是硬交付物**（落盘文档 ↔ 代码镜头表逐行对应）+ **环境陷阱
  附录**（中文 drawtext、同源加载、形状检查 fail loud、数学效果的可见验收物、重渲染不进
  git、先解析再写入的批量编辑）。
- `validation.md` —— 覆盖率必须证明"**画出来了**"而非"注册了"；锚点词映射表让**构建**
  失败而不是首映失败；**三层同步审计门禁** `关键词 → 场景 → 镜头` 以 `REMAINING GAPS: 0`
  收口，有缺口时**带着清单**向用户提一次短问题；视觉验收的**字节级 sha 旁证**、**帧内
  时间戳**、**无静止帧扫描**，以及**先验证验证器**再怪作品。
- `visual-system.md` —— **分层隔离的接管**（只盖演出区，歌词与传输条保持可读）；**凡是
  打开的都必须有退场**；**歌词画板绝不拖过自己的句尾**；母题第二次出现**复用已建立的
  语言**。
- `reference-analysis.md` —— **仓库卫生**：版权音频、成片、重渲染与运营文档一律不进 git；
  首推**之前**就想清楚。

### 状态

- ⚠️ 规则蒸馏自真实生产证据，但**本次修订本身尚未在全新会话里端到端跑过**；2.2.0 仍是
  拆分前 skill 的实测基线。

---

## [2.3.0] — 2026-10-03

Verified against the shipped artifact `realtime-music-mv-universal-skill-v2.3.0.zip`
(`SKILL.md`, 54 765 bytes, 2 191 lines, frontmatter `version: 2.3.0`).

### Fixed — interactive question tool payload (found in real host failures)

Root cause: a long `question` field can prevent constrained host UIs from rendering the
options at all. 2.3.0 separates the two channels:

- **Full context lives in the normal agent message** — question, why it matters, options
  with consequences, recommended default, reply format. The interactive tool carries only
  a short header, a short decision index and concise options.
- The tool's `question` field is an **index**, not a copy of the natural-language question.
  Never put `[WHY IT MATTERS]`, `[RECOMMENDED DEFAULT]`, `[REPLY]`, long rationale,
  reference analysis or implementation rationale into it.
- UI-safety size budgets: decision index ≤ 32 CJK characters, header ≤ 12, option label ≤ 24,
  option description ≤ 60 when supported. These are *payload* budgets — context is **moved
  out of the tool, never deleted**.
- New enforcement subsection **§ 27.4 "Interactive tool payload / UI safety"** (§ 27.5–27.15
  renumbered accordingly), extended question-quality checklist, stable semantic `id` per
  decision, and a North-star addition: *the host UI is a delivery constraint, not the product*.
- No duplication: the message carries meaning, the tool carries selection.

### Note — a planned bullet does not exist in the artifact

The release brief for 2.3.0 also mentioned *"the recommended option no longer has to be
listed first"*. **No such rule exists anywhere in the shipped 2.3.0 `SKILL.md`** (verified
by search). Per project policy — actual content wins, never invent history — it is *not*
recorded as a change. If intended, it must be written into the Skill first.

### Changed — repository structure (this repository)

- Monolithic `SKILL.md` split into an entry point + `references/` (7 files):
  - **kept in `SKILL.md`**: § 0 mission / north-star, § 1 temporal invariants, § 2 request
    compiler, § 17 worked example, § 18–20 quality / final definition / lineage, § 27
    operational enforcement protocol (L0–L3, audits, ordering, shared `render(t)`, replan,
    severity, completion gate), § 28 audit invariants, § 29 mission check — plus a compact
    restatement of every moved rule (*Core rules carried by references*) and a reference map;
  - **moved verbatim**: § 3–§ 16 and § 21–§ 26 → `references/architecture.md`,
    `workflow.md`, `visual-system.md`, `music-visual-mapping.md`, `reference-analysis.md`,
    `decision-protocol.md`, `validation.md` — original section numbers preserved;
  - exactly two pointer adaptations (the § 2.1 image-inspection bullets move to
    `reference-analysis.md` while their core rule stays in `SKILL.md`; the § 27.5 reference
    to "Section 23" now links `references/workflow.md`);
  - fidelity verified by line-multiset comparison against the shipped artifact:
    **0 lines lost, 0 lines duplicated, all cross-links resolve**.
- Added `README.md` (English), `README.zh-CN.md`, `examples/`
  (minimal / terminal-tui / lyric-driven), and `docs/readme_ai.md` (original document
  preserved instead of overwritten).

### Status

- ⚠️ **Not yet field-tested.** 2.3.0 fixes the 2.2.0 known issue but has not been verified
  in real runs. Until it is, **2.2.0 remains the field-tested baseline**.

---

## [2.2.0] — 2026-10-02

Verified against the shipped artifact `realtime-music-mv-universal-skill-v2.2.0.zip`
(`SKILL.md`, 49 730 bytes, 2 087 lines, frontmatter `version: 2.2.0`).

### Added — Mission Lock

- **North-star rule**: *"The purpose of this Skill is to help an agent make the user's music MV, not to make the agent's architecture look impressive."*
- **Mission-preservation check (§ 29)**: every abstraction must answer *what part of the user's MV does this improve / what evidence says it needs to exist / could the same result be achieved more simply*, plus anti-drift guard and *"no architecture for architecture's sake"*.

### Added — operational enforcement protocol (§ 27)

The design principles became explicit agent-execution rules with priority over vague defaults elsewhere:

- execution state machine `S0 INSPECT → … → S9 COMPLETION GATE`;
- decision levels **L0 / L1 / L2 / L3** with default behavior (`decide / default / default / ask and wait`);
- question budget and precision rules;
- **input audit** (audio, lyrics, references, MIDI/analysis) before visual implementation;
- **existing-project audit** — reuse compatible abstractions, replacement only when documented;
- event model: timestamps **non-decreasing**, stable ordering by `(time, priority, stableOrder)`;
- **preview / playback / offline export share one `render(t)` pipeline** (`t = frameIndex / fps + syncOffset`);
- **replan trigger** on dominant-style / layout / temporal / asset / renderer changes;
- **defect severity** `BLOCKER / HIGH / MEDIUM / LOW`;
- **completion gate** (9 checks) + **stop condition** (no infinite polishing);
- user-locked priorities override the default quality hierarchy;
- multi-reference conflict order: explicit instruction > primary reference > shared grammar > secondary > agent inference;
- deterministic time model (seconds canonical, no accumulated frame deltas).

### Hardened

- Determinism split into **state determinism** and **render determinism** with an explicit test procedure (§ 13.4).
- Deterministic randomness (`seed(sceneId, eventId, elementId)`), no uncontrolled `Math.random()` (§ 1.2).
- **Audit invariants (§ 28)**: compact pre-completion checklist grouped as TEMPORAL / INPUT / DECISIONS / ARCHITECTURE / VISUAL / QUALITY.

### Known issues

- 🐞 **Interactive question payload too long** (found in real agent runs): when the agent passes the whole `[DECISION] / [WHY IT MATTERS] / [OPTIONS] / [RECOMMENDED DEFAULT]` block inside an interactive question tool's `question` field, some host UIs cannot render the options at all. Workaround on 2.2.0: put the full context in the normal agent message and keep the tool payload short. **Fixed in 2.3.0.**
- ✅ **Otherwise field-tested**: 2.2.0 is the baseline version confirmed working in real runs.

### Note on sources

Two descriptions of 2.2 exist in the project record: the original project document calls it *"adds the Mission Lock (Skill 是缰绳，不是目标)"*, while the release brief also credits *"enhanced determinism, input audit, existing-project audit, replan, completion gate"*. **Both claims are verifiable in the shipped 2.2.0 artifact** (North-star rule + § 27.4–27.10), so both are recorded instead of choosing one.

---

## [2.1.0] — date unknown · *reconstructed*

- Agent execution workflow (phases / build steps / behavior contract).
- Decision boundary and severity levels.
- Input audit, existing-project audit, determinism rules.
- Validation mechanism introduced as a first-class concern.

*Source: `docs/readme_ai.md` and the release brief. No archived 2.1.0 artifact is available for verification.*

---

## [2.0.0] — date unknown · *reconstructed*

- **Universal Skill-ification** of the original realtime MV methodology:
  - style adaptation / style-agnostic architecture;
  - scene & plate system;
  - lyrics as events;
  - music coupling;
  - validation;
  - open-ended prompt compilation (vague request → Specification).

*Source: `docs/readme_ai.md`. No archived 2.0.0 artifact is available for verification.*

---

## [1.x] — date unknown · *reconstructed*

- Original realtime MV methodology distilled into a minimal pipeline:

  ```text
  audio → time → visual state → render
  ```

- Realtime, deterministic, lyric-driven, time-based, code-rendered — principles
  distilled from the documented design of
  [`Galen563/world.execute-me`](https://github.com/Galen563/world.execute-me).

*Source: `docs/readme_ai.md`. No archived 1.x artifact is available for verification.*

---

[2.4.0]: https://github.com/13055751/realtime-music-mv-skill/releases/tag/v2.4.0
[2.3.0]: https://github.com/13055751/realtime-music-mv-skill/releases/tag/v2.3.0
[2.2.0]: https://github.com/13055751/realtime-music-mv-skill/releases/tag/v2.2.0

# 技术方案：docs/specs 按模块组织

| 项 | 内容 |
| --- | --- |
| 状态 | Draft |
| 作者 | opencode |
| 日期 | 2026-11-01 |
| 版本 | v0.1 |
| 关联 | — |

## 变更记录

| 版本 | 日期 | 变更 | 作者 |
| --- | --- | --- | --- |
| v0.1 | 2026-11-01 | 初稿：docs/specs 按模块拆分与索引门禁方案 | opencode |

## 1. 背景与问题

目前 `docs/specs/` 是平铺目录，所有技术方案都在同一层：

```
docs/specs/
├── README.md
├── restrict-cross-route-imports.md
├── restrict-kebab-case-filenames.md
├── ai-quality-gates.md
└── agent-hook-gates.md
```

问题会随文档数量增长而放大：

- 架构、命名、质量门禁、业务功能混在一起，无法按主题浏览
- `docs/index.md` 必须逐个列出每个 spec 文件，新增/移动文档时容易漏改
- 文件名没有模块语境，`gates`、`restrict-*` 这类词会越来越多且互相无关
- 后续按模块 review、归档、找 owner 都会变困难

## 2. 目标与非目标

**目标**

- `docs/specs/` 按稳定模块分目录，一层模块 + 模块内文档
- 每个模块有 `README.md` 作为该模块的索引与范围说明
- `docs/index.md` 只维护模块入口，不再逐个维护 spec 文件
- 门禁能校验「模块有 README」「文档被模块 README 收录」「spec 元数据完整」
- 迁移现有文档，保持链接可控、可回滚

**非目标（本次不做）**

- 不按「状态」分目录（Draft / Approved / Implemented），避免状态变化导致文件移动
- 不按「一个需求一个目录」拆分，避免大量只含一个文件的空目录
- 不引入外部文档系统或静态站点
- 不改变 `docs/.template/`、`docs/harness/` 的现有职责

## 3. 目录结构方案

```
docs/specs/
├── README.md                     # 模块总索引：模块范围、状态图例、新增规则
├── architecture/                 # 架构与依赖边界
│   ├── README.md
│   └── restrict-cross-route-imports.md
├── conventions/                  # 代码 / 命名 / 文档约定
│   ├── README.md
│   ├── organize-specs-by-module.md
│   └── restrict-kebab-case-filenames.md
└── quality/                      # 质量门禁、测试、CI、agent hooks
    ├── README.md
    ├── ai-quality-gates.md
    └── agent-hook-gates.md
```

后续按需新增模块，例如：

- `features/`：面向用户的功能方案（有第一个功能 spec 时再创建）
- `platform/`：构建、环境变量、部署、Helm、CI 基础设施
- `process/`：分支模型、发布流程、协作流程

## 4. 模块划分与归属规则

| 模块 | 负责范围 | 不负责 |
| --- | --- | --- |
| `architecture/` | 模块边界、依赖方向、路由/API 分层、目录结构 | 代码风格、具体功能交互 |
| `conventions/` | 命名、文件布局、文档组织、i18n / 样式约定 | 运行时架构、发布流程 |
| `quality/` | lint 规则、测试策略、CI、agent hooks、质量门禁 | 业务功能设计 |
| `features/` | 单个业务功能的目标、流程、接口、验收 | 跨功能的架构决策 |
| `platform/` | 构建、环境变量、部署、Helm、CI 基础设施 | 代码规范 |
| `process/` | 分支、发布、评审、协作流程 | 技术实现细节 |

归属规则：

1. **一个 spec 只放进一个模块**，以「主要决策归属」为准；跨模块内容用链接引用，不复制正文
2. 架构决策放 `architecture/`；命名/文档规范放 `conventions/`；门禁/测试/CI 放 `quality/`
3. 模块内文档建议控制在 **10 篇以内**；超过后拆子模块（如 `quality/agent/`），子模块同样需要 `README.md`
4. 新模块的创建需要更新 `docs/specs/README.md` 与 `docs/index.md`

### 4.1 features 模块：按业务域划分，页面只是承载面

`features/` 不直接按 `src/routes` 的页面文件建目录，而是按**业务域（domain）**分，域内再按**能力（capability）**拆 spec：

```
docs/specs/features/
├── README.md
├── auth/
│   ├── README.md
│   └── login.md
├── dashboard/
│   ├── README.md
│   └── overview.md
├── users/
│   ├── README.md
│   ├── list.md
│   ├── import.md
│   └── permissions.md
└── settings/
    ├── README.md
    └── preferences.md
```

- **第一层是业务域**，不是路由。域和页面可以一一对应，也可以一对多（一个域多个页面）或多对一（一个页面多个域）
- **第二层是能力**，一个能力 = 一个可以独立评审 / 发布 / 回滚的决策
- 页面只是能力的承载面；不要按组件、弹窗、Tab 拆文档

页面与能力的划分判断：

| 场景 | 建议 |
| --- | --- |
| 能独立发布 / 回滚 | 单独一篇 spec |
| 必须同时上线、共享验收 | 同一篇 spec 分节 |
| 跨页面流程（如登录 → 跳转 → 首页） | 归属主域，其他域链接引用 |
| 同一资源的列表 + 详情 + 编辑 | 可合并为一篇，超过可读范围再拆 |
| 权限、导入导出、审计等公共能力 | 放主域；确实跨域才建 `_shared/`，并指定 owner |
| 纯 UI 样式调整 | 不建 feature spec，放 `conventions/` 或直接改代码 |

当前项目的映射示例：

| 路由 | 业务域 | 能力文档示例 |
| --- | --- | --- |
| `/` | `dashboard` | `overview.md` |
| `/users` | `users` | `list.md` / `import.md` / `permissions.md` |
| `/settings` | `settings` | `preferences.md` |
| `/login` | `auth` | `login.md` |

约定：

- 文件名：`features/<domain>/<capability>.md`，如 `features/users/list.md`
- 不用 `page-` 前缀，也不用路由路径做目录名（`/users` 改路径时不应迫使文档搬家）
- 域的 `README.md` 表格增加「路由 / 页面」列；spec 元数据表增加「关联路由」行
- **有第一篇 spec 时才创建域目录**，不建空目录
- 单域超过 8-10 篇再拆子域（如 `users/profile/`），每个子目录补 `README.md`
- 跨域能力优先明确一个 owner 域；`_shared/` 只放真正无法归属的内容，避免变成垃圾桶

## 5. 索引与门禁改造

### 5.1 新的索引层级

```
docs/index.md
  └── 只列 docs/specs/README.md + 各模块 README
        └── 模块 README 列出本模块下的 spec
              └── spec 之间用相对链接互引
```

`docs/index.md` 的 specs 部分从「逐个文件」改为「逐个模块」：

```md
## 技术方案（specs）

- [specs/README.md](./specs/README.md) — 模块索引、状态图例与新增规则
- [specs/architecture/README.md](./specs/architecture/README.md) — 架构与依赖边界
- [specs/conventions/README.md](./specs/conventions/README.md) — 代码 / 命名 / 文档约定
- [specs/quality/README.md](./specs/quality/README.md) — 质量门禁、测试、CI、agent hooks
```

### 5.2 改造 `check-docs.mjs`

当前逻辑要求 **每个 md 都被 `docs/index.md` 收录**，分模块后不再适用。改为层级校验：

- `docs/index.md`：必须收录每个顶层模块的 `README.md`
- 模块 `README.md`：必须收录该目录下的每个 md（不含子模块，子模块由子模块 README 负责）
- 每个目录（含模块目录）必须存在 `README.md`（保留现有 `checkReadmes`）
- 可选增强：解析 Markdown 相对链接，校验目标文件存在

伪代码：

```js
for (const file of listMarkdown(DOCS_DIR)) {
  if (file === INDEX_FILE) continue;

  const dir = dirname(file);
  const owner = dir === DOCS_DIR ? INDEX_FILE : join(dir, "README.md");

  if (!read(owner).includes(basename(file))) {
    problems.push(`${relative(ROOT, owner)} 未收录：${relative(ROOT, file)}`);
  }
}
```

### 5.3 新增 `check-specs.mjs`

把 spec 的约定从通用文档检查里拆出来，新增 `docs/.scripts/check-specs.mjs`：

- `docs/specs/` 下每个目录必须有 `README.md`
- 每个模块 README 必须被 `docs/specs/README.md` 收录
- 每个 spec 必须：
  - 文件名 kebab-case
  - 有 `# 技术方案：...` 标题
  - 有元数据表，包含 `状态` / `作者` / `日期`
  - 状态值在枚举内：`Draft` / `In Review` / `Approved` / `Implemented` / `Superseded` / `Rejected`
- 每个 spec 必须被所在模块 README 收录

命令：

```json
"specs:check": "node docs/.scripts/check-specs.mjs",
"verify": "pnpm lint && pnpm typecheck && pnpm test && pnpm docs:check && pnpm specs:check && pnpm test:layout"
```

同时更新 `docs/.scripts/README.md` 与 `docs/.scripts/index.md`。

### 5.4 AI 能约束到什么程度

结论：**门禁能保证「结构正确」，不能保证「语义划分正确」。** 需要把约束拆成三层。

#### 第一层：可硬门禁（`check-specs.mjs` + CI）

这些是确定性的，适合直接失败：

- `docs/specs/` 根目录除 `README.md` 外不允许有 spec 文件
- spec 必须位于模块目录，`features/` 下必须是 `features/<domain>/<capability>.md`
- 每个 domain 目录必须有 `README.md`，且被 `features/README.md` 收录
- spec 元数据必须包含：`状态`、`作者`、`日期`、`所属域`、`关联路由`
- `关联路由` 必须能在 `src/routes.ts` 解析到（防止文档与路由漂移）
- 文件名 kebab-case、状态值在枚举内、spec 必须被所在模块 README 收录
- 不允许空域目录；不允许孤儿 spec（未被模块 README 收录）
- 单域文档数超过阈值（如 10 篇）给出 warning，提示拆子域

#### 第二层：Agent hook 门禁（创建时拦截）

在 `.agent/` 现有 hooks 上增加文档专用规则：

| 动作 | 决策 |
| --- | --- |
| 在 `docs/specs/` 根目录新建 `.md` | deny（必须放模块目录） |
| 在 `features/` 下新建第一篇文档（新域） | ask，提示先确认域归属并创建 README |
| 路径不是 `features/<domain>/<capability>.md` 且无子模块 README | ask |
| 写入 `docs/specs/**` 后 | 自动跑 `pnpm specs:check && pnpm docs:check`，失败回传 |
| 结束时 | 已有 `pnpm verify` 覆盖 docs / specs 检查 |

这样 AI 在「新域」「新层级」「根目录放文件」这些语义分叉点会被强制停下来，而不是事后才发现。

#### 第三层：无法自动判断的部分（流程约束）

以下问题门禁无法可靠判断，需要流程配合：

- 一个能力该不该拆成多篇 spec
- 两个业务域是否应该合并
- 跨页面流程归哪个域
- 两篇 spec 是否内容重复或已经过时

对策：

- `AGENTS.md` 增加规则：新增 feature spec 前先读 `features/README.md`，新建域必须先问
- spec 元数据增加「所属域 / 关联路由 / 划分理由」，把隐含判断显式写出来
- PR 模板 / review checklist 增加「域归属与拆分粒度」检查项
- 定期跑审计脚本：按域统计文档数、列出未被任何 spec 覆盖的路由、找出长期停留在 Draft 的文档

推荐落地顺序：先上 `check-specs`（结构兜底），再加 agent hook（创建时拦截），最后补审计与 review checklist。**门禁是必要不充分条件，最终仍需人确认语义划分。**

### 5.5 Skill 优先，门禁辅助

语义放置更适合交给 skill，而不是硬编码门禁：

- 新增 `write-spec` skill（`docs/skills/write-spec/SKILL.md`），定义模块 / 域 / 能力的决策树、查重、索引与完成检查
- 在 `AGENTS.md`、`docs/harness/docs-and-specs.md`、`docs/specs/README.md` 显式要求：写 / 改 spec 前先加载该 skill
- 门禁只做结构兜底与创建时拦截，不试图判断「拆分是否合理」
- 人工 review 确认域归属、拆分粒度与重复内容

分工：

| 层 | 负责 | 例子 |
| --- | --- | --- |
| `write-spec` skill | 语义决策 + 完整流程 | 这是 users 域还是 auth 域；该不该拆两篇 |
| Agent hook | 创建时拦截异常路径 | 根目录新建 spec → deny；新域首篇 → ask |
| CI 门禁 | 结构、索引、元数据 | README 是否缺失、路由是否存在、状态是否合法 |
| 人工 review | 最终语义确认 | owner、粒度、内容重复 / 过时 |

推荐落地顺序调整为：**先写 `write-spec` skill 并接入文档 → 再补 `check-specs` 与 agent hook 作为辅助。**

## 6. 文件与索引约定

### 6.1 命名

- 模块目录：kebab-case、复数名词，如 `architecture` / `conventions` / `quality`
- spec 文件：kebab-case，动词开头描述决策，如 `restrict-cross-route-imports.md`
- 不使用数字前缀（`01-`、`02-`），排序交给模块 README
- 一个文件只讲一个决策；大主题拆多篇并用链接关联

### 6.2 模块 README 模板

```md
# <模块名>

<一句话说明模块范围。>

## 文档

| 文档 | 状态 | 日期 | 摘要 |
| --- | --- | --- | --- |
| [xxx.md](./xxx.md) | Implemented | 2026-11-01 | ... |

## 边界

- 属于本模块：...
- 不属于本模块：...
```

### 6.3 状态与归档

状态定义与流转以 `docs/skills/write-spec/SKILL.md` 为准，固定 6 个值：

| 状态 | 含义 | 允许流转到 |
| --- | --- | --- |
| `Draft` | 正在编写，未提交评审；新建默认 | `In Review` / `Rejected` |
| `In Review` | 内容冻结，等待评审或决策 | `Approved` / `Draft` / `Rejected` |
| `Approved` | 已批准，尚未完成实现 | `Implemented` / `Superseded` / `Draft` |
| `Implemented` | 已实现并验证，正文与代码一致 | `Superseded` |
| `Superseded` | 已被新方案替代，仅保留历史 | 终态 |
| `Rejected` | 未采纳或撤回，保留决策记录 | 终态 |

- 状态只写在文档元数据表里，**不按状态建目录**
- 禁止 `WIP` / `Done` / `Approved*` / `Draft/In Review` 等模糊值
- `Approved` 不代表已实现；部分实现不得标 `Implemented`
- 被替代的方案保留在原模块，状态改为 `Superseded`，并在正文顶部链接新方案
- `Rejected` 必须写原因；重启方案时新建 `Draft` 并链接旧文档
- 只有确认无历史价值时才删除；删除前先从模块 README 移除链接

## 7. 迁移步骤

1. 创建模块目录：`architecture/`、`conventions/`、`quality/`
2. `git mv` 现有文件：

   | 原路径 | 新路径 |
   | --- | --- |
   | `specs/restrict-cross-route-imports.md` | `specs/architecture/restrict-cross-route-imports.md` |
   | `specs/restrict-kebab-case-filenames.md` | `specs/conventions/restrict-kebab-case-filenames.md` |
   | `specs/organize-specs-by-module.md` | `specs/conventions/organize-specs-by-module.md` |
   | `specs/ai-quality-gates.md` | `specs/quality/ai-quality-gates.md` |
   | `specs/agent-hook-gates.md` | `specs/quality/agent-hook-gates.md` |

3. 为每个模块创建 `README.md`，把该模块下的 spec 列入表格
4. 改写 `docs/specs/README.md`：从「逐文件」改为「逐模块 + 状态图例 + 新增规则」
5. 改写 `docs/index.md` 的 specs 部分：只保留模块 README
6. 更新 `docs/harness/directory-structure.md` 与 `docs/harness/docs-and-specs.md` 的目录树与文档约定
7. 改造 `check-docs.mjs`，新增 `check-specs.mjs` 与 `pnpm specs:check`
8. 全仓搜索旧路径（`rg 'specs/.*\.md'`），修正引用
9. 运行 `pnpm verify` 与 `pnpm docs:check`

## 8. 备选方案与取舍

| 方案 | 优点 | 缺点 | 结论 |
| --- | --- | --- | --- |
| A. 模块目录 + 模块 README + 层级索引 | 主题清晰、可扩展、索引职责下沉 | 需要改造 `check-docs` | ✅ 推荐 |
| B. 保持平铺，用文件名前缀（`arch-`、`quality-`） | 零迁移成本 | 文件多后仍难浏览，模块边界靠命名约定 | ❌ |
| C. 按状态分目录（`draft/`、`approved/`） | 状态一眼可见 | 状态变化要移动文件，链接频繁失效 | ❌ |
| D. 一个 spec 一个目录 | 可放附件/图表 | 目录数量爆炸，多数目录只有一个文件 | ❌ |
| E. 外部 wiki / 静态站点 | 展示更好 | 脱离仓库与 PR 流程，维护成本高 | ❌ |

## 9. 影响面、兼容性与回滚

- 影响范围：仅文档路径、索引与文档门禁，不影响运行时代码
- 兼容性：旧链接会失效，需要按迁移表更新；仓库内引用已通过 `rg` 收敛
- 回滚：`git mv` 还原目录，恢复 `check-docs.mjs`，删除 `check-specs.mjs` 与 `specs:check`
- 建议分两步提交：先迁移文件与索引，再改门禁，便于定位问题

## 10. 测试计划

- [ ] `pnpm docs:check` 通过：模块 README 完整、每个 spec 被模块 README 收录
- [ ] `pnpm specs:check` 通过：标题、元数据、状态、命名合规
- [ ] 反例：删除模块 README → `docs:check` 失败
- [ ] 反例：spec 未加入模块 README → `docs:check` / `specs:check` 失败
- [ ] 反例：`状态: Foo` → `specs:check` 失败
- [ ] 反例：`Bad_Name.md` → `specs:check` 失败
- [ ] `pnpm verify` 全绿
- [ ] 全仓无旧路径引用

## 11. 风险与开放问题

| 风险 / 问题 | 影响 | 缓解措施 / 待定 |
| --- | --- | --- |
| 模块划分过细 | 文档分散、跨模块找资料 | 先只建 3 个模块，超过 10 篇再拆子模块 |
| `check-docs` 改造影响其他目录 | `harness/`、`.scripts/` 等索引规则变化 | 层级规则对现有目录兼容；先跑全量 docs 检查 |
| 旧链接散落在历史 PR / issue | 无法全部修复 | 仓库内链接必须修；外部链接接受失效 |
| 状态枚举与现有文档不一致 | 门禁误报 | 迁移时统一为 `Draft` / `In Review` / `Approved` / `Implemented` / `Superseded` / `Rejected` |
| 模块 README 维护成本 | 新增文档忘记登记 | 由 `check-specs.mjs` 强制校验 |

## 12. 验收标准

- [ ] `docs/specs/` 下按模块分目录，每个模块有 `README.md`
- [ ] `docs/index.md` 只列模块 README，不再逐文件列 spec
- [ ] 现有 5 篇 spec 全部迁移且链接可用
- [ ] `pnpm docs:check` / `pnpm specs:check` / `pnpm verify` 通过
- [ ] `AGENTS.md` 与 `docs/harness/docs-and-specs.md` 已记录新的文档组织规则
- [ ] 新增 spec 时，只需更新「模块 README + docs/specs/README」两处

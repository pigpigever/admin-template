---
name: write-spec
description: Use when creating, moving, or updating technical plans under docs/specs (技术方案/方案/spec), especially when choosing the module, feature domain, or capability placement. Enforces the docs/specs structure, metadata, and index updates before writing.
---

# Write Spec

## 何时使用

- 用户要求「出方案」「写技术方案」「设计一下」「写 spec」
- 需要新增、移动、拆分或归档 `docs/specs/` 下的文档
- 需要判断一个需求该放 `architecture` / `conventions` / `quality` / `features` 哪个模块
- 需要判断 feature 属于哪个业务域、该不该拆成多篇

不适用：纯代码修改、bugfix（用 `docs/.template/bugfix.md`）、只需要口头解释的问题。

## 开始前必读

1. `docs/specs/README.md`：模块列表、状态图例、新增规则
2. 目标模块的 `README.md`：范围、已有文档、路由/域映射
3. `docs/.template/technical-design.md`：方案正文模板
4. 相关代码与路由：`src/routes.ts`、`src/routes/`、`src/constants/`

## 工作流

### 1. 判断模块

按主要决策归属选择，一个 spec 只放一个模块：

| 模块 | 放什么 | 不放什么 |
| --- | --- | --- |
| `architecture/` | 模块边界、依赖方向、路由/API 分层、目录结构 | 代码风格、具体功能交互 |
| `conventions/` | 命名、文件布局、文档组织、i18n / 样式约定 | 运行时架构、发布流程 |
| `quality/` | lint、测试、CI、agent hooks、质量门禁 | 业务功能设计 |
| `features/` | 用户可见的业务能力 | 跨功能的架构决策 |
| `platform/` | 构建、环境变量、部署、Helm、CI 基础设施 | 代码规范 |
| `process/` | 分支、发布、评审、协作流程 | 技术实现细节 |

没有合适模块时，**先问用户** 是否新建模块，不要直接塞进 `conventions/` 或根目录。

### 2. features 的域与能力划分

先选业务域，再选能力。**页面只是承载面，不要按路由文件或组件拆文档。**

- 第一层：业务域（`users` / `auth` / `settings` / `dashboard` / `billing` ...）
- 第二层：能力（`list` / `import` / `permissions` / `login` ...）
- 路径：`docs/specs/features/<domain>/<capability>.md`

判断一个能力是否单独成篇：

| 场景 | 做法 |
| --- | --- |
| 能独立发布 / 回滚 | 单独一篇 |
| 必须同时上线、共享验收 | 同一篇分节 |
| 同一资源的列表 + 详情 + 编辑 | 可合并，超过可读范围再拆 |
| 跨页面流程 | 归属主域，其他域链接引用 |
| 权限、导入导出、审计等公共能力 | 指定一个 owner 域 |
| 纯 UI 样式调整 | 不建 feature spec |

反模式：

- 在 `docs/specs/` 根目录直接放 spec
- 按 `src/routes` 一一镜像建目录（路由改名不应迫使文档搬家）
- 一个组件 / 弹窗 / Tab 一篇 spec
- 同一能力在多个域重复写正文
- 创建空模块或空域目录
- 用 `draft/`、`approved/` 等状态目录

### 3. 先查重再写

- 用 `rg` 搜索关键词，确认没有相同或高度重叠的方案
- 读目标模块 README 的文档表
- 相关方案用链接关联，不复制正文
- 被替代的旧方案保留在原模块，状态改 `Superseded` 并链接新方案

### 4. 写正文

复制 `docs/.template/technical-design.md` 的结构，至少包含：

- 元数据表：`状态` / `作者` / `日期` / `版本` / `关联`
- 变更记录表：放在元数据表下方，列 `版本` / `日期` / `变更` / `作者`；从 `v0.1` 开始，最新版本在第一行，版本号递增
- `features/` 文档额外包含：`所属域` / `关联路由` / `划分理由`
- 背景、目标与非目标、方案、备选方案、影响面、测试、风险、验收标准

新建文档的状态一律为 `Draft`。

### 4.1 状态定义

状态只能取以下 6 个值之一，禁止 `WIP` / `Done` / `Approved*` / `Draft/In Review` 等变体或并列值。

| 状态 | 含义 | 进入条件 | 允许流转到 |
| --- | --- | --- | --- |
| `Draft` | 正在编写，内容可改，尚未提交评审 | 新建文档默认状态 | `In Review` / `Rejected` |
| `In Review` | 内容冻结，等待评审或决策 | 目标、非目标、方案、备选、影响面、验收标准已齐全 | `Approved` / `Draft` / `Rejected` |
| `Approved` | 已批准，尚未完成实现 | 评审通过，范围、owner、验收标准明确 | `Implemented` / `Superseded` / `Draft` |
| `Implemented` | 已实现并验证，正文与代码一致 | 验收标准全部勾选，关联代码已合并 | `Superseded` |
| `Superseded` | 已被新方案替代，仅保留历史 | 存在明确替代文档并已链接 | 终态 |
| `Rejected` | 方案未采纳或主动撤回，保留决策记录 | 写明否决 / 撤回原因 | 终态 |

流转规则：

- **新建一律 `Draft`**；只有作者确认可评审时才改为 `In Review`
- `In Review` 期间内容冻结；评审要求修改时退回 `Draft`，改完重新提交
- `Approved` 只表示「已决定做」，不代表「已做完」；部分实现不得标 `Implemented`
- `Implemented` 必须勾完验收标准，且关联代码已合并；禁止 `Implemented (partial)`
- `Superseded` 必须写替代文档链接；旧文档保留，不删除
- `Rejected` 必须写原因；需要重启时新建 `Draft` 并链接旧文档，不修改旧状态
- 任何状态变更或实质内容变更都要更新元数据 `日期` / `版本`，并在变更记录最上方加一行（版本号递增，如 `v0.2`）
- 状态只写在元数据表里，**不进入文件名或目录名**

### 5. 更新索引

按文档所在层级更新：

- 模块内新增：更新该模块 `README.md` 的文档表
- `features/` 新域：创建域 `README.md`，并更新 `features/README.md`
- 新增模块：更新 `docs/specs/README.md` 与 `docs/index.md`
- 移动 / 改名：更新所有引用（`rg 'specs/.*\.md'`），修正旧链接

索引层级：`docs/index.md` → 模块 README → spec。`docs/index.md` 不逐个列 spec。

### 5.1 输出方式

- 方案正文必须用 Write 工具写入 `docs/specs/` 对应文件
- 不要用 `echo` / `cat <<EOF` / `console.log` 把方案输出到控制台
- 最终回复只给模块 / 域 / 路径和关键决策摘要，不重复正文
- 方案里的示例代码不要包含 `console.log` / `debugger`；需要说明日志时用 `console.warn` / `console.error`

### 6. 校验

- `pnpm docs:check`：模块 README、索引收录
- `pnpm specs:check`：spec 结构、元数据、命名（门禁落地后）
- `pnpm verify`：全量

门禁只保证结构；**域归属、拆分粒度、owner 仍需在方案里写明并由人确认**。

## 完成前检查

- [ ] 模块选择有明确理由，且没有更合适的模块
- [ ] feature 的域是业务域，不是路由目录
- [ ] 一个 spec 只对应一个可独立评审 / 发布的决策
- [ ] 已搜索并链接相关方案，没有重复正文
- [ ] 元数据完整，状态是上述 6 个枚举值之一，且流转符合规则
- [ ] 没有 `WIP` / `Done` / `Approved*` / `Draft/In Review` 等模糊状态
- [ ] 模块 / 域 README 与 `docs/index.md` 已同步
- [ ] `pnpm docs:check` 通过
- [ ] 在回复中说明「放在哪个模块 / 域 / 能力，为什么」

## 参考

- `docs/specs/README.md`
- `docs/specs/organize-specs-by-module.md`
- `docs/.template/technical-design.md`
- `docs/harness/index.md`

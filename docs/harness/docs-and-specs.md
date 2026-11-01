# 文档与技术方案（spec）

- 写 / 改 `docs/specs/` 前先加载 `write-spec` skill（`docs/skills/write-spec/SKILL.md`），由 skill 负责模块 / 域 / 能力的放置决策
- 方案正文必须用 Write 工具写入 `docs/specs/`；不要用 `echo` / `cat <<EOF` / `console.log` 输出方案，回复只给摘要与文件路径
- 元数据表在前，`## 变更记录` 在后；变更记录含 `版本` / `日期` / `变更` / `作者`，从 `v0.1` 开始，最新版本在第一行
- 模块划分：`architecture` / `conventions` / `quality` / `features` / `platform` / `process`；一个 spec 只放一个模块
- `features/` 按业务域（domain）分，域内按能力（capability）分；页面只是承载面，不按路由文件、组件或弹窗拆文档
- 索引层级：`docs/index.md` → 模块 `README.md` → spec；新增 / 移动文档时同步更新所在模块 README
- 方案状态固定为 `Draft` / `In Review` / `Approved` / `Implemented` / `Superseded` / `Rejected`，新建默认 `Draft`；定义与流转见 skill，禁止 `WIP` / `Done` / `Approved*` 等模糊值
- 门禁（`docs:check` / `specs:check` / agent hooks）只校验结构、元数据与路径；域归属和拆分粒度由 skill 决策 + 人工 review 确认
- 详细规则见 `docs/specs/organize-specs-by-module.md`

| 日期 | 变更 | 作者 |
| --- | --- | --- |
| 2026-11-01 | 已实现 P0：共享策略 + opencode/Claude/Codex 接线 + 单测 | opencode |
| 2026-11-01 | 初稿：Agent hooks 门禁现状与落地方案 | opencode |

# 技术方案：Agent hooks 门禁

| 项 | 内容 |
| --- | --- |
| 状态 | Implemented |
| 作者 | opencode |
| 日期 | 2026-11-01 |
| 关联 | — |

## 1. 背景与问题

这里的「门禁」指 **coding agent 自身的 hooks / permission 机制**，不是 husky 的 git hooks，也不是 CI。

当前仓库**没有配置任何 agent hooks 门禁**：

| 位置 | 现状 |
| --- | --- |
| 仓库 `.opencode/` | 不存在 |
| 仓库 `.claude/` | 不存在 |
| 仓库 `.commandcode/` | 只有空的 `taste/taste.md` |
| 全局 `~/.config/opencode/opencode.jsonc` | 只有 `$schema`，无 plugin / permission |
| 全局 `~/.claude/settings.json` | 有 env / model / statusLine，**无 hooks** |
| 全局 `~/.claude/settings.local.json` | 只有部分 `permissions.allow` |
| 全局 `~/.codex/config.toml` | 无 `[hooks]`，也无 `~/.codex/hooks.json` |
| 仓库 `.codex/` | 不存在 |
| `~/.commandcode/config.json` | 只有 provider / model，无 hooks |

已有的是**仓库侧门禁**（oxlint 自定义插件、`docs:check`、`test:layout`、husky pre-commit）。它们只能拦截「已经写进仓库/提交时」的问题；agent hooks 能在 **AI 调用工具之前/之后** 直接拦截，反馈更早、成本更低。

> 注意：`~/.claude/settings.json` 里明文存了 `ANTHROPIC_AUTH_TOKEN`，建议后续改为环境变量或密钥管理，不要在方案落地时继续扩散。

## 2. 目标与非目标

**目标**

- 盘点 agent hooks 能覆盖的门禁类型
- 给出 opencode / Claude Code / Codex 的具体 hooks 设计
- 明确哪些部分可跨 agent 复用、哪些必须各写适配层
- 明确 P0 / P1 / P2 落地顺序与验证方式

**非目标**

- 本次不写 hook 代码、不改 agent 配置
- 不替代 CI：hooks 依赖用户环境，仍可被绕过，CI 才是最终兜底
- 不追求覆盖所有工具，先覆盖高风险动作（命令、写文件、提交、完成）

## 3. 三层防御模型

```
Layer 1：声明式 permission（快，零代码）
   deny / ask / allow 粗粒度拦截
        │
Layer 2：hook 脚本（策略集中，可审计）
   tool.execute.before / after、Stop
        │
Layer 3：仓库门禁 + CI（不可绕过）
   oxlint / tsc / test / docs / layout / CI
```

原则：

- **危险动作 fail closed**（默认拒绝，确认后放行）
- **pre-tool 要快**（< 100ms，纯规则判断，不跑全量检查）
- **重检查放 post-tool / Stop**（按文件、按阶段执行）
- **策略复用仓库脚本**（`docs/.scripts/*.mjs`），避免 hooks 与 CI 两套逻辑

## 4. 常见 Agent hooks 门禁清单

### 4.1 工具调用前（PreToolUse / `tool.execute.before`）

| 门禁 | 触发 | 建议动作 | 优先级 |
| --- | --- | --- | --- |
| 禁止 `--no-verify` | Bash | deny | P0 |
| 禁止强推 / 破坏性 git（`push --force`、`reset --hard`、`clean -fd`） | Bash | deny | P0 |
| 禁止 `rm -rf` / `sudo` / `chmod 777` / `curl \| sh` | Bash | deny | P0 |
| 依赖变更（`pnpm add`、`npm i <pkg>`、改 `package.json` / lockfile） | Bash / Edit | ask | P0 |
| 写 `.env*` / 密钥文件 | Edit / Write | deny | P0 |
| 写生成物（`src/apis/**`、`routeTree.gen.ts`、编译 catalog） | Edit / Write | deny | P0 |
| 写敏感配置（`helm/`、`vite.config.ts`、CI） | Edit / Write | ask | P1 |
| 修改 lint 规则 / `AGENTS.md` | Edit / Write | ask | P1 |
| 读 `.env*` / `~/.ssh` / 密钥 | Read | deny | P0 |
| 访问工作区外目录 | Read / Edit / Bash | ask | P1 |
| 外发请求（WebFetch / curl） | WebFetch / Bash | 域名 allowlist，其余 ask | P1 |
| 大规模改动（diff 行数 / 文件数超阈值） | Edit / Write | ask | P2 |

### 4.2 工具调用后（PostToolUse / `tool.execute.after`）

| 门禁 | 触发 | 建议动作 | 优先级 |
| --- | --- | --- | --- |
| 写入 `src/**/*.{ts,tsx,js,jsx}` 后跑 oxlint | Edit / Write | 失败回传 agent 修复 | P0 |
| 改 `package.json` / lockfile 后检查 frozen lockfile | Edit / Bash | 失败回传 | P1 |
| 改文案 / `.po` 后跑 `pnpm extract` | Edit / Bash | 自动补齐或提示 | P1 |
| 改路由后跑路由边界规则 | Edit | 由 oxlint 覆盖 | P1 |
| 提交后跑 `pnpm verify` | Bash（git commit） | 失败回传 | P1 |
| 改动源码但没有测试改动 | Edit / Write | 提示或要求补测试 | P2 |
| 自动格式化（oxfmt） | Edit / Write | 静默执行 | P2 |

### 4.3 会话生命周期

| 门禁 | 触发 | 建议动作 | 优先级 |
| --- | --- | --- | --- |
| 启动时注入 `AGENTS.md` / 规范 / 当前分支 | SessionStart | 注入上下文 | P0 |
| 启动时检查工作区是否干净 | SessionStart | 警告未提交改动 | P2 |
| 用户提交 prompt 时检测粘贴的密钥 | UserPromptSubmit / `chat.message` | 警告 / 脱敏 | P1 |
| 回答结束前跑完整 verify | Stop / session idle | 失败则阻止结束并回传 | P0 |
| 压缩前保存任务状态 | PreCompact | 写临时摘要 | P2 |
| 会话结束备份 | SessionEnd | 备份 / 审计日志 | P2 |

### 4.4 权限层（permission.ask / settings.permissions）

| 门禁 | 作用 |
| --- | --- |
| 只读命令自动放行 | `git status`、`git diff`、`ls`、`rg` |
| 写操作默认 ask | 除白名单路径外 |
| 危险命令默认 deny | 强推、删库、绕过钩子 |
| 外部目录默认 ask | 防止越界读写 |

## 5. 推荐落地方案

### 5.1 opencode（当前主用 agent）

**声明式权限**：在项目根 `opencode.json`（或 `.opencode/opencode.json`）加 permission。注意规则按**最后匹配**生效，宽规则在前、窄规则在后。

```json
{
  "$schema": "https://opencode.ai/config.json",
  "permission": {
    "bash": {
      "*": "ask",
      "git status*": "allow",
      "git diff*": "allow",
      "git push*": "ask",
      "git push --force*": "deny",
      "git reset --hard*": "deny",
      "git clean -fd*": "deny",
      "rm -rf *": "deny",
      "pnpm add *": "ask",
      "pnpm install *": "ask",
      "*--no-verify*": "deny"
    },
    "edit": {
      "*": "allow",
      "**/.env*": "deny",
      "src/apis/**": "deny",
      "src/routeTree.gen.ts": "deny",
      "helm/**": "ask"
    },
    "read": {
      "*": "allow",
      "**/.env*": "deny",
      "~/.ssh/**": "deny"
    },
    "external_directory": {
      "*": "ask"
    }
  }
}
```

**Hook 插件**：`.opencode/plugin/guard.ts`（自动发现，无需配置）。核心钩子：

```ts
import type { Plugin } from "@opencode-ai/plugin"

export default (async ({ $, directory }) => {
  return {
    "tool.execute.before": async (input, output) => {
      // 1) bash 命令策略：危险命令直接 throw 阻止
      // 2) edit/write 路径策略：禁区 deny、敏感区 ask
      // 3) read 路径策略：禁止读取密钥
    },
    "tool.execute.after": async (input, output) => {
      // 4) 写 src 后跑 oxlint（限当前文件）
      // 5) 写 package.json/lock 后跑 frozen-lockfile 检查
    },
    event: async ({ event }) => {
      // 6) session.idle 时提示跑 pnpm verify（opencode 阻止结束能力有限）
    },
  }
}) satisfies Plugin
```

说明：

- `tool.execute.before` 中 **抛出异常即可阻止工具执行**，错误信息会回传给 agent
- `tool.execute.after` 适合做「写后检查」，失败时通过返回值 / 异常回传
- opencode 没有 Claude 的 `Stop` 阻塞语义，完整 verify 更适合放在 **pre-commit / CI**，hook 只做提示
- 新增插件后必须 **退出并重启 opencode** 才生效

**策略集中化**：规则放在 `.agent/guard-policy.json`（命令黑名单、敏感路径、生成物路径、允许域名），插件只做读取与匹配，便于测试和后续给 Claude Code / Codex 复用。

### 5.2 Claude Code（如团队使用）

在项目 `.claude/settings.json` 配置 hooks，脚本放 `.claude/hooks/*.mjs`：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{ "type": "command", "command": "node .claude/hooks/pre-bash.mjs" }]
      },
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [{ "type": "command", "command": "node .claude/hooks/pre-write.mjs" }]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [{ "type": "command", "command": "node .claude/hooks/post-write.mjs" }]
      }
    ],
    "Stop": [
      {
        "hooks": [{ "type": "command", "command": "node .claude/hooks/stop-verify.mjs" }]
      }
    ]
  }
}
```

约定：

- `PreToolUse` 返回 exit code `2` 可阻断，stderr 反馈给模型；也可返回 JSON 的 `permissionDecision: deny | ask | allow`
- `PostToolUse` 返回 exit code `2` 把检查结果反馈给模型
- `Stop` 返回 exit code `2` 阻止结束，要求先修复
- hook 输入是 stdin JSON，包含 `tool_name` / `tool_input`

### 5.3 Codex

Codex 已支持 hooks（stable），位置：

- 全局：`~/.codex/hooks.json`，或 `~/.codex/config.toml` 里的 `[[hooks.*]]`
- 仓库：`.codex/hooks.json` 或 `.codex/config.toml`
- 插件：插件 manifest 内置的 hooks

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node \"$(git rev-parse --show-toplevel)/.codex/hooks/pre-tool-use.mjs\"",
            "statusMessage": "Checking tool call"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write|apply_patch",
        "hooks": [
          {
            "type": "command",
            "command": "node \"$(git rev-parse --show-toplevel)/.codex/hooks/post-write.mjs\""
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"$(git rev-parse --show-toplevel)/.codex/hooks/stop-verify.mjs\""
          }
        ]
      }
    ]
  }
}
```

约定：

- 事件名与 Claude Code 基本一致：`PreToolUse` / `PostToolUse` / `Stop` / `UserPromptSubmit` / `SessionStart` / `SessionEnd` / `SubagentStart` / `SubagentStop` / `PreCompact` / `PostCompact` / `PermissionRequest`
- 输入同样是 stdin JSON；`PreToolUse` 可返回 exit code `2`，或 JSON `permissionDecision: "deny"` 阻断
- `permissionDecision: "ask"` 目前**未支持**（会被解析但忽略）→ 需要确认的动作请用 `deny` + 明确原因，让模型停下来问用户
- 文件编辑工具名是 `apply_patch`，matcher 可写 `apply_patch` / `Edit` / `Write`；输入里是 `tool_input.command`
- 新增 / 修改的非托管 hook 需要在 `/hooks` 里 review 并 trust，否则不会执行
- 仓库内 hook 建议用 git root 绝对路径，避免从子目录启动时找不到脚本

### 5.4 commandcode / 其他 agent

`.commandcode/` 目前只有空 `taste/`。需要先确认它是否支持 hooks：

- 支持：按同样的「pre-tool / post-tool / stop」映射实现
- 不支持：退化为 permission 配置 + 包装脚本 + git hooks / CI 兜底，不要假设有 hook 能力

### 5.5 跨 agent 通用性结论

**不通用。** hooks 是各家 agent 的私有机制，配置文件、API、工具名都不同；但可以做到「**策略与脚本复用，接线层各写一份适配**」。

| 能力 | opencode | Claude Code | Codex |
| --- | --- | --- | --- |
| 配置位置 | `opencode.json` permission + `.opencode/plugin/*.ts` | `.claude/settings.json` | `.codex/hooks.json` / `config.toml` |
| 工具调用前 | `tool.execute.before`（TS 插件） | `PreToolUse` | `PreToolUse` |
| 工具调用后 | `tool.execute.after` | `PostToolUse` | `PostToolUse` |
| 结束时校验 | 无阻塞式 Stop，只能事件提示 | `Stop`（exit 2 阻断） | `Stop` |
| 阻断方式 | 抛异常 | exit 2 / `permissionDecision: deny` | exit 2 / `permissionDecision: deny` |
| ask 语义 | `permission` 规则 | `permissionDecision: ask` | 未支持，用 deny + 原因替代 |
| 编辑工具名 | `edit` / `write` | `Edit` / `Write` / `MultiEdit` | `apply_patch`（可用 Edit / Write 匹配） |
| 脚本协议 | TypeScript hook API | stdin JSON + exit code | stdin JSON + exit code（与 Claude 接近） |

可复用 / 不可复用：

| 部分 | 是否通用 | 做法 |
| --- | --- | --- |
| 策略规则（命令黑名单、敏感路径、生成物路径） | ✅ 通用 | 放 `.agent/guard-policy.json`，三端都读 |
| 纯校验脚本（检查路径、命令、生成物、密钥） | ✅ 通用 | `.agent/hooks/guard.mjs` 输入标准化 JSON，输出统一结果 |
| hook 接线方式 | ❌ 不通用 | opencode 用 TS 插件；Claude/Codex 用 `hooks.json` 指向同一个 `guard.mjs` |
| permission 配置 | ❌ 不通用 | 各自维护，但规则从同一份策略生成或手工对齐 |
| Stop 语义 | ❌ 不一致 | Claude/Codex 可阻断；opencode 退化为提示 + pre-commit/CI |

推荐结构：

```
.agent/
├── guard-policy.json      # 三端共享规则
└── hooks/
    └── guard.mjs          # 三端共享校验逻辑（stdin JSON → 决策）
.opencode/plugin/guard.ts  # 适配器：把 tool args 转成标准 JSON
.claude/hooks/*.mjs        # 适配器：直接调用 guard.mjs
.codex/hooks/*.mjs         # 适配器：直接调用 guard.mjs
```

这样切换 Claude / Codex 时，**规则和检查逻辑不用重写**，只需维护各自的 hook 配置与工具名映射。

### 5.6 已实现文件

| 文件 | 作用 |
| --- | --- |
| `.agent/guard-policy.json` | 共享策略：危险命令、依赖变更、敏感路径、生成物、密钥读取 |
| `.agent/guard.mjs` | 共享校验逻辑：pre-tool 决策、post-write oxlint、stop verify、审计日志 |
| `.agent/hooks/agent-hook.mjs` | Claude / Codex 共用 hook 入口（stdin JSON → 决策） |
| `.opencode/plugin/guard.js` | opencode 适配器（`tool.execute.before` / `after`） |
| `opencode.json` | opencode permission 声明式兜底 |
| `.claude/settings.json` | Claude Code PreToolUse / PostToolUse / Stop 接线 |
| `.codex/hooks.json` | Codex PreToolUse / PostToolUse / Stop 接线 |
| `tests/agent/guard.test.mjs` | 策略单测 |
| `package.json` | 新增 `pnpm verify` |

> 生效方式：opencode 需重启；Claude Code 需新会话；Codex 首次需在 `/hooks` 中 review 并 trust。

## 6. 规则设计细节

### 6.1 命令分级

| 级别 | 示例 | 动作 |
| --- | --- | --- |
| 只读安全 | `git status`、`git diff`、`rg`、`ls`、`cat` | allow |
| 有副作用可恢复 | `pnpm lint`、`pnpm test`、`git add`、`git commit` | allow / ask |
| 改变依赖或配置 | `pnpm add`、`pnpm install`、改 lockfile | ask |
| 敏感 / 不可逆 | `git push`、`gh pr create`、部署 | ask |
| 明确危险 | `--no-verify`、`push --force`、`reset --hard`、`rm -rf`、`sudo` | deny |

### 6.2 路径分级

| 级别 | 路径 | 动作 |
| --- | --- | --- |
| 可写 | `src/components`、`src/lib`、`src/routes`、`tests` | allow |
| 需确认 | `AGENTS.md`、`.oxlintrc.json`、`vite.config.ts`、`helm/**`、`package.json` | ask |
| 禁止 | `.env*`、`src/apis/**`、`src/routeTree.gen.ts`、`.git/**`、密钥 / SSH | deny |

### 6.3 审计

- 每次 deny / ask 记录：时间、agent、工具、目标、命中规则
- 日志放 `.opencode/logs/guard.log`（加入 `.gitignore`）
- **日志必须脱敏**，不能记录命令里的 token、Authorization header

## 7. 落地优先级

### P0（先挡住高风险动作）

1. 声明式 permission：危险命令 deny、依赖变更 ask、敏感路径 deny
2. `tool.execute.before`：bash 命令守卫 + 写文件路径守卫 + 读密钥守卫
3. `tool.execute.after`：写 `src/**` 后按文件跑 oxlint
4. SessionStart 注入 `AGENTS.md` 与门禁说明
5. 最小审计日志

### P1（补齐工程边界）

6. 生成物 / 依赖 / 配置变更守卫（复用 `docs/.scripts/check-generated.mjs`、`check-deps.mjs`）
7. 完整 verify（`pnpm verify`）放到 pre-commit / CI，hook 在结束时提示
8. 外部目录与网络域名 allowlist
9. 文案改动后自动 `pnpm extract`
10. Claude Code hooks 对齐同一套策略

### P2（体验与治理）

11. diff 规模阈值
12. 会话结束备份 / 压缩摘要
13. 指标统计（拦截次数、误报率）
14. 按 agent 区分的策略（plan agent 只读）

## 8. 测试计划

- [ ] 单测：策略匹配函数覆盖命令、路径、边界（通配符、相对路径、大小写）
- [ ] 反例：`git commit --no-verify` 被 deny
- [ ] 反例：`git push --force` 被 deny
- [ ] 反例：写 `.env.local` / `src/apis/users/get.ts` 被 deny
- [ ] 反例：`pnpm add lodash` 触发 ask
- [ ] 正例：`pnpm lint` / `pnpm test` 直接 allow
- [ ] 写 `src/lib/foo.ts` 后自动运行 oxlint
- [ ] Stop 阶段 verify 失败时能阻止结束（Claude Code）
- [ ] 审计日志不包含密钥
- [ ] 重启 agent 后配置生效

## 9. 风险与开放问题

| 风险 / 问题 | 影响 | 缓解措施 / 待定 |
| --- | --- | --- |
| hooks 依赖本地环境，可被绕过 | 门禁不完整 | CI + pre-commit 兜底 |
| 规则过严导致频繁打断 | 开发体验下降 | 先 deny 少量高危，其余 ask；收集误报后收紧 |
| post-tool 检查太慢 | 工具调用卡顿 | 只跑当前文件 lint；重检查放 Stop / CI |
| opencode 无 Stop 阻塞语义 | 无法强制「完成前 verify」 | 用说明 + pre-commit/CI；或自定义 agent 流程 |
| 多 agent 策略不一致 | 不同入口行为不同 | 策略文件共享，各 agent 只做适配层 |
| 明文 token 在 Claude 配置中 | 泄露风险 | 改用环境变量 / 密钥管理，不在 hook 日志中出现 |
| commandcode hooks 能力未知 | 方案无法落地 | 先确认官方机制，再决定是否纳入 |

## 10. 验收标准

- [ ] 明确回答：当前没有 agent hooks 门禁（本文第 1 节）
- [ ] 常见 hooks 门禁清单覆盖 pre-tool / post-tool / 生命周期 / 权限（第 4 节）
- [ ] P0 规则可在主用 agent 上生效并实际拦截
- [ ] 策略文件与实现分离，可被至少两种 agent 复用
- [ ] 有单测 / 手工验收用例，审计日志脱敏
- [ ] 与现有仓库门禁（oxlint / pre-commit / CI）形成三层防御
- [ ] `AGENTS.md` / `docs/harness/spec.md` 补充 agent hooks 说明

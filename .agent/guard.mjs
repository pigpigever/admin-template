import { spawnSync } from "node:child_process";
import { appendFileSync, mkdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, relative, resolve, sep } from "node:path";

const HERE = import.meta.dirname;
const POLICY = JSON.parse(readFileSync(join(HERE, "guard-policy.json"), "utf8"));
const LOG_DIR = join(HERE, "logs");
const LOG_FILE = join(LOG_DIR, "guard.log");
const SOURCE_FILE = /\.(?:[cm]?[jt]sx?)$/u;
const LINTABLE = /^(?:src|tests)\//u;
const PATCH_FILE = /^\*\*\* (?:Add|Update|Delete) File: (?<path>.+)$/gmu;
const VERIFY_TIMEOUT_MS = 180_000;
const OUTPUT_LIMIT = 4000;
const REDACT_LIMIT = 500;
const HOME_PREFIX_LENGTH = 2;

function toPosix(value) {
  return value.split(sep).join("/");
}

function expandHome(value) {
  if (value === "~") {
    return homedir();
  }
  if (value.startsWith("~/")) {
    return join(homedir(), value.slice(HOME_PREFIX_LENGTH));
  }
  return value;
}

function normalizePath(value, cwd) {
  if (!value) {
    return "";
  }
  const expanded = expandHome(String(value));
  const absolute = resolve(cwd, expanded);
  return toPosix(relative(cwd, absolute));
}

function isOutsideWorkspace(value) {
  return value === ".." || value.startsWith("../");
}

function matchesAny(value, rules = []) {
  for (const rule of rules) {
    if (new RegExp(rule.pattern, "iu").test(value)) {
      return rule;
    }
  }
  return null;
}

function toolKind(tool) {
  const name = String(tool).toLowerCase();
  if (name === "bash" || name === "shell" || name === "exec_command") {
    return "bash";
  }
  if (name === "read" || name === "read_file") {
    return "read";
  }
  if (name === "edit" || name === "write" || name === "multiedit" || name === "notebookedit") {
    return "write";
  }
  if (name === "apply_patch") {
    return "patch";
  }
  return "other";
}

function patchPaths(text) {
  const paths = [];
  const source = String(text);
  for (const match of source.matchAll(PATCH_FILE)) {
    paths.push(match.groups.path.trim());
  }
  return paths;
}

function collectPaths(tool, args) {
  const kind = toolKind(tool);
  if (kind === "patch") {
    return patchPaths(args.command ?? "");
  }
  if (kind !== "write") {
    return [];
  }
  const raw = args.filePath ?? args.file_path ?? args.path ?? "";
  const values = Array.isArray(raw) ? raw : [raw];
  return values.filter(Boolean).map(String);
}

function commandDecision(command) {
  const deny = matchesAny(command, POLICY.denyCommands);
  if (deny) {
    return { decision: "deny", reason: deny.reason };
  }
  const ask = matchesAny(command, POLICY.askCommands);
  if (ask) {
    if (ask.allowEnv && process.env[ask.allowEnv] === "1") {
      return { decision: "allow", reason: `${ask.reason} (allowed by ${ask.allowEnv})` };
    }
    return { decision: "ask", reason: ask.reason };
  }
  return { decision: "allow", reason: "" };
}

function pathDecision(path, kind) {
  const denyRules = kind === "read" ? POLICY.denyReadPaths : POLICY.denyWritePaths;
  const askRules = kind === "read" ? POLICY.askReadPaths : POLICY.askWritePaths;
  const deny = matchesAny(path, denyRules);
  if (deny) {
    return { decision: "deny", reason: deny.reason };
  }
  if (isOutsideWorkspace(path)) {
    return { decision: "ask", reason: `Path is outside the workspace: ${path}` };
  }
  const ask = matchesAny(path, askRules);
  if (ask) {
    return { decision: "ask", reason: ask.reason };
  }
  return { decision: "allow", reason: "" };
}

export function evaluatePreTool({ tool, args = {}, cwd = process.cwd() }) {
  const kind = toolKind(tool);
  if (kind === "bash") {
    return commandDecision(String(args.command ?? ""));
  }
  if (kind === "read") {
    const path = normalizePath(args.filePath ?? args.file_path ?? args.path ?? "", cwd);
    return pathDecision(path, "read");
  }
  if (kind === "write" || kind === "patch") {
    for (const path of collectPaths(tool, args)) {
      const decision = pathDecision(normalizePath(path, cwd), "write");
      if (decision.decision !== "allow") {
        return decision;
      }
    }
  }
  return { decision: "allow", reason: "" };
}

export function runPostWriteCheck({ tool, args = {}, cwd = process.cwd() }) {
  const files = collectPaths(tool, args)
    .map((path) => normalizePath(path, cwd))
    .filter((path) => SOURCE_FILE.test(path) && LINTABLE.test(path));
  for (const file of files) {
    const result = spawnSync("pnpm", ["exec", "oxlint", "--deny-warnings", file], {
      cwd,
      encoding: "utf8",
    });
    if (result.status !== 0) {
      return { ok: false, reason: trimOutput(`oxlint failed for ${file}\n${result.stdout}${result.stderr}`) };
    }
  }
  return { ok: true, reason: "" };
}

export function runStopVerify({ cwd = process.cwd() }) {
  const status = spawnSync("git", ["status", "--porcelain"], { cwd, encoding: "utf8" });
  if (status.status !== 0) {
    return { ok: false, reason: trimOutput(`git status failed\n${status.stderr}`) };
  }
  if (status.stdout.trim() === "") {
    return { ok: true, reason: "" };
  }
  const result = spawnSync("pnpm", ["verify"], {
    cwd,
    encoding: "utf8",
    timeout: VERIFY_TIMEOUT_MS,
  });
  if (result.status !== 0) {
    return { ok: false, reason: trimOutput(`pnpm verify failed\n${result.stdout}${result.stderr}`) };
  }
  return { ok: true, reason: "" };
}

function trimOutput(value) {
  const text = String(value).trim();
  return text.length > OUTPUT_LIMIT ? `${text.slice(0, OUTPUT_LIMIT)}\n…(truncated)` : text;
}

function redact(value) {
  return String(value)
    .replaceAll(/(?:sk-|ghp_|github_pat_|AKIA)[A-Za-z0-9_-]{6,}/gu, "[REDACTED]")
    .replaceAll(/(?<prefix>Bearer\s+)[A-Za-z0-9._-]+/giu, "$<prefix>[REDACTED]")
    .replaceAll(/(?<prefix>(?:token|password|secret)\s*[=:]\s*)\S+/giu, "$<prefix>[REDACTED]")
    .slice(0, REDACT_LIMIT);
}

export function logDecision({ agent, tool, target = "", decision, reason = "" }) {
  try {
    mkdirSync(LOG_DIR, { recursive: true });
    const entry = {
      ts: new Date().toISOString(),
      agent,
      tool,
      target: redact(target),
      decision,
      reason: redact(reason),
    };
    appendFileSync(LOG_FILE, `${JSON.stringify(entry)}\n`, "utf8");
  } catch {
    // Logging must never break the agent loop.
  }
}

export function summarizeTool(tool, args = {}) {
  return String(args.command ?? args.filePath ?? args.file_path ?? args.path ?? tool);
}

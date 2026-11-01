#!/usr/bin/env node
import { readFileSync } from "node:fs";

import {
  evaluatePreTool,
  logDecision,
  runPostWriteCheck,
  runStopVerify,
  summarizeTool,
} from "../guard.mjs";

const EXIT_BLOCK = 2;
const SESSION_CONTEXT =
  "Agent guard is active. Follow AGENTS.md and docs/harness/spec.md. " +
  "Do not use --no-verify, force-push, or edit generated files. " +
  "Run pnpm verify before finishing.";
const EVENT = process.argv[2] ?? "PreToolUse";
const AGENT = process.env.AGENT_GUARD_AGENT ?? "unknown";
const payload = readPayload();
const cwd = payload.cwd ?? process.cwd();
const tool = payload.tool_name ?? payload.tool ?? "unknown";
const args = payload.tool_input ?? payload.args ?? {};

function readPayload() {
  try {
    const text = readFileSync(0, "utf8").trim();
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

function block(message) {
  process.stderr.write(`${message}\n`);
  process.exit(EXIT_BLOCK);
}

function allow() {
  process.exit(0);
}

try {
  if (EVENT === "SessionStart") {
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "SessionStart",
          additionalContext: SESSION_CONTEXT,
        },
      }),
    );
    allow();
  }

  if (EVENT === "PreToolUse") {
    const decision = evaluatePreTool({ tool, args, cwd });
    logDecision({
      agent: AGENT,
      tool,
      target: summarizeTool(tool, args),
      decision: decision.decision,
      reason: decision.reason,
    });
    if (decision.decision === "deny") {
      block(`BLOCKED: ${decision.reason}`);
    }
    if (decision.decision === "ask") {
      block(`CONFIRM REQUIRED: ${decision.reason}`);
    }
    allow();
  }

  if (EVENT === "PostToolUse") {
    const result = runPostWriteCheck({ tool, args, cwd });
    if (!result.ok) {
      block(`CHECK FAILED: ${result.reason}`);
    }
    allow();
  }

  if (EVENT === "Stop") {
    const result = runStopVerify({ cwd });
    if (!result.ok) {
      block(`STOP BLOCKED: ${result.reason}`);
    }
    allow();
  }

  allow();
} catch (error) {
  process.stderr.write(`agent guard error: ${error?.message ?? error}\n`);
  process.exit(0);
}

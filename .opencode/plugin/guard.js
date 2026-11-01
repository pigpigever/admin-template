import {
  evaluatePreTool,
  logDecision,
  runPostWriteCheck,
  summarizeTool,
} from "../../.agent/guard.mjs";

function createGuard({ directory }) {
  return {
    "tool.execute.before": (input, output) => {
      const decision = evaluatePreTool({
        tool: input.tool,
        args: output.args,
        cwd: directory,
      });
      logDecision({
        agent: "opencode",
        tool: input.tool,
        target: summarizeTool(input.tool, output.args),
        decision: decision.decision,
        reason: decision.reason,
      });
      if (decision.decision === "deny") {
        throw new Error(`BLOCKED: ${decision.reason}`);
      }
      if (decision.decision === "ask") {
        throw new Error(`CONFIRM REQUIRED: ${decision.reason}`);
      }
    },

    "tool.execute.after": (input) => {
      const result = runPostWriteCheck({
        tool: input.tool,
        args: input.args,
        cwd: directory,
      });
      if (!result.ok) {
        throw new Error(`CHECK FAILED: ${result.reason}`);
      }
    },
  };
}

export default createGuard;

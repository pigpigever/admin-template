/**
 * JSX lint rules (loaded via .oxlintrc.json → jsPlugins).
 *
 * - no-long-inline-callback: JSX attribute callbacks spanning more than one line
 *   must be extracted into named functions.
 * - max-props-per-line: a JSX element with more than two props must put each prop
 *   on its own line.
 */

const MAX_PROPS_PER_LINE = 2;

function isCallback(node) {
  return (
    node &&
    (node.type === "ArrowFunctionExpression" || node.type === "FunctionExpression")
  );
}

const noLongInlineCallback = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Require multi-line JSX attribute callbacks to be extracted into named functions",
    },
    schema: [],
  },
  create(context) {
    return {
      JSXAttribute(node) {
        if (node.value?.type !== "JSXExpressionContainer") {
          return;
        }
        const expr = node.value.expression;
        if (!isCallback(expr)) {
          return;
        }
        if (expr.loc.start.line === expr.loc.end.line) {
          return;
        }
        context.report({
          node: expr,
          message:
            "Inline callback spans multiple lines. Extract it into a named function.",
        });
      },
    };
  },
};

const maxPropsPerLine = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Require each prop on its own line when a JSX element has more than two props",
    },
    schema: [],
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        const attrs = node.attributes;
        if (attrs.length <= MAX_PROPS_PER_LINE) {
          return;
        }

        if (attrs[0].loc.start.line === node.name.loc.end.line) {
          context.report({
            node: attrs[0],
            message: `JSX element has more than ${MAX_PROPS_PER_LINE} props. Put each prop on its own line.`,
          });
          return;
        }

        for (let i = 1; i < attrs.length; i++) {
          if (attrs[i].loc.start.line === attrs[i - 1].loc.start.line) {
            context.report({
              node: attrs[i],
              message: `JSX element has more than ${MAX_PROPS_PER_LINE} props. Put each prop on its own line.`,
            });
            return;
          }
        }
      },
    };
  },
};

export default {
  meta: { name: "jsx-rules", version: "1.0.0" },
  rules: {
    "no-long-inline-callback": noLongInlineCallback,
    "max-props-per-line": maxPropsPerLine,
  },
};

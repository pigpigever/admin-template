/**
 * Architecture lint rules (loaded via .oxlintrc.json → jsPlugins).
 *
 * - constants-dir: module-level data constants must live in `src/constants/`.
 */

const CONSTANTS_DIR = "/src/constants/";

function getFilename(context) {
  return context.filename ?? context.getFilename?.() ?? "";
}

function isTopLevel(node) {
  const parent = node.parent;
  return (
    parent?.type === "Program" ||
    (parent?.type === "ExportNamedDeclaration" && parent.parent?.type === "Program") ||
    (parent?.type === "ExportDefaultDeclaration" && parent.parent?.type === "Program")
  );
}

function isDataConstant(init) {
  if (!init) {
    return false;
  }
  switch (init.type) {
    case "Literal":
    case "ArrayExpression":
    case "ObjectExpression":
      return true;
    case "TemplateLiteral":
      return init.expressions.length === 0;
    case "NewExpression":
      return (
        init.callee?.type === "Identifier" &&
        (init.callee.name === "Set" || init.callee.name === "Map")
      );
    case "TSAsExpression":
    case "TSSatisfiesExpression":
      return isDataConstant(init.expression);
    default:
      return false;
  }
}

const constantsDir = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Require module-level data constants to live in src/constants/",
    },
    schema: [],
  },
  create(context) {
    const filename = getFilename(context);
    if (!/\.(ts|tsx)$/.test(filename)) {
      return {};
    }
    if (filename.includes(CONSTANTS_DIR)) {
      return {};
    }

    return {
      VariableDeclaration(node) {
        if (node.kind !== "const") {
          return;
        }
        if (!isTopLevel(node)) {
          return;
        }

        for (const decl of node.declarations) {
          if (!decl.init || !isDataConstant(decl.init)) {
            continue;
          }
          context.report({
            node: decl,
            message:
              "Module-level data constants must live in src/constants/ (split by domain and export them).",
          });
        }
      },
    };
  },
};

export default {
  meta: { name: "architecture", version: "1.0.0" },
  rules: {
    "constants-dir": constantsDir,
  },
};

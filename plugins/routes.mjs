/**
 * Route-boundary lint rules (loaded via .oxlintrc.json → jsPlugins).
 *
 * - no-cross-route-import: files under src/routes/ must not import one another.
 *   Route files are entry points; shared code belongs in src/lib,
 *   src/components or src/constants.
 */

import { dirname, resolve } from "node:path";

const ROUTES_SEGMENT = "/src/routes/";
const TS_EXT = /\.(?:[cm]?[jt]sx?)$/u;
const INDEX_SUFFIX = /\/index$/u;

function getFilename(context) {
  return (context.filename ?? context.getFilename?.() ?? "").replaceAll("\\", "/");
}

function getSrcDir(filename) {
  const index = filename.indexOf(ROUTES_SEGMENT);
  if (index === -1) {
    return null;
  }
  return filename.slice(0, index + "/src".length);
}

function resolveTarget(specifier, filename, srcDir) {
  if (specifier.startsWith("@/routes/")) {
    return `${srcDir}/routes/${specifier.slice("@/routes/".length)}`;
  }
  if (specifier.startsWith("./") || specifier.startsWith("../")) {
    return resolve(dirname(filename), specifier).replaceAll("\\", "/");
  }
  return null;
}

function normalizeId(file) {
  return file.replace(TS_EXT, "").replace(INDEX_SUFFIX, "");
}

const noCrossRouteImport = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow imports between files under src/routes (route files are entry points)",
    },
    schema: [],
  },
  create(context) {
    function check(node, specifier) {
      if (typeof specifier !== "string") {
        return;
      }
      const filename = getFilename(context);
      const srcDir = getSrcDir(filename);
      if (!srcDir) {
        return;
      }
      const target = resolveTarget(specifier, filename, srcDir);
      if (!target || !target.startsWith(`${srcDir}/routes/`)) {
        return;
      }
      if (normalizeId(target) === normalizeId(filename)) {
        return;
      }
      context.report({
        node,
        message:
          "Route files must not import each other. Move shared code out of src/routes (e.g. src/lib, src/components, src/constants).",
      });
    }

    return {
      ImportDeclaration(node) {
        check(node, node.source?.value);
      },
      ExportNamedDeclaration(node) {
        check(node, node.source?.value);
      },
      ExportAllDeclaration(node) {
        check(node, node.source?.value);
      },
      ImportExpression(node) {
        check(node, node.source?.value);
      },
      CallExpression(node) {
        if (node.callee?.type === "Identifier" && node.callee.name === "require") {
          check(node, node.arguments[0]?.value);
        }
      },
    };
  },
};

export default {
  meta: { name: "routes", version: "1.0.0" },
  rules: {
    "no-cross-route-import": noCrossRouteImport,
  },
};

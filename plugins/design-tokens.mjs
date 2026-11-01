/**
 * Design-token lint rules (loaded via .oxlintrc.json → jsPlugins).
 *
 * - no-hex-color: colors must come from the Tailwind `@theme` tokens
 *   (e.g. `text-primary` or `var(--color-primary)`), not hardcoded hex values.
 */

const HEX_COLOR =
  /(?:^|[^0-9a-zA-Z_])#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})(?![0-9a-zA-Z_])/;

const noHexColor = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow hardcoded hex colors; use Tailwind @theme tokens instead",
    },
    schema: [],
  },
  create(context) {
    return {
      Literal(node) {
        if (typeof node.value !== "string") {
          return;
        }
        if (!HEX_COLOR.test(node.value)) {
          return;
        }
        context.report({
          node,
          message:
            "Do not hardcode hex colors. Use a theme token from the @theme block (e.g. text-primary or var(--color-primary)).",
        });
      },
    };
  },
};

export default {
  meta: { name: "design-tokens", version: "1.0.0" },
  rules: {
    "no-hex-color": noHexColor,
  },
};

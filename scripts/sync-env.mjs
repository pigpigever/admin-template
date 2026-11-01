import { readFileSync, writeFileSync } from "node:fs";
import { parse } from "yaml";

const environment = process.argv[2] ?? "development";
const root = new URL("../", import.meta.url);

function readValues(file) {
  try {
    return parse(readFileSync(new URL(`helm/${file}`, root), "utf8")) ?? {};
  } catch (error) {
    if (error.code === "ENOENT") {
      return {};
    }
    throw error;
  }
}

const base = readValues("values.yaml");
const override = readValues(`values.${environment}.yaml`);
const env = { ...base.env, ...override.env };

const lines = Object.entries(env).map(([key, value]) => `${key}=${value}`);
writeFileSync(new URL(`.env.${environment}`, root), `${lines.join("\n")}\n`);

console.log(`Wrote .env.${environment} (${lines.length} vars)`);

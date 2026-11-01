import { readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const TESTS_DIR = join(ROOT, "tests");
const TEST_FILE = /\.(?:test|spec)\.[cm]?[jt]sx?$/u;

const IGNORED = new Set([
  "node_modules",
  "dist",
  "coverage",
  ".git",
  ".husky",
  ".vite",
]);

const problems = [];

function listFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!IGNORED.has(entry.name)) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...listFiles(full));
      } else {
        files.push(full);
      }
    }
  }
  return files;
}

function checkNoStrayTests() {
  for (const file of listFiles(ROOT)) {
    if (TEST_FILE.test(file) && relative(TESTS_DIR, file).startsWith("..")) {
      problems.push(
        `Test file must live under tests/: ${relative(ROOT, file)}`
      );
    }
  }
}

function checkTestsExist() {
  let count = 0;
  try {
    count = listFiles(TESTS_DIR).filter((file) => TEST_FILE.test(file)).length;
  } catch {
    problems.push("Missing tests/ directory");
  }
  if (count === 0) {
    problems.push("No test files found under tests/");
  }
}

checkNoStrayTests();
checkTestsExist();

if (problems.length > 0) {
  console.error(`✖ Test layout check failed (${problems.length}):`);
  for (const problem of problems) {
    console.error(`  - ${problem}`);
  }
  process.exitCode = 1;
} else {
  console.log("✔ Test layout check passed");
}

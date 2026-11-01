import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const DOCS_DIR = join(ROOT, "docs");
const AGENTS_FILE = join(ROOT, "AGENTS.md");
const INDEX_FILE = join(DOCS_DIR, "index.md");
const README = "README.md";

const problems = [];

function read(file) {
  return readFileSync(file, "utf8");
}

function listMarkdown(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listMarkdown(full));
    } else if (entry.name.endsWith(".md")) {
      files.push(full);
    }
  }
  return files;
}

function listDirs(dir) {
  const dirs = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const full = join(dir, entry.name);
      dirs.push(full, ...listDirs(full));
    }
  }
  return dirs;
}

function checkAgentsImports() {
  const agents = read(AGENTS_FILE);
  for (const match of agents.matchAll(/@(?<path>[\w./-]+\.md)/gu)) {
    const { path } = match.groups;
    try {
      read(join(ROOT, path));
    } catch {
      problems.push(`AGENTS.md 引用了不存在的文件：@${path}`);
    }
  }
}

function checkIndexCoversDocs() {
  const index = read(INDEX_FILE);
  for (const file of listMarkdown(DOCS_DIR)) {
    if (file !== INDEX_FILE) {
      const rel = relative(DOCS_DIR, file).replaceAll("\\", "/");
      if (!index.includes(rel)) {
        problems.push(`docs/index.md 未收录：${rel}`);
      }
    }
  }
}

function checkReadmes() {
  for (const dir of listDirs(DOCS_DIR)) {
    try {
      read(join(dir, README));
    } catch {
      problems.push(`缺少 README.md：${relative(ROOT, dir)}`);
    }
  }
}

checkAgentsImports();
checkIndexCoversDocs();
checkReadmes();

if (problems.length > 0) {
  console.error(`✖ 文档检查未通过（${problems.length} 项）：`);
  for (const problem of problems) {
    console.error(`  - ${problem}`);
  }
  process.exitCode = 1;
} else {
  console.log("✔ 文档结构检查通过");
}

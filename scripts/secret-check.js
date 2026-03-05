#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const IGNORE_DIRS = new Set([".git", "node_modules", ".next", "dist", "build", ".turbo"]);
const IGNORE_FILES = new Set(["package-lock.json", "pnpm-lock.yaml", "yarn.lock"]);

const PATTERNS = [
  { name: "Stacks private key literal", re: /\b[0-9a-f]{64}01\b/i },
  { name: "Env private key assignment", re: /\b(STACKS_PRIVATE_KEY|STACKS_DEPLOYER_KEY)\s*=\s*["'][^"']+["']/i },
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (!IGNORE_FILES.has(entry.name)) files.push(full);
  }
  return files;
}

const hits = [];
for (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file);
  let content = "";
  try {
    content = fs.readFileSync(file, "utf8");
  } catch {
    continue;
  }
  const lines = content.split(/\r?\n/);
  lines.forEach((line, idx) => {
    for (const p of PATTERNS) {
      if (p.re.test(line)) {
        hits.push(`${rel}:${idx + 1} -> ${p.name}`);
        break;
      }
    }
  });
}

if (hits.length) {
  console.error("Secret scan failed. Potential leaks found:\n");
  for (const hit of hits.slice(0, 200)) console.error(`- ${hit}`);
  process.exit(1);
}

console.log("Secret scan passed.");

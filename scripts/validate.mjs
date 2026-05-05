import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const requiredFiles = [
  "index.html",
  "styles.css",
  "app.js",
  "README.md",
  "SECURITY.md",
  "PRIVACY.md",
  "assets/cartoon_robot.png",
  "assets/cartoon_rocket.png",
  "assets/reward_badge.png",
];

function read(relativePath) {
  return readFileSync(join(root, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    console.error(`Validation failed: ${message}`);
    process.exit(1);
  }
}

for (const file of requiredFiles) {
  assert(existsSync(join(root, file)), `missing ${file}`);
}

const index = read("index.html");
const app = read("app.js");
const styles = read("styles.css");
const source = `${index}\n${app}\n${styles}`;

assert(index.includes("Content-Security-Policy"), "index.html must define a Content Security Policy");
assert(index.includes("connect-src 'none'"), "CSP should block app network calls");
assert(!/https?:\/\//i.test(source), "app source should not reference remote http(s) resources");
assert(!/\beval\s*\(/.test(app), "app.js must not use eval");
assert(!/\bnew\s+Function\b/.test(app), "app.js must not construct functions dynamically");
assert(!/\son[a-z]+\s*=/i.test(index), "index.html must not use inline event handlers");
assert(app.includes("function sanitizeColor"), "app.js should sanitize colors");
assert(app.includes("function normalizeState"), "app.js should normalize imported state");
assert(app.includes("function escapeHtml"), "app.js should escape rendered text");
assert(app.includes("MAX_ENTRIES"), "app.js should cap imported entries");
assert(app.includes("function copyEntryFromForm"), "app.js should support copying one scheduled activity");
assert(app.includes("function entryOverlapsHour"), "app.js should render multi-hour activity blocks");
assert(app.includes("function hourBlockDetails"), "app.js should label each blocked hour inside a long activity");
assert(app.includes("function saveBulkSchedule"), "app.js should support bulk schedule creation");
assert(app.includes("function conflictPairs"), "app.js should detect overlapping schedule conflicts");
assert(app.includes("function renderInsights"), "app.js should render the parent brief");
assert(app.includes("function exportIcs"), "app.js should support local calendar export");

const syntax = spawnSync(process.execPath, ["--check", join(root, "app.js")], { encoding: "utf8" });
assert(syntax.status === 0, syntax.stderr || "app.js syntax check failed");

console.log("Validation passed. Kids Schedule Studio is ready for local packaging.");

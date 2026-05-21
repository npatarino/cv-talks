#!/usr/bin/env node
// Scaffolding: create a new slide .md file from a template, inside a deck.
// Usage: node scripts/new-slide.js <deck> <template> <order> <slug> "<label>"
//   e.g. node scripts/new-slide.js 2026-03-productividad-toxica big-stat 5 big-stat-5 "Big stat · latency"

const fs = require("node:fs");
const path = require("node:path");

const [, , deck, template, orderStr, slug, label] = process.argv;
if (!deck || !template || !orderStr || !slug || !label) {
  console.error('usage: node scripts/new-slide.js <deck> <template> <order> <slug> "<label>"');
  process.exit(1);
}

const order = Number(orderStr);
const slidesDir = path.join(__dirname, "..", "decks", deck);
if (!fs.existsSync(slidesDir)) {
  console.error(`deck not found: ${slidesDir}. create it with scripts/new-deck.js first.`);
  process.exit(1);
}
const filename = `${String(order).padStart(2, "0")}-${slug}.md`;

// Per-template field scaffolds — keep in sync with layouts in src/_includes/layouts
const SCAFFOLDS = {
  "cover":            ["brand", "index", "kicker", "title", "deck"],
  "agenda":           ["eyebrow", "title"],
  "big-stat":         ["eyebrow", "stat_number", "stat_unit", "explanation", "citation"],
  "quote":            ["quote", "who"],
  "three-ideas":      ["eyebrow", "title"],
  "big-list":         ["title"],
  "key-takeaway":     ["eyebrow", "title", "line"],
  "closing":          ["top_left", "top_right", "title", "q", "foot_left", "foot_right"],
  "closing-qr":       ["eyebrow", "title", "qr_cap"],
  "closing-socials":  ["title", "socials", "credits"],
  "chart":            ["eyebrow", "title", "note"],
  "flow":             ["eyebrow", "title", "note"],
  "matrix":           ["eyebrow", "title", "col1", "col2", "row1", "row2"],
  "split-case":       ["figure", "eyebrow", "title", "lede", "link"],
  "big-concept":      ["eyebrow", "title", "note"],
  "speaker-bio":      ["initials", "photo_tag", "eyebrow", "name", "bio", "handle", "location"],
  "kpi-grid":         ["eyebrow", "title", "foot"],
  "compare":          ["eyebrow", "title", "a_label", "a_value", "a_desc", "delta", "b_label", "b_value", "b_desc", "note"],
  "roadmap":          ["eyebrow", "title"],
  "resource-cards":   ["eyebrow", "title"],
  "pricing":          ["eyebrow", "title"],
  "faq":              ["eyebrow", "title"],
  "code-block":       ["eyebrow", "title", "filename", "code", "takeaway"],
  "comparison-table": ["eyebrow", "title", "note"],
  "social-embed":     ["eyebrow", "title", "lede", "avatar", "name", "handle", "brand", "body", "meta"],
  "architecture":     ["eyebrow", "title"],
  "stack":            ["eyebrow", "title", "note"],
  "demo":             ["eyebrow", "title", "url", "main_title", "main_sub", "caption"],
  "full-bleed":       ["quote", "figure"],
  "concept-shift":    ["old", "new"],
  "word-cloud":       ["words"],
};

const fieldKeys = SCAFFOLDS[template];
if (!fieldKeys) {
  console.error(`unknown template "${template}". known: ${Object.keys(SCAFFOLDS).join(", ")}`);
  process.exit(1);
}

const metaName = (key) => key.split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join("_");
const fieldsYaml = fieldKeys
  .map((k) => `  ${k}:\n    content: "TODO"\n    meta: "${metaName(k)}"`)
  .join("\n");

const body = `---
template: ${template}
order: ${order}
label: "${label}"
fields:
${fieldsYaml}
---
`;

const target = path.join(slidesDir, filename);
if (fs.existsSync(target)) {
  console.error(`refusing to overwrite ${target}`);
  process.exit(1);
}
fs.writeFileSync(target, body);
console.log(`created ${path.relative(process.cwd(), target)}`);

#!/usr/bin/env node
// Scaffolding: create a new deck directory with the minimal files needed.
// Usage: node scripts/new-deck.js <slug> "<title>" "<author>"
//   e.g. node scripts/new-deck.js 2026-06-mi-charla "Mi charla" "Nicolás Patarino"

const fs = require("node:fs");
const path = require("node:path");

const [, , slug, title, author] = process.argv;
if (!slug || !title) {
  console.error('usage: node scripts/new-deck.js <slug> "<title>" "<author>"');
  process.exit(1);
}

const deckDir = path.join(__dirname, "..", "decks", slug);
if (fs.existsSync(deckDir)) {
  console.error(`deck already exists: ${deckDir}`);
  process.exit(1);
}
fs.mkdirSync(deckDir, { recursive: true });

const dirData = {
  tags: `${slug}-slide`,
  permalink: `talks/decks/${slug}/{{ page.fileSlug }}/index.html`,
  deck: {
    title,
    author: author || "",
    date: slug.slice(0, 7),
  },
  eleventyComputed: {
    layout: "layouts/{{ template }}.njk",
    slideCss: "{{ template }}",
    effectiveMode: "{{ mode or site.mode }}",
  },
};
fs.writeFileSync(
  path.join(deckDir, `${slug}.json`),
  JSON.stringify(dirData, null, 2) + "\n"
);

const indexNjk = `---
permalink: /talks/decks/${slug}/index.html
eleventyExcludeFromCollections: true
eleventyComputed:
  layout: ""
---
{% set slug = "${slug}" %}
{% set slides = collections["deck:${slug}"] %}
{% include "deck-toc.njk" %}
`;
fs.writeFileSync(path.join(deckDir, "index.njk"), indexNjk);

const deckNjk = `---
permalink: /talks/decks/${slug}/deck/index.html
eleventyExcludeFromCollections: true
eleventyComputed:
  layout: ""
---
{% set slides = collections["deck:${slug}"] %}
{% include "deck-player.njk" %}
`;
fs.writeFileSync(path.join(deckDir, "deck.njk"), deckNjk);

console.log(`created ${path.relative(process.cwd(), deckDir)}/`);
console.log(`next: node scripts/new-slide.js ${slug} cover 1 portada "Portada"`);

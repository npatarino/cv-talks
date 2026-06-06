const fs = require("node:fs");
const path = require("node:path");

const DECKS_DIR = path.join(__dirname, "decks");

function listDecks() {
  if (!fs.existsSync(DECKS_DIR)) return [];
  return fs
    .readdirSync(DECKS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
}

module.exports = async function (eleventyConfig) {
  const { renderSEOHeadHTML } = await import(
    "@chimichurricode/design-system/seo/render-head"
  );
  const { buildJsonLd } = await import(
    "@chimichurricode/design-system/seo"
  );

  eleventyConfig.addFilter("seoHead", function (props) {
    return renderSEOHeadHTML(props);
  });
  eleventyConfig.addFilter("seoJsonLd", function (data, kind, siteId) {
    return buildJsonLd({ kind, siteId: siteId || "talks", data });
  });

  eleventyConfig.addFilter("parseBigList", function (markdown) {
    if (!markdown) return [];
    const lines = markdown.split(/\r?\n/);
    const items = [];
    let currentTop = null;

    for (const line of lines) {
      if (!line.trim()) continue;

      const indent = line.match(/^\s*/)[0].length;
      const cleanLine = line.trim();

      const unorderedMatch = cleanLine.match(/^([*+-])\s+(.*)$/);
      const orderedMatch = cleanLine.match(/^([a-zA-Z0-9]+)[\.)]\s+(.*)$/);

      if (!unorderedMatch && !orderedMatch) {
        if (indent >= 4 && currentTop && currentTop.sub && currentTop.sub.length > 0) {
          currentTop.sub[currentTop.sub.length - 1].text += ' ' + cleanLine;
        } else if (currentTop) {
          currentTop.text += ' ' + cleanLine;
        }
        continue;
      }

      const marker = unorderedMatch ? unorderedMatch[1] : orderedMatch[1];
      let content = unorderedMatch ? unorderedMatch[2] : orderedMatch[2];

      let state = null;
      const checklistMatch = content.match(/^\[([ xX-])\]\s+(.*)$/);
      if (checklistMatch) {
        const boxChar = checklistMatch[1];
        content = checklistMatch[2];
        if (boxChar === 'x' || boxChar === 'X') {
          state = 'done';
        } else if (boxChar === '-') {
          state = 'fail';
        } else {
          state = 'todo';
        }
      }

      let term = null;
      let desc = null;
      const glossaryMatch = content.match(/^(?:\*\*(.*?)\*\*|([^*:\s][^:]*))\s*:\s*(.*)$/);
      if (glossaryMatch) {
        const potentialTerm = (glossaryMatch[1] || glossaryMatch[2]).trim();
        if (potentialTerm.toLowerCase() !== 'http' && potentialTerm.toLowerCase() !== 'https') {
          term = potentialTerm;
          desc = glossaryMatch[3].trim();
        }
      }

      const isSub = (indent >= 4);

      if (isSub) {
        if (!currentTop) {
          currentTop = { text: content };
          if (state) currentTop.state = state;
          if (term !== null) {
            currentTop.term = term;
            currentTop.desc = desc;
          }
          items.push(currentTop);
        } else {
          if (!currentTop.sub) {
            currentTop.sub = [];
          }
          const subItem = { n: marker, text: content };
          if (state) subItem.state = state;
          if (term !== null) {
            subItem.term = term;
            subItem.desc = desc;
          }
          currentTop.sub.push(subItem);
        }
      } else {
        currentTop = { text: content };
        if (orderedMatch) {
          currentTop.n = marker;
        }
        if (state) currentTop.state = state;
        if (term !== null) {
          currentTop.term = term;
          currentTop.desc = desc;
        }
        items.push(currentTop);
      }
    }

    return items;
  });

  eleventyConfig.addPassthroughCopy({ "theme/styles": "talks/styles" });
  eleventyConfig.addPassthroughCopy({ "theme/assets": "talks/assets" });

  for (const slug of listDecks()) {
    const assetsDir = path.join(DECKS_DIR, slug, "assets");
    const slidesAssetsDir = path.join(DECKS_DIR, slug, "slides", "assets");
    if (fs.existsSync(assetsDir)) {
      eleventyConfig.addPassthroughCopy({
        [`decks/${slug}/assets`]: `talks/decks/${slug}/assets`,
      });
    } else if (fs.existsSync(slidesAssetsDir)) {
      eleventyConfig.addPassthroughCopy({
        [`decks/${slug}/slides/assets`]: `talks/decks/${slug}/assets`,
      });
    }
  }

  eleventyConfig.addPassthroughCopy({
    "node_modules/@chimichurricode/design-system/dist": "design-system",
  });

  eleventyConfig.addPassthroughCopy({
    "node_modules/@chimichurricode/analytics/dist": "analytics",
  });

  eleventyConfig.addCollection("templates", (api) =>
    api.getFilteredByGlob("templates/*.md").sort((a, b) => a.data.order - b.data.order)
  );

  for (const slug of listDecks()) {
    eleventyConfig.addCollection(`deck:${slug}`, (api) => {
      const configPath = path.join(DECKS_DIR, slug, 'deck.config.json');
      let slideOrder = [];
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        slideOrder = config.slides || [];
      }
      return api
        .getFilteredByGlob([`decks/${slug}/*.md`, `decks/${slug}/slides/*.md`])
        .sort((a, b) => {
          const idxA = slideOrder.indexOf(path.basename(a.inputPath));
          const idxB = slideOrder.indexOf(path.basename(b.inputPath));
          const posA = idxA === -1 ? Infinity : idxA;
          const posB = idxB === -1 ? Infinity : idxB;
          return posA - posB;
        });
    });
  }

  eleventyConfig.addGlobalData("decks", () =>
    listDecks().map((slug) => {
      let metaPath = path.join(DECKS_DIR, slug, `${slug}.json`);
      if (!fs.existsSync(metaPath)) {
        metaPath = path.join(DECKS_DIR, slug, `${slug}.11tydata.json`);
      }
      const raw = fs.existsSync(metaPath)
        ? JSON.parse(fs.readFileSync(metaPath, "utf8"))
        : {};
      return { slug, ...(raw.deck || {}) };
    })
  );

  eleventyConfig.ignores.add("node_modules/**");
  eleventyConfig.ignores.add("README.md");
  eleventyConfig.ignores.add("scripts/**");

  return {
    dir: {
      input: ".",
      includes: "theme/_includes",
      data: "_data",
      output: "_site",
    },
    templateFormats: ["md", "njk", "html"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
};

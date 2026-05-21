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

  eleventyConfig.addPassthroughCopy({ "theme/styles": "talks/styles" });
  eleventyConfig.addPassthroughCopy({ "theme/assets": "talks/assets" });

  for (const slug of listDecks()) {
    const assetsDir = path.join(DECKS_DIR, slug, "assets");
    if (fs.existsSync(assetsDir)) {
      eleventyConfig.addPassthroughCopy({
        [`decks/${slug}/assets`]: `talks/decks/${slug}/assets`,
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
    eleventyConfig.addCollection(`deck:${slug}`, (api) =>
      api
        .getFilteredByGlob(`decks/${slug}/*.md`)
        .sort((a, b) => a.data.order - b.data.order)
    );
  }

  eleventyConfig.addGlobalData("decks", () =>
    listDecks().map((slug) => {
      const metaPath = path.join(DECKS_DIR, slug, `${slug}.json`);
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

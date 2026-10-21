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


  // Assets de deck con path corto. En los .md basta con `assets/x.svg` (en src,
  // href o data-inline); este transform lo expande a /talks/decks/<slug>/assets/
  // según el deck al que pertenece la página. Después resuelve `data-inline`:
  //   <img src="assets/x.svg" data-inline …>   → SVG incrustado (hereda fuentes y
  //                                              sus animaciones CSS funcionan)
  //   <div data-inline="assets/x.html"></div>  → fragmento HTML incrustado
  // Los atributos class/style/alt del <img> pasan al <svg>.
  function readDeckAsset(slug, file) {
    const candidates = [
      path.join(DECKS_DIR, slug, "slides", "assets", file),
      path.join(DECKS_DIR, slug, "assets", file),
    ];
    const found = candidates.find((f) => fs.existsSync(f));
    return found ? fs.readFileSync(found, "utf8") : null;
  }
  eleventyConfig.addTransform("deckAssets", function (content) {
    const ip = (this.page && this.page.inputPath) || "";
    const m = ip.match(/decks\/([^/]+)\//);
    if (!m || !/\.html$/.test((this.page && this.page.outputPath) || "")) return content;
    const slug = m[1];
    const base = `/talks/decks/${slug}/assets/`;
    let html = String(content).replace(/\b(src|href|data-inline)="assets\//g, `$1="${base}`);
    if (html.indexOf("data-inline") === -1) return html;
    html = html.replace(/<div\s+data-inline="\/talks\/decks\/([^/"]+)\/assets\/([^"?#]+\.html)"\s*>\s*<\/div>/g, (tag, s, file) => {
      const frag = readDeckAsset(s, file);
      return frag ? frag.trim() : tag;
    });
    return html.replace(/<img\b([^>]*?)\bdata-inline\b([^>]*)>/g, (tag, a, b) => {
      const attrs = a + " " + b;
      const src = (attrs.match(/\bsrc="([^"]+)"/) || [])[1];
      const mm = src && src.match(/^\/talks\/decks\/([^/]+)\/assets\/([^"?#]+\.svg)$/);
      if (!mm) return tag;
      let svg = readDeckAsset(mm[1], mm[2]);
      if (!svg) return tag;
      svg = svg.replace(/<\?xml[^>]*>\s*/, "").trim();
      const cls = (attrs.match(/\bclass="([^"]*)"/) || [])[1];
      const style = (attrs.match(/\bstyle="([^"]*)"/) || [])[1];
      const alt = (attrs.match(/\balt="([^"]*)"/) || [])[1];
      return svg.replace(/<svg\b([^>]*)>/, (open, sa) => {
        let s = sa;
        if (cls) s = /\bclass="/.test(s) ? s.replace(/\bclass="([^"]*)"/, `class="$1 ${cls}"`) : s + ` class="${cls}"`;
        if (style) s = /\bstyle="/.test(s) ? s.replace(/\bstyle="([^"]*)"/, `style="$1;${style}"`) : s + ` style="${style}"`;
        if (alt) s += ` role="img" aria-label="${alt}"`;
        return `<svg${s}>`;
      });
    });
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

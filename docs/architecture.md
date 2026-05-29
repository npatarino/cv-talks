# Architecture

## Overview

`cv-talks` is a local-first presentation authoring tool. Slides are plain Markdown files with YAML frontmatter stored on disk, versioned by Git. Two processes run during development:

- **Eleventy** (`:8080`) — static site generator that renders every slide to HTML.
- **Editor server** (`:3001`) — Bun HTTP server that provides a REST API for CRUD operations on slide files and serves the editor UI.

There is no database. The filesystem is the source of truth; Git is the revision history.

---

## Directory Structure

```
cv-talks/
├── .eleventy.js              # Eleventy config (collections, passthrough, filters)
├── editor/
│   ├── server.mjs            # Bun HTTP server entry point (port 3001)
│   ├── api/
│   │   ├── router.mjs        # HTTP routing (pure function: Request → Response)
│   │   ├── decks.mjs         # Deck listing and path helpers
│   │   ├── slides.mjs        # Slide CRUD + template scaffold loading
│   │   ├── renumber.mjs      # Slide ordering, rename, delete
│   │   ├── frontmatter.mjs   # Custom YAML parser + serializer
│   │   ├── pdf.mjs           # PDF export via Playwright
│   │   ├── assets.mjs        # Image upload + resize via Playwright/canvas
│   │   └── templates.mjs     # Template metadata loader (reads _data/templates.json)
│   └── ui/
│       ├── index.html        # Editor SPA shell
│       ├── app.js            # Vanilla JS editor application
│       ├── clipboard-svg.mjs # SVG clipboard helper
│       └── editor-helpers.mjs # Form utilities
├── theme/
│   ├── _includes/
│   │   ├── layouts/          # 27+ Nunjucks slide layouts (one per template type)
│   │   └── partials/         # Shared partials: field macro, analytics, SEO head
│   ├── assets/               # Presentation JS (present.js, deck.js, speaker notes)
│   └── styles/               # Plain CSS: base canvas, design tokens, per-template styles
├── templates/                # 44 canonical slide template files (*.md)
├── decks/                    # Authored presentation decks
│   └── {slug}/
│       ├── {N}-{slug}.md     # Slide files, ordered by numeric prefix
│       ├── {slug}.json       # Deck metadata (title, description, SEO)
│       └── assets/           # Deck-local images
├── _data/
│   └── templates.json        # Template gallery metadata (fields, variants, descriptions)
├── scripts/                  # Build and scaffolding scripts (sync-fonts, new-deck, etc.)
└── tests/
    ├── unit/                 # Vitest — pure functions (frontmatter, renumber)
    ├── integration/          # Vitest — HTTP router, template loading
    └── e2e/                  # Playwright — editor UI workflows
```

---

## Technology Choices

| Layer | Technology | Rationale |
|---|---|---|
| Static site | Eleventy 3 | Zero-JS-by-default, full Nunjucks templating, file-based collections |
| Runtime / package manager | Bun | Fast startup, no extra server dependency for the editor |
| Editor server | `Bun.serve` | Built into Bun; no Express/Fastify needed |
| Templating | Nunjucks (`.njk`) | Eleventy native; supports macros and filters |
| Frontend | Vanilla JS | No framework, no build step, instant reload |
| CSS | Plain CSS + CSS variables | Design tokens via `--recipe-*` custom properties; no preprocessor |
| YAML parsing | Custom (`frontmatter.mjs`) | Full round-trip control; avoids an external dependency |
| PDF export | Playwright + Chromium | Screenshot-to-PDF avoids iframe cross-origin constraints |
| Image resize | Playwright canvas | No native binaries; reuses the already-present Playwright dep |
| Design system | `@chimichurricode/design-system` | Shared tokens, recipes, fonts, SEO utilities, analytics |
| Testing | Vitest + Playwright | Unit/integration for pure functions; E2E for the full editor UI |

---

## Data Flow

### Development environment

```
npm run dev
  ├─ scripts/dev.sh
  │   ├─ bun editor/server.mjs     → :3001 (editor + API)
  │   └─ eleventy --serve          → :8080 (slide preview)
  │
  └─ Both watch the decks/ directory.
     Editing a slide via the API triggers Eleventy to rebuild.
```

### Slide lifecycle

```
1. User opens http://localhost:3001
2. Editor UI loads → GET /api/decks → GET /api/decks/{slug}/slides
3. User selects a slide → GET /api/decks/{slug}/slides/{file}
4. User edits form fields
5. Editor UI → PUT /api/decks/{slug}/slides/{file}
6. API writes updated .md file to disk
7. Eleventy detects change → rebuilds _site/{slug}/{slide}/index.html
8. Editor iframe reloads slide preview from http://localhost:8080
```

### PDF export

```
POST /api/decks/{slug}/export-pdf
  │
  ├─ listSlides(slug)               — get ordered slide list
  ├─ chromium.launch()              — one Chromium instance
  ├─ for each slide:
  │   ├─ page.goto(previewUrl?present=1&reveal=full)
  │   ├─ page.waitForFonts()
  │   └─ page.screenshot() → PNG buffer
  ├─ buildWrapperHtml(pngBuffers)   — single HTML with all PNGs + @page CSS
  ├─ printPage.pdf()                — Chromium print → multi-page PDF
  └─ return PDF buffer as response
```

---

## Editor API Module Responsibilities

| Module | Responsibility |
|---|---|
| `server.mjs` | Bun server bootstrap; injects `serveFile` into the router |
| `router.mjs` | HTTP routing; validates slugs; delegates to domain modules |
| `decks.mjs` | List decks from filesystem; resolve deck directory paths |
| `slides.mjs` | Slide CRUD; template scaffold seeding; preview URL generation |
| `renumber.mjs` | Slide ordering, two-pass file rename, frontmatter order sync |
| `frontmatter.mjs` | Custom YAML parse + serialize for `.md` files |
| `templates.mjs` | Load `_data/templates.json` metadata |
| `pdf.mjs` | Export a deck to PDF via Playwright screenshots |
| `assets.mjs` | Validate, optionally resize, and save uploaded images |

---

## Slide File Format

Each slide is a Markdown file with YAML frontmatter:

```yaml
---
template: big-stat
recipe: canvas-signal
order: 5
label: "Adoption · 300%"
variant: default
fields:
  eyebrow: { content: "◆ Growth", meta: "Eyebrow_Label" }
  stat_number: { content: "300%", meta: "Stat_Number" }
  explanation: { content: "YoY active users", meta: "Explanation_Text" }
items:
  - text: "Enterprise tier grew 4×"
  - text: "SMB tier grew 2×"
notes: Speaker notes (editor-only, not rendered in the slide)
---
```

- `template` — which Nunjucks layout to use (e.g. `big-stat`, `cover`, `word-cloud`).
- `recipe` — color palette (`canvas-quiet`, `canvas-signal`, `paper`, `energy-loud`, etc.).
- `order` — 1-based position; the filename prefix (`05-...`) must always match.
- `fields` — structured content for the template; each value carries `content` (visible) and `meta` (label shown in `SLIDE_MODE=meta` debug mode).
- `items` — ordered list content for list-style templates.

---

## Rendering: Dual Mode

Every template can render in two modes, toggled by the `SLIDE_MODE` environment variable:

| Mode | Description |
|---|---|
| `content` (default) | Shows real slide content |
| `meta` | Shows field labels instead of content (for template documentation) |

The `field()` Nunjucks macro in `theme/_includes/partials/field.njk` handles both branches.

---

## Presentation Modes

| Mode | Trigger | Behavior |
|---|---|---|
| Desktop presentation | viewport ≥ 768 px or `?view=presentation` | Fixed 1920×1080 canvas; `present.js` scales with CSS `transform: scale()` |
| Mobile viewer | viewport < 768 px or `?view=mobile` | Full-viewport slides stacked vertically; CSS `scroll-snap-type: y mandatory` |

---

## Design System Integration

`@chimichurricode/design-system` provides:

- **CSS tokens** — `--recipe-surface`, `--recipe-ink`, `--recipe-em`, `--recipe-accent`, `--recipe-warn` custom properties, one set per recipe.
- **Recipes** — 7 named color palettes applied per slide via the `recipe` frontmatter key.
- **Fonts** — Copied to `theme/styles/fonts/` at build time by `scripts/sync-fonts.mjs`.
- **SEO utilities** — `renderSEOHeadHTML()` and `buildJsonLd()`, exposed as Eleventy filters.
- **Analytics** — Passthrough-copied to `_site/analytics/`.

---

## Testing

| Suite | Framework | Location | What it covers |
|---|---|---|---|
| Unit | Vitest | `tests/unit/` | `frontmatter.mjs` parse/serialize, `renumber.mjs` ordering logic, `slides.mjs` CRUD |
| Integration | Vitest | `tests/integration/` | Router HTTP endpoints, template scaffold round-trip |
| E2E | Playwright | `tests/e2e/` | Full editor UI: deck selection, slide editing, save, reorder |

All API modules accept an optional `decksRoot` override so tests can redirect I/O to a temporary directory without mocking the filesystem.

---

## Build

```bash
npm run build
# 1. scripts/sync-fonts.mjs  — copy fonts from design-system package
# 2. eleventy                — render _site/ (all decks + templates)
# 3. scripts/build-seo.mjs   — post-build SEO metadata generation
```

Output is static HTML in `_site/`, deployable to any static host.

---

## Issues and Improvement Opportunities

The following are observations about areas that deviate from clean separation of concerns or common best practices. None are blocking issues for a local dev tool, but they are worth knowing about.

### 1. Git operations live inside the router

**Where:** `router.mjs:132–147` (git-status) and `router.mjs:205–219` (git-revert).

**Problem:** `spawnSync('git', ...)` is called directly inside the routing function. The router's job is to map HTTP requests to domain functions; running shell commands there mixes transport and domain concerns.

**Suggestion:** Extract a `git.mjs` module with `getStatus()` and `revertFile()` functions. The router delegates to it the same way it delegates to `slides.mjs` or `pdf.mjs`.

---

### 2. `TALKS_ROOT` is owned by `decks.mjs`

**Where:** `decks.mjs:11–12`, imported in `router.mjs:11`.

**Problem:** The repository root path (`TALKS_ROOT`) is a global constant needed by multiple modules (currently the router for git commands). It lives in `decks.mjs` because that module was the first to need it, not because it logically belongs there. Importing a path constant from an unrelated module is a leaky dependency.

**Suggestion:** Move shared path constants (`TALKS_ROOT`, `DECKS_DIR`) to a single `paths.mjs` (or `config.mjs`) module that all other modules import.

---

### 3. `TEMPLATES_DIR` is defined in two places

**Where:** `decks.mjs:13` and `slides.mjs:16`.

**Problem:** Both modules independently compute the same path (`path.resolve(__dirname, '../../templates')`). If the templates directory moves, two files need updating.

**Suggestion:** Define `TEMPLATES_DIR` once in the shared paths module described above.

---

### 4. `listTemplateSlides` does not belong in `decks.mjs`

**Where:** `decks.mjs:53–76`.

**Problem:** The function reads template files and returns template metadata. It has nothing to do with decks. It lives in `decks.mjs` only because `TEMPLATES_DIR` was already defined there, which is itself a side effect of issue #3.

**Suggestion:** Move `listTemplateSlides` to `templates.mjs`, alongside `getTemplatesMeta`.

---

### 5. Preview URLs hardcode `localhost:8080`

**Where:** `slides.mjs:124–126` (`slidePreviewUrl`) and `decks.mjs:73`.

**Problem:** The Eleventy preview port is hardcoded as a string literal in two separate places. If someone runs Eleventy on a different port (e.g. due to a conflict), the editor's preview iframes break silently.

**Suggestion:** Extract a single `PREVIEW_BASE_URL` constant (defaulting to `http://localhost:8080`, overridable via an environment variable like `ELEVENTY_PORT`) and reference it from both places.

---

### 6. `pdf.mjs` is coupled to the filesystem

**Where:** `pdf.mjs:26` — `exportDeckPdf` calls `listSlides(slug, decksRoot)` directly.

**Problem:** The PDF export module reads slides from disk itself instead of receiving them as a parameter. This couples the export logic to the persistence layer and makes the function harder to test or reuse.

**Suggestion:** Change the signature to `exportDeckPdf(slides)` and have the router (or caller) pass the already-loaded slide list. The router already has the slug in scope and can do the lookup.

---

### 7. Playwright is launched fresh for every operation

**Where:** `pdf.mjs:29`, `assets.mjs:80`.

**Problem:** Each PDF export and each image upload that needs resizing launches and tears down a full Chromium instance. For a deck with many slides or multiple uploads in succession, startup overhead adds up (~1–2 s per launch).

**Suggestion:** For a local dev tool this is acceptable, but a simple module-level singleton (launch once on server start, reuse across requests) would eliminate the repeated cold starts. Requires careful cleanup on shutdown.

---

### 8. `.eleventy.js` uses CommonJS while everything else uses ESM

**Where:** `.eleventy.js:1` uses `require()` and `module.exports`; all other files use `import`/`export`.

**Problem:** Eleventy's config file is loaded as CJS (no `.mjs` extension, no `"type": "module"` in `package.json`). This forces async `import()` calls inside the config function (`import('@chimichurricode/design-system/...')`) as a workaround. The inconsistency can confuse contributors and prevents static analysis tools from working uniformly.

**Suggestion:** Rename to `.eleventy.mjs` (Eleventy 3 supports it) and convert to top-level `import` statements. This aligns the config file with the rest of the codebase.

---

### 9. `listDecks` logic is duplicated between the editor and Eleventy

**Where:** `.eleventy.js:3–11` (inline `listDecks`), `decks.mjs:19–36` (full version).

**Problem:** Both the Eleventy config and the editor API independently scan the `decks/` directory to build the deck list. The Eleventy version is a simplified subset. When the metadata schema changes, both places need updating.

**Suggestion:** The Eleventy config could import `listDecks` from `editor/api/decks.mjs` (it is a pure filesystem read). This eliminates the duplication and keeps a single canonical implementation. Note that this would require converting `.eleventy.js` to ESM first (see issue #8).

---

### 10. Image resize always outputs PNG regardless of input format

**Where:** `assets.mjs:102`.

**Problem:** When resizing a JPEG or WebP, the canvas API always outputs PNG. A 2 MB JPEG may become a larger PNG after resize. This behavior is documented in a code comment but is invisible to the user, who receives a `.jpg` filename containing PNG bytes.

**Suggestion:** Use `canvas.toDataURL('image/jpeg')` or `'image/webp'` when the source format supports lossy compression, matching the extension to the actual output format, or document this as a known limitation and rename the file to `.png` on resize.

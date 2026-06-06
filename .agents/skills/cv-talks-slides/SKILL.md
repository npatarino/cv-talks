---
name: cv-talks-slides
description: >
  Build and serve the Eleventy slides for cv-talks. Use this skill whenever
  the user wants to build the presentation, compile the SEO data, or serve the slides
  without the editor UI — including phrases like "build slides", "compile seo",
  or "serve meta mode".
---

# Slides Generation

The project lives at `/Users/juansp/projects/chimi/cv-talks`.

The core slide generation is handled by Eleventy.

## Building for Production

To build the static HTML for the slides and generate SEO metadata:

```bash
cd /Users/juansp/projects/chimi/cv-talks
bun run slides:build
```

## Local Serving (Eleventy Only)

If you only need to preview the slides without the Editor API:

```bash
bun run slides:serve
```

To run in "meta" mode (which renders slide field placeholders instead of content):

```bash
bun run slides:serve-meta
```

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  TALKS_ROOT, DECKS_DIR, TEMPLATES_DIR, TEMPLATES_META_PATH, DESIGN_SYSTEM_ICONS_DIR,
  PREVIEW_ORIGIN, slidePreviewUrl, templatePreviewUrl,
} from '../../editor/config.mjs';

describe('editor/config', () => {
  it('resuelve rutas absolutas dentro del repo', () => {
    for (const p of [TALKS_ROOT, DECKS_DIR, TEMPLATES_DIR, TEMPLATES_META_PATH, DESIGN_SYSTEM_ICONS_DIR]) {
      expect(path.isAbsolute(p)).toBe(true);
      expect(p.startsWith(TALKS_ROOT)).toBe(true);
    }
    expect(fs.existsSync(path.join(TALKS_ROOT, 'package.json'))).toBe(true);
    expect(fs.existsSync(TEMPLATES_META_PATH)).toBe(true);
  });

  it('las rutas no dependen del cwd', () => {
    const prev = process.cwd();
    process.chdir('/');
    try {
      expect(fs.existsSync(DECKS_DIR)).toBe(true);
    } finally { process.chdir(prev); }
  });

  it('construye URLs de preview sobre PREVIEW_ORIGIN', () => {
    expect(PREVIEW_ORIGIN).not.toMatch(/\/$/);
    expect(slidePreviewUrl('d', 's')).toBe(`${PREVIEW_ORIGIN}/talks/decks/d/s/`);
    expect(templatePreviewUrl('t')).toBe(`${PREVIEW_ORIGIN}/talks/templates/t/`);
  });
});

import { describe, it, expect } from 'vitest';
import { getTemplatesMeta } from '../../editor/api/templates.mjs';

describe('getTemplatesMeta', () => {
  it('returns a non-empty object', () => {
    const meta = getTemplatesMeta();
    expect(typeof meta).toBe('object');
    expect(Object.keys(meta).length).toBeGreaterThan(0);
  });

  it('includes core templates: cover, big-concept, quote', () => {
    const meta = getTemplatesMeta();
    expect(meta).toHaveProperty('cover');
    expect(meta).toHaveProperty('big-concept');
    expect(meta).toHaveProperty('quote');
  });

  it('each template has description, when, and variants', () => {
    const meta = getTemplatesMeta();
    for (const [name, tmpl] of Object.entries(meta)) {
      expect(typeof tmpl.description, `${name}: missing description`).toBe('string');
      expect(typeof tmpl.when, `${name}: missing when`).toBe('string');
      expect(Array.isArray(tmpl.variants), `${name}: variants must be an array`).toBe(true);
    }
  });

  it('each variant has a name and note', () => {
    const meta = getTemplatesMeta();
    for (const [tName, tmpl] of Object.entries(meta)) {
      for (const variant of tmpl.variants) {
        expect(typeof variant.name, `${tName}: variant missing name`).toBe('string');
        expect(typeof variant.note, `${tName}: variant missing note`).toBe('string');
      }
    }
  });

  it('returns the same object on repeated calls (caching)', () => {
    const first = getTemplatesMeta();
    const second = getTemplatesMeta();
    expect(first).toBe(second);
  });
});

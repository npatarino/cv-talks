/**
 * Unit tests for editor/ui/editor-helpers.mjs
 *
 * Locks in the contract for several editor behaviors the user explicitly
 * asked for in conversation:
 *
 *  - `buildAssetInsertHTML` must wrap inserted assets with class="title-icon"
 *    and a trailing <br> — the canonical pattern across the deck, ensures
 *    title images render at icon size (not full-bleed) and the title text
 *    drops to a new line below.
 *  - `mergeFields` must preserve user-typed content when the template
 *    changes, but only for matching field names; meta strings stay bound
 *    to the new scaffold.
 *  - `defaultInsertPosition` must place a new slide right after the
 *    currently-selected one — not at the end.
 */
import { describe, it, expect } from 'vitest';
import {
  buildAssetInsertHTML,
  buildAssetSrc,
  mergeFields,
  defaultInsertPosition,
} from '../../editor/ui/editor-helpers.mjs';

// ─── buildAssetInsertHTML ───────────────────────────────────────────────────

describe('buildAssetInsertHTML', () => {
  it('wraps the src in <img class="title-icon"> with a trailing <br>', () => {
    const html = buildAssetInsertHTML('/talks/decks/my-deck/assets/icon.png');
    expect(html).toBe('<img src="/talks/decks/my-deck/assets/icon.png" alt="" class="title-icon"><br>');
  });

  it('always includes class="title-icon"', () => {
    expect(buildAssetInsertHTML('/any/path.svg')).toContain('class="title-icon"');
  });

  it('always emits a trailing <br>', () => {
    expect(buildAssetInsertHTML('/x.png').endsWith('<br>')).toBe(true);
  });

  it('always emits alt="" for accessibility hygiene', () => {
    expect(buildAssetInsertHTML('/x.png')).toContain('alt=""');
  });

  it('passes the src through verbatim (no encoding mangling)', () => {
    const path = '/talks/decks/2026-03-productividad-toxica/assets/icon-war-plane.png';
    expect(buildAssetInsertHTML(path)).toContain(`src="${path}"`);
  });
});

// ─── buildAssetSrc ──────────────────────────────────────────────────────────

describe('buildAssetSrc', () => {
  it('builds the canonical /talks/decks/<slug>/assets/<file> path', () => {
    expect(buildAssetSrc('my-deck', 'icon.png')).toBe('/talks/decks/my-deck/assets/icon.png');
  });

  it('does not URL-encode (the editor handles asset names that are already slugified)', () => {
    expect(buildAssetSrc('deck', 'my_icon-2.png')).toBe('/talks/decks/deck/assets/my_icon-2.png');
  });
});

// ─── mergeFields ────────────────────────────────────────────────────────────

describe('mergeFields — matching keys preserve previous content', () => {
  it('copies content from previous when a key exists in both', () => {
    const scaffold = {
      title: { content: '', meta: 'Title_Text' },
      note:  { content: '', meta: 'Body_Text' },
    };
    const previous = {
      title: { content: 'Hello world', meta: 'Old_Meta' },
    };
    const out = mergeFields(scaffold, previous);
    expect(out.title.content).toBe('Hello world');
    // Meta stays bound to the new scaffold, not the previous one.
    expect(out.title.meta).toBe('Title_Text');
    expect(out.note.content).toBe('');
  });

  it('drops previous keys that have no scaffold slot (new template smaller)', () => {
    const scaffold = { title: { content: '', meta: 'T' } };
    const previous = {
      title: { content: 'Keep', meta: 'T' },
      removedField: { content: 'Drop me', meta: 'X' },
    };
    const out = mergeFields(scaffold, previous);
    expect(out.title.content).toBe('Keep');
    expect(out).not.toHaveProperty('removedField');
  });

  it('returns the scaffold verbatim when previous is null/undefined/non-object', () => {
    const scaffold = { title: { content: '', meta: 'T' } };
    expect(mergeFields(scaffold, null)).toBe(scaffold);
    expect(mergeFields(scaffold, undefined)).toBe(scaffold);
    expect(mergeFields(scaffold, 'not-an-object')).toBe(scaffold);
  });

  it('handles string-valued previous (fields stored as plain strings)', () => {
    const scaffold = { title: { content: '', meta: 'T' } };
    const previous = { title: 'String content' };
    const out = mergeFields(scaffold, previous);
    expect(out.title.content).toBe('String content');
    expect(out.title.meta).toBe('T');
  });

  it('coerces non-string previous content to empty when content is missing', () => {
    const scaffold = { title: { content: '', meta: 'T' } };
    const previous = { title: { meta: 'X' } };  // no content key
    const out = mergeFields(scaffold, previous);
    expect(out.title.content).toBe('');
  });

  it('preserves plain-string scaffold shape (rare but possible)', () => {
    const scaffold = { caption: '' };
    const previous = { caption: 'Hi' };
    const out = mergeFields(scaffold, previous);
    expect(out.caption).toBe('Hi');
  });
});

// ─── defaultInsertPosition ──────────────────────────────────────────────────

describe('defaultInsertPosition', () => {
  const slides = [
    { filename: '01-a.md' },
    { filename: '02-b.md' },
    { filename: '03-c.md' },
  ];

  it('inserts right after the selected slide (selectedIndex + 2 in 1-based terms)', () => {
    // B is at index 1 → insert at position 3 (right after B, before C).
    expect(defaultInsertPosition(slides, '02-b.md')).toBe(3);
  });

  it('inserts at position 2 when the first slide is selected', () => {
    expect(defaultInsertPosition(slides, '01-a.md')).toBe(2);
  });

  it('appends at the end when the last slide is selected', () => {
    // C is at index 2 (last) → insert at position 4 (end+1 of a 3-slide deck).
    expect(defaultInsertPosition(slides, '03-c.md')).toBe(4);
  });

  it('appends at the end when no slide is selected', () => {
    expect(defaultInsertPosition(slides, null)).toBe(4);
    expect(defaultInsertPosition(slides, undefined)).toBe(4);
    expect(defaultInsertPosition(slides, '')).toBe(4);
  });

  it('appends when selected slide is not found in the list (stale state)', () => {
    expect(defaultInsertPosition(slides, 'unknown.md')).toBe(4);
  });

  it('returns 1 for an empty deck regardless of selection', () => {
    expect(defaultInsertPosition([], null)).toBe(1);
    expect(defaultInsertPosition([], 'anything.md')).toBe(1);
  });

  it('returns 1 when slides is not an array (defensive)', () => {
    expect(defaultInsertPosition(null, '01-a.md')).toBe(1);
    expect(defaultInsertPosition(undefined, '01-a.md')).toBe(1);
  });
});

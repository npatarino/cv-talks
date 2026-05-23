/**
 * Unit tests for editor/ui/clipboard-svg.mjs
 *
 * Pure string parsing — no DOM, no clipboard, no browser. Validates the
 * extractor against the three common payload shapes the function has to
 * handle when the user pastes an SVG from a design tool.
 */
import { describe, it, expect } from 'vitest';
import { extractSvgFromText } from '../../editor/ui/clipboard-svg.mjs';

describe('extractSvgFromText — bare SVG markup', () => {
  it('returns the SVG verbatim when input is bare SVG with namespace', () => {
    const input = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><circle cx="5" cy="5" r="4"/></svg>';
    expect(extractSvgFromText(input)).toBe(input);
  });

  it('injects xmlns when missing', () => {
    const input = '<svg width="10" height="10"><rect width="10" height="10"/></svg>';
    const out = extractSvgFromText(input);
    expect(out).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(out).toContain('<rect width="10" height="10"/>');
  });

  it('strips leading whitespace and BOM-like padding', () => {
    const input = '   \n<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>\n  ';
    const out = extractSvgFromText(input);
    expect(out.startsWith('<svg')).toBe(true);
    expect(out.endsWith('</svg>')).toBe(true);
  });

  it('handles uppercase <SVG> tags', () => {
    const input = '<SVG xmlns="http://www.w3.org/2000/svg"><RECT/></SVG>';
    const out = extractSvgFromText(input);
    expect(out).toBe(input);
  });
});

describe('extractSvgFromText — SVG with XML prelude', () => {
  it('strips the <?xml ?> declaration before <svg>', () => {
    const input = '<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg"><circle r="1"/></svg>';
    const out = extractSvgFromText(input);
    expect(out.startsWith('<svg')).toBe(true);
    expect(out).not.toContain('<?xml');
  });

  it('handles DOCTYPE before <svg>', () => {
    const input = '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg xmlns="http://www.w3.org/2000/svg"><g/></svg>';
    const out = extractSvgFromText(input);
    expect(out.startsWith('<svg')).toBe(true);
    expect(out).not.toContain('DOCTYPE');
  });
});

describe('extractSvgFromText — SVG embedded in HTML', () => {
  it('extracts SVG from a wrapping <html>/<body>', () => {
    const input = '<html><body><div><svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0L1 1"/></svg></div></body></html>';
    const out = extractSvgFromText(input);
    expect(out.startsWith('<svg')).toBe(true);
    expect(out.endsWith('</svg>')).toBe(true);
    expect(out).toContain('M0 0L1 1');
  });

  it('extracts inner SVG when there is text content around it', () => {
    const input = 'Some text before <svg xmlns="http://www.w3.org/2000/svg"><line x1="0" x2="1"/></svg> some text after';
    const out = extractSvgFromText(input);
    expect(out).toBe('<svg xmlns="http://www.w3.org/2000/svg"><line x1="0" x2="1"/></svg>');
  });
});

describe('extractSvgFromText — nested SVG', () => {
  it('extracts the outer SVG (last </svg> wins so nested children are preserved)', () => {
    const input = '<svg xmlns="http://www.w3.org/2000/svg"><svg viewBox="0 0 10 10"><rect/></svg></svg>';
    const out = extractSvgFromText(input);
    // Outer SVG, including the inner one.
    expect(out).toBe(input);
  });
});

describe('extractSvgFromText — rejection cases', () => {
  it('returns null for empty string', () => {
    expect(extractSvgFromText('')).toBeNull();
  });

  it('returns null for whitespace-only', () => {
    expect(extractSvgFromText('   \n\t  ')).toBeNull();
  });

  it('returns null for plain text without <svg>', () => {
    expect(extractSvgFromText('hello world')).toBeNull();
  });

  it('returns null for HTML without an svg element', () => {
    expect(extractSvgFromText('<div><p>not svg</p></div>')).toBeNull();
  });

  it('returns null for partial SVG (no closing tag)', () => {
    expect(extractSvgFromText('<svg xmlns="http://www.w3.org/2000/svg"><circle')).toBeNull();
  });

  it('returns null for closing tag before opening tag', () => {
    expect(extractSvgFromText('</svg> garbage <svg')).toBeNull();
  });

  it('returns null for non-string input', () => {
    expect(extractSvgFromText(null)).toBeNull();
    expect(extractSvgFromText(undefined)).toBeNull();
    expect(extractSvgFromText(123)).toBeNull();
    expect(extractSvgFromText({})).toBeNull();
  });

  it('does NOT match "<svglike" — requires word boundary after <svg', () => {
    // "<svgfake" is not the svg element; the regex requires whitespace or > after <svg.
    expect(extractSvgFromText('<svgfake></svgfake>')).toBeNull();
  });
});

describe('extractSvgFromText — attribute handling', () => {
  it('preserves attributes on the <svg> root', () => {
    const input = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="currentColor"><path d="M0 0"/></svg>';
    const out = extractSvgFromText(input);
    expect(out).toContain('viewBox="0 0 100 100"');
    expect(out).toContain('fill="none"');
    expect(out).toContain('stroke="currentColor"');
  });

  it('preserves a pre-existing xmlns without duplicating it', () => {
    const input = '<svg xmlns="http://www.w3.org/2000/svg" width="1"/>';
    const out = extractSvgFromText(input);
    // Only one xmlns declaration.
    expect((out.match(/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/g) || []).length).toBe(1);
  });
});

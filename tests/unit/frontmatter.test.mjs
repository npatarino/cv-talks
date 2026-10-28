import { describe, it, expect } from 'vitest';
import {
  splitFrontmatter,
  parseYaml,
  serializeYaml,
  parseMd,
  serializeMd,
} from '../../editor/api/lib/frontmatter.mjs';

// ─── splitFrontmatter ────────────────────────────────────────────────────────

describe('splitFrontmatter', () => {
  it('splits a standard frontmatter block', () => {
    const raw = '---\ntitle: Hello\n---\n# Body';
    const { yamlStr, content } = splitFrontmatter(raw);
    expect(yamlStr).toBe('title: Hello');
    expect(content).toBe('# Body');
  });

  it('returns empty yamlStr and full content when no fence', () => {
    const raw = '# Just markdown';
    const { yamlStr, content } = splitFrontmatter(raw);
    expect(yamlStr).toBe('');
    expect(content).toBe('# Just markdown');
  });

  it('handles CRLF line endings', () => {
    const raw = '---\r\ntitle: Hello\r\n---\r\nBody';
    const { yamlStr, content } = splitFrontmatter(raw);
    expect(yamlStr).toBe('title: Hello');
    expect(content).toBe('Body');
  });

  it('returns empty content when nothing after closing fence', () => {
    const raw = '---\ntitle: Hello\n---\n';
    const { content } = splitFrontmatter(raw);
    expect(content).toBe('');
  });

  it('preserves multiline body after frontmatter', () => {
    const raw = '---\nkey: val\n---\nLine 1\nLine 2\n';
    const { content } = splitFrontmatter(raw);
    expect(content).toBe('Line 1\nLine 2\n');
  });
});

// ─── parseYaml — scalars ─────────────────────────────────────────────────────

describe('parseYaml — scalars', () => {
  it('parses a plain string', () => {
    expect(parseYaml('key: hello')).toEqual({ key: 'hello' });
  });

  it('parses an integer', () => {
    expect(parseYaml('order: 4')).toEqual({ order: 4 });
  });

  it('parses a negative integer', () => {
    expect(parseYaml('val: -5')).toEqual({ val: -5 });
  });

  it('parses a float', () => {
    expect(parseYaml('val: 3.14')).toEqual({ val: 3.14 });
  });

  it('parses true/false booleans', () => {
    expect(parseYaml('a: true\nb: false')).toEqual({ a: true, b: false });
  });

  it('parses null values (null, ~, empty)', () => {
    expect(parseYaml('a: null\nb: ~\nc:')).toEqual({ a: null, b: null, c: '' });
  });

  it('parses single-quoted string', () => {
    expect(parseYaml("key: 'hello world'")).toEqual({ key: 'hello world' });
  });

  it('parses single-quoted string with escaped single quote', () => {
    expect(parseYaml("key: 'it''s fine'")).toEqual({ key: "it's fine" });
  });

  it('parses double-quoted string', () => {
    expect(parseYaml('key: "hello world"')).toEqual({ key: 'hello world' });
  });

  it('parses double-quoted string with escape sequences', () => {
    expect(parseYaml('key: "line1\\nline2"')).toEqual({ key: 'line1\nline2' });
    expect(parseYaml('key: "col1\\tcol2"')).toEqual({ key: 'col1\tcol2' });
    expect(parseYaml('key: "say \\"hi\\""')).toEqual({ key: 'say "hi"' });
  });

  it('parses an unquoted string that looks like a sentence', () => {
    expect(parseYaml('label: Big Concept slide')).toEqual({ label: 'Big Concept slide' });
  });

  it('handles multiple top-level keys', () => {
    const yaml = 'template: big-concept\nrecipe: energy-loud\norder: 2';
    expect(parseYaml(yaml)).toEqual({ template: 'big-concept', recipe: 'energy-loud', order: 2 });
  });
});

// ─── parseYaml — nested objects ──────────────────────────────────────────────

describe('parseYaml — nested objects', () => {
  it('parses a nested mapping block', () => {
    const yaml = [
      'fields:',
      '  title:',
      '    content: Hello',
      '    meta: Title_Text',
    ].join('\n');
    expect(parseYaml(yaml)).toEqual({
      fields: { title: { content: 'Hello', meta: 'Title_Text' } },
    });
  });

  it('parses an inline object value', () => {
    const yaml = 'title: { content: "Hello", meta: Title_Text }';
    expect(parseYaml(yaml)).toEqual({ title: { content: 'Hello', meta: 'Title_Text' } });
  });

  it('parses deeply nested objects', () => {
    const yaml = [
      'fields:',
      '  title: { content: "Hello", meta: Title_Text }',
      '  note: { content: "Body text", meta: Body_Text }',
    ].join('\n');
    expect(parseYaml(yaml)).toEqual({
      fields: {
        title: { content: 'Hello', meta: 'Title_Text' },
        note: { content: 'Body text', meta: 'Body_Text' },
      },
    });
  });

  it('parses an empty inline object', () => {
    expect(parseYaml('data: {}')).toEqual({ data: {} });
  });
});

// ─── parseYaml — arrays ──────────────────────────────────────────────────────

describe('parseYaml — arrays', () => {
  it('parses a block array of inline objects', () => {
    const yaml = [
      'items:',
      '  - { text: "First item" }',
      '  - { text: "Second item" }',
    ].join('\n');
    expect(parseYaml(yaml)).toEqual({
      items: [{ text: 'First item' }, { text: 'Second item' }],
    });
  });

  it('parses a block array of multiline objects', () => {
    const yaml = [
      'items:',
      '  -',
      '    text: First',
      '    bold: true',
      '  -',
      '    text: Second',
      '    bold: false',
    ].join('\n');
    expect(parseYaml(yaml)).toEqual({
      items: [
        { text: 'First', bold: true },
        { text: 'Second', bold: false },
      ],
    });
  });

  it('parses an inline array of scalars', () => {
    expect(parseYaml('tags: [a, b, c]')).toEqual({ tags: ['a', 'b', 'c'] });
  });

  it('parses an empty array', () => {
    expect(parseYaml('items: []')).toEqual({ items: [] });
  });

  it('parses array items with key: value shorthand', () => {
    const yaml = [
      'items:',
      '  - text: Hello',
      '  - text: World',
    ].join('\n');
    expect(parseYaml(yaml)).toEqual({
      items: [{ text: 'Hello' }, { text: 'World' }],
    });
  });
});

// ─── parseYaml — real slide frontmatter ──────────────────────────────────────

describe('parseYaml — real slide frontmatter', () => {
  it('parses a cover slide', () => {
    const yaml = [
      'template: cover',
      'recipe: canvas-quiet',
      'order: 1',
      'label: Cover · default',
      'variant: default',
      'fields:',
      '  title: { content: "El mito de la productividad tóxica", meta: Title_Text }',
      '  subtitle: { content: "Cómo el culto al trabajo nos quema", meta: Subtitle_Text }',
      '  author: { content: "Nicolás Patarino", meta: Author_Text }',
    ].join('\n');
    const result = parseYaml(yaml);
    expect(result.template).toBe('cover');
    expect(result.order).toBe(1);
    expect(result.fields.title.content).toBe('El mito de la productividad tóxica');
    expect(result.fields.author.meta).toBe('Author_Text');
  });

  it('parses a big-stat slide with numeric field', () => {
    const yaml = [
      'template: big-stat',
      'recipe: paper',
      'order: 12',
      'label: Big stat · xl',
      'variant: xl',
      'fields:',
      '  stat: { content: "73%", meta: Stat_Text }',
      '  caption: { content: "de los trabajadores reportan burnout", meta: Caption_Text }',
    ].join('\n');
    const result = parseYaml(yaml);
    expect(result.variant).toBe('xl');
    expect(result.fields.stat.content).toBe('73%');
  });
});

// ─── serializeYaml ───────────────────────────────────────────────────────────

describe('serializeYaml', () => {
  it('serializes a flat object', () => {
    const result = serializeYaml({ template: 'cover', order: 1 });
    expect(result).toContain('template: cover');
    expect(result).toContain('order: 1');
    expect(result).toMatch(/^---\n/);
    expect(result).toMatch(/\n---\n$/);
  });

  it('serializes boolean values', () => {
    const result = serializeYaml({ visible: true, hidden: false });
    expect(result).toContain('visible: true');
    expect(result).toContain('hidden: false');
  });

  it('serializes null values', () => {
    const result = serializeYaml({ nothing: null });
    expect(result).toContain('nothing: null');
  });

  it('quotes strings with special characters', () => {
    const result = serializeYaml({ title: 'Hello: World' });
    expect(result).toMatch(/title: ['"]Hello: World['"]/);
  });

  it('quotes strings with leading/trailing spaces', () => {
    const result = serializeYaml({ title: ' padded ' });
    expect(result).toMatch(/title: ['"]\s*padded\s*['"]/);
  });

  it('serializes arrays of inline objects', () => {
    const result = serializeYaml({ items: [{ text: 'A' }, { text: 'B' }] });
    expect(result).toContain('items:');
    expect(result).toContain('{ text: A }');
  });

  it('serializes empty string as ""', () => {
    const result = serializeYaml({ key: '' });
    expect(result).toContain('key: ""');
  });
});

// ─── Round-trip: parse → serialize → re-parse ────────────────────────────────

describe('parseYaml / serializeYaml round-trip', () => {
  const cases = [
    {
      label: 'flat object',
      obj: { template: 'cover', recipe: 'canvas-quiet', order: 1, variant: 'default' },
    },
    {
      label: 'object with nested fields',
      obj: {
        template: 'big-concept',
        order: 3,
        fields: {
          title: { content: 'Hello World', meta: 'Title_Text' },
          note: { content: null, meta: 'Body_Text' },
        },
      },
    },
    {
      label: 'object with items array',
      obj: {
        template: 'big-list',
        order: 5,
        items: [{ text: 'First' }, { text: 'Second' }, { text: 'Third' }],
      },
    },
    {
      label: 'boolean and number fields',
      obj: { template: 'cover', order: 1, visible: true, count: 42 },
    },
  ];

  for (const { label, obj } of cases) {
    it(`round-trips: ${label}`, () => {
      const yaml = serializeYaml(obj);
      const parsed = parseYaml(yaml.replace(/^---\n/, '').replace(/\n---\n$/, ''));
      expect(parsed).toEqual(obj);
    });
  }
});

// ─── Formatter idempotence: serialize(parse(raw)) === raw ────────────────────
//
// These tests verify that files already in canonical form are not modified by
// the formatter (i.e. bun run format produces no diff noise on clean files).

describe('formatter idempotence', () => {
  function idempotent(raw) {
    const { data, body } = parseMd(raw);
    return serializeMd(data, body) === raw;
  }

  it('plain unquoted label', () => {
    const raw = [
      '---',
      'template: icon',
      'recipe: paper',
      'order: 2',
      'label: Feedback alegre',
      'variant: default',
      '---',
      '',
    ].join('\n');
    expect(idempotent(raw)).toBe(true);
  });

  it('single-quoted label with special chars', () => {
    const raw = [
      '---',
      'template: big-concept',
      'recipe: canvas-quiet',
      'order: 17',
      "label: '¿Cuánto tarda una idea en llegar a producción?'",
      'variant: default',
      '---',
      '',
    ].join('\n');
    expect(idempotent(raw)).toBe(true);
  });

  it('fields with inline objects', () => {
    const raw = [
      '---',
      'template: big-concept',
      'recipe: cool-fresh',
      'order: 1',
      "label: 'Portada · Viernes 15:30'",
      'variant: default',
      'fields:',
      "  title: { content: '<strong>VIERNES</strong> <em>15:30</em>', meta: Title_Text }",
      '---',
      '',
    ].join('\n');
    expect(idempotent(raw)).toBe(true);
  });

  it('items array with inline objects', () => {
    const raw = [
      '---',
      'template: icon',
      'recipe: paper',
      'order: 49',
      'label: Cadena · paso 4',
      'variant: default',
      'items:',
      "  - { glyph: '<img src=\"/assets/a.png\" alt=\"\">' }",
      "  - { glyph: '<img src=\"/assets/b.png\" alt=\"\">' }",
      '---',
      '',
    ].join('\n');
    expect(idempotent(raw)).toBe(true);
  });

  it('multiline notes block scalar', () => {
    const raw = [
      '---',
      'template: big-concept',
      'recipe: canvas-quiet',
      'order: 1',
      'label: Portada',
      'variant: default',
      'notes: |',
      '  Primera línea de notas.',
      '  Segunda línea.',
      '---',
      '',
    ].join('\n');
    expect(idempotent(raw)).toBe(true);
  });

  it('single-line notes without quotes', () => {
    const raw = [
      '---',
      'template: big-concept',
      'recipe: canvas-quiet',
      'order: 1',
      'label: Portada',
      'variant: default',
      'notes: Contar mi historia de un viernes a última hora.',
      '---',
      '',
    ].join('\n');
    expect(idempotent(raw)).toBe(true);
  });

  it('double-quoted string is not canonical (needs reformat)', () => {
    const raw = [
      '---',
      'template: icon',
      'order: 2',
      'label: "Feedback alegre"',
      '---',
      '',
    ].join('\n');
    // Double quotes where single/bare suffice: not idempotent
    expect(idempotent(raw)).toBe(false);
  });
});

// ─── parseMd / serializeMd ────────────────────────────────────────────────────

describe('parseMd / serializeMd', () => {
  it('splits a full .md file into data and body', () => {
    const raw = '---\ntemplate: cover\norder: 1\n---\n# Heading\n\nParagraph.\n';
    const { data, body } = parseMd(raw);
    expect(data).toEqual({ template: 'cover', order: 1 });
    expect(body).toBe('# Heading\n\nParagraph.\n');
  });

  it('returns empty body when there is none', () => {
    const raw = '---\ntemplate: cover\n---\n';
    const { body } = parseMd(raw);
    expect(body).toBe('');
  });

  it('serializes data + body back to valid .md', () => {
    const data = { template: 'cover', order: 1 };
    const body = '# Heading\n';
    const result = serializeMd(data, body);
    expect(result).toMatch(/^---\n/);
    expect(result).toContain('template: cover');
    expect(result).toContain('# Heading');
  });

  it('round-trips a full slide file', () => {
    const original = [
      '---',
      'template: big-concept',
      'recipe: energy-loud',
      'order: 4',
      'label: Big concept · default',
      'variant: default',
      'fields:',
      '  title: { content: "La idea central", meta: Title_Text }',
      '  note: { content: null, meta: Body_Text }',
      '---',
      '<!-- optional markdown body -->',
      '',
    ].join('\n');

    const { data, body } = parseMd(original);
    const reserialized = serializeMd(data, body);
    const { data: data2, body: body2 } = parseMd(reserialized);

    expect(data2).toEqual(data);
    expect(body2).toBe(body);
  });
});

// ─── Casos encontrados al comparar con el parser YAML real (gray-matter) ──────

describe('agreement with real YAML: scalars that look like other types', () => {
  it('quotes strings that start like a number, date or time', () => {
    for (const v of ['2012.', '+15', '.5', '1e3', '0x1F', '12:30', '2026-10-27', '1_000', '007']) {
      const out = serializeYaml({ k: v });
      expect(out, v).toMatch(/k: ['"]/);
      expect(parseYaml(out.replace(/^---\n|---\n$/g, '')).k).toBe(v);
    }
  });

  it('quotes YAML 1.1 booleans and list/document markers', () => {
    for (const v of ['yes', 'No', 'ON', 'off', 'y', 'n', 'Null', '~', '- item', '---', '...']) {
      expect(serializeYaml({ k: v }), v).toMatch(/k: ['"]/);
    }
    expect(serializeYaml({ k: 'nope' })).toBe('---\nk: nope\n---\n');
    expect(serializeYaml({ k: 'a-1' })).toBe('---\nk: a-1\n---\n');
  });
});

describe('agreement with real YAML: block scalars keep trailing spaces', () => {
  it('preserves trailing whitespace inside | blocks and round-trips it', () => {
    const raw = 'notes: |\n  Mentorías. \n\n  Te enseño.  \n';
    const data = parseYaml(raw);
    expect(data.notes).toBe('Mentorías. \n\nTe enseño.  \n');
    const back = parseYaml(serializeYaml(data).replace(/^---\n|---\n$/g, ''));
    expect(back.notes).toBe(data.notes);
  });
});

describe('agreement with real YAML: list items that are mappings', () => {
  it('reads a multi-key mapping whose first pair is on the dash line', () => {
    const raw = 'rows:\n  - label: A\n    cells:\n      - { kind: num, value: x }\n      - { kind: num, value: y }\n  - label: B\n    cells:\n      - { kind: num, value: z }\n';
    expect(parseYaml(raw).rows).toEqual([
      { label: 'A', cells: [{ kind: 'num', value: 'x' }, { kind: 'num', value: 'y' }] },
      { label: 'B', cells: [{ kind: 'num', value: 'z' }] },
    ]);
  });

  it('reads a block scalar inside a list item (- glyph: |)', () => {
    const raw = 'items:\n  - glyph: |\n      <svg></svg>\n      <script>1</script>\n    n: 1\n  - glyph: ok\n';
    expect(parseYaml(raw).items).toEqual([{ glyph: '<svg></svg>\n<script>1</script>\n', n: 1 }, { glyph: 'ok' }]);
  });

  it('serializes nested lists/objects/blocks inside list items at the right indent', () => {
    const data = {
      rows: [
        { label: 'A', cells: [{ kind: 'num', value: 'x' }], note: 'l1\nl2\n' },
        { label: 'B', layers: [{ items: ['a', 'b'] }] },
      ],
    };
    const out = serializeYaml(data);
    expect(out).toContain('rows:\n  - label: A\n    cells:\n      - { kind: num, value: x }\n    note: |\n      l1\n      l2\n  - label: B\n');
    expect(parseYaml(out.replace(/^---\n|---\n$/g, ''))).toEqual(data);
  });
});

describe('agreement with real YAML: inline collections nest', () => {
  it('parses arrays and objects inside inline objects and arrays', () => {
    expect(parseYaml('a: { label: Edge, items: ["x", "y"], meta: { k: 1 } }\nb: [{ k: v }, [1, 2]]\n')).toEqual({
      a: { label: 'Edge', items: ['x', 'y'], meta: { k: 1 } },
      b: [{ k: 'v' }, [1, 2]],
    });
  });
});

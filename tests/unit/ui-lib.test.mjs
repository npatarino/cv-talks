import { describe, it, expect } from 'vitest';
import { escHtml, slugifyAssetName } from '../../editor/ui/lib/strings.mjs';
import { toEditorHTML, cleanHTML } from '../../editor/ui/lib/html-transform.mjs';
import { IMAGE_EXT_RE, glyphToDisplay, displayToGlyph } from '../../editor/ui/lib/glyph.mjs';
import { TEMPLATE_OPTIONAL_FIELDS, isRawHtmlField, emptyItem, structuredItemsToMarkdown } from '../../editor/ui/lib/template-rules.mjs';
import { parseBigList } from '../../theme/lib/big-list.mjs';

describe('strings', () => {
  it('escHtml escapa & < > " y tolera null', () => {
    expect(escHtml('<a href="x">&</a>')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;');
    expect(escHtml(null)).toBe('');
    expect(escHtml(5)).toBe('5');
  });

  it('slugifyAssetName: minúsculas, sin extensión ni acentos, guiones', () => {
    expect(slugifyAssetName('Mi Imagen Ñandú.PNG')).toBe('mi-imagen-nandu');
    expect(slugifyAssetName('  --a__b--  ')).toBe('a-b');
    expect(slugifyAssetName('???')).toBe('image');
    expect(slugifyAssetName('x'.repeat(100) + '.png')).toHaveLength(60);
  });
});

describe('html-transform', () => {
  const origin = 'http://localhost:8080';

  it('toEditorHTML absolutiza assets cortos y rutas /talks/ contra el origen', () => {
    expect(toEditorHTML('<img src="assets/a.svg">', 'd', origin))
      .toBe('<img src="http://localhost:8080/talks/decks/d/assets/a.svg">');
    expect(toEditorHTML('<img src="/talks/decks/d/assets/a.svg">', 'd', origin))
      .toBe('<img src="http://localhost:8080/talks/decks/d/assets/a.svg">');
    expect(toEditorHTML('<a href="assets/x">no es img</a>', 'd', origin)).toBe('<a href="assets/x">no es img</a>');
    expect(toEditorHTML(null, 'd', origin)).toBe('');
  });

  it('cleanHTML normaliza negrita/cursiva, divs/p y estilos', () => {
    expect(cleanHTML('<b>x</b><i>y</i>', origin)).toBe('<strong>x</strong><em>y</em>');
    expect(cleanHTML('<b class="k">x</b>', origin)).toBe('<strong class="k">x</strong>');
    expect(cleanHTML('<div>a</div><div>b</div>', origin)).toBe('a<br>b');
    expect(cleanHTML('<p>a</p><p>b</p>', origin)).toBe('a<br>b');
    expect(cleanHTML('a<br><br> ', origin)).toBe('a');
    expect(cleanHTML('<span style="color:red">x</span>', origin)).toBe('<span>x</span>');
  });

  it('no confunde <br> con <b>', () => {
    expect(cleanHTML('a<br>b', origin)).toBe('a<br>b');
  });

  it('cleanHTML(toEditorHTML(x)) devuelve el path corto original', () => {
    for (const html of ['<img src="assets/a.svg" alt="">', 'texto <img src="assets/b.png"> más']) {
      expect(cleanHTML(toEditorHTML(html, 'mi-deck', origin), origin)).toBe(html);
    }
  });

  it('respeta un origen distinto y escapa sus caracteres especiales', () => {
    const o = 'http://preview.test:8081';
    expect(cleanHTML(toEditorHTML('<img src="assets/a.svg">', 'd', o), o)).toBe('<img src="assets/a.svg">');
  });
});

describe('glyph', () => {
  it('glyphToDisplay extrae el nombre del asset de un <img>, o devuelve el texto', () => {
    expect(glyphToDisplay('<img src="assets/a.png" alt="">')).toBe('a.png');
    expect(glyphToDisplay('<img src="/talks/decks/d/assets/b.svg">')).toBe('b.svg');
    expect(glyphToDisplay('🔥')).toBe('🔥');
    expect(glyphToDisplay(null)).toBe('');
  });

  it('displayToGlyph: imagen → <img>, HTML intacto, emoji intacto, vacío → ""', () => {
    expect(displayToGlyph('a.png')).toBe('<img src="assets/a.png" alt="">');
    expect(displayToGlyph('<b>x</b>')).toBe('<b>x</b>');
    expect(displayToGlyph('🔥')).toBe('🔥');
    expect(displayToGlyph('')).toBe('');
  });

  it('es un viaje de ida y vuelta para nombres de imagen', () => {
    expect(glyphToDisplay(displayToGlyph('icono.webp'))).toBe('icono.webp');
    expect(IMAGE_EXT_RE.test('x.AVIF')).toBe(true);
    expect(IMAGE_EXT_RE.test('x.txt')).toBe(false);
  });
});

describe('template-rules', () => {
  it('campos opcionales por template', () => {
    expect(TEMPLATE_OPTIONAL_FIELDS['big-concept'].icon).toEqual({ content: '', meta: 'Image_Src' });
    expect(TEMPLATE_OPTIONAL_FIELDS.cover.animation.meta).toBe('Animation_HTML');
  });

  it('isRawHtmlField: por meta o por contenido peligroso para el contenteditable', () => {
    expect(isRawHtmlField('', 'Image_Background')).toBe(true);
    expect(isRawHtmlField('', 'Animation_HTML')).toBe(true);
    expect(isRawHtmlField('<script>1</script>', 'Title_Text')).toBe(true);
    expect(isRawHtmlField('<div style="position: absolute">', 'Title_Text')).toBe(true);
    expect(isRawHtmlField('<iframe src=x>', 'x')).toBe(true);
    expect(isRawHtmlField('<em>hola</em>', 'Title_Text')).toBe(false);
    expect(isRawHtmlField(null, 'Title_Text')).toBe(false);
  });

  it('emptyItem devuelve la forma de item de cada template', () => {
    expect(emptyItem('big-list', 'glossary')).toEqual({ term: '', desc: '' });
    expect(emptyItem('big-list', 'checklist')).toEqual({ text: '', state: 'todo' });
    expect(emptyItem('big-list', 'bullets')).toEqual({ text: '' });
    expect(emptyItem('icon')).toEqual({ glyph: '' });
    expect(emptyItem('three-ideas')).toEqual({ title: '', desc: '' });
    expect(emptyItem('agenda')).toEqual({ content: '' });
    expect(emptyItem('otro')).toEqual({ text: '' });
  });

  describe('structuredItemsToMarkdown', () => {
    it('no-array → ""', () => {
      expect(structuredItemsToMarkdown(undefined, 'default')).toBe('');
    });

    it('numerada (por defecto), con sub-items', () => {
      expect(structuredItemsToMarkdown([{ text: 'a' }, { text: 'b', sub: [{ n: 'a', text: 'c' }] }], 'default'))
        .toBe('1. a\n2. b\n    a. c');
    });

    it('bullets, checklist y glosario', () => {
      expect(structuredItemsToMarkdown([{ text: 'x' }], 'bullets')).toBe('* x');
      expect(structuredItemsToMarkdown([{ text: 'a', state: 'done' }, { text: 'b', state: 'fail' }, { text: 'c' }], 'checklist'))
        .toBe('- [x] a\n- [-] b\n- [ ] c');
      expect(structuredItemsToMarkdown([{ term: 'API', desc: 'interfaz' }], 'glossary')).toBe('* **API**: interfaz');
    });

    it('es inversa de parseBigList (la que usa el build)', () => {
      const items = [{ text: 'a', n: '1' }, { text: 'b', n: '2', sub: [{ n: 'a', text: 'c' }] }];
      expect(parseBigList(structuredItemsToMarkdown(items, 'default'))).toEqual(items);
      const checks = [{ text: 'a', state: 'done' }, { text: 'b', state: 'fail' }, { text: 'c', state: 'todo' }];
      expect(parseBigList(structuredItemsToMarkdown(checks, 'checklist'))).toEqual(checks);
      const gloss = [{ text: '**API**: interfaz', term: 'API', desc: 'interfaz' }];
      expect(parseBigList(structuredItemsToMarkdown([{ term: 'API', desc: 'interfaz' }], 'glossary'))).toEqual(gloss);
    });
  });
});

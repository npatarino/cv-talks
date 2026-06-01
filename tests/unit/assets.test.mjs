/**
 * Unit tests for editor/api/assets.mjs
 *
 * Validates the basename / mime guards and the file-write behavior without
 * invoking the Playwright resize path. SVG uploads skip the resize entirely,
 * so those tests don't need a browser at all.
 *
 * The actual resize logic is exercised by an integration test (router) with
 * a long timeout — see tests/integration/router.test.mjs.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { uploadAsset, imageWidthFromHeader } from '../../editor/api/assets.mjs';

// 1x1 transparent PNG — well below the 512px resize threshold so no browser is launched.
const PNG_1x1_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
const PNG_1x1 = Buffer.from(PNG_1x1_B64, 'base64');

const SVG_TINY = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>', 'utf8');

let tmpRoot;

function makeDeck(slug = 'test-deck') {
  const dir = path.join(tmpRoot, slug);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

beforeEach(() => {
  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cv-assets-test-'));
});

afterEach(() => {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

describe('uploadAsset — happy path', () => {
  it('writes a small PNG and returns filename without resize', async () => {
    makeDeck();
    const result = await uploadAsset(
      'test-deck',
      { basename: 'my-icon', mimeType: 'image/png', buffer: PNG_1x1 },
      tmpRoot,
    );
    expect(result.filename).toBe('my-icon.png');
    expect(result.resized).toBe(false);
    expect(fs.existsSync(path.join(tmpRoot, 'test-deck', 'assets', 'my-icon.png'))).toBe(true);
  });

  it('creates the assets directory if it does not exist yet', async () => {
    makeDeck();
    const assetsDir = path.join(tmpRoot, 'test-deck', 'assets');
    expect(fs.existsSync(assetsDir)).toBe(false);
    await uploadAsset('test-deck', { basename: 'foo', mimeType: 'image/png', buffer: PNG_1x1 }, tmpRoot);
    expect(fs.existsSync(assetsDir)).toBe(true);
  });

  it('writes SVG bytes verbatim (no resize path)', async () => {
    makeDeck();
    const result = await uploadAsset(
      'test-deck',
      { basename: 'logo', mimeType: 'image/svg+xml', buffer: SVG_TINY },
      tmpRoot,
    );
    expect(result.filename).toBe('logo.svg');
    expect(result.resized).toBe(false);
    const written = fs.readFileSync(path.join(tmpRoot, 'test-deck', 'assets', 'logo.svg'));
    expect(written.equals(SVG_TINY)).toBe(true);
  });

  it('maps image/jpeg to .jpg', async () => {
    makeDeck();
    // Tiny fake JPEG bytes — we never decode it because it's below the resize threshold check,
    // but uploadAsset will try to maybeResize. Pass a buffer that maybeResize can decode as JPEG —
    // the 1x1 PNG bytes work because the canvas <img> may still attempt; safer to use a real JPEG.
    // Use a minimal JPEG (smallest valid JPEG header + EOI).
    const TINY_JPEG = Buffer.from(
      'ffd8ffe000104a46494600010100000100010000ffdb004300080606070605080707070909080a0c140d0c0b0b0c1912130f141d1a1f1e1d1a1c1c20242e2720222c231c1c2837292c30313434341f27393d38323c2e333432ffc2000b080001000101011100ffc4001f0000010501010101010100000000000000000102030405060708090a0bffda00080101000000003fffd9',
      'hex',
    );
    const result = await uploadAsset(
      'test-deck',
      { basename: 'photo', mimeType: 'image/jpeg', buffer: TINY_JPEG },
      tmpRoot,
    );
    expect(result.filename).toBe('photo.jpg');
  });
});

describe('uploadAsset — basename validation', () => {
  it('rejects empty basename', async () => {
    makeDeck();
    await expect(
      uploadAsset('test-deck', { basename: '', mimeType: 'image/png', buffer: PNG_1x1 }, tmpRoot),
    ).rejects.toThrow(/Invalid basename/);
  });

  it('rejects basename with path traversal', async () => {
    makeDeck();
    await expect(
      uploadAsset('test-deck', { basename: '../escape', mimeType: 'image/png', buffer: PNG_1x1 }, tmpRoot),
    ).rejects.toThrow(/Invalid basename/);
  });

  it('rejects basename with forward slash', async () => {
    makeDeck();
    await expect(
      uploadAsset('test-deck', { basename: 'sub/dir', mimeType: 'image/png', buffer: PNG_1x1 }, tmpRoot),
    ).rejects.toThrow(/Invalid basename/);
  });

  it('rejects basename starting with a dot', async () => {
    makeDeck();
    await expect(
      uploadAsset('test-deck', { basename: '.hidden', mimeType: 'image/png', buffer: PNG_1x1 }, tmpRoot),
    ).rejects.toThrow(/Invalid basename/);
  });

  it('accepts basenames with hyphens, underscores, and digits', async () => {
    makeDeck();
    const result = await uploadAsset(
      'test-deck',
      { basename: 'my_icon-2', mimeType: 'image/png', buffer: PNG_1x1 },
      tmpRoot,
    );
    expect(result.filename).toBe('my_icon-2.png');
  });
});

describe('uploadAsset — mime type validation', () => {
  it('rejects unsupported mime type', async () => {
    makeDeck();
    await expect(
      uploadAsset('test-deck', { basename: 'bad', mimeType: 'application/pdf', buffer: PNG_1x1 }, tmpRoot),
    ).rejects.toThrow(/Unsupported image type/);
  });

  it('rejects missing mime type', async () => {
    makeDeck();
    await expect(
      uploadAsset('test-deck', { basename: 'bad', mimeType: '', buffer: PNG_1x1 }, tmpRoot),
    ).rejects.toThrow(/Unsupported image type/);
  });
});

describe('uploadAsset — duplicate guard', () => {
  it('rejects when target file already exists', async () => {
    makeDeck();
    await uploadAsset('test-deck', { basename: 'dup', mimeType: 'image/png', buffer: PNG_1x1 }, tmpRoot);
    await expect(
      uploadAsset('test-deck', { basename: 'dup', mimeType: 'image/png', buffer: PNG_1x1 }, tmpRoot),
    ).rejects.toThrow(/already exists/);
  });
});

describe('imageWidthFromHeader', () => {
  // PNG: 8-byte signature, IHDR length(0x0000000D) + "IHDR" + width(BE) + height(BE).
  function pngHeader(width, height) {
    const b = Buffer.alloc(24);
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(b, 0);
    b.writeUInt32BE(13, 8);
    b.write('IHDR', 12, 'ascii');
    b.writeUInt32BE(width, 16);
    b.writeUInt32BE(height, 20);
    return b;
  }

  it('reads the width of a 1x1 PNG', () => {
    expect(imageWidthFromHeader(PNG_1x1)).toBe(1);
  });

  it('reads the width of a synthetic large PNG', () => {
    expect(imageWidthFromHeader(pngHeader(1024, 768))).toBe(1024);
  });

  it('reads the width of a JPEG from its SOF marker', () => {
    const TINY_JPEG = Buffer.from(
      'ffd8ffe000104a46494600010100000100010000ffdb004300080606070605080707070909080a0c140d0c0b0b0c1912130f141d1a1f1e1d1a1c1c20242e2720222c231c1c2837292c30313434341f27393d38323c2e333432ffc2000b080001000101011100ffc4001f0000010501010101010100000000000000000102030405060708090a0bffda00080101000000003fffd9',
      'hex',
    );
    expect(imageWidthFromHeader(TINY_JPEG)).toBe(1);
  });

  it('reads the width of a GIF from its logical screen descriptor', () => {
    const gif = Buffer.from('GIF89a', 'ascii');
    const b = Buffer.concat([gif, Buffer.alloc(4)]);
    b.writeUInt16LE(320, 6);
    expect(imageWidthFromHeader(b)).toBe(320);
  });

  it('returns null for an unparseable header', () => {
    expect(imageWidthFromHeader(Buffer.from('not an image', 'utf8'))).toBeNull();
  });
});

describe('uploadAsset — resize behavior', () => {
  // Skipped by default: launches a real Chromium via Playwright. Run manually
  // with `bun run test -- assets` when verifying the resize path end-to-end.
  it.skip('downscales an oversized PNG and reports resized:true', async () => {
    // Build a 1024×1024 PNG on the fly via a Buffer with PNG header + IHDR.
    // (Tests skip by default; enable when explicitly verifying Playwright.)
    makeDeck();
    // For a real run, swap in a real >512px image buffer here.
    const big = PNG_1x1; // placeholder — replace when un-skipping.
    const result = await uploadAsset(
      'test-deck',
      { basename: 'big', mimeType: 'image/png', buffer: big },
      tmpRoot,
    );
    expect(result.resized).toBe(true);
  }, 30_000);
});

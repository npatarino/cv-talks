import fs from 'node:fs';
import path from 'node:path';
import { parseMd, serializeMd } from './frontmatter.mjs';

const SLIDE_FILE_RE = /^[a-z0-9_-]+\.md$/i;

function getConfigPath(deckDir) {
  return path.join(deckDir, 'deck.config.json');
}

function readConfig(deckDir) {
  const p = getConfigPath(deckDir);
  if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  return { slides: [] };
}

function writeConfig(deckDir, config) {
  fs.writeFileSync(getConfigPath(deckDir), JSON.stringify(config, null, 2), 'utf8');
}

export function getSlideDir(deckDir) {
  const slidesDir = path.join(deckDir, 'slides');
  return fs.existsSync(slidesDir) ? slidesDir : deckDir;
}

export function readSlides(deckDir) {
  if (!fs.existsSync(deckDir)) return [];

  const config = readConfig(deckDir);
  const slideOrder = config.slides || [];

  const targetDir = getSlideDir(deckDir);
  const files = fs.readdirSync(targetDir).filter(f => {
    if (!f.endsWith('.md')) return false;
    if (f === 'index.md') return false;
    return SLIDE_FILE_RE.test(f);
  });

  const slides = files.map(filename => {
    const filepath = path.join(targetDir, filename);
    const raw = fs.readFileSync(filepath, 'utf8');
    const { data, body } = parseMd(raw);
    
    let order = slideOrder.indexOf(filename);
    if (order === -1) order = Infinity; // Push unordered to the end

    return { filename, filepath, data, body, _order: order };
  });

  slides.sort((a, b) => a._order - b._order);

  // Inject computed order so rest of the app thinks it's 1-indexed
  return slides.map((s, i) => {
    s.data.order = i + 1;
    return s;
  });
}

export function slugFromFilename(filename) {
  return filename.replace(/\.md$/, '');
}

export function buildFilename(order, slug) {
  return `${slug}.md`;
}

export function renumberSlides(deckDir, newOrder) {
  const config = readConfig(deckDir);
  
  if (newOrder && newOrder.length > 0) {
    config.slides = newOrder;
  } else {
    // If no new order provided, just sync the current sorted slides array
    config.slides = readSlides(deckDir).map(s => s.filename);
  }
  
  writeConfig(deckDir, config);
  
  return readSlides(deckDir).map(s => ({
    filename: s.filename,
    order: s.data.order,
    slug: slugFromFilename(s.filename),
    filepath: s.filepath
  }));
}

export function deleteSlide(deckDir, filename) {
  const filepath = path.join(getSlideDir(deckDir), filename);
  const config = readConfig(deckDir);
  const exists = fs.existsSync(filepath) || (config.slides && config.slides.includes(filename));
  if (!exists) {
    throw new Error('Slide not found');
  }
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
  }
  if (config.slides) {
    config.slides = config.slides.filter(f => f !== filename);
    writeConfig(deckDir, config);
  }
  return renumberSlides(deckDir);
}

export function moveSlide(deckDir, filename, toPosition) {
  const config = readConfig(deckDir);
  let slides = config.slides || [];
  
  const fromIdx = slides.indexOf(filename);
  if (fromIdx === -1) throw new Error(`Slide not found in config: ${filename}`);

  const toIdx = Math.max(0, Math.min(slides.length - 1, toPosition - 1));
  const [moved] = slides.splice(fromIdx, 1);
  slides.splice(toIdx, 0, moved);

  config.slides = slides;
  writeConfig(deckDir, config);

  return renumberSlides(deckDir);
}

/**
 * Orden de las slides de un deck (`slides` en deck.config.json): renumerar,
 * mover y borrar. La lectura y escritura de disco vive en store/deck-store.mjs.
 */

import fs from 'node:fs';
import path from 'node:path';
import { NotFoundError } from './domain/errors.mjs';
import { getSlideDir, readDeckConfig, writeDeckConfig, readSlides } from './store/deck-store.mjs';

// Compatibilidad: estos símbolos vivían aquí antes de existir el store.
export { getSlideDir, readSlides };

function readConfig(deckDir) {
  return readDeckConfig(deckDir) ?? { slides: [] };
}

const writeConfig = writeDeckConfig;

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
    throw new NotFoundError('Slide not found');
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
  if (fromIdx === -1) throw new NotFoundError(`Slide not found in config: ${filename}`);

  const toIdx = Math.max(0, Math.min(slides.length - 1, toPosition - 1));
  const [moved] = slides.splice(fromIdx, 1);
  slides.splice(toIdx, 0, moved);

  config.slides = slides;
  writeConfig(deckDir, config);

  return renumberSlides(deckDir);
}

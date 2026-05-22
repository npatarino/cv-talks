/**
 * Templates metadata API — reads _data/templates.js and returns it as JSON.
 */

import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const TEMPLATES_PATH = path.resolve(__dirname, '../../_data/templates.js');

let _cache = null;

export function getTemplatesMeta() {
  if (!_cache) {
    try {
      _cache = require(TEMPLATES_PATH);
    } catch {
      _cache = {};
    }
  }
  return _cache;
}

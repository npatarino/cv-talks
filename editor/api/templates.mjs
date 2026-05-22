import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

export function getTemplatesMeta() {
  return require(path.resolve(__dirname, '../../_data/templates.json'));
}

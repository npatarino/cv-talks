import { createRequire } from 'node:module';
import { TEMPLATES_META_PATH } from '../config.mjs';

const require = createRequire(import.meta.url);

export function getTemplatesMeta() {
  return require(TEMPLATES_META_PATH);
}

/**
 * Validación de entrada del editor. Único sitio donde se comprueban slugs,
 * nombres de fichero y forma de los cuerpos; el dominio asume entrada válida.
 * Todo lanza ValidationError.
 */

import { ValidationError } from '../domain/errors.mjs';
import { SLIDE_FILE_RE, SLUG_RE } from '../store/deck-store.mjs';

/** Slug de deck (también protege contra path traversal). */
export function slug(value) {
  if (typeof value !== 'string' || !SLUG_RE.test(value)) throw new ValidationError('Invalid deck slug');
  return value;
}

/** Nombre de fichero de slide (`algo.md`). */
export function slideFilename(value) {
  if (typeof value !== 'string' || !SLIDE_FILE_RE.test(value)) throw new ValidationError('Invalid slide filename');
  return value;
}

/** Cuerpo JSON que debe ser un objeto. */
export function object(value, message = 'Body must be a JSON object') {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new ValidationError(message);
  return value;
}

export function number(value, message) {
  if (typeof value !== 'number' || Number.isNaN(value)) throw new ValidationError(message);
  return value;
}

export function stringArray(value, message) {
  if (!Array.isArray(value) || !value.every(v => typeof v === 'string')) throw new ValidationError(message);
  return value;
}

export function strings(obj, keys, message) {
  if (!keys.every(k => typeof obj[k] === 'string')) throw new ValidationError(message);
  return obj;
}

/** Lee y parsea el cuerpo JSON de una petición. */
export async function readJson(req) {
  try {
    return await req.json();
  } catch {
    throw new ValidationError('Invalid JSON body');
  }
}

/** Valida por nombre de parámetro de ruta (`:slug`, `:filename`). */
export const PARAM_VALIDATORS = { slug, filename: slideFilename };

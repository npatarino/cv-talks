/** Helpers de respuesta HTTP del editor. */

import { statusOf } from '../domain/errors.mjs';

const CORS = { 'Access-Control-Allow-Origin': '*' };

export function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

export function err(message, status = 400) {
  return json({ error: message }, status);
}

/** Respuesta de error para una excepción: usa su status si es un AppError. */
export function fail(e, fallback = 500) {
  return err(e.message, statusOf(e, fallback));
}

export function text(body, status = 200) {
  return new Response(body, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

export function preflight() {
  return new Response(null, {
    status: 204,
    headers: {
      ...CORS,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

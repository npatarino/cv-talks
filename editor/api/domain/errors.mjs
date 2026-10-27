/**
 * Errores de dominio tipados. Cada uno lleva el status HTTP que le corresponde,
 * así el router no tiene que adivinarlo según la ruta.
 */

export class AppError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = new.target.name;
    this.status = status;
  }
}

/** Entrada mal formada (400). */
export class ValidationError extends AppError {
  constructor(message) { super(message, 400); }
}

/** El recurso pedido no existe (404). */
export class NotFoundError extends AppError {
  constructor(message) { super(message, 404); }
}

/** La operación choca con el estado actual (409). */
export class ConflictError extends AppError {
  constructor(message) { super(message, 409); }
}

/** Status HTTP de un error cualquiera; `fallback` para los que no son AppError. */
export function statusOf(e, fallback = 500) {
  return Number.isInteger(e?.status) ? e.status : fallback;
}

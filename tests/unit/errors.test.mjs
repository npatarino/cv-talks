import { describe, it, expect } from 'vitest';
import { AppError, ValidationError, NotFoundError, ConflictError, statusOf } from '../../editor/api/domain/errors.mjs';

describe('domain errors', () => {
  it('cada tipo lleva su status y sigue siendo un Error', () => {
    expect(new ValidationError('x').status).toBe(400);
    expect(new NotFoundError('x').status).toBe(404);
    expect(new ConflictError('x').status).toBe(409);
    expect(new AppError('x').status).toBe(500);
    const e = new NotFoundError('nope');
    expect(e).toBeInstanceOf(Error);
    expect(e).toBeInstanceOf(AppError);
    expect(e.name).toBe('NotFoundError');
    expect(e.message).toBe('nope');
  });

  it('statusOf usa el status del error o el fallback', () => {
    expect(statusOf(new NotFoundError('x'), 400)).toBe(404);
    expect(statusOf(new Error('x'), 400)).toBe(400);
    expect(statusOf(null)).toBe(500);
  });
});

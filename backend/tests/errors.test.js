const { AppError, NotFoundError, UnauthorizedError, ForbiddenError, ConflictError, ValidationError } = require('../utils/errors');

describe('Custom Error Classes', () => {
  test('AppError should have correct properties', () => {
    const error = new AppError('Test error', 500, 'TEST_ERROR');
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe('TEST_ERROR');
    expect(error.isOperational).toBe(true);
    expect(error instanceof Error).toBe(true);
  });

  test('NotFoundError should have status 404', () => {
    const error = new NotFoundError('User');
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
    expect(error.message).toBe('User not found');
  });

  test('UnauthorizedError should have status 401', () => {
    const error = new UnauthorizedError();
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe('UNAUTHORIZED');
  });

  test('ForbiddenError should have status 403', () => {
    const error = new ForbiddenError();
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe('FORBIDDEN');
  });

  test('ConflictError should have status 409', () => {
    const error = new ConflictError('Already exists');
    expect(error.statusCode).toBe(409);
    expect(error.message).toBe('Already exists');
  });

  test('ValidationError should carry errors array', () => {
    const errors = [{ field: 'email', message: 'Invalid email' }];
    const error = new ValidationError('Validation failed', errors);
    expect(error.statusCode).toBe(422);
    expect(error.errors).toEqual(errors);
  });
});

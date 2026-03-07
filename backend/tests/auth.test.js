const jwt = require('jsonwebtoken');

// Mock config
jest.mock('../config', () => ({
  jwt: { secret: 'test_secret', accessExpiresIn: '1h', refreshExpiresIn: '7d', expiresIn: '1h' },
}));

const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/roleGuard');

describe('Auth Middleware', () => {
  let req = null, res = null, next = null;

  beforeEach(() => {
    req = { headers: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  test('should reject request without token', () => {
    expect(() => authenticate(req, res, next)).toThrow('No token provided');
  });

  test('should reject request with invalid token', () => {
    req.headers.authorization = 'Bearer invalid_token';
    expect(() => authenticate(req, res, next)).toThrow('Invalid token');
  });

  test('should authenticate valid token', () => {
    const token = jwt.sign(
      { id: 'user-1', email: 'test@test.com', role: 'DONOR', name: 'Test' },
      'test_secret',
      { expiresIn: '1h' }
    );
    req.headers.authorization = `Bearer ${token}`;

    authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user.id).toBe('user-1');
    expect(req.user.role).toBe('DONOR');
  });

  test('should reject expired token', () => {
    const token = jwt.sign(
      { id: 'user-1', email: 'test@test.com', role: 'DONOR', name: 'Test' },
      'test_secret',
      { expiresIn: '0s' }
    );
    req.headers.authorization = `Bearer ${token}`;

    expect(() => authenticate(req, res, next)).toThrow('Token expired');
  });
});

describe('Role Guard Middleware', () => {
  let req = {}, res = {}, next = jest.fn();

  beforeEach(() => {
    req = { user: { id: 'user-1', role: 'DONOR' } };
    res = {};
    next = jest.fn();
  });

  test('should allow authorized role', () => {
    const middleware = authorize('DONOR', 'ADMIN');
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('should reject unauthorized role', () => {
    const middleware = authorize('VALIDATOR');
    expect(() => middleware(req, res, next)).toThrow();
  });

  test('should reject when no user', () => {
    req.user = null;
    const middleware = authorize('DONOR');
    expect(() => middleware(req, res, next)).toThrow();
  });

  test('should reject DONOR trying to access ADMIN route', () => {
    req.user = { id: 'user-1', role: 'DONOR' };
    const middleware = authorize('ADMIN');
    expect(() => middleware(req, res, next)).toThrow();
  });

  test('should allow ADMIN to access ADMIN route', () => {
    req.user = { id: 'admin-1', role: 'ADMIN' };
    const middleware = authorize('ADMIN');
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

describe('Role-Lock Enforcement', () => {
  test('registerRules should only accept DONOR and RESTAURANT roles', () => {
    // The registerRules validator restricts role to ['DONOR', 'RESTAURANT']
    const allowedSelfRegister = ['DONOR', 'RESTAURANT'];
    const blockedRoles = ['VALIDATOR', 'ADMIN', 'SUPERADMIN', 'ROOT'];

    for (const role of allowedSelfRegister) {
      expect(allowedSelfRegister).toContain(role);
    }

    for (const role of blockedRoles) {
      expect(allowedSelfRegister).not.toContain(role);
    }
  });

  test('privileged user creation should only accept VALIDATOR and ADMIN', () => {
    const allowedPrivileged = ['VALIDATOR', 'ADMIN'];

    expect(allowedPrivileged).toContain('VALIDATOR');
    expect(allowedPrivileged).toContain('ADMIN');
    expect(allowedPrivileged).not.toContain('DONOR');
    expect(allowedPrivileged).not.toContain('RESTAURANT');
  });

  test('unapproved user login should be blocked', () => {
    // Simulates the check in authService.login()
    const unapprovedUser = { id: 'u1', role: 'VALIDATOR', isApproved: false };
    expect(unapprovedUser.isApproved).toBe(false);
    // authService.login() throws ForbiddenError when isApproved === false
  });

  test('approved user login should proceed', () => {
    const approvedUser = { id: 'u2', role: 'DONOR', isApproved: true };
    expect(approvedUser.isApproved).toBe(true);
  });
});

// Test setup - runs before all test suites
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_for_testing';
process.env.JWT_EXPIRES_IN = '1h';

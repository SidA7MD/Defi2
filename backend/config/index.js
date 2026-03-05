require('dotenv').config();

// ─────────────────────────────────────────────
//  SECURITY: Fail fast if critical secrets are missing
// ─────────────────────────────────────────────
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: JWT_SECRET must be set and at least 32 characters in production.');
    process.exit(1);
  }
}

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET || 'dev_only_secret_not_for_production_32chars!',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    // Legacy support
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  },
  cors: {
    // Support comma-separated origins for multi-environment deployments
    // '*' means allow any origin (uses a callback so credentials still work)
    origin: process.env.CORS_ORIGIN === '*'
      ? true                                         // reflect request origin → works with credentials
      : process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
        : ['http://localhost:3000'],
  },
  upload: {
    dir: process.env.UPLOAD_DIR || 'uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024,
  },
  blockchain: {
    enabled: process.env.BLOCKCHAIN_ENABLED === 'true',
    rpcUrl: process.env.ETHEREUM_RPC_URL || '',
    contractAddress: process.env.CONTRACT_ADDRESS || '',
  },
  rateLimit: {
    auth: {
      windowMs: 15 * 60 * 1000, // 15 min
      max: parseInt(process.env.RATE_LIMIT_AUTH, 10) || 10,
    },
    api: {
      windowMs: 15 * 60 * 1000,
      max: parseInt(process.env.RATE_LIMIT_API, 10) || 200,
    },
  },
  isDev() {
    return this.nodeEnv === 'development';
  },
  isProd() {
    return this.nodeEnv === 'production';
  },
  isTest() {
    return this.nodeEnv === 'test';
  },
};

module.exports = config;

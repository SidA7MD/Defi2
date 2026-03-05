const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config');
const { userRepository, restaurantRepository } = require('../repositories');
const { ConflictError, UnauthorizedError, NotFoundError, ForbiddenError } = require('../utils/errors');

class AuthService {
  /**
   * Public registration — DONOR and RESTAURANT only.
   * VALIDATOR and ADMIN accounts must be created by an existing admin.
   */
  async register({ name, email, password, role, restaurantName, neighborhood }) {
    // Enforce role restriction: only DONOR and RESTAURANT can self-register
    const allowedSelfRegister = ['DONOR', 'RESTAURANT'];
    if (!allowedSelfRegister.includes(role)) {
      throw new ForbiddenError(
        `Role "${role}" cannot self-register. Only DONOR and RESTAURANT accounts can be created publicly.`
      );
    }

    // Check if user exists
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw new ConflictError('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user — self-registered users are auto-approved
    const user = await userRepository.create({
      name,
      email,
      passwordHash,
      role,
      isApproved: true,
    });

    // If restaurant role, create restaurant profile
    let restaurant = null;
    if (role === 'RESTAURANT' && restaurantName) {
      restaurant = await restaurantRepository.create({
        userId: user.id,
        name: restaurantName,
        neighborhood: neighborhood || '',
      });
    }

    // Create wallet with welcome bonus
    const walletService = require('./walletService');
    await walletService.deposit(user.id, {
      amount: 5000,
      description: 'Welcome bonus — مرحباً بك في إحسان',
    });

    // Generate tokens
    const accessToken = this._generateAccessToken(user);
    const refreshToken = await this._generateRefreshToken(user.id);

    return {
      user: {
        ...this._sanitizeUser(user),
        restaurant: restaurant
          ? { id: restaurant.id, name: restaurant.name, neighborhood: restaurant.neighborhood }
          : undefined,
      },
      token: accessToken,
      refreshToken,
    };
  }

  /**
   * Admin-only: Create a VALIDATOR or ADMIN user (pre-approved).
   */
  async createPrivilegedUser(adminId, { name, email, password, role }) {
    const allowedRoles = ['VALIDATOR', 'ADMIN'];
    if (!allowedRoles.includes(role)) {
      throw new ForbiddenError(`This endpoint is only for creating ${allowedRoles.join('/')} accounts.`);
    }

    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw new ConflictError('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await userRepository.create({
      name,
      email,
      passwordHash,
      role,
      isApproved: true,
      approvedBy: adminId,
    });

    // Create wallet
    const walletService = require('./walletService');
    await walletService.deposit(user.id, {
      amount: 5000,
      description: 'Welcome bonus — مرحباً بك في إحسان',
    });

    return this._sanitizeUser(user);
  }

  async login({ email, password }) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Block unapproved accounts
    if (!user.isApproved) {
      throw new ForbiddenError('Your account is pending approval by an administrator.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const accessToken = this._generateAccessToken(user);
    const refreshToken = await this._generateRefreshToken(user.id);

    // If restaurant, include restaurant info
    let restaurant = null;
    if (user.role === 'RESTAURANT') {
      restaurant = await restaurantRepository.findByUserId(user.id);
    }

    return {
      user: {
        ...this._sanitizeUser(user),
        restaurant: restaurant
          ? { id: restaurant.id, name: restaurant.name, neighborhood: restaurant.neighborhood }
          : undefined,
      },
      token: accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh an access token using a valid refresh token.
   */
  async refreshAccessToken(refreshTokenStr) {
    const prisma = require('../config/database');

    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshTokenStr },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.revoked || tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Rotate: revoke old, issue new
    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revoked: true },
    });

    const accessToken = this._generateAccessToken(tokenRecord.user);
    const newRefreshToken = await this._generateRefreshToken(tokenRecord.userId);

    return {
      token: accessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Revoke a refresh token (logout).
   */
  async revokeRefreshToken(refreshTokenStr) {
    const prisma = require('../config/database');

    await prisma.refreshToken.updateMany({
      where: { token: refreshTokenStr },
      data: { revoked: true },
    });
  }

  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    let restaurant = null;
    if (user.role === 'RESTAURANT') {
      restaurant = await restaurantRepository.findByUserId(user.id);
    }

    return {
      ...this._sanitizeUser(user),
      restaurant: restaurant
        ? { id: restaurant.id, name: restaurant.name, neighborhood: restaurant.neighborhood }
        : undefined,
    };
  }

  _generateAccessToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      config.jwt.secret,
      { expiresIn: config.jwt.accessExpiresIn }
    );
  }

  async _generateRefreshToken(userId) {
    const prisma = require('../config/database');
    const token = crypto.randomBytes(40).toString('hex');

    // Parse refresh token expiry
    const expiresIn = config.jwt.refreshExpiresIn;
    const ms = this._parseDuration(expiresIn);

    await prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt: new Date(Date.now() + ms),
      },
    });

    return token;
  }

  _parseDuration(str) {
    const match = str.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000; // default 7 days
    const val = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
      case 's': return val * 1000;
      case 'm': return val * 60 * 1000;
      case 'h': return val * 60 * 60 * 1000;
      case 'd': return val * 24 * 60 * 60 * 1000;
      default: return 7 * 24 * 60 * 60 * 1000;
    }
  }

  _sanitizeUser(user) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
      reputationScore: user.reputationScore,
      createdAt: user.createdAt,
    };
  }
}

module.exports = new AuthService();

const { donationRepository, needRepository } = require('../repositories');
const { generateTransactionHash, verifyDonationIntegrity } = require('../utils/hash');
const { NotFoundError, ConflictError, ForbiddenError } = require('../utils/errors');

class DonationService {
  constructor() {
    this.io = null;
  }

  setIO(io) {
    this.io = io;
  }

  async createDonation(donorId, { needId, amount }) {
    // Get and validate need
    const need = await needRepository.findById(needId);
    if (!need) {
      throw new NotFoundError('Need');
    }

    if (need.status !== 'OPEN') {
      throw new ConflictError('This need is no longer open for donations');
    }

    const donationAmount = parseFloat(amount);

    // Deduct from donor wallet — fully atomic, handles race conditions
    const walletService = require('./walletService');
    await walletService.deductForDonation(donorId, donationAmount, null);

    // Credit the restaurant or validator wallet
    const creditActions = {
      restaurant: async id => {
        const restaurant = await require('../repositories').restaurantRepository.findById(id);
        const userId = restaurant?.userId;
        if (userId) {
          await walletService.creditForDonation(userId, donationAmount, null);
        }
      },
      validator: async id => {
        if (id) {
          await walletService.creditForDonation(id, donationAmount, null);
        }
      }
    };

    const donationTarget = need.restaurantId
      ? { type: 'restaurant', id: need.restaurantId }
      : { type: 'validator', id: need.validatorId };
    await creditActions[donationTarget.type](donationTarget.id);

    // Generate timestamp and transaction hash (with structured separator)
    const timestamp = new Date().toISOString();
    const transactionHash = generateTransactionHash(
      donorId,
      needId,
      donationAmount,
      timestamp
    );

    // Get previous hash for chain integrity
    const previousHash = await donationRepository.getLastHash();

    // Create donation
    const donation = await donationRepository.create({
      donorId,
      needId,
      amount: donationAmount,
      transactionHash,
      previousHash: previousHash || null,
      status: 'PENDING',
    });

    // Update need status to FUNDED and lock it
    await needRepository.update(needId, {
      status: 'FUNDED',
      lockedAt: new Date(),
    });

    // Audit log
    const { auditLogService } = require('./auditLogService');
    await auditLogService.log(donorId, 'CREATE_DONATION', 'Donation', donation.id, {
      amount: donationAmount,
      needId,
      transactionHash,
    });

    // Emit real-time events
    if (this.io) {
      this.io.emit('donation:created', {
        id: donation.id,
        amount: parseFloat(donation.amount),
        neighborhood: need.neighborhood,
        type: need.type,
        transactionHash: donation.transactionHash,
        status: donation.status,
        createdAt: donation.createdAt,
      });

      // Notify validator
      this.io.to(`validator:${need.validatorId}`).emit('need:funded', {
        needId: need.id,
        description: need.description,
        donationId: donation.id,
      });

      // Notify restaurant if assigned
      if (need.restaurantId) {
        this.io.to(`restaurant:${need.restaurantId}`).emit('order:new', {
          needId: need.id,
          description: need.description,
          donationId: donation.id,
        });
      }
    }

    return {
      donation: {
  async confirmDonation(donationId, validatorId) {
    const donation = await donationRepository.findById(donationId);

    const validations = [
      { condition: !donation, error: new NotFoundError('Donation') },
      { condition: donation.status === 'CONFIRMED', error: new ConflictError('Donation already confirmed') },
      { condition: donation.need.validatorId !== validatorId, error: new ForbiddenError('Only the assigned validator can confirm this donation') },
    ];

    validations.forEach(v => {
      if (v.condition) throw v.error;
    });

    const anomalyMap = {
      true: 'ANOMALY_SELF_DONATE_CONFIRM: Validator donated to and confirmed their own need',
    };

    const flagReason = anomalyMap[donation.donorId === validatorId] || null;
    const flagged = Boolean(flagReason);

    // Confirm and make immutable
    const confirmedAt = new Date();
    const updated = await donationRepository.update(donationId, {
      status: 'CONFIRMED',
      confirmedAt,
      immutable: true,
      flagged,
      flagReason,
    });

    // Update need status
    await needRepository.update(donation.needId, {
      status: 'CONFIRMED',
    });

    // Audit log
    const { auditLogService } = require('./auditLogService');
    await auditLogService.log(validatorId, 'CONFIRM_DONATION', 'Donation', donationId, {
      confirmedAt,
      flagged,
      flagReason,
    });

    // Emit real-time events
    if (this.io) {
      this.io.emit('donation:confirmed', {
        id: donation.id,
        amount: parseFloat(donation.amount),
        neighborhood: donation.need.neighborhood,
        type: donation.need.type,
        transactionHash: donation.transactionHash,
        status: 'CONFIRMED',
        confirmedAt,
      });

      // Notify donor
      this.io.to(`user:${donation.donorId}`).emit('donation:proof', {
        donationId: donation.id,
        message: 'Your donation has been confirmed with proof!',
      });
    }

    return updated;
  }

  static async getDonorDonations(donorId) {
    const donations = await donationRepository.findByDonor(donorId);
    return donations.map(d => ({
      ...d,
      amount: parseFloat(d.amount),
    }));
  }

  static async getDonationById(id) {
    const donation = await donationRepository.findById(id);
    if (!donation) {
      throw new NotFoundError('Donation');
    }
    return {
      ...donation,
      amount: parseFloat(donation.amount),
    };
  }

  /**
   * Verify a transaction hash with full integrity check.
   * Recomputes hash from stored fields and compares.
   */
  static async verifyTransaction(transactionHash) {
    const donation = await donationRepository.findByHash(transactionHash);
    if (!donation) {
      throw new NotFoundError('Transaction');
    }

    // Recompute hash from stored components and verify integrity
    const integrity = verifyDonationIntegrity(donation);

    return {
      verified: donation.immutable && donation.status === 'CONFIRMED',
      integrityCheck: integrity.hashValid ? 'PASS' : 'FAIL',
      transaction: {
        id: donation.id,
        amount: parseFloat(donation.amount),
        transactionHash: donation.transactionHash,
        previousHash: donation.previousHash,
        status: donation.status,
        immutable: donation.immutable,
        flagged: donation.flagged,
        createdAt: donation.createdAt,
        confirmedAt: donation.confirmedAt,
        need: donation.need,
        impactProof: donation.impactProof,
      },
    };
  }

  static async getPublicDashboard() {
    const donations = await donationRepository.findAll(100);
    return donations.map((d) => ({
      id: d.id,
      amount: parseFloat(d.amount),
      neighborhood: d.need?.neighborhood,
      type: d.need?.type,
      description: d.need?.description,
      date: d.createdAt,
      confirmedAt: d.confirmedAt,
      status: d.status,
      transactionHash: d.transactionHash,
      immutable: d.immutable,
    }));
  }

  static async getConfirmedDonations() {
    const donations = await donationRepository.findConfirmed(50);
    return donations.map((d) => ({
      id: d.id,
      amount: parseFloat(d.amount),
      neighborhood: d.need?.neighborhood,
      type: d.need?.type,
      date: d.confirmedAt || d.createdAt,
      status: d.status,
      transactionHash: d.transactionHash,
    }));
  }

  /**
   * Aggregated dashboard statistics — uses database-level aggregation.
   */
  static async getDashboardStats() {
    const prisma = require('../config/database');

    const [totalStats, confirmedStats, needStats, recentDonations] = await Promise.all([
      // Total donated + count
      prisma.donation.aggregate({
        _sum: { amount: true },
        _count: { id: true },
      }),
      // Confirmed only
      prisma.donation.aggregate({
        where: { status: 'CONFIRMED', immutable: true },
        _sum: { amount: true },
        _count: { id: true },
      }),
      // Needs by status
      prisma.need.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      // Recent activity (last 10)
      prisma.donation.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          amount: true,
          status: true,
          createdAt: true,
          need: { select: { type: true, neighborhood: true } },
        },
      }),
    ]);

    // Donations by neighborhood
    const byNeighborhood = await prisma.donation.groupBy({
      by: ['needId'],
      where: { status: 'CONFIRMED' },
      _sum: { amount: true },
      _count: { id: true },
    });

    const needsStatusMap = {};
    for (const ns of needStats) {
      needsStatusMap[ns.status] = ns._count.id;
    }

    return {
      totalDonated: parseFloat(totalStats._sum.amount || 0),
      totalDonations: totalStats._count.id,
      confirmedDonations: confirmedStats._count.id,
      confirmedAmount: parseFloat(confirmedStats._sum.amount || 0),
      needs: needsStatusMap,
      recentActivity: recentDonations.map(d => ({
        ...d,
        amount: parseFloat(d.amount),
      })),
    };
  }

  static async getDonorStats(donorId) {
    const { userRepository } = require('../repositories');
    const user = await userRepository.findById(donorId);
    const donations = await donationRepository.findByDonor(donorId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const confirmed = donations.filter(d => d.status === 'CONFIRMED');
    const pending = donations.filter(d => d.status === 'PENDING');
    const totalDonated = donations.reduce((sum, d) => sum + parseFloat(d.amount), 0);
    const withProof = donations.filter(d => d.impactProof);
    const todayDonations = donations.filter(d => new Date(d.createdAt) >= today).length;
    const neighborhoods = [...new Set(donations.map(d => d.need?.neighborhood).filter(Boolean))];

    return {
      donor: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      stats: {
        totalDonated,
        totalDonations: donations.length,
        confirmedCount: confirmed.length,
        pendingCount: pending.length,
        impactProofs: withProof.length,
        todayDonations,
        neighborhoodsReached: neighborhoods.length,
      },
    };
  }
}

module.exports = new DonationService();

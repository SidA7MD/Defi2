const prisma = require('../config/database');

class DonationRepository {
  static async findById(id) {
    return prisma.donation.findUnique({
      where: { id },
      include: {
        donor: {
          select: { id: true, name: true },
        },
        need: {
          include: {
            validator: { select: { id: true, name: true } },
            restaurant: { select: { id: true, name: true } },
          },
        },
        impactProof: true,
      },
    });
  }

  static async findByHash(transactionHash) {
    return prisma.donation.findUnique({
      where: { transactionHash },
      include: {
        need: {
          select: {
            id: true,
            type: true,
            description: true,
            neighborhood: true,
            status: true,
          },
        },
        impactProof: {
          select: {
            confirmationMessage: true,
            photoUrl: true,
            confirmedAt: true,
          },
        },
      },
    });
  }

  static async create(data) {
    return prisma.donation.create({
      data,
      include: {
        donor: { select: { id: true, name: true } },
        need: {
          include: {
            validator: { select: { id: true, name: true } },
            restaurant: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  static async update(id, data) {
    return prisma.donation.update({
      where: { id },
      data,
    });
  }

  static async findByDonor(donorId) {
    return prisma.donation.findMany({
      where: { donorId },
      include: {
        need: {
          select: {
            id: true,
            type: true,
            description: true,
            neighborhood: true,
            status: true,
          },
        },
        impactProof: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async findByNeed(needId) {
    return prisma.donation.findMany({
      where: { needId },
      include: {
        donor: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async findConfirmed(limit = 50) {
    return prisma.donation.findMany({
      where: { status: 'CONFIRMED', immutable: true },
      include: {
        need: {
          select: {
            type: true,
            neighborhood: true,
            description: true,
          },
        },
      },
      orderBy: { confirmedAt: 'desc' },
      take: limit,
    });
  }

  static async findAll(limit = 100) {
    return prisma.donation.findMany({
      include: {
        need: {
          select: {
            type: true,
            neighborhood: true,
            description: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get the hash of the most recent donation for hash chain linking.
   * Returns null if no donations exist (GENESIS).
   */
  static async getLastHash() {
    const last = await prisma.donation.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { transactionHash: true },
    });
    return last?.transactionHash || null;
  }
}

module.exports = new DonationRepository();

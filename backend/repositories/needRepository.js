const prisma = require('../config/database');

class NeedRepository {
  static async findById(id) {
    return prisma.need.findUnique({
      where: { id },
      include: {
        validator: {
          select: { id: true, name: true, reputationScore: true },
        },
        restaurant: true,
        donations: {
          select: {
            id: true,
            amount: true,
            status: true,
            transactionHash: true,
            createdAt: true,
          },
        },
      },
    });
  }

  static async findAll(filters = {}) {
    const where = {};

    if (filters.status) where.status = filters.status;
    if (filters.neighborhood) {
      where.neighborhood = { contains: filters.neighborhood };
    }
    if (filters.type) {
      where.type = { contains: filters.type };
    }
    if (filters.validatorId) where.validatorId = filters.validatorId;

    return prisma.need.findMany({
      where,
      include: {
        validator: {
          select: { id: true, name: true, reputationScore: true },
        },
        restaurant: {
          select: { id: true, name: true, neighborhood: true },
        },
        donations: {
          select: {
            id: true,
            amount: true,
            status: true,
            transactionHash: true,
            createdAt: true,
            donorId: true,
            impactProof: {
              select: {
                id: true,
                confirmationMessage: true,
                confirmedAt: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async create(data) {
    return prisma.need.create({
      data,
      include: {
        validator: {
          select: { id: true, name: true },
        },
      },
    });
  }

  static async update(id, data) {
    return prisma.need.update({
      where: { id },
      data,
      include: {
        validator: {
          select: { id: true, name: true },
        },
        restaurant: true,
      },
    });
  }

  static async findByRestaurant(restaurantId, statuses) {
    const where = { restaurantId };
    if (statuses && statuses.length) {
      where.status = { in: statuses };
    }
    return prisma.need.findMany({
      where,
      include: {
        validator: {
          select: { id: true, name: true, reputationScore: true },
        },
        donations: {
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true,
            confirmedAt: true,
            transactionHash: true,
            donor: { select: { id: true, name: true } },
            impactProof: {
              select: {
                id: true,
                confirmationMessage: true,
                confirmedAt: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

module.exports = new NeedRepository();

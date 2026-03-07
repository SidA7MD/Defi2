const prisma = require('../config/database');

class ImpactProofRepository {
  static async findByDonationId(donationId) {
    return prisma.impactProof.findUnique({
      where: { donationId },
      include: {
        donation: {
          include: {
            donor: { select: { id: true, name: true } },
            need: {
              select: {
                type: true,
                description: true,
                neighborhood: true,
              },
            },
          },
        },
      },
    });
  }

  static async create(data) {
    return prisma.impactProof.create({
      data,
      include: {
        donation: {
          include: {
            donor: { select: { id: true, name: true } },
            need: {
              select: {
                type: true,
                description: true,
                neighborhood: true,
              },
            },
          },
        },
      },
    });
  }
}

module.exports = new ImpactProofRepository();

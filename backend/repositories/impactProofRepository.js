const prisma = require('../config/database');

class ImpactProofRepository {
  async findByDonationId(donationId) {
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

  async create(data) {
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

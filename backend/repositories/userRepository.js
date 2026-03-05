const prisma = require('../config/database');

class UserRepository {
  async findById(id) {
    return prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email) {
    return prisma.user.findUnique({ where: { email } });
  }

  async create(data) {
    return prisma.user.create({ data });
  }

  async update(id, data) {
    return prisma.user.update({ where: { id }, data });
  }

  async incrementReputation(id, amount = 1) {
    return prisma.user.update({
      where: { id },
      data: { reputationScore: { increment: amount } },
    });
  }

  async findAllByRole(role) {
    return prisma.user.findMany({
      where: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        reputationScore: true,
        createdAt: true,
      },
    });
  }
}

module.exports = new UserRepository();

const prisma = require('../config/database');

class UserRepository {
  static async findById(id) {
    return prisma.user.findUnique({ where: { id } });
  }

  static async findByEmail(email) {
    return prisma.user.findUnique({ where: { email } });
  }

  static async create(data) {
    return prisma.user.create({ data });
  }

  static async update(id, data) {
    return prisma.user.update({ where: { id }, data });
  }

  static async incrementReputation(id, amount = 1) {
    return prisma.user.update({
      where: { id },
      data: { reputationScore: { increment: amount } },
    });
  }

  static async findAllByRole(role) {
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

const prisma = require('../config/database');

class RestaurantRepository {
  static async findById(id) {
    return prisma.restaurant.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  static async findByUserId(userId) {
    return prisma.restaurant.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  static async findByUserIdWithStats(userId) {
    const restaurant = await prisma.restaurant.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        needs: {
          select: {
            id: true,
            status: true,
            estimatedAmount: true,
            createdAt: true,
            lockedAt: true,
            donations: {
              select: { amount: true, status: true },
            },
          },
        },
      },
    });
    return restaurant;
  }

  static async findAll() {
    return prisma.restaurant.findMany({
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  static async create(data) {
    return prisma.restaurant.create({ data });
  }
}

module.exports = new RestaurantRepository();

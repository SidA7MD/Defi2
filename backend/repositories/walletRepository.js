const prisma = require('../config/database');

class WalletRepository {
  async findByUserId(userId) {
    return prisma.wallet.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });
  }

  async findById(id) {
    return prisma.wallet.findUnique({
      where: { id },
    });
  }

  async create(userId) {
    return prisma.wallet.create({
      data: { userId, balance: 0 },
    });
  }

  async getOrCreate(userId) {
    let wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId, balance: 0 },
      });
    }
    return wallet;
  }

  async updateBalance(walletId, newBalance) {
    return prisma.wallet.update({
      where: { id: walletId },
      data: { balance: newBalance },
    });
  }

  async createTransaction(data) {
    return prisma.walletTransaction.create({ data });
  }

  async getTransactions(walletId, limit = 50) {
    return prisma.walletTransaction.findMany({
      where: { walletId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Atomically deposit: update balance + create transaction in one DB call
   */
  async deposit(walletId, amount, description, reference = null) {
    return prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.update({
        where: { id: walletId },
        data: { balance: { increment: amount } },
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          walletId,
          type: 'DEPOSIT',
          amount,
          description,
          reference,
          balanceAfter: wallet.balance,
        },
      });

      return { wallet, transaction };
    });
  }

  /**
   * Atomically deduct: update balance + create transaction in one DB call
   */
  async deduct(walletId, amount, type, description, reference = null) {
    return prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { id: walletId } });
      if (!wallet || wallet.balance < amount) {
        throw new Error('INSUFFICIENT_BALANCE');
      }

      const updated = await tx.wallet.update({
        where: { id: walletId },
        data: { balance: { decrement: amount } },
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          walletId,
          type,
          amount: -amount,
          description,
          reference,
          balanceAfter: updated.balance,
        },
      });

      return { wallet: updated, transaction };
    });
  }
}

module.exports = new WalletRepository();

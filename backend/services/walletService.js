const { walletRepository } = require('../repositories');
const { ConflictError } = require('../utils/errors');

class WalletService {
  constructor() {
    this.io = null;
  }

  setIO(io) {
    this.io = io;
  }

  /**
   * Get wallet for a user (auto-creates if not exists)
   */
  async getWallet(userId) {
    const wallet = await walletRepository.getOrCreate(userId);
    const transactions = await walletRepository.getTransactions(wallet.id, 50);
    return {
      id: wallet.id,
      balance: parseFloat(wallet.balance),
      createdAt: wallet.createdAt,
      transactions: transactions.map(this._formatTransaction),
    };
  }

  /**
   * Deposit virtual currency into wallet (no real money)
   */
  async deposit(userId, { amount, description }) {
    const depositAmount = parseFloat(amount);
    if (!depositAmount || depositAmount <= 0) {
      throw new ConflictError('Amount must be greater than 0');
    }

    const wallet = await walletRepository.getOrCreate(userId);
    const { wallet: updated, transaction } = await walletRepository.deposit(
      wallet.id,
      depositAmount,
      description || 'Virtual currency deposit'
    );

    // Emit real-time balance update
    if (this.io) {
      this.io.to(`user:${userId}`).emit('wallet:updated', {
        balance: parseFloat(updated.balance),
        transaction: this._formatTransaction(transaction),
      });
    }

    return {
      balance: parseFloat(updated.balance),
      transaction: this._formatTransaction(transaction),
    };
  }

  /**
   * Add bonus/reward to wallet
   */
  async addBonus(userId, { amount, description, reference }) {
    const bonusAmount = parseFloat(amount);
    if (!bonusAmount || bonusAmount <= 0) {
      throw new ConflictError('Bonus amount must be greater than 0');
    }

    const wallet = await walletRepository.getOrCreate(userId);

    // Use deposit mechanism but mark as BONUS
    const result = await walletRepository.deposit(
      wallet.id,
      bonusAmount,
      description || 'Bonus reward',
      reference || null
    );

    // Override the type to BONUS
    const prisma = require('../config/database');
    await prisma.walletTransaction.update({
      where: { id: result.transaction.id },
      data: { type: 'BONUS' },
    });

    if (this.io) {
      this.io.to(`user:${userId}`).emit('wallet:bonus', {
        balance: parseFloat(result.wallet.balance),
        amount: bonusAmount,
        description,
      });
    }

    return {
      balance: parseFloat(result.wallet.balance),
      transaction: {
        ...this._formatTransaction(result.transaction),
        type: 'BONUS',
      },
    };
  }

  /**
   * Deduct from wallet for a donation.
   * 
   * IMPORTANT: This method does NOT check balance at the service level.
   * The balance check + deduction is 100% atomic inside the repository's
   * Prisma $transaction block. This prevents race conditions where two
   * concurrent requests could overdraw the wallet.
   */
  async deductForDonation(userId, amount, donationId) {
    const wallet = await walletRepository.getOrCreate(userId);

    // Atomic check + deduct in repository $transaction
    // Throws INSUFFICIENT_BALANCE if balance < amount
    let result;
    try {
      result = await walletRepository.deduct(
        wallet.id,
        amount,
        'DONATION',
        'Donation payment',
        donationId
      );
    } catch (err) {
      if (err.message === 'INSUFFICIENT_BALANCE') {
        throw new ConflictError('Insufficient wallet balance. Please add funds first.');
      }
      throw err;
    }

    const { wallet: updated, transaction } = result;

    if (this.io) {
      this.io.to(`user:${userId}`).emit('wallet:updated', {
        balance: parseFloat(updated.balance),
        transaction: this._formatTransaction(transaction),
      });
    }

    return {
      balance: parseFloat(updated.balance),
      transaction: this._formatTransaction(transaction),
    };
  }

  /**
   * Credit a restaurant/validator wallet when a donation is received.
   */
  async creditForDonation(userId, amount, donationId) {
    const wallet = await walletRepository.getOrCreate(userId);
    const { wallet: updated, transaction } = await walletRepository.deposit(
      wallet.id,
      amount,
      'Donation received',
      donationId
    );

    // Override type to DONATION_RECEIVED
    const prisma = require('../config/database');
    await prisma.walletTransaction.update({
      where: { id: transaction.id },
      data: { type: 'DONATION_RECEIVED' },
    });

    if (this.io) {
      this.io.to(`user:${userId}`).emit('wallet:updated', {
        balance: parseFloat(updated.balance),
        transaction: { ...this._formatTransaction(transaction), type: 'DONATION_RECEIVED' },
      });
    }

    return {
      balance: parseFloat(updated.balance),
      transaction: { ...this._formatTransaction(transaction), type: 'DONATION_RECEIVED' },
    };
  }

  /**
   * Withdraw from wallet — simulated payout
   */
  async withdraw(userId, { amount, description }) {
    const withdrawAmount = parseFloat(amount);
    if (!withdrawAmount || withdrawAmount <= 0) {
      throw new ConflictError('Amount must be greater than 0');
    }

    const wallet = await walletRepository.getOrCreate(userId);

    let result;
    try {
      result = await walletRepository.deduct(
        wallet.id,
        withdrawAmount,
        'WITHDRAWAL',
        description || 'Wallet withdrawal',
        null
      );
    } catch (err) {
      if (err.message === 'INSUFFICIENT_BALANCE') {
        throw new ConflictError('Insufficient wallet balance');
      }
      throw err;
    }

    const { wallet: updated, transaction } = result;

    if (this.io) {
      this.io.to(`user:${userId}`).emit('wallet:updated', {
        balance: parseFloat(updated.balance),
        transaction: this._formatTransaction(transaction),
      });
    }

    return {
      balance: parseFloat(updated.balance),
      transaction: this._formatTransaction(transaction),
    };
  }

  /**
   * Get wallet balance only
   */
  async getBalance(userId) {
    const wallet = await walletRepository.getOrCreate(userId);
    return { balance: parseFloat(wallet.balance) };
  }

  /**
   * Get transaction history
   */
  async getTransactions(userId, limit = 50) {
    const wallet = await walletRepository.getOrCreate(userId);
    const transactions = await walletRepository.getTransactions(wallet.id, limit);
    return transactions.map(this._formatTransaction);
  }

  _formatTransaction(tx) {
    return {
      id: tx.id,
      type: tx.type,
      amount: parseFloat(tx.amount),
      description: tx.description,
      reference: tx.reference,
      balanceAfter: parseFloat(tx.balanceAfter),
      createdAt: tx.createdAt,
    };
  }
}

module.exports = new WalletService();

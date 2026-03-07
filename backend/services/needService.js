const { needRepository } = require('../repositories');
const { NotFoundError, ForbiddenError, ConflictError } = require('../utils/errors');

class NeedService {
  static async createNeed(validatorId, data) {
    const need = await needRepository.create({
      validatorId,
      type: data.type,
      description: data.description,
      neighborhood: data.neighborhood,
      estimatedAmount: parseFloat(data.estimatedAmount),
      lat: parseFloat(data.lat),
      lng: parseFloat(data.lng),
      restaurantId: data.restaurantId || null,
      beneficiaryId: data.beneficiaryId || null,
    });

    // Audit log
    const { auditLogService } = require('./auditLogService');
    await auditLogService.log(validatorId, 'CREATE_NEED', 'Need', need.id, {
      type: data.type,
      neighborhood: data.neighborhood,
      estimatedAmount: parseFloat(data.estimatedAmount),
    });

    return need;
  }

  static async getNeeds(filters = {}) {
    return needRepository.findAll(filters);
  }

  static async getNeedById(id) {
    const need = await needRepository.findById(id);
    if (!need) {
      throw new NotFoundError('Need');
    }
    return need;
  }

  static async updateNeedStatus(id, status, userId) {
    const need = await needRepository.findById(id);
    if (!need) {
      throw new NotFoundError('Need');
    }

    if (['FUNDED', 'CONFIRMED'].includes(need.status) && status !== 'CONFIRMED') {
      throw new ConflictError('Cannot modify a funded or confirmed need');
    }

    if (need.validatorId !== userId) {
      throw new ForbiddenError('Only the assigned validator can update this need');
    }

    const statusDataMap = {
      FUNDED: { lockedAt: new Date() },
    };

    const data = { status, ...(statusDataMap[status] || {}) };

    return needRepository.update(id, data);
  }

  static async getValidatorNeeds(validatorId) {
    return needRepository.findAll({ validatorId });
  }

  static async getRestaurantNeeds(restaurantId) {
    return needRepository.findByRestaurant(restaurantId, ['OPEN', 'FUNDED', 'CONFIRMED']);
  }

  static async confirmByRestaurant(needId, restaurantId, message) {
    const need = await needRepository.findById(needId);

    const validationMap = [
      { condition: !need, ErrorClass: NotFoundError, args: ['Need'] },
      { condition: need.restaurantId !== restaurantId, ErrorClass: ForbiddenError, args: ['This need is not assigned to your restaurant'] },
      { condition: need.status !== 'FUNDED', ErrorClass: ConflictError, args: ['Only funded needs can be confirmed by the restaurant'] },
    ];
    validationMap.forEach(({ condition, ErrorClass, args }) => {
      if (condition) {
        throw new ErrorClass(...args);
      }
    });

    const updated = await needRepository.update(needId, { status: 'CONFIRMED' });

    const { donationRepository, impactProofRepository } = require('../repositories');

    const donationActionMap = {
      PENDING: async (donation) => {
        await donationRepository.update(donation.id, {
          status: 'CONFIRMED',
          confirmedAt: new Date(),
          immutable: true,
        });
        await impactProofRepository.create({
          donationId: donation.id,
          message,
        });
      },
    };

    for (const donation of need.donations) {
      const action = donationActionMap[donation.status];
      if (action) {
        await action(donation);
      }
    }

    return updated;
  }
        });

        // Create impact proof if none exists
        const existingProof = await impactProofRepository.findByDonationId(donation.id);
        if (!existingProof) {
          await impactProofRepository.create({
            donationId: donation.id,
            confirmationMessage: message || 'Meal prepared and delivered by restaurant. Confirmed by restaurant.',
            photoUrl: null,
          });
        }
      }
    }

    // Increment validator reputation
    await userRepository.incrementReputation(need.validatorId);

    // Audit log
    const { auditLogService } = require('./auditLogService');
    await auditLogService.log(need.validatorId, 'RESTAURANT_CONFIRM', 'Need', needId, {
      restaurantId,
      donationsConfirmed: need.donations.filter(d => d.status === 'PENDING').length,
    });

    return updated;
  }

  static async getValidatorStats(validatorId) {
    const { userRepository } = require('../repositories');
    const user = await userRepository.findById(validatorId);
    const needs = await needRepository.findAll({ validatorId });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const open = needs.filter(n => n.status === 'OPEN');
    const funded = needs.filter(n => n.status === 'FUNDED');
    const confirmed = needs.filter(n => n.status === 'CONFIRMED');
    const totalAmountValidated = needs.reduce((sum, n) => sum + parseFloat(n.estimatedAmount), 0);
    const totalDonationsReceived = needs.reduce((sum, n) => sum + (n.donations?.length || 0), 0);
    const todayNeeds = needs.filter(n => new Date(n.createdAt) >= today).length;
    const neighborhoods = [...new Set(needs.map(n => n.neighborhood).filter(Boolean))];

    return {
      validator: {
        id: user.id,
        name: user.name,
        email: user.email,
        reputationScore: user.reputationScore,
        createdAt: user.createdAt,
      },
      stats: {
        totalNeeds: needs.length,
        openCount: open.length,
        fundedCount: funded.length,
        confirmedCount: confirmed.length,
        totalAmountValidated,
        totalDonationsReceived,
        todayNeeds,
        neighborhoodsCovered: neighborhoods.length,
        reputationScore: user.reputationScore,
      },
    };
  }
}

module.exports = new NeedService();

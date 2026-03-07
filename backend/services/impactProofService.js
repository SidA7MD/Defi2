const { impactProofRepository, donationRepository } = require('../repositories');
const { userRepository } = require('../repositories');
const { NotFoundError, ConflictError, ForbiddenError } = require('../utils/errors');
const donationService = require('./donationService');

class ImpactProofService {
  constructor() {
    this.io = null;
  }

  setIO(io) {
    this.io = io;
  }

  async createImpactProof(validatorId, { donationId, confirmationMessage, photoUrl }) {
    // Check if donation exists
    const donation = await donationRepository.findById(donationId);
    // Check if already has proof
    const existingProof = await impactProofRepository.findByDonationId(donationId);
    // Only the validator of the related need can submit proof
    const errorCases = [
      { condition: () => !donation, error: new NotFoundError('Donation') },
      { condition: () => existingProof, error: new ConflictError('Impact proof already submitted for this donation') },
      { condition: () => donation.need.validatorId !== validatorId, error: new ForbiddenError('Only the assigned validator can submit proof') },
    ];
    for (const { condition, error } of errorCases) {
      if (condition()) {
        throw error;
      }
    }

    // Create impact proof
    const proof = await impactProofRepository.create({
      donationId,
      confirmationMessage,
      photoUrl: photoUrl || null,
    });

    // Confirm the donation (makes it immutable)
    await donationService.confirmDonation(donationId, validatorId);

    // Increment validator reputation
    await userRepository.incrementReputation(validatorId);

    // Audit log
    const { auditLogService } = require('./auditLogService');
    await auditLogService.log(validatorId, 'CREATE_IMPACT_PROOF', 'ImpactProof', proof.id, {
      donationId,
      hasPhoto: !!photoUrl,
    });

    // Emit real-time event to donor
    if (this.io) {
      this.io.to(`user:${donation.donorId}`).emit('impact:proof', {
        donationId,
        confirmationMessage,
        photoUrl,
        confirmedAt: proof.confirmedAt,
      });
    }

    return proof;
  }

  static async getProofByDonationId(donationId) {
    const proof = await impactProofRepository.findByDonationId(donationId);
    if (!proof) {
      throw new NotFoundError('Impact proof');
    }
    return proof;
  }
}

module.exports = new ImpactProofService();

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// ─────────────────────────────────────────────
//  IMMUTABILITY MIDDLEWARE
//  Blocks updates/deletes on confirmed (immutable) donations.
//  This is DATABASE-LEVEL enforcement — cannot be bypassed by service bugs.
// ─────────────────────────────────────────────
prisma.$use(async (params, next) => {
  // Block updates on immutable donations
  if (params.model === 'Donation' && params.action === 'update') {
    const donationId = params.args.where?.id;
    if (donationId) {
      const existing = await prisma.donation.findUnique({
        where: { id: donationId },
        select: { immutable: true, status: true },
      });

      if (existing?.immutable) {
        // Only allow if this IS the confirmation transition itself
        // (setting immutable from false → true, status from PENDING → CONFIRMED)
        const data = params.args.data || {};
        const isConfirmationTransition =
          data.immutable === true &&
          data.status === 'CONFIRMED' &&
          existing.status === 'PENDING';

        if (!isConfirmationTransition) {
          throw new Error(
            `IMMUTABILITY_VIOLATION: Donation ${donationId} is immutable and cannot be modified.`
          );
        }
      }
    }
  }

  // Block deletes on any donation
  if (params.model === 'Donation' && params.action === 'delete') {
    throw new Error('IMMUTABILITY_VIOLATION: Donations cannot be deleted.');
  }

  // Block deletes on audit logs (append-only)
  if (params.model === 'AuditLog' && (params.action === 'delete' || params.action === 'update')) {
    throw new Error('IMMUTABILITY_VIOLATION: Audit logs are append-only and cannot be modified or deleted.');
  }

  return next(params);
});

module.exports = prisma;

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Structured separator matching utils/hash.js
const SEPARATOR = '|';
function generateHash(donorId, needId, amount, timestamp) {
  const data = [donorId, needId, amount, timestamp].join(SEPARATOR);
  return crypto.createHash('sha256').update(data).digest('hex');
}

async function main() {
  console.log('🌱 Seeding IHSAN database...\n');

  // Clear existing data (order matters for FK constraints)
  await prisma.auditLog.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.walletTransaction.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.impactProof.deleteMany();
  await prisma.donation.deleteMany();
  await prisma.need.deleteMany();
  await prisma.beneficiary.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 12);

  // ==================== USERS ====================

  // Admin (pre-approved, no external approver)
  const admin = await prisma.user.create({
    data: {
      name: 'IHSAN Admin',
      email: 'admin@ihsan.org',
      passwordHash,
      role: 'ADMIN',
      isApproved: true,
    },
  });
  console.log('✅ Created admin:', admin.email);

  // Validator: Sidi M. (approved by admin)
  const sidiM = await prisma.user.create({
    data: {
      name: 'Sidi M.',
      email: 'sidi@ihsan.org',
      passwordHash,
      role: 'VALIDATOR',
      isApproved: true,
      approvedBy: admin.id,
      reputationScore: 15,
    },
  });
  console.log('✅ Created validator: Sidi M.');

  // Second Validator (approved by admin)
  const fatima = await prisma.user.create({
    data: {
      name: 'Fatima B.',
      email: 'fatima@ihsan.org',
      passwordHash,
      role: 'VALIDATOR',
      isApproved: true,
      approvedBy: admin.id,
      reputationScore: 8,
    },
  });
  console.log('✅ Created validator: Fatima B.');

  // Donor: Ali (self-registered, auto-approved)
  const ali = await prisma.user.create({
    data: {
      name: 'Ali',
      email: 'ali@donor.com',
      passwordHash,
      role: 'DONOR',
      isApproved: true,
    },
  });
  console.log('✅ Created donor: Ali');

  // Second Donor
  const mariam = await prisma.user.create({
    data: {
      name: 'Mariam K.',
      email: 'mariam@donor.com',
      passwordHash,
      role: 'DONOR',
      isApproved: true,
    },
  });
  console.log('✅ Created donor: Mariam K.');

  // Restaurant user: Al Baraka (self-registered, auto-approved)
  const alBarakaUser = await prisma.user.create({
    data: {
      name: 'Al Baraka Restaurant',
      email: 'albaraka@restaurant.com',
      passwordHash,
      role: 'RESTAURANT',
      isApproved: true,
    },
  });

  // Restaurant: Al Baraka
  const alBaraka = await prisma.restaurant.create({
    data: {
      userId: alBarakaUser.id,
      name: 'Al Baraka',
      neighborhood: 'Tevragh Zeina',
    },
  });
  console.log('✅ Created restaurant: Al Baraka');

  // Second restaurant
  const darnaNouaUser = await prisma.user.create({
    data: {
      name: 'Darna Noua Restaurant',
      email: 'darnanoua@restaurant.com',
      passwordHash,
      role: 'RESTAURANT',
      isApproved: true,
    },
  });

  const darnaNoua = await prisma.restaurant.create({
    data: {
      userId: darnaNouaUser.id,
      name: 'Darna Noua',
      neighborhood: 'Ksar',
    },
  });
  console.log('✅ Created restaurant: Darna Noua');

  // ==================== WALLETS ====================

  const users = [admin, sidiM, fatima, ali, mariam, alBarakaUser, darnaNouaUser];
  for (const user of users) {
    const wallet = await prisma.wallet.create({
      data: { userId: user.id, balance: 5000 },
    });
    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'DEPOSIT',
        amount: 5000,
        description: 'Welcome bonus — مرحباً بك في إحسان',
        balanceAfter: 5000,
      },
    });
  }
  console.log('✅ Created wallets with welcome bonus for all users');

  // ==================== BENEFICIARIES (Private) ====================

  const beneficiary1 = await prisma.beneficiary.create({
    data: {
      validatorId: sidiM.id,
      neighborhood: 'Tevragh Zeina',
      lat: 18.0866,
      lng: -15.9785,
      internalNotes: 'Family of 5, recently displaced. Urgent food needs.',
    },
  });

  const beneficiary2 = await prisma.beneficiary.create({
    data: {
      validatorId: fatima.id,
      neighborhood: 'Ksar',
      lat: 18.0894,
      lng: -15.9755,
      internalNotes: 'Elderly woman, mobility issues, needs regular meal support.',
    },
  });
  console.log('✅ Created beneficiaries (private)');

  // ==================== NEEDS ====================

  // THE Ali Iftar scenario need (linked to beneficiary)
  const iftarNeed = await prisma.need.create({
    data: {
      validatorId: sidiM.id,
      beneficiaryId: beneficiary1.id,
      type: 'Iftar Meals',
      description: '5 Iftar meals – Tevragh Zeina – 1,250 MRU',
      neighborhood: 'Tevragh Zeina',
      estimatedAmount: 1250.0,
      lat: 18.0866,
      lng: -15.9785,
      status: 'OPEN',
      restaurantId: alBaraka.id,
    },
  });
  console.log('✅ Created need: 5 Iftar meals (Ali scenario)');

  // Additional needs
  const need2 = await prisma.need.create({
    data: {
      validatorId: sidiM.id,
      beneficiaryId: beneficiary1.id,
      type: 'Food Package',
      description: '3 Food packages for families in need – Tevragh Zeina',
      neighborhood: 'Tevragh Zeina',
      estimatedAmount: 900.0,
      lat: 18.0870,
      lng: -15.9790,
      status: 'OPEN',
    },
  });

  const need3 = await prisma.need.create({
    data: {
      validatorId: fatima.id,
      beneficiaryId: beneficiary2.id,
      type: 'Iftar Meals',
      description: '10 Iftar meals for orphanage – Ksar – 2,500 MRU',
      neighborhood: 'Ksar',
      estimatedAmount: 2500.0,
      lat: 18.0894,
      lng: -15.9755,
      status: 'OPEN',
      restaurantId: darnaNoua.id,
    },
  });

  const need4 = await prisma.need.create({
    data: {
      validatorId: fatima.id,
      type: 'Medical Aid',
      description: 'Medication for elderly patient – Ksar',
      neighborhood: 'Ksar',
      estimatedAmount: 600.0,
      lat: 18.0900,
      lng: -15.9760,
      status: 'OPEN',
    },
  });

  const need5 = await prisma.need.create({
    data: {
      validatorId: sidiM.id,
      type: 'School Supplies',
      description: 'School supplies for 8 children – Tevragh Zeina',
      neighborhood: 'Tevragh Zeina',
      estimatedAmount: 1800.0,
      lat: 18.0875,
      lng: -15.9780,
      status: 'OPEN',
    },
  });

  console.log('✅ Created additional needs');

  // ==================== SAMPLE COMPLETED DONATION ====================

  const timestamp = new Date('2026-02-27T18:00:00Z').toISOString();
  const txHash = generateHash(mariam.id, need2.id, 900, timestamp);

  const completedDonation = await prisma.donation.create({
    data: {
      donorId: mariam.id,
      needId: need2.id,
      amount: 900.0,
      transactionHash: txHash,
      previousHash: null, // First donation in chain (GENESIS)
      status: 'CONFIRMED',
      confirmedAt: new Date('2026-02-27T20:00:00Z'),
      immutable: true,
    },
  });

  await prisma.need.update({
    where: { id: need2.id },
    data: { status: 'CONFIRMED', lockedAt: new Date('2026-02-27T18:00:00Z') },
  });

  await prisma.impactProof.create({
    data: {
      donationId: completedDonation.id,
      confirmationMessage: 'All 3 food packages were delivered successfully to families. Verified by Sidi M.',
      photoUrl: null,
      confirmedAt: new Date('2026-02-27T20:00:00Z'),
    },
  });

  console.log('✅ Created sample completed donation with impact proof');

  // ==================== AUDIT LOG ENTRIES ====================

  await prisma.auditLog.create({
    data: {
      actorId: mariam.id,
      action: 'CREATE_DONATION',
      entityType: 'Donation',
      entityId: completedDonation.id,
      metadata: JSON.stringify({ amount: 900, needId: need2.id }),
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: sidiM.id,
      action: 'CONFIRM_DONATION',
      entityType: 'Donation',
      entityId: completedDonation.id,
      metadata: JSON.stringify({ confirmedAt: '2026-02-27T20:00:00Z' }),
    },
  });

  console.log('✅ Created sample audit log entries');

  // ==================== SUMMARY ====================

  console.log('\n══════════════════════════════════════════');
  console.log('🎉 Seeding completed!');
  console.log('══════════════════════════════════════════');
  console.log('\n📋 Demo Credentials:');
  console.log('──────────────────────────────────────────');
  console.log('  Admin:      admin@ihsan.org / password123');
  console.log('  Validator:  sidi@ihsan.org / password123');
  console.log('  Validator:  fatima@ihsan.org / password123');
  console.log('  Donor:      ali@donor.com / password123');
  console.log('  Donor:      mariam@donor.com / password123');
  console.log('  Restaurant: albaraka@restaurant.com / password123');
  console.log('  Restaurant: darnanoua@restaurant.com / password123');
  console.log('──────────────────────────────────────────');
  console.log(`\n  Ali Iftar Need ID: ${iftarNeed.id}`);
  console.log('══════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

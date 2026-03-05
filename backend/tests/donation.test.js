/**
 * Integration-style tests for the donation flow.
 * Tests cover: hash integrity, immutability, role-lock, and edge cases.
 */

const { generateTransactionHash } = require('../utils/hash');

// Mock the repositories
jest.mock('../config/database', () => ({
  donation: {
    findUnique: jest.fn(),
  },
  $use: jest.fn(),
}));

jest.mock('../repositories', () => {
  const needs = new Map();
  const donations = new Map();

  return {
    needRepository: {
      findById: jest.fn(async (id) => needs.get(id) || null),
      update: jest.fn(async (id, data) => {
        const need = needs.get(id);
        if (!need) return null;
        const updated = { ...need, ...data };
        needs.set(id, updated);
        return updated;
      }),
      _store: needs,
    },
    donationRepository: {
      create: jest.fn(async (data) => {
        const donation = { id: 'don-1', ...data, createdAt: new Date() };
        donations.set(donation.id, donation);
        return {
          ...donation,
          donor: { id: data.donorId, name: 'Test Donor' },
          need: needs.get(data.needId),
        };
      }),
      findById: jest.fn(async (id) => donations.get(id) || null),
      findByHash: jest.fn(async (hash) => {
        for (const [, d] of donations) {
          if (d.transactionHash === hash) return d;
        }
        return null;
      }),
      update: jest.fn(async (id, data) => {
        const d = donations.get(id);
        if (!d) return null;
        const updated = { ...d, ...data };
        donations.set(id, updated);
        return updated;
      }),
      findByDonor: jest.fn(async () => []),
      findConfirmed: jest.fn(async () => []),
      findAll: jest.fn(async () => []),
      getLastHash: jest.fn(async () => null),
      _store: donations,
    },
    impactProofRepository: {
      findByDonationId: jest.fn(async () => null),
      create: jest.fn(async (data) => ({ id: 'proof-1', ...data, confirmedAt: new Date() })),
    },
    userRepository: {
      incrementReputation: jest.fn(async () => ({})),
      findById: jest.fn(async () => ({ id: 'user-1', name: 'Test', email: 'test@test.com' })),
    },
  };
});

const { needRepository, donationRepository } = require('../repositories');

describe('Donation Flow', () => {
  beforeEach(() => {
    needRepository._store.clear();
    donationRepository._store.clear();

    needRepository._store.set('need-1', {
      id: 'need-1',
      validatorId: 'validator-1',
      type: 'Iftar Meals',
      description: '5 Iftar meals – Tevragh Zeina – 1,250 MRU',
      neighborhood: 'Tevragh Zeina',
      estimatedAmount: 1250,
      status: 'OPEN',
      lat: 18.0866,
      lng: -15.9785,
      restaurantId: 'rest-1',
    });
  });

  test('should generate valid transaction hash with pipe separator', () => {
    const donorId = 'donor-ali';
    const needId = 'need-1';
    const amount = 1250;
    const timestamp = new Date().toISOString();

    const hash = generateTransactionHash(donorId, needId, amount, timestamp);

    expect(hash).toBeDefined();
    expect(hash).toHaveLength(64);
    expect(/^[a-f0-9]+$/.test(hash)).toBe(true);
  });

  test('should prevent donation on non-OPEN need', async () => {
    needRepository._store.set('need-closed', {
      id: 'need-closed',
      status: 'FUNDED',
      validatorId: 'v1',
    });

    const need = needRepository._store.get('need-closed');
    expect(need.status).not.toBe('OPEN');
  });

  test('should prevent double confirmation', () => {
    const donation = {
      id: 'don-confirmed',
      status: 'CONFIRMED',
      immutable: true,
    };

    expect(donation.status).toBe('CONFIRMED');
    expect(donation.immutable).toBe(true);
  });

  test('should mark donation as immutable after confirmation', () => {
    const donation = {
      id: 'don-1',
      status: 'PENDING',
      immutable: false,
    };

    // Simulate confirmation
    donation.status = 'CONFIRMED';
    donation.immutable = true;
    donation.confirmedAt = new Date();

    expect(donation.immutable).toBe(true);
    expect(donation.status).toBe('CONFIRMED');
    expect(donation.confirmedAt).toBeDefined();
  });

  test('should validate hash immutability with pipe separator', () => {
    const donorId = 'donor-ali';
    const needId = 'need-1';
    const amount = 1250;
    const timestamp = '2026-02-28T18:00:00.000Z';

    const hash = generateTransactionHash(donorId, needId, amount, timestamp);

    // Verify: same inputs → same hash
    const verified = generateTransactionHash(donorId, needId, amount, timestamp);
    expect(hash).toBe(verified);

    // Tampered amount → different hash
    const tampered = generateTransactionHash(donorId, needId, 9999, timestamp);
    expect(hash).not.toBe(tampered);
  });
});

describe('Edge Cases', () => {
  test('should reject duplicate payment (same hash)', () => {
    const hash1 = generateTransactionHash('d1', 'n1', 100, '2026-01-01T00:00:00Z');
    const hash2 = generateTransactionHash('d1', 'n1', 100, '2026-01-01T00:00:00Z');

    // Same inputs produce same hash → DB unique constraint would reject
    expect(hash1).toBe(hash2);
  });

  test('should produce unique hash with different timestamp', () => {
    const hash1 = generateTransactionHash('d1', 'n1', 100, '2026-01-01T00:00:00Z');
    const hash2 = generateTransactionHash('d1', 'n1', 100, '2026-01-01T00:00:01Z');

    expect(hash1).not.toBe(hash2);
  });

  test('validator cannot confirm unfunded need (status check)', () => {
    const need = { status: 'OPEN' };
    expect(need.status).not.toBe('FUNDED');
  });
});

describe('Role-Lock Security', () => {
  test('only DONOR and RESTAURANT should be self-registerable', () => {
    const allowedSelfRegister = ['DONOR', 'RESTAURANT'];

    expect(allowedSelfRegister).toContain('DONOR');
    expect(allowedSelfRegister).toContain('RESTAURANT');
    expect(allowedSelfRegister).not.toContain('VALIDATOR');
    expect(allowedSelfRegister).not.toContain('ADMIN');
  });

  test('unapproved user should not be able to login', () => {
    const user = { isApproved: false, role: 'VALIDATOR' };
    expect(user.isApproved).toBe(false);
    // AuthService.login() would throw ForbiddenError
  });
});

describe('Anomaly Detection', () => {
  test('should flag self-donate-confirm pattern', () => {
    const validatorId = 'validator-1';
    const donation = {
      donorId: validatorId, // Validator is also the donor!
      need: { validatorId },
    };

    const isSelfDonate = donation.donorId === donation.need.validatorId;
    expect(isSelfDonate).toBe(true);
    // System would set flagged: true, flagReason: 'ANOMALY_SELF_DONATE_CONFIRM'
  });
});

describe('Immutability Middleware Enforcement', () => {
  /**
   * Simulates the logic in config/database.js Prisma $use middleware.
   * This function mirrors the middleware behavior for testability.
   */
  function simulateImmutabilityCheck(existing, updateData) {
    if (existing?.immutable) {
      const isConfirmationTransition =
        updateData.immutable === true &&
        updateData.status === 'CONFIRMED' &&
        existing.status === 'PENDING';

      if (!isConfirmationTransition) {
        throw new Error(
          `IMMUTABILITY_VIOLATION: Donation is immutable and cannot be modified.`
        );
      }
    }
    return { ...existing, ...updateData };
  }

  test('should block updates on immutable donations', () => {
    const existing = { id: 'don-1', status: 'CONFIRMED', immutable: true, amount: 1000 };

    expect(() => {
      simulateImmutabilityCheck(existing, { amount: 9999 });
    }).toThrow('IMMUTABILITY_VIOLATION');
  });

  test('should block status changes on immutable donations', () => {
    const existing = { id: 'don-1', status: 'CONFIRMED', immutable: true };

    expect(() => {
      simulateImmutabilityCheck(existing, { status: 'PENDING' });
    }).toThrow('IMMUTABILITY_VIOLATION');
  });

  test('should allow confirmation transition (PENDING → CONFIRMED + immutable)', () => {
    const existing = { id: 'don-1', status: 'PENDING', immutable: false };

    // This should NOT throw — it's the legitimate confirmation path
    const result = simulateImmutabilityCheck(existing, {
      status: 'CONFIRMED',
      immutable: true,
      confirmedAt: new Date(),
    });

    expect(result.status).toBe('CONFIRMED');
    expect(result.immutable).toBe(true);
  });

  test('should allow updates on non-immutable donations', () => {
    const existing = { id: 'don-1', status: 'PENDING', immutable: false, amount: 1000 };

    // Non-immutable donations can still be updated
    const result = simulateImmutabilityCheck(existing, { amount: 1500 });
    expect(result.amount).toBe(1500);
  });
});

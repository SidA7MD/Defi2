const { generateTransactionHash, verifyTransactionHash, generateChainHash, verifyDonationIntegrity } = require('../utils/hash');

describe('Hash Utilities', () => {
  const donorId = 'donor-123';
  const needId = 'need-456';
  const amount = 1250;
  const timestamp = '2026-02-28T12:00:00.000Z';

  test('should generate consistent SHA-256 hash with pipe separator', () => {
    const hash1 = generateTransactionHash(donorId, needId, amount, timestamp);
    const hash2 = generateTransactionHash(donorId, needId, amount, timestamp);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 hex = 64 chars
  });

  test('should generate different hashes for different inputs', () => {
    const hash1 = generateTransactionHash(donorId, needId, amount, timestamp);
    const hash2 = generateTransactionHash(donorId, needId, 999, timestamp);

    expect(hash1).not.toBe(hash2);
  });

  test('should prevent concatenation collision via separator', () => {
    // Without separator: "ab" + "cd" === "abc" + "d" (both become "abcd")
    // With pipe separator: "ab|cd" !== "abc|d"
    const hash1 = generateTransactionHash('ab', 'cd', 100, timestamp);
    const hash2 = generateTransactionHash('abc', 'd', 100, timestamp);
    expect(hash1).not.toBe(hash2);
  });

  test('should verify a valid hash using timing-safe comparison', () => {
    const hash = generateTransactionHash(donorId, needId, amount, timestamp);
    const isValid = verifyTransactionHash(hash, donorId, needId, amount, timestamp);

    expect(isValid).toBe(true);
  });

  test('should fail verification for tampered data', () => {
    const hash = generateTransactionHash(donorId, needId, amount, timestamp);
    const isValid = verifyTransactionHash(hash, donorId, needId, 9999, timestamp);

    expect(isValid).toBe(false);
  });

  test('should fail verification for malformed hash', () => {
    const isValid = verifyTransactionHash('not_a_valid_hex', donorId, needId, amount, timestamp);
    expect(isValid).toBe(false);
  });
});

describe('Hash Chain', () => {
  test('should generate chain hash linking two hashes', () => {
    const hash1 = generateTransactionHash('d1', 'n1', 100, '2026-01-01T00:00:00Z');
    const hash2 = generateTransactionHash('d2', 'n2', 200, '2026-01-02T00:00:00Z');

    const chain1 = generateChainHash(hash1, null); // GENESIS
    const chain2 = generateChainHash(hash2, hash1);

    expect(chain1).toHaveLength(64);
    expect(chain2).toHaveLength(64);
    expect(chain1).not.toBe(chain2);
  });

  test('should produce consistent chain hashes', () => {
    const hash1 = generateTransactionHash('d1', 'n1', 100, '2026-01-01T00:00:00Z');
    const chain1a = generateChainHash(hash1, null);
    const chain1b = generateChainHash(hash1, null);
    expect(chain1a).toBe(chain1b);
  });
});

describe('Donation Integrity Verification', () => {
  test('should verify intact donation', () => {
    const donorId = 'donor-1';
    const needId = 'need-1';
    const amount = 1250;
    const createdAt = new Date('2026-02-28T12:00:00.000Z');
    const hash = generateTransactionHash(donorId, needId, amount, createdAt.toISOString());

    const donation = {
      donorId,
      needId,
      amount,
      transactionHash: hash,
      createdAt,
    };

    const result = verifyDonationIntegrity(donation);
    expect(result.hashValid).toBe(true);
  });

  test('should detect tampered donation', () => {
    const donorId = 'donor-1';
    const needId = 'need-1';
    const amount = 1250;
    const createdAt = new Date('2026-02-28T12:00:00.000Z');
    const hash = generateTransactionHash(donorId, needId, amount, createdAt.toISOString());

    const tampered = {
      donorId,
      needId,
      amount: 9999, // TAMPERED!
      transactionHash: hash,
      createdAt,
    };

    const result = verifyDonationIntegrity(tampered);
    expect(result.hashValid).toBe(false);
  });
});

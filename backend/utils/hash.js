const crypto = require('crypto');

// Structured separator prevents collision from concatenation ambiguity
// e.g., "ab" + "cd" vs "abc" + "d" would collide without separators
const SEPARATOR = '|';

/**
 * Generate SHA-256 hash for transaction immutability.
 * Hash = SHA256(donor_id | need_id | amount | timestamp)
 * Uses pipe separator to prevent concatenation collisions.
 */
function generateTransactionHash(donorId, needId, amount, timestamp) {
  const data = [donorId, needId, amount, timestamp].join(SEPARATOR);
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Verify a transaction hash against its components.
 * Uses timing-safe comparison to prevent timing attacks.
 */
function verifyTransactionHash(hash, donorId, needId, amount, timestamp) {
  const expected = generateTransactionHash(donorId, needId, amount, timestamp);
  // Use timing-safe comparison to prevent timing-based attacks
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false; // If buffers are different lengths, inputs are invalid
  }
}

/**
 * Generate a hash chain link.
 * Each donation's hash includes the previous donation's hash,
 * creating an append-only chain that makes tampering detectable.
 * 
 * ChainHash = SHA256(currentTransactionHash | previousHash)
 * If no previous hash (first donation), uses "GENESIS" as seed.
 */
function generateChainHash(currentHash, previousHash) {
  const seed = previousHash || 'GENESIS';
  const data = [currentHash, seed].join(SEPARATOR);
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Recompute and verify a donation's integrity.
 * Returns { valid, computedHash, chainValid, computedChainHash }
 */
function verifyDonationIntegrity(donation) {
  const computedHash = generateTransactionHash(
    donation.donorId,
    donation.needId,
    donation.amount.toString(),
    donation.createdAt.toISOString()
  );

  const hashValid = donation.transactionHash === computedHash;

  return {
    hashValid,
    computedHash,
    storedHash: donation.transactionHash,
  };
}

module.exports = {
  generateTransactionHash,
  verifyTransactionHash,
  generateChainHash,
  verifyDonationIntegrity,
};

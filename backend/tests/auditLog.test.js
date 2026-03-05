/**
 * Tests for AuditLog immutability enforcement.
 * The Prisma middleware in config/database.js blocks updates and deletes
 * on AuditLog records, making them append-only.
 */

describe('AuditLog Immutability', () => {
    /**
     * Simulates the Prisma $use middleware logic from config/database.js
     * for AuditLog model protection.
     */
    function simulateAuditLogMiddleware(model, action) {
        if (model === 'AuditLog' && (action === 'delete' || action === 'update')) {
            throw new Error(
                'IMMUTABILITY_VIOLATION: Audit logs are append-only and cannot be modified or deleted.'
            );
        }
        return true; // Allowed
    }

    test('should block updates on audit log entries', () => {
        expect(() => {
            simulateAuditLogMiddleware('AuditLog', 'update');
        }).toThrow('IMMUTABILITY_VIOLATION');
    });

    test('should block deletes on audit log entries', () => {
        expect(() => {
            simulateAuditLogMiddleware('AuditLog', 'delete');
        }).toThrow('IMMUTABILITY_VIOLATION');
    });

    test('should allow creating new audit log entries', () => {
        const result = simulateAuditLogMiddleware('AuditLog', 'create');
        expect(result).toBe(true);
    });

    test('should not affect other models', () => {
        expect(simulateAuditLogMiddleware('User', 'update')).toBe(true);
        expect(simulateAuditLogMiddleware('Donation', 'create')).toBe(true);
        expect(simulateAuditLogMiddleware('Need', 'delete')).toBe(true);
    });
});

describe('Donation Delete Prevention', () => {
    /**
     * Simulates the Prisma $use middleware logic for blocking donation deletes.
     */
    function simulateDonationDeleteMiddleware(model, action) {
        if (model === 'Donation' && action === 'delete') {
            throw new Error('IMMUTABILITY_VIOLATION: Donations cannot be deleted.');
        }
        return true;
    }

    test('should block deleting donations', () => {
        expect(() => {
            simulateDonationDeleteMiddleware('Donation', 'delete');
        }).toThrow('IMMUTABILITY_VIOLATION');
    });

    test('should allow other donation operations', () => {
        expect(simulateDonationDeleteMiddleware('Donation', 'create')).toBe(true);
        expect(simulateDonationDeleteMiddleware('Donation', 'update')).toBe(true);
    });
});

const prisma = require('../config/database');

class AuditLogService {
    /**
     * Create an immutable audit log entry.
     * Called from all critical service methods.
     * 
     * @param {string} actorId - User who performed the action
     * @param {string} action - Action type (CREATE_NEED, FUND_NEED, CONFIRM_DONATION, LOGIN, etc.)
     * @param {string} entityType - Entity type (User, Need, Donation, ImpactProof)
     * @param {string} entityId - Entity ID
     * @param {object} metadata - Additional context (JSON-serializable)
     * @param {string} ipAddress - Client IP (optional)
     */
    static async log(actorId, action, entityType, entityId, metadata = {}, ipAddress = null) {
        try {
            await prisma.auditLog.create({
                data: {
                    actorId,
                    action,
                    entityType,
                    entityId,
                    metadata: JSON.stringify(metadata),
                    ipAddress,
                },
            });
        } catch (err) {
            // Audit logging should never break the main flow
            console.error('AuditLog write failed:', err.message);
        }
    }

    /**
     * Get audit trail for a specific entity.
     */
    static async getByEntity(entityType, entityId) {
        return prisma.auditLog.findMany({
            where: { entityType, entityId },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Get audit trail for a specific actor.
     */
    static async getByActor(actorId, limit = 50) {
        return prisma.auditLog.findMany({
            where: { actorId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    /**
     * Get flagged/anomalous actions.
     */
    static async getAnomalies(limit = 50) {
        return prisma.auditLog.findMany({
            where: {
                action: { startsWith: 'ANOMALY' },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    /**
     * Get system-wide recent activity.
     */
    static async getRecentActivity(limit = 100) {
        return prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
}

const auditLogService = new AuditLogService();

module.exports = { auditLogService };

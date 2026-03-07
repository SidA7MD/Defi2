const { authService } = require('../services');
const { asyncHandler } = require('../utils');
const { auditLogService } = require('../services/auditLogService');

/**
 * Admin-only: Create a VALIDATOR or ADMIN user.
 */
const createUser = asyncHandler(async (req, res) => {
    const user = await authService.createPrivilegedUser(req.user.id, req.body);

    await auditLogService.log(
        req.user.id,
        'ADMIN_CREATE_USER',
        'User',
        user.id,
        { role: req.body.role, email: req.body.email },
        req.ip
    );

    res.status(201).json({
        success: true,
        message: `${req.body.role} account created successfully`,
        data: user,
    });
});

/**
 * Admin-only: Approve a pending user account.
 */
const approveUser = asyncHandler(async (req, res) => {
    const prisma = require('../config/database');
    const { userId } = req.params;

    const user = await prisma.user.update({
        where: { id: userId },
        data: {
            isApproved: true,
            approvedBy: req.user.id,
        },
    });

    await auditLogService.log(
        req.user.id,
        'ADMIN_APPROVE_USER',
        'User',
        userId,
        { role: user.role },
        req.ip
    );

    res.json({
        success: true,
        message: 'User approved successfully',
        data: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            isApproved: user.isApproved,
        },
    });
});

/**
 * Admin-only: List ALL users with optional filters.
 */
const getAllUsers = asyncHandler(async (req, res) => {
    const prisma = require('../config/database');
    const { role, approved, search } = req.query;

    const where = {};
    if (role) where.role = role;
    if (approved !== undefined) where.isApproved = approved === 'true';
    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
        ];
    }

    const users = await prisma.user.findMany({
        where,
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isApproved: true,
            reputationScore: true,
            createdAt: true,
            _count: { select: { donations: true, validatedNeeds: true } },
        },
        orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: users, count: users.length });
});

/**
 * Admin-only: List pending (unapproved) users.
 */
const getPendingUsers = asyncHandler(async (req, res) => {
    const prisma = require('../config/database');

    const users = await prisma.user.findMany({
        where: { isApproved: false },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: users, count: users.length });
});

/**
 * Admin-only: Delete a user (cannot delete self).
 */
const deleteUser = asyncHandler(async (req, res) => {
    const prisma = require('../config/database');
    const { userId } = req.params;

    if (userId === req.user.id) {
        return res.status(400).json({ success: false, message: 'Cannot delete yourself' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    await prisma.user.delete({ where: { id: userId } });

    await auditLogService.log(
        req.user.id,
        'ADMIN_DELETE_USER',
        'User',
        userId,
        { name: user.name, email: user.email, role: user.role },
        req.ip
    );

    res.json({ success: true, message: 'User deleted successfully' });
});

/**
 * Admin-only: Suspend / unsuspend a user (toggle isApproved).
 */
const toggleUserStatus = asyncHandler(async (req, res) => {
    const prisma = require('../config/database');
    const { userId } = req.params;

    if (userId === req.user.id) {
        return res.status(400).json({ success: false, message: 'Cannot suspend yourself' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    const updated = await prisma.user.update({
        where: { id: userId },
        data: { isApproved: !user.isApproved },
    });

    await auditLogService.log(
        req.user.id,
        updated.isApproved ? 'ADMIN_UNSUSPEND_USER' : 'ADMIN_SUSPEND_USER',
        'User',
        userId,
        { role: user.role },
        req.ip
    );

    res.json({
        success: true,
        message: updated.isApproved ? 'User unsuspended' : 'User suspended',
        data: { id: updated.id, isApproved: updated.isApproved },
    });
});

/**
 * Admin-only: Platform-wide statistics.
 */
const getSystemStats = asyncHandler(async (req, res) => {
    const prisma = require('../config/database');

    const [userCounts, donationStats, needStats, auditCount] = await Promise.all([
        prisma.user.groupBy({
            by: ['role'],
            _count: { id: true },
        }),
        prisma.donation.aggregate({
            _sum: { amount: true },
            _count: { id: true },
        }),
        prisma.need.groupBy({
            by: ['status'],
            _count: { id: true },
        }),
        prisma.auditLog.count(),
    ]);

    const flaggedDonations = await prisma.donation.count({ where: { flagged: true } });
    const pendingUsers = await prisma.user.count({ where: { isApproved: false } });

    res.json({
        success: true,
        data: {
            users: userCounts.reduce((acc, u) => { acc[u.role] = u._count.id; return acc; }, {}),
            donations: {
                total: donationStats._count.id,
                totalAmount: parseFloat(donationStats._sum.amount || 0),
                flagged: flaggedDonations,
            },
            needs: needStats.reduce((acc, n) => { acc[n.status] = n._count.id; return acc; }, {}),
            auditLogEntries: auditCount,
            pendingUsers,
        },
    });
});

/**
 * Admin-only: Get audit log.
 */
const getAuditLog = asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit, 10) || 100;
    const logs = await auditLogService.getRecentActivity(limit);

    res.json({
        success: true,
        data: logs.map(l => ({
            ...l,
            metadata: l.metadata ? JSON.parse(l.metadata) : null,
        })),
        count: logs.length,
    });
});

/**
 * Admin-only: Get ALL needs with full details.
 */
const getAllNeeds = asyncHandler(async (req, res) => {
    const prisma = require('../config/database');
    const { status, search } = req.query;

    const where = {};
    if (status) where.status = status;
    if (search) {
        where.OR = [
            { description: { contains: search, mode: 'insensitive' } },
            { neighborhood: { contains: search, mode: 'insensitive' } },
        ];
    }

    const needs = await prisma.need.findMany({
        where,
        include: {
            validator: { select: { id: true, name: true, email: true } },
            restaurant: { select: { id: true, name: true } },
            _count: { select: { donations: true } },
        },
        orderBy: { createdAt: 'desc' },
    });

    res.json({
        success: true,
        data: needs.map(n => ({ ...n, estimatedAmount: parseFloat(n.estimatedAmount) })),
        count: needs.length,
    });
});

/**
 * Admin-only: Delete a need.
 */
const deleteNeed = asyncHandler(async (req, res) => {
    const prisma = require('../config/database');
    const { needId } = req.params;

    const need = await prisma.need.findUnique({ where: { id: needId } });
    if (!need) {
        return res.status(404).json({ success: false, message: 'Need not found' });
    }

    await prisma.need.delete({ where: { id: needId } });

    await auditLogService.log(
        req.user.id,
        'ADMIN_DELETE_NEED',
        'Need',
        needId,
        { description: need.description, status: need.status },
        req.ip
    );

    res.json({ success: true, message: 'Need deleted successfully' });
});

/**
 * Admin-only: Update need status.
 */
const updateNeedStatus = asyncHandler(async (req, res) => {
    const prisma = require('../config/database');
    const { needId } = req.params;
    const { status } = req.body;

    const valid = ['OPEN', 'FUNDED', 'CONFIRMED', 'CANCELLED'];
    if (!valid.includes(status)) {
        return res.status(400).json({ success: false, message: `Status must be one of: ${valid.join(', ')}` });
    }

    const need = await prisma.need.update({
        where: { id: needId },
        data: { status },
    });

    await auditLogService.log(
        req.user.id,
        'ADMIN_UPDATE_NEED_STATUS',
        'Need',
        needId,
        { newStatus: status },
        req.ip
    );

    res.json({ success: true, message: 'Need status updated', data: need });
});

/**
 * Admin-only: Get ALL donations.
 */
const getAllDonations = asyncHandler(async (req, res) => {
    const prisma = require('../config/database');
    const { status, flagged, search } = req.query;

    const where = {};
    if (status) where.status = status;
    if (flagged !== undefined) where.flagged = flagged === 'true';
    if (search) {
        where.OR = [
            { transactionHash: { contains: search, mode: 'insensitive' } },
        ];
    }

    const donations = await prisma.donation.findMany({
        where,
        include: {
            donor: { select: { id: true, name: true, email: true } },
            need: {
                select: {
                    id: true,
                    description: true,
                    neighborhood: true,
                    validator: { select: { id: true, name: true } },
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    res.json({
        success: true,
        data: donations.map(d => ({ ...d, amount: parseFloat(d.amount) })),
        count: donations.length,
    });
});

/**
 * Admin-only: Get flagged donations.
 */
const getFlaggedDonations = asyncHandler(async (req, res) => {
    const prisma = require('../config/database');

    const flagged = await prisma.donation.findMany({
        where: { flagged: true },
        include: {
            donor: { select: { id: true, name: true, email: true } },
            need: {
                select: {
                    id: true,
                    description: true,
                    validator: { select: { id: true, name: true } },
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    res.json({
        success: true,
        data: flagged.map(d => ({
            ...d,
            amount: parseFloat(d.amount),
        })),
        count: flagged.length,
    });
});

/**
 * Admin-only: Toggle flagged status on a donation.
 */
const toggleDonationFlag = asyncHandler(async (req, res) => {
    const prisma = require('../config/database');
    const { donationId } = req.params;
    const { flagReason } = req.body;

    const donation = await prisma.donation.findUnique({ where: { id: donationId } });
    if (!donation) {
        return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    const toggleTo = !donation.flagged;
    const flagActions = {
        true: {
            actionType: 'ADMIN_FLAG_DONATION',
            message: 'Donation flagged',
            reason: flagReason || 'Flagged by admin'
        },
        false: {
            actionType: 'ADMIN_UNFLAG_DONATION',
            message: 'Donation unflagged',
            reason: null
        }
    };

    const selected = flagActions[toggleTo];

    const updated = await prisma.donation.update({
        where: { id: donationId },
        data: {
            flagged: toggleTo,
            flagReason: selected.reason
        },
    });

    await auditLogService.log(
        req.user.id,
        selected.actionType,
        'Donation',
        donationId,
        { amount: parseFloat(donation.amount), flagReason: selected.reason },
        req.ip
    );

    res.json({
        success: true,
        message: selected.message,
        data: { id: updated.id, flagged: updated.flagged },
    });
});

/**
 * Admin-only: Delete a donation.
 */
const deleteDonation = asyncHandler(async (req, res) => {
    const prisma = require('../config/database');
    const { donationId } = req.params;

    const donation = await prisma.donation.findUnique({ where: { id: donationId } });
    if (!donation) {
        return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    await prisma.donation.delete({ where: { id: donationId } });

    await auditLogService.log(
        req.user.id,
        'ADMIN_DELETE_DONATION',
        'Donation',
        donationId,
        { amount: parseFloat(donation.amount) },
        req.ip
    );

    res.json({ success: true, message: 'Donation deleted successfully' });
});

module.exports = {
    createUser,
    approveUser,
    getAllUsers,
    getPendingUsers,
    deleteUser,
    toggleUserStatus,
    getSystemStats,
    getAuditLog,
    getAllNeeds,
    deleteNeed,
    updateNeedStatus,
    getAllDonations,
    getFlaggedDonations,
    toggleDonationFlag,
    deleteDonation,
};

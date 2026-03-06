import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services';
import { useLanguage } from '../../context/LanguageContext';
import { LoadingSpinner } from '../../components/common';
import UIcon from '../../components/common/UIcon';
import toast from 'react-hot-toast';

export default function AdminOverview() {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);

    const fetchStats = useCallback(async () => {
        try {
            const res = await adminService.getStats();
            setStats(res.data.data || null);
        } catch {
            toast.error(t('admin.loadFailed'));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => { fetchStats(); }, [fetchStats]);

    if (loading) return <LoadingSpinner size="lg" text={t('admin.loading')} />;

    const totalUsers = stats?.users
        ? Object.values(stats.users).reduce((s, v) => s + v, 0) : 0;

    return (
        <div className="fade-in">

            {/* Stats Grid */}
            <div className="app-stats-grid">
                <div className="app-stat-card">
                    <div className="app-stat-icon" style={{ background: 'var(--primary-50)', color: 'var(--primary-700)' }}><UIcon name="users" size={22} /></div>
                    <div>
                        <div className="app-stat-value">{totalUsers}</div>
                        <div className="app-stat-label">{t('admin.totalUsers')}</div>
                    </div>
                </div>
                <div className="app-stat-card">
                    <div className="app-stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}><UIcon name="dollar" size={22} /></div>
                    <div>
                        <div className="app-stat-value">{(stats?.donations?.totalAmount || 0).toLocaleString()}</div>
                        <div className="app-stat-label">{t('admin.totalDonated')}</div>
                    </div>
                </div>
                <div className="app-stat-card">
                    <div className="app-stat-icon" style={{ background: '#d1fae5', color: '#059669' }}><UIcon name="check-circle" size={22} /></div>
                    <div>
                        <div className="app-stat-value">{stats?.donations?.total || 0}</div>
                        <div className="app-stat-label">{t('admin.totalDonations')}</div>
                    </div>
                </div>
                <div className="app-stat-card">
                    <div className="app-stat-icon" style={{ background: '#fee2e2', color: '#dc2626' }}><UIcon name="triangle-warning" size={22} /></div>
                    <div>
                        <div className="app-stat-value" style={{ color: stats?.donations?.flagged > 0 ? '#dc2626' : undefined }}>
                            {stats?.donations?.flagged || 0}
                        </div>
                        <div className="app-stat-label">{t('admin.flaggedCount')}</div>
                    </div>
                </div>
                <div className="app-stat-card">
                    <div className="app-stat-icon" style={{ background: '#ede9fe', color: '#7c3aed' }}><UIcon name="document" size={22} /></div>
                    <div>
                        <div className="app-stat-value">{stats?.auditLogEntries || 0}</div>
                        <div className="app-stat-label">{t('admin.auditEntries')}</div>
                    </div>
                </div>
                <div className="app-stat-card">
                    <div className="app-stat-icon" style={{ background: '#fce7f3', color: '#db2777' }}><UIcon name="clock" size={22} /></div>
                    <div>
                        <div className="app-stat-value" style={{ color: stats?.pendingUsers > 0 ? '#d97706' : undefined }}>
                            {stats?.pendingUsers || 0}
                        </div>
                        <div className="app-stat-label">{t('admin.pendingApprovals')}</div>
                    </div>
                </div>
            </div>

            {/* Role Breakdown */}
            <div className="admin-card">
                <h3 className="admin-card-title"><UIcon name="users" size={16} /> {t('admin.userBreakdown')}</h3>
                <div className="admin-role-grid">
                    {Object.entries(stats?.users || {}).map(([role, count]) => (
                        <div key={role} className="admin-role-chip">
                            <span className={`role-badge role-${role.toLowerCase()}`}>{role}</span>
                            <span className="admin-role-count">{count}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Need Status Breakdown */}
            <div className="admin-card">
                <h3 className="admin-card-title"><UIcon name="clipboard" size={16} /> {t('admin.needBreakdown')}</h3>
                <div className="admin-role-grid">
                    {Object.entries(stats?.needs || {}).map(([status, count]) => (
                        <div key={status} className="admin-role-chip">
                            <span className={`admin-status-badge status-${status.toLowerCase()}`}>{status}</span>
                            <span className="admin-role-count">{count}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

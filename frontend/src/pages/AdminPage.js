import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '../services';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LoadingSpinner, EmptyState } from '../components/common';
import UIcon from '../components/common/UIcon';
import toast from 'react-hot-toast';
import './Pages.css';

function timeAgo(date) {
    if (!date) return '';
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

export default function AdminPage() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [tab, setTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [pendingUsers, setPendingUsers] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [flaggedDonations, setFlaggedDonations] = useState([]);
    const [auditSearch, setAuditSearch] = useState('');
    const [auditFilter, setAuditFilter] = useState('ALL');

    // Create user form
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [createForm, setCreateForm] = useState({
        name: '', email: '', password: '', role: 'VALIDATOR'
    });
    const [creating, setCreating] = useState(false);

    const fetchAll = useCallback(async () => {
        try {
            const [statsRes, pendingRes, auditRes, flaggedRes] = await Promise.all([
                adminService.getStats(),
                adminService.getPendingUsers(),
                adminService.getAuditLog(200),
                adminService.getFlaggedDonations(),
            ]);
            setStats(statsRes.data.data || null);
            setPendingUsers(pendingRes.data.data || []);
            setAuditLogs(auditRes.data.data || []);
            setFlaggedDonations(flaggedRes.data.data || []);
        } catch (err) {
            toast.error(t('admin.loadFailed'));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const handleApproveUser = async (userId) => {
        try {
            await adminService.approveUser(userId);
            toast.success(t('admin.userApproved'));
            fetchAll();
        } catch (err) {
            toast.error(err.response?.data?.message || t('admin.approveFailed'));
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            await adminService.createUser(createForm);
            toast.success(t('admin.userCreated'));
            setShowCreateForm(false);
            setCreateForm({ name: '', email: '', password: '', role: 'VALIDATOR' });
            fetchAll();
        } catch (err) {
            toast.error(err.response?.data?.message || t('admin.createFailed'));
        } finally {
            setCreating(false);
        }
    };

    // Filtered audit logs
    const filteredLogs = auditLogs.filter((log) => {
        if (auditFilter !== 'ALL' && log.action !== auditFilter) return false;
        if (auditSearch) {
            const q = auditSearch.toLowerCase();
            return (
                log.action?.toLowerCase().includes(q) ||
                log.entityType?.toLowerCase().includes(q) ||
                log.entityId?.toLowerCase().includes(q) ||
                log.actorId?.toLowerCase().includes(q)
            );
        }
        return true;
    });

    const uniqueActions = [...new Set(auditLogs.map(l => l.action))];

    if (loading) return <LoadingSpinner size="lg" text={t('admin.loading')} />;

    const totalUsers = stats?.users
        ? Object.values(stats.users).reduce((s, v) => s + v, 0)
        : 0;

    return (
        <div className="container">
            {/* Admin Header */}
            <div className="app-profile-header">
                <div className="app-profile-avatar"><UIcon name="shield" size={32} /></div>
                <div className="app-profile-info">
                    <h1 className="app-profile-name">{user.name}</h1>
                    <div className="app-profile-meta">
                        <span><UIcon name="crown" size={13} /> {t('admin.title')}</span>
                        <span><UIcon name="shield-check" size={13} /> {t('admin.subtitle')}</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="panel-tabs" style={{ marginBottom: '1.5rem' }}>
                <button className={`panel-tab ${tab === 'overview' ? 'panel-tab-active' : ''}`} onClick={() => setTab('overview')}>
                    <UIcon name="pulse" size={15} /> {t('admin.tabOverview')}
                </button>
                <button className={`panel-tab ${tab === 'users' ? 'panel-tab-active' : ''}`} onClick={() => setTab('users')}>
                    <UIcon name="users" size={15} /> {t('admin.tabUsers')}
                    {pendingUsers.length > 0 && <span className="app-tab-badge">{pendingUsers.length}</span>}
                </button>
                <button className={`panel-tab ${tab === 'audit' ? 'panel-tab-active' : ''}`} onClick={() => setTab('audit')}>
                    <UIcon name="document" size={15} /> {t('admin.tabAudit')}
                </button>
                <button className={`panel-tab ${tab === 'flagged' ? 'panel-tab-active' : ''}`} onClick={() => setTab('flagged')}>
                    <UIcon name="flag" size={15} /> {t('admin.tabFlagged')}
                    {flaggedDonations.length > 0 && <span className="app-tab-badge app-tab-badge-urgent" style={{ background: '#ef4444' }}>{flaggedDonations.length}</span>}
                </button>
            </div>

            {/* ─── TAB: OVERVIEW ─── */}
            {tab === 'overview' && (
                <div className="fade-in">
                    {/* Platform Stats */}
                    <div className="app-stats-grid">
                        <div className="app-stat-card">
                            <div className="app-stat-icon" style={{ background: 'var(--primary-50)', color: 'var(--primary-700)' }}><UIcon name="users" size={20} /></div>
                            <div className="app-stat-value">{totalUsers}</div>
                            <div className="app-stat-label">{t('admin.totalUsers')}</div>
                        </div>
                        <div className="app-stat-card">
                            <div className="app-stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}><UIcon name="dollar" size={20} /></div>
                            <div className="app-stat-value">{(stats?.donations?.totalAmount || 0).toLocaleString()}</div>
                            <div className="app-stat-label">{t('admin.totalDonated')}</div>
                        </div>
                        <div className="app-stat-card">
                            <div className="app-stat-icon" style={{ background: '#d1fae5', color: '#059669' }}><UIcon name="check-circle" size={20} /></div>
                            <div className="app-stat-value">{stats?.donations?.total || 0}</div>
                            <div className="app-stat-label">{t('admin.totalDonations')}</div>
                        </div>
                        <div className="app-stat-card">
                            <div className="app-stat-icon" style={{ background: '#fee2e2', color: '#dc2626' }}><UIcon name="triangle-warning" size={20} /></div>
                            <div className="app-stat-value" style={{ color: stats?.donations?.flagged > 0 ? '#dc2626' : undefined }}>
                                {stats?.donations?.flagged || 0}
                            </div>
                            <div className="app-stat-label">{t('admin.flaggedCount')}</div>
                        </div>
                        <div className="app-stat-card">
                            <div className="app-stat-icon" style={{ background: '#ede9fe', color: '#7c3aed' }}><UIcon name="document" size={20} /></div>
                            <div className="app-stat-value">{stats?.auditLogEntries || 0}</div>
                            <div className="app-stat-label">{t('admin.auditEntries')}</div>
                        </div>
                        <div className="app-stat-card">
                            <div className="app-stat-icon" style={{ background: '#fce7f3', color: '#db2777' }}><UIcon name="clock" size={20} /></div>
                            <div className="app-stat-value" style={{ color: pendingUsers.length > 0 ? '#d97706' : undefined }}>
                                {pendingUsers.length}
                            </div>
                            <div className="app-stat-label">{t('admin.pendingApprovals')}</div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
                        {/* User Breakdown */}
                        <div className="card" style={{ padding: '1.5rem' }}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--text-dark)' }}>
                                <UIcon name="users" size={18} /> {t('admin.userBreakdown')}
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {Object.entries(stats?.users || {}).map(([role, count]) => (
                                    <div key={role} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-light)', borderRadius: '0.5rem' }}>
                                        <span className={`role-badge role-${role.toLowerCase()}`}>{role}</span>
                                        <span style={{ fontWeight: '600', color: 'var(--text-dark)' }}>{count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Need Status Breakdown */}
                        <div className="card" style={{ padding: '1.5rem' }}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--text-dark)' }}>
                                <UIcon name="clipboard" size={18} /> {t('admin.needBreakdown')}
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {Object.entries(stats?.needs || {}).map(([status, count]) => (
                                    <div key={status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-light)', borderRadius: '0.5rem' }}>
                                        <span className={`badge badge-${status.toLowerCase()}`}>{status}</span>
                                        <span style={{ fontWeight: '600', color: 'var(--text-dark)' }}>{count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── TAB: USERS ─── */}
            {tab === 'users' && (
                <div className="fade-in">
                    {/* Create User */}
                    <div style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem' }}>
                                <UIcon name="user-add" size={18} /> {t('admin.createPrivileged')}
                            </h3>
                            <button className="btn btn-primary" onClick={() => setShowCreateForm(!showCreateForm)}>
                                {showCreateForm ? <><UIcon name="cross" size={14} /> {t('admin.cancel')}</> : <><UIcon name="plus" size={14} /> {t('admin.createBtn')}</>}
                            </button>
                        </div>

                        {showCreateForm && (
                            <div className="card fade-in" style={{ marginBottom: '2rem' }}>
                                <div className="card-header"><h3 style={{ margin: 0, fontSize: '1.1rem' }}>{t('admin.createBtn')}</h3></div>
                                <form className="app-order-inner" onSubmit={handleCreateUser}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: '1.25rem' }}>
                                        <div className="form-group">
                                            <label className="form-label">{t('admin.nameLabel')}</label>
                                            <input className="form-input" value={createForm.name}
                                                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                                                placeholder={t('admin.namePlaceholder')} required />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">{t('admin.emailLabel')}</label>
                                            <input className="form-input" type="email" value={createForm.email}
                                                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                                                placeholder={t('admin.emailPlaceholder')} required />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">{t('admin.passwordLabel')}</label>
                                            <input className="form-input" type="password" value={createForm.password}
                                                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                                                placeholder={t('admin.passwordPlaceholder')} minLength={8} required />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">{t('admin.roleLabel')}</label>
                                            <select className="form-select" value={createForm.role}
                                                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}>
                                                <option value="VALIDATOR">{t('admin.roleValidator')}</option>
                                                <option value="ADMIN">{t('admin.roleAdmin')}</option>
                                                <option value="RESTAURANT">{t('admin.roleRestaurant', 'RESTAURANT')}</option>
                                            </select>
                                        </div>
                                    </div>
                                    <button type="submit" className="btn btn-primary" disabled={creating} style={{ marginTop: '1.25rem' }}>
                                        <UIcon name="user-add" size={14} /> {creating ? t('admin.creating') : t('admin.submitCreate')}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>

                    {/* Pending Approvals */}
                    <div>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '1.125rem' }}>
                            <UIcon name="clock" size={18} /> {t('admin.pendingTitle')} ({pendingUsers.length})
                        </h3>
                        {pendingUsers.length === 0 ? (
                            <EmptyState icon={<UIcon name="check-circle" size={36} />} title={t('admin.noPending')} message={t('admin.noPendingMsg')} />
                        ) : (
                            <div className="app-orders-grid">
                                {pendingUsers.map((u) => (
                                    <div key={u.id} className="app-order-card app-order-open">
                                        <div className="app-order-inner">
                                            <div className="app-order-header">
                                                <span className={`role-badge role-${u.role?.toLowerCase()}`}>{u.role}</span>
                                                <span className="app-time-badge">
                                                    <UIcon name="clock" size={12} /> {new Date(u.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
                                                <div className="app-profile-avatar" style={{ width: '48px', height: '48px', minWidth: '48px' }}>
                                                    {u.name?.charAt(0)?.toUpperCase()}
                                                </div>
                                                <div style={{ overflow: 'hidden' }}>
                                                    <div style={{ fontWeight: '600', color: 'var(--text-dark)', fontSize: '1.1rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{u.name}</div>
                                                    <div style={{ color: 'var(--text-light)', fontSize: '0.9rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{u.email}</div>
                                                </div>
                                            </div>

                                            <button className="btn btn-primary app-confirm-btn" onClick={() => handleApproveUser(u.id)}>
                                                <UIcon name="user-check" size={16} /> {t('admin.approve')}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ─── TAB: AUDIT LOG ─── */}
            {tab === 'audit' && (
                <div className="fade-in">
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '1.125rem' }}>
                            <UIcon name="document" size={18} /> {t('admin.auditTitle')} ({filteredLogs.length})
                        </h3>

                        <div className="app-filter-bar" style={{ marginBottom: '1.5rem' }}>
                            <div className="app-search-wrapper">
                                <UIcon name="search" size={16} className="app-search-icon" />
                                <input
                                    type="text"
                                    className="app-search-input"
                                    placeholder={t('admin.auditSearchPlaceholder')}
                                    value={auditSearch}
                                    onChange={(e) => setAuditSearch(e.target.value)}
                                />
                            </div>
                            <div className="app-filter-wrapper">
                                <UIcon name="filter" size={14} />
                                <select className="app-filter-select" value={auditFilter} onChange={(e) => setAuditFilter(e.target.value)}>
                                    <option value="ALL">{t('admin.allActions')}</option>
                                    {uniqueActions.map((a) => (
                                        <option key={a} value={a}>{a}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {filteredLogs.length === 0 ? (
                            <EmptyState icon="" title={t('admin.noAuditLogs')} message={t('admin.noAuditLogsMsg')} />
                        ) : (
                            <div className="app-orders-grid">
                                {filteredLogs.map((log) => (
                                    <div key={log.id} className="app-order-card app-order-done">
                                        <div className="app-order-inner">
                                            <div className="app-order-header">
                                                <span className={`admin-action-badge admin-action-${log.action?.split('_')[0]?.toLowerCase()}`} style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'var(--bg-light)', fontWeight: 600 }}>
                                                    {log.action}
                                                </span>
                                                <span className="app-time-badge">
                                                    <UIcon name="clock" size={12} /> {timeAgo(log.createdAt)}
                                                </span>
                                            </div>

                                            <p className="app-order-desc" style={{ marginBottom: '1rem' }}>
                                                {t('admin.auditActor')}: {log.actorId ? <><UIcon name="hastag" size={10} /> {log.actorId.slice(0, 12)}…</> : 'System'}
                                            </p>

                                            <div className="app-order-details">
                                                <div className="app-detail-item">
                                                    <UIcon name="box" size={13} />
                                                    <span>{log.entityType}</span>
                                                </div>
                                                <div className="app-detail-item app-detail-tx">
                                                    <UIcon name="hastag" size={11} />
                                                    <span>{log.entityId?.slice(0, 12)}…</span>
                                                </div>
                                                <div className="app-detail-item">
                                                    <UIcon name="calendar" size={13} />
                                                    <span>{new Date(log.createdAt).toLocaleString()}</span>
                                                </div>
                                            </div>

                                            {log.metadata && (
                                                <details style={{ fontSize: '0.85rem', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                                                    <summary style={{ cursor: 'pointer', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 500 }}>
                                                        <UIcon name="eye" size={14} /> {t('admin.viewDetails')}
                                                    </summary>
                                                    <pre style={{ margin: '0.75rem 0 0', padding: '0.75rem', background: 'var(--bg-light)', borderRadius: 'var(--radius-md)', overflowX: 'auto', fontSize: '0.8rem', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                                                        {JSON.stringify(log.metadata, null, 2)}
                                                    </pre>
                                                </details>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ─── TAB: FLAGGED ─── */}
            {tab === 'flagged' && (
                <div className="fade-in">
                    <div>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '1.125rem' }}>
                            <UIcon name="triangle-warning" size={18} /> {t('admin.flaggedTitle')} ({flaggedDonations.length})
                        </h3>
                        {flaggedDonations.length === 0 ? (
                            <EmptyState icon="—" title={t('admin.noFlagged')} message={t('admin.noFlaggedMsg')} />
                        ) : (
                            <div className="app-orders-grid">
                                {flaggedDonations.map((d) => (
                                    <div key={d.id} className="app-order-card app-order-urgent">
                                        <div className="app-order-inner">
                                            <div className="app-order-header">
                                                <span className="app-need-type" style={{ color: '#ef4444' }}>
                                                    <UIcon name="triangle-warning" size={14} /> {t('admin.flaggedTitle')}
                                                </span>
                                                <span className="app-time-badge app-time-urgent">
                                                    <UIcon name="clock" size={11} /> {new Date(d.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>

                                            <div style={{ marginBottom: '1rem' }}>
                                                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>
                                                    {parseFloat(d.amount).toLocaleString()} MRU
                                                </div>
                                                <div style={{ color: '#ef4444', fontSize: '0.9rem', fontWeight: 500, marginTop: '0.25rem' }}>
                                                    {d.flagReason || t('admin.unknownReason')}
                                                </div>
                                            </div>

                                            <div className="app-order-details">
                                                <div className="app-detail-item">
                                                    <UIcon name="user" size={13} />
                                                    <span>{d.donor?.name || 'Unknown'} ({d.donor?.email || 'N/A'})</span>
                                                </div>
                                                <div className="app-detail-item">
                                                    <UIcon name="clipboard" size={13} />
                                                    <span>{d.need?.description || 'No description'}</span>
                                                </div>
                                                {d.need?.validator && (
                                                    <div className="app-detail-item">
                                                        <UIcon name="shield" size={13} />
                                                        <span>{d.need.validator.name}</span>
                                                    </div>
                                                )}
                                                <div className="app-detail-item app-detail-tx">
                                                    <UIcon name="hastag" size={11} />
                                                    <span>{d.transactionHash?.slice(0, 16)}…</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

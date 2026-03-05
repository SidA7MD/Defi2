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
            <div className="admin-header">
                <div className="admin-header-info">
                    <div className="admin-avatar"><UIcon name="shield" size={28} /></div>
                    <div>
                        <h1 className="admin-title">{t('admin.title')}</h1>
                        <p className="admin-subtitle">{t('admin.subtitle')}</p>
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
                    {flaggedDonations.length > 0 && <span className="app-tab-badge admin-badge-danger">{flaggedDonations.length}</span>}
                </button>
            </div>

            {/* ─── TAB: OVERVIEW ─── */}
            {tab === 'overview' && (
                <div className="fade-in">
                    {/* Platform Stats */}
                    <div className="admin-stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: 'var(--primary-50)', color: 'var(--primary-700)' }}><UIcon name="users" size={20} /></div>
                            <div className="stat-value">{totalUsers}</div>
                            <div className="stat-label">{t('admin.totalUsers')}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}><UIcon name="dollar" size={20} /></div>
                            <div className="stat-value">{(stats?.donations?.totalAmount || 0).toLocaleString()}</div>
                            <div className="stat-label">{t('admin.totalDonated')}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: '#d1fae5', color: '#059669' }}><UIcon name="check-circle" size={20} /></div>
                            <div className="stat-value">{stats?.donations?.total || 0}</div>
                            <div className="stat-label">{t('admin.totalDonations')}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: '#fee2e2', color: '#dc2626' }}><UIcon name="triangle-warning" size={20} /></div>
                            <div className="stat-value" style={{ color: stats?.donations?.flagged > 0 ? '#dc2626' : undefined }}>
                                {stats?.donations?.flagged || 0}
                            </div>
                            <div className="stat-label">{t('admin.flaggedCount')}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: '#ede9fe', color: '#7c3aed' }}><UIcon name="document" size={20} /></div>
                            <div className="stat-value">{stats?.auditLogEntries || 0}</div>
                            <div className="stat-label">{t('admin.auditEntries')}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: '#fce7f3', color: '#db2777' }}><UIcon name="clock" size={20} /></div>
                            <div className="stat-value" style={{ color: pendingUsers.length > 0 ? '#d97706' : undefined }}>
                                {pendingUsers.length}
                            </div>
                            <div className="stat-label">{t('admin.pendingApprovals')}</div>
                        </div>
                    </div>

                    {/* User Breakdown */}
                    <div className="admin-section">
                        <h3 className="admin-section-title"><UIcon name="users" size={16} /> {t('admin.userBreakdown')}</h3>
                        <div className="admin-role-grid">
                            {Object.entries(stats?.users || {}).map(([role, count]) => (
                                <div key={role} className="admin-role-card">
                                    <span className={`role-badge role-${role.toLowerCase()}`}>{role}</span>
                                    <span className="admin-role-count">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Need Status Breakdown */}
                    <div className="admin-section">
                        <h3 className="admin-section-title"><UIcon name="clipboard" size={16} /> {t('admin.needBreakdown')}</h3>
                        <div className="admin-role-grid">
                            {Object.entries(stats?.needs || {}).map(([status, count]) => (
                                <div key={status} className="admin-role-card">
                                    <span className={`badge badge-${status.toLowerCase()}`}>{status}</span>
                                    <span className="admin-role-count">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ─── TAB: USERS ─── */}
            {tab === 'users' && (
                <div className="fade-in">
                    {/* Create User */}
                    <div className="admin-section">
                        <div className="admin-section-header">
                            <h3 className="admin-section-title"><UIcon name="user-add" size={16} /> {t('admin.createPrivileged')}</h3>
                            <button className="btn btn-primary btn-sm" onClick={() => setShowCreateForm(!showCreateForm)}>
                                {showCreateForm ? t('admin.cancel') : t('admin.createBtn')}
                            </button>
                        </div>

                        {showCreateForm && (
                            <form className="admin-create-form card fade-in" onSubmit={handleCreateUser}>
                                <div className="card-body">
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: '1rem' }}>
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
                                            </select>
                                        </div>
                                    </div>
                                    <button type="submit" className="btn btn-primary" disabled={creating} style={{ marginTop: '1rem' }}>
                                        <UIcon name="user-add" size={14} /> {creating ? t('admin.creating') : t('admin.submitCreate')}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Pending Approvals */}
                    <div className="admin-section">
                        <h3 className="admin-section-title"><UIcon name="clock" size={16} /> {t('admin.pendingTitle')} ({pendingUsers.length})</h3>
                        {pendingUsers.length === 0 ? (
                            <EmptyState icon={<UIcon name="check-circle" size={36} />} title={t('admin.noPending')} message={t('admin.noPendingMsg')} />
                        ) : (
                            <div className="admin-users-grid">
                                {pendingUsers.map((u) => (
                                    <div key={u.id} className="admin-user-card card">
                                        <div className="card-body">
                                            <div className="admin-user-info">
                                                <div className="admin-user-avatar">
                                                    {u.name?.charAt(0)?.toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="admin-user-name">{u.name}</div>
                                                    <div className="admin-user-email">{u.email}</div>
                                                    <span className={`role-badge role-${u.role?.toLowerCase()}`}>{u.role}</span>
                                                </div>
                                            </div>
                                            <div className="admin-user-meta">
                                                <span><UIcon name="clock" size={12} /> {new Date(u.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <button className="btn btn-primary btn-sm admin-approve-btn" onClick={() => handleApproveUser(u.id)}>
                                                <UIcon name="user-check" size={14} /> {t('admin.approve')}
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
                    <div className="admin-section">
                        <h3 className="admin-section-title"><UIcon name="document" size={16} /> {t('admin.auditTitle')} ({filteredLogs.length})</h3>

                        <div className="admin-audit-controls">
                            <div className="admin-search-box">
                                <UIcon name="search" size={16} />
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder={t('admin.auditSearchPlaceholder')}
                                    value={auditSearch}
                                    onChange={(e) => setAuditSearch(e.target.value)}
                                />
                            </div>
                            <select className="form-select" value={auditFilter} onChange={(e) => setAuditFilter(e.target.value)} style={{ maxWidth: '200px' }}>
                                <option value="ALL">{t('admin.allActions')}</option>
                                {uniqueActions.map((a) => (
                                    <option key={a} value={a}>{a}</option>
                                ))}
                            </select>
                        </div>

                        {filteredLogs.length === 0 ? (
                            <EmptyState icon="�" title={t('admin.noAuditLogs')} message={t('admin.noAuditLogsMsg')} />
                        ) : (
                            <div className="card" style={{ overflow: 'hidden' }}>
                                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                                    <table className="tx-table admin-audit-table">
                                        <thead>
                                            <tr>
                                                <th>{t('admin.auditTime')}</th>
                                                <th>{t('admin.auditAction')}</th>
                                                <th>{t('admin.auditEntity')}</th>
                                                <th>{t('admin.auditActor')}</th>
                                                <th>{t('admin.auditDetails')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredLogs.map((log, i) => (
                                                <tr key={log.id} className={i < 5 ? 'slide-in' : ''} style={{ animationDelay: `${i * 30}ms` }}>
                                                    <td>
                                                        <span className="admin-audit-time">{timeAgo(log.createdAt)}</span>
                                                        <span className="admin-audit-date">{new Date(log.createdAt).toLocaleString()}</span>
                                                    </td>
                                                    <td>
                                                        <span className={`admin-action-badge admin-action-${log.action?.split('_')[0]?.toLowerCase()}`}>
                                                            {log.action}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className="admin-entity">{log.entityType}</span>
                                                        <span className="admin-entity-id"><UIcon name="hastag" size={10} /> {log.entityId?.slice(0, 8)}…</span>
                                                    </td>
                                                    <td>
                                                        <span className="admin-entity-id"><UIcon name="hastag" size={10} /> {log.actorId?.slice(0, 8)}…</span>
                                                    </td>
                                                    <td>
                                                        {log.metadata ? (
                                                            <details className="admin-meta-details">
                                                                <summary><UIcon name="eye" size={12} /> {t('admin.viewDetails')}</summary>
                                                                <pre className="admin-meta-json">{JSON.stringify(log.metadata, null, 2)}</pre>
                                                            </details>
                                                        ) : '—'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ─── TAB: FLAGGED ─── */}
            {tab === 'flagged' && (
                <div className="fade-in">
                    <div className="admin-section">
                        <h3 className="admin-section-title">
                            <UIcon name="triangle-warning" size={16} /> {t('admin.flaggedTitle')} ({flaggedDonations.length})
                        </h3>
                        {flaggedDonations.length === 0 ? (
                            <EmptyState icon="—" title={t('admin.noFlagged')} message={t('admin.noFlaggedMsg')} />
                        ) : (
                            <div className="admin-flagged-grid">
                                {flaggedDonations.map((d) => (
                                    <div key={d.id} className="admin-flagged-card card">
                                        <div className="card-body">
                                            <div className="admin-flagged-header">
                                                <UIcon name="triangle-warning" size={18} className="admin-flagged-icon" />
                                                <div>
                                                    <div className="admin-flagged-amount">{parseFloat(d.amount).toLocaleString()} MRU</div>
                                                    <div className="admin-flagged-reason">{d.flagReason || t('admin.unknownReason')}</div>
                                                </div>
                                            </div>
                                            <div className="admin-flagged-details">
                                                <div className="admin-flagged-detail">
                                                    <span className="admin-flagged-label">{t('admin.donor')}:</span>
                                                    <span>{d.donor?.name} ({d.donor?.email})</span>
                                                </div>
                                                <div className="admin-flagged-detail">
                                                    <span className="admin-flagged-label">{t('admin.need')}:</span>
                                                    <span>{d.need?.description}</span>
                                                </div>
                                                {d.need?.validator && (
                                                    <div className="admin-flagged-detail">
                                                        <span className="admin-flagged-label">{t('admin.validator')}:</span>
                                                        <span>{d.need.validator.name}</span>
                                                    </div>
                                                )}
                                                <div className="admin-flagged-detail">
                                                    <span className="admin-flagged-label">{t('admin.txHash')}:</span>
                                                    <span className="admin-entity-id"><UIcon name="hastag" size={10} /> {d.transactionHash?.slice(0, 16)}…</span>
                                                </div>
                                                <div className="admin-flagged-detail">
                                                    <span className="admin-flagged-label">{t('admin.date')}:</span>
                                                    <span>{new Date(d.createdAt).toLocaleString()}</span>
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

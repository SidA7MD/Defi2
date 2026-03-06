import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services';
import { useLanguage } from '../../context/LanguageContext';
import { LoadingSpinner, EmptyState } from '../../components/common';
import UIcon from '../../components/common/UIcon';
import toast from 'react-hot-toast';

export default function AdminUsers() {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [pendingUsers, setPendingUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [approvedFilter, setApprovedFilter] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', role: 'VALIDATOR' });
    const [creating, setCreating] = useState(false);

    const fetchUsers = useCallback(async () => {
        try {
            const params = {};
            if (roleFilter) params.role = roleFilter;
            if (approvedFilter) params.approved = approvedFilter;
            if (search) params.search = search;

            const [usersRes, pendingRes] = await Promise.all([
                adminService.getAllUsers(params),
                adminService.getPendingUsers(),
            ]);
            setUsers(usersRes.data.data || []);
            setPendingUsers(pendingRes.data.data || []);
        } catch {
            toast.error(t('admin.loadFailed'));
        } finally {
            setLoading(false);
        }
    }, [roleFilter, approvedFilter, search, t]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const handleApprove = async (userId) => {
        try {
            await adminService.approveUser(userId);
            toast.success(t('admin.userApproved'));
            fetchUsers();
        } catch (err) {
            toast.error(err.response?.data?.message || t('admin.approveFailed'));
        }
    };

    const handleToggleStatus = async (userId) => {
        try {
            const res = await adminService.toggleUserStatus(userId);
            toast.success(res.data.message);
            fetchUsers();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed');
        }
    };

    const handleDelete = async (userId, name) => {
        if (!window.confirm(`${t('admin.confirmDelete')} "${name}"?`)) return;
        try {
            await adminService.deleteUser(userId);
            toast.success(t('admin.userDeleted'));
            fetchUsers();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed');
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            await adminService.createUser(createForm);
            toast.success(t('admin.userCreated'));
            setShowCreateForm(false);
            setCreateForm({ name: '', email: '', password: '', role: 'VALIDATOR' });
            fetchUsers();
        } catch (err) {
            toast.error(err.response?.data?.message || t('admin.createFailed'));
        } finally {
            setCreating(false);
        }
    };

    if (loading) return <LoadingSpinner size="lg" text={t('admin.loading')} />;

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <UIcon name="users" size={20} /> {t('admin.navUsers')}
                </h2>
                <button className="btn btn-primary btn-sm" onClick={() => setShowCreateForm(!showCreateForm)}>
                    <UIcon name="user-add" size={14} /> {showCreateForm ? t('admin.cancel') : t('admin.createBtn')}
                </button>
            </div>

            {/* Create User Form */}
            {showCreateForm && (
                <div className="card fade-in" style={{ marginBottom: '2rem' }}>
                    <div className="card-header"><h3 style={{ margin: 0, fontSize: '1.1rem' }}>{t('admin.createPrivileged')}</h3></div>
                    <form className="app-order-inner" onSubmit={handleCreate}>
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

            {/* Pending Approvals */}
            {pendingUsers.length > 0 && (
                <div className="admin-card" style={{ borderLeft: '4px solid #d97706' }}>
                    <h3 className="admin-card-title"><UIcon name="clock" size={16} /> {t('admin.pendingTitle')} ({pendingUsers.length})</h3>
                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>{t('admin.nameLabel')}</th>
                                    <th>{t('admin.emailLabel')}</th>
                                    <th>{t('admin.roleLabel')}</th>
                                    <th>{t('admin.date')}</th>
                                    <th>{t('admin.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingUsers.map(u => (
                                    <tr key={u.id}>
                                        <td className="admin-table-name">
                                            <div className="admin-avatar-sm">{u.name?.charAt(0)?.toUpperCase()}</div>
                                            {u.name}
                                        </td>
                                        <td>{u.email}</td>
                                        <td><span className={`role-badge role-${u.role?.toLowerCase()}`}>{u.role}</span></td>
                                        <td className="admin-table-date">{new Date(u.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <button className="admin-action-btn admin-action-success" onClick={() => handleApprove(u.id)} title={t('admin.approve')}>
                                                <UIcon name="user-check" size={15} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* All Users */}
            <div className="admin-card">
                <h3 className="admin-card-title"><UIcon name="users" size={16} /> {t('admin.allUsers')} ({users.length})</h3>

                {/* Filters */}
                <div className="admin-filters">
                    <div className="admin-search-input">
                        <UIcon name="search" size={16} />
                        <input type="text" className="form-input" placeholder={t('admin.searchUsers')}
                            value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <div className="admin-filter-group">
                        <UIcon name="filter" size={14} />
                        <select className="form-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                            <option value="">{t('admin.allRoles')}</option>
                            <option value="DONOR">DONOR</option>
                            <option value="VALIDATOR">VALIDATOR</option>
                            <option value="RESTAURANT">RESTAURANT</option>
                            <option value="ADMIN">ADMIN</option>
                        </select>
                        <select className="form-select" value={approvedFilter} onChange={(e) => setApprovedFilter(e.target.value)}>
                            <option value="">{t('admin.allStatus')}</option>
                            <option value="true">{t('admin.approved')}</option>
                            <option value="false">{t('admin.suspended')}</option>
                        </select>
                    </div>
                </div>

                {users.length === 0 ? (
                    <EmptyState icon="�" title={t('admin.noUsersFound')} message={t('admin.tryDifferentFilter')} />
                ) : (
                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>{t('admin.nameLabel')}</th>
                                    <th>{t('admin.emailLabel')}</th>
                                    <th>{t('admin.roleLabel')}</th>
                                    <th>{t('admin.statusLabel')}</th>
                                    <th>{t('admin.date')}</th>
                                    <th>{t('admin.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id}>
                                        <td className="admin-table-name">
                                            <div className="admin-avatar-sm">{u.name?.charAt(0)?.toUpperCase()}</div>
                                            <div>
                                                <div>{u.name}</div>
                                                {u._count?.donations > 0 && (
                                                    <small className="text-muted">{u._count.donations} donations</small>
                                                )}
                                                {u._count?.validatedNeeds > 0 && (
                                                    <small className="text-muted">{u._count.validatedNeeds} needs</small>
                                                )}
                                            </div>
                                        </td>
                                        <td className="admin-table-email">{u.email}</td>
                                        <td><span className={`role-badge role-${u.role?.toLowerCase()}`}>{u.role}</span></td>
                                        <td>
                                            <span className={`admin-status-badge ${u.isApproved ? 'status-active' : 'status-suspended'}`}>
                                                {u.isApproved ? t('admin.active') : t('admin.suspendedLabel')}
                                            </span>
                                        </td>
                                        <td className="admin-table-date">{new Date(u.createdAt).toLocaleDateString()}</td>
                                        <td className="admin-table-actions">
                                            <button
                                                className={`admin-action-btn ${u.isApproved ? 'admin-action-warn' : 'admin-action-success'}`}
                                                onClick={() => handleToggleStatus(u.id)}
                                                title={u.isApproved ? t('admin.suspend') : t('admin.activate')}
                                            >
                                                {u.isApproved ? <UIcon name="toggle-on" size={15} /> : <UIcon name="toggle-off" size={15} />}
                                            </button>
                                            <button
                                                className="admin-action-btn admin-action-danger"
                                                onClick={() => handleDelete(u.id, u.name)}
                                                title={t('admin.delete')}
                                            >
                                                <UIcon name="trash" size={15} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

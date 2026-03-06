import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services';
import { useLanguage } from '../../context/LanguageContext';
import { LoadingSpinner, EmptyState } from '../../components/common';
import UIcon from '../../components/common/UIcon';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['OPEN', 'FUNDED', 'CONFIRMED', 'CANCELLED'];

export default function AdminNeeds() {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [needs, setNeeds] = useState([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const fetchNeeds = useCallback(async () => {
        try {
            const params = {};
            if (statusFilter) params.status = statusFilter;
            if (search) params.search = search;
            const res = await adminService.getAllNeeds(params);
            setNeeds(res.data.data || []);
        } catch {
            toast.error(t('admin.loadFailed'));
        } finally {
            setLoading(false);
        }
    }, [statusFilter, search, t]);

    useEffect(() => { fetchNeeds(); }, [fetchNeeds]);

    const handleStatusChange = async (needId, newStatus) => {
        try {
            await adminService.updateNeedStatus(needId, newStatus);
            toast.success(t('admin.needStatusUpdated'));
            fetchNeeds();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed');
        }
    };

    const handleDelete = async (needId, desc) => {
        if (!window.confirm(`${t('admin.confirmDelete')} "${desc.slice(0, 50)}"?`)) return;
        try {
            await adminService.deleteNeed(needId);
            toast.success(t('admin.needDeleted'));
            fetchNeeds();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed');
        }
    };

    if (loading) return <LoadingSpinner size="lg" text={t('admin.loading')} />;

    return (
        <div className="fade-in">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UIcon name="heart" size={20} /> {t('admin.navNeeds')}
            </h2>

            <div className="admin-card">
                {/* Filters */}
                <div className="admin-filters">
                    <div className="admin-search-input">
                        <UIcon name="search" size={16} />
                        <input type="text" className="form-input" placeholder={t('admin.searchNeeds')}
                            value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <div className="admin-filter-group">
                        <UIcon name="filter" size={14} />
                        <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="">{t('admin.allStatuses')}</option>
                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>

                {needs.length === 0 ? (
                    <EmptyState icon="�" title={t('admin.noNeedsFound')} message={t('admin.tryDifferentFilter')} />
                ) : (
                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>{t('admin.description')}</th>
                                    <th>{t('admin.neighborhood')}</th>
                                    <th>{t('admin.amount')}</th>
                                    <th>{t('admin.statusLabel')}</th>
                                    <th>{t('admin.validator')}</th>
                                    <th>{t('admin.donations')}</th>
                                    <th>{t('admin.date')}</th>
                                    <th>{t('admin.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {needs.map(n => (
                                    <tr key={n.id}>
                                        <td className="admin-table-desc">{n.description}</td>
                                        <td>{n.neighborhood}</td>
                                        <td className="admin-table-amount">{parseFloat(n.estimatedAmount).toLocaleString()} MRU</td>
                                        <td>
                                            <select
                                                className={`admin-status-select status-${n.status.toLowerCase()}`}
                                                value={n.status}
                                                onChange={(e) => handleStatusChange(n.id, e.target.value)}
                                            >
                                                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </td>
                                        <td className="admin-table-email">{n.validator?.name}</td>
                                        <td className="admin-table-center">{n._count?.donations || 0}</td>
                                        <td className="admin-table-date">{new Date(n.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <button
                                                className="admin-action-btn admin-action-danger"
                                                onClick={() => handleDelete(n.id, n.description)}
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

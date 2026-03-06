import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services';
import { useLanguage } from '../../context/LanguageContext';
import { LoadingSpinner, EmptyState } from '../../components/common';
import UIcon from '../../components/common/UIcon';
import toast from 'react-hot-toast';

export default function AdminDonations() {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [donations, setDonations] = useState([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [flaggedFilter, setFlaggedFilter] = useState('');

    const fetchDonations = useCallback(async () => {
        try {
            const params = {};
            if (statusFilter) params.status = statusFilter;
            if (flaggedFilter) params.flagged = flaggedFilter;
            if (search) params.search = search;
            const res = await adminService.getAllDonations(params);
            setDonations(res.data.data || []);
        } catch {
            toast.error(t('admin.loadFailed'));
        } finally {
            setLoading(false);
        }
    }, [statusFilter, flaggedFilter, search, t]);

    useEffect(() => { fetchDonations(); }, [fetchDonations]);

    const handleToggleFlag = async (donationId) => {
        try {
            const res = await adminService.toggleDonationFlag(donationId, 'Flagged by admin');
            toast.success(res.data.message);
            fetchDonations();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed');
        }
    };

    const handleDelete = async (donationId) => {
        if (!window.confirm(t('admin.confirmDeleteDonation'))) return;
        try {
            await adminService.deleteDonation(donationId);
            toast.success(t('admin.donationDeleted'));
            fetchDonations();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed');
        }
    };

    if (loading) return <LoadingSpinner size="lg" text={t('admin.loading')} />;

    return (
        <div className="fade-in">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UIcon name="dollar" size={20} /> {t('admin.navDonations')}
            </h2>

            <div className="admin-card">
                {/* Filters */}
                <div className="admin-filters">
                    <div className="admin-search-input">
                        <UIcon name="search" size={16} />
                        <input type="text" className="form-input" placeholder={t('admin.searchDonations')}
                            value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <div className="admin-filter-group">
                        <UIcon name="filter" size={14} />
                        <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="">{t('admin.allStatuses')}</option>
                            <option value="PENDING">PENDING</option>
                            <option value="CONFIRMED">CONFIRMED</option>
                        </select>
                        <select className="form-select" value={flaggedFilter} onChange={(e) => setFlaggedFilter(e.target.value)}>
                            <option value="">{t('admin.allDonations')}</option>
                            <option value="true">{t('admin.flaggedOnly')}</option>
                            <option value="false">{t('admin.cleanOnly')}</option>
                        </select>
                    </div>
                </div>

                {donations.length === 0 ? (
                    <EmptyState icon={<UIcon name="coin" variant="sr" size={36} />} title={t('admin.noDonationsFound')} message={t('admin.tryDifferentFilter')} />
                ) : (
                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>{t('admin.donor')}</th>
                                    <th>{t('admin.amount')}</th>
                                    <th>{t('admin.need')}</th>
                                    <th>{t('admin.statusLabel')}</th>
                                    <th>{t('admin.flag')}</th>
                                    <th>{t('admin.txHash')}</th>
                                    <th>{t('admin.date')}</th>
                                    <th>{t('admin.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {donations.map(d => (
                                    <tr key={d.id} className={d.flagged ? 'admin-row-flagged' : ''}>
                                        <td className="admin-table-name">
                                            <div className="admin-avatar-sm">{d.donor?.name?.charAt(0)?.toUpperCase()}</div>
                                            <div>
                                                <div>{d.donor?.name}</div>
                                                <small className="text-muted">{d.donor?.email}</small>
                                            </div>
                                        </td>
                                        <td className="admin-table-amount">{d.amount.toLocaleString()} MRU</td>
                                        <td className="admin-table-desc">{d.need?.description?.slice(0, 40)}…</td>
                                        <td>
                                            <span className={`admin-status-badge status-${d.status?.toLowerCase()}`}>
                                                {d.status}
                                            </span>
                                        </td>
                                        <td>
                                            {d.flagged ? (
                                                <span className="admin-flag-badge flagged">
                                                    <UIcon name="flag" size={12} /> {t('admin.flaggedLabel')}
                                                </span>
                                            ) : (
                                                <span className="admin-flag-badge clean">{t('admin.cleanLabel')}</span>
                                            )}
                                        </td>
                                        <td className="admin-table-hash">
                                            <UIcon name="hastag" size={10} /> {d.transactionHash?.slice(0, 12)}…
                                        </td>
                                        <td className="admin-table-date">{new Date(d.createdAt).toLocaleDateString()}</td>
                                        <td className="admin-table-actions">
                                            <button
                                                className={`admin-action-btn ${d.flagged ? 'admin-action-success' : 'admin-action-warn'}`}
                                                onClick={() => handleToggleFlag(d.id)}
                                                title={d.flagged ? t('admin.unflag') : t('admin.flagAction')}
                                            >
                                                <UIcon name="flag" size={15} />
                                            </button>
                                            <button
                                                className="admin-action-btn admin-action-danger"
                                                onClick={() => handleDelete(d.id)}
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

import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services';
import { useLanguage } from '../../context/LanguageContext';
import { LoadingSpinner, EmptyState } from '../../components/common';
import UIcon from '../../components/common/UIcon';
import toast from 'react-hot-toast';

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

export default function AdminAudit() {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState([]);
    const [search, setSearch] = useState('');
    const [actionFilter, setActionFilter] = useState('ALL');

    const fetchLogs = useCallback(async () => {
        try {
            const res = await adminService.getAuditLog(300);
            setLogs(res.data.data || []);
        } catch {
            toast.error(t('admin.loadFailed'));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    const uniqueActions = [...new Set(logs.map(l => l.action))];

    const filtered = logs.filter((log) => {
        if (actionFilter !== 'ALL' && log.action !== actionFilter) return false;
        if (search) {
            const q = search.toLowerCase();
            return (
                log.action?.toLowerCase().includes(q) ||
                log.entityType?.toLowerCase().includes(q) ||
                log.entityId?.toLowerCase().includes(q) ||
                log.actorId?.toLowerCase().includes(q)
            );
        }
        return true;
    });

    if (loading) return <LoadingSpinner size="lg" text={t('admin.loading')} />;

    return (
        <div className="fade-in">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title"><UIcon name="document" size={22} /> {t('admin.navAudit')}</h1>
                    <p className="admin-page-subtitle">{t('admin.auditSubtitle')}</p>
                </div>
            </div>

            <div className="admin-card">
                {/* Filters */}
                <div className="admin-filters">
                    <div className="admin-search-input">
                        <UIcon name="search" size={16} />
                        <input type="text" className="form-input" placeholder={t('admin.auditSearchPlaceholder')}
                            value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <div className="admin-filter-group">
                        <UIcon name="filter" size={14} />
                        <select className="form-select" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
                            <option value="ALL">{t('admin.allActions')}</option>
                            {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </div>
                </div>

                <div className="admin-audit-count">{filtered.length} {t('admin.entries')}</div>

                {filtered.length === 0 ? (
                    <EmptyState icon="�" title={t('admin.noAuditLogs')} message={t('admin.noAuditLogsMsg')} />
                ) : (
                    <div className="admin-table-wrap">
                        <table className="admin-table admin-audit-tbl">
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
                                {filtered.map((log) => (
                                    <tr key={log.id}>
                                        <td>
                                            <span className="admin-audit-time">{timeAgo(log.createdAt)}</span>
                                            <span className="admin-audit-date">{new Date(log.createdAt).toLocaleString()}</span>
                                        </td>
                                        <td>
                                            <span className={`admin-action-pill admin-action-${log.action?.split('_')[0]?.toLowerCase()}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="admin-entity-type">{log.entityType}</span>
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
                )}
            </div>
        </div>
    );
}

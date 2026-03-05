import React, { useState, useEffect, useCallback } from 'react';
import { donationService } from '../services';
import { useLanguage } from '../context/LanguageContext';
import { LoadingSpinner, StatusBadge, TransactionHash, EmptyState } from '../components/common';
import { useSocket } from '../hooks/useSocket';
import UIcon from '../components/common/UIcon';
import socketService from '../services/socket';
import toast from 'react-hot-toast';
import './Pages.css';

export default function DashboardPage() {
  const { t } = useLanguage();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, confirmed: 0, totalAmount: 0, pending: 0 });

  const fetchDashboard = useCallback(async () => {
    try {
      const { data } = await donationService.getDashboard();
      const txs = data.data || [];
      setTransactions(txs);

      const confirmed = txs.filter((t) => t.status === 'CONFIRMED');
      const totalAmount = txs.reduce((sum, t) => sum + (t.amount || 0), 0);
      setStats({
        total: txs.length,
        confirmed: confirmed.length,
        pending: txs.length - confirmed.length,
        totalAmount,
      });
    } catch (err) {
      toast.error(t('dashboard.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    socketService.connect();
    fetchDashboard();
  }, [fetchDashboard]);

  useSocket('donation:created', useCallback((data) => {
    toast(t('dashboard.newDonation'), { icon: '�' });
    fetchDashboard();
  }, [fetchDashboard, t]));

  useSocket('donation:confirmed', useCallback((data) => {
    toast.success(t('dashboard.donationConfirmed'));
    fetchDashboard();
  }, [fetchDashboard, t]));

  if (loading) return <LoadingSpinner size="lg" text={t('dashboard.loadingDashboard')} />;

  return (
    <div className="dashboard-page container">
      <div className="page-header">
        <h1 className="page-title">{t('dashboard.title')}</h1>
        <p className="page-subtitle">{t('dashboard.subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon" style={{ color: 'var(--primary-600)' }}><UIcon name="pulse" size={24} /></div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">{t('dashboard.totalTransactions')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: 'var(--success)' }}><UIcon name="check-circle" size={24} /></div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>{stats.confirmed}</div>
          <div className="stat-label">{t('dashboard.confirmed')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: 'var(--warning)' }}><UIcon name="clock" size={24} /></div>
          <div className="stat-value" style={{ color: 'var(--warning)' }}>{stats.pending}</div>
          <div className="stat-label">{t('dashboard.pending')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: 'var(--accent-600)' }}><UIcon name="dollar" size={24} /></div>
          <div className="stat-value">{stats.totalAmount.toLocaleString()}</div>
          <div className="stat-label">{t('dashboard.totalMru')}</div>
        </div>
      </div>

      {/* Transactions Table */}
      {transactions.length === 0 ? (
        <EmptyState icon="—" title={t('dashboard.noTransactions')} message={t('dashboard.noTransactionsMsg')} />
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table className="tx-table">
            <thead>
              <tr>
                <th>{t('dashboard.date')}</th>
                <th>{t('dashboard.type')}</th>
                <th>{t('dashboard.neighborhoodCol')}</th>
                <th>{t('dashboard.amount')}</th>
                <th>{t('dashboard.status')}</th>
                <th>{t('dashboard.txHash')}</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, index) => (
                <tr key={tx.id} className={index < 3 ? 'slide-in' : ''} style={{ animationDelay: `${index * 50}ms` }}>
                  <td>{new Date(tx.date).toLocaleDateString()}</td>
                  <td>{tx.type}</td>
                  <td>◆ {tx.neighborhood}</td>
                  <td style={{ fontWeight: 600 }}>{tx.amount?.toLocaleString()} MRU</td>
                  <td><StatusBadge status={tx.status} /></td>
                  <td><TransactionHash hash={tx.transactionHash} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      <div className="notice notice-info" style={{ marginTop: '2.5rem' }}>
        <span><UIcon name="lock" size={16} /></span>
        <div>
          {t('dashboard.immutableNotice')}
          <br />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {t('dashboard.realtimeNotice')}
          </span>
        </div>
      </div>
    </div>
  );
}

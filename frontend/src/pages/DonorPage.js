import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { donationService } from '../services';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LoadingSpinner, StatusBadge, TransactionHash, EmptyState } from '../components/common';
import { useSocket } from '../hooks/useSocket';
import UIcon from '../components/common/UIcon';
import toast from 'react-hot-toast';
import './Pages.css';

function timeAgo(date, t) {
  if (!date) return '';
  const now = new Date();
  const diff = now - new Date(date);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('donor.justNow');
  if (mins < 60) {
    const label = t('donor.minsAgo');
    return typeof label === 'function' ? label(mins) : `${mins}m`;
  }
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) {
    const label = t('donor.hrsAgo');
    return typeof label === 'function' ? label(hrs) : `${hrs}h`;
  }
  const days = Math.floor(hrs / 24);
  const label = t('donor.daysAgo');
  return typeof label === 'function' ? label(days) : `${days}d`;
}

export default function DonorPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [donations, setDonations] = useState([]);
  const [stats, setStats] = useState(null);
  const [donorInfo, setDonorInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const fetchData = useCallback(async () => {
    try {
      const [donationsRes, statsRes] = await Promise.all([
        donationService.getMine(),
        donationService.getMyStats(),
      ]);
      setDonations(donationsRes.data.data || []);
      setStats(statsRes.data.data?.stats || null);
      setDonorInfo(statsRes.data.data?.donor || null);
    } catch (err) {
      toast.error(t('donor.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useSocket('impact:proof', useCallback(() => {
    toast.success(t('donor.proofReceived'), { duration: 6000, icon: '✦' });
    fetchData();
  }, [fetchData, t]));

  useSocket('donation:proof', useCallback(() => {
    toast.success(t('donor.donationConfirmed'), { duration: 6000, icon: '✔' });
    fetchData();
  }, [fetchData, t]));

  if (loading) return <LoadingSpinner size="lg" text={t('donor.loadingDonations')} />;

  const pending = donations.filter(d => d.status === 'PENDING');
  const confirmed = donations.filter(d => d.status === 'CONFIRMED');

  const filtered = activeTab === 'pending' ? pending
    : activeTab === 'confirmed' ? confirmed
    : donations;

  return (
    <div className="container">
      {/* Donor Profile Header */}
      <div className="app-profile-header">
        <div className="app-profile-avatar"><UIcon name="hand-holding-heart" size={32} /></div>
        <div className="app-profile-info">
          <h1 className="app-profile-name">{donorInfo?.name || user.name}</h1>
          <div className="app-profile-meta">
            <span><UIcon name="calendar" size={13} /> {t('donor.memberSince')} {donorInfo?.createdAt ? new Date(donorInfo.createdAt).toLocaleDateString() : '—'}</span>
            <span><UIcon name="globe" size={13} /> {stats?.neighborhoodsReached || 0} {t('donor.neighborhoods')}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="app-stats-grid">
        <div className="app-stat-card">
          <div className="app-stat-icon" style={{ background: 'var(--primary-50)', color: 'var(--primary-700)' }}><UIcon name="dollar" /></div>
          <div className="app-stat-value" style={{ color: 'var(--primary-700)' }}>{(stats?.totalDonated || 0).toLocaleString()}</div>
          <div className="app-stat-label">{t('donor.totalDonated')}</div>
        </div>
        <div className="app-stat-card">
          <div className="app-stat-icon" style={{ background: 'var(--accent-50)', color: 'var(--accent)' }}><UIcon name="heart" /></div>
          <div className="app-stat-value">{stats?.totalDonations || 0}</div>
          <div className="app-stat-label">{t('donor.donationCount')}</div>
        </div>
        <div className="app-stat-card">
          <div className="app-stat-icon" style={{ background: '#d1fae5', color: '#059669' }}><UIcon name="check-circle" /></div>
          <div className="app-stat-value" style={{ color: '#059669' }}>{stats?.confirmedCount || 0}</div>
          <div className="app-stat-label">{t('donor.confirmedCount')}</div>
        </div>
        <div className="app-stat-card">
          <div className="app-stat-icon" style={{ background: '#ede9fe', color: '#7c3aed' }}><UIcon name="shield" /></div>
          <div className="app-stat-value" style={{ color: '#7c3aed' }}>{stats?.impactProofs || 0}</div>
          <div className="app-stat-label">{t('donor.impactProofs')}</div>
        </div>
      </div>

      {/* Pending Notice Banner */}
      {pending.length > 0 && (
        <div className="app-pending-banner">
          <div className="app-pending-banner-icon"><UIcon name="clock" size={20} /></div>
          <div>
            <strong>{pending.length} {t('donor.pendingNotice')}</strong>
            <span className="app-pending-amount">
              {pending.reduce((s, d) => s + d.amount, 0).toLocaleString()} MRU
            </span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="panel-tabs" style={{ marginBottom: '1.5rem' }}>
        <button
          className={`panel-tab ${activeTab === 'all' ? 'panel-tab-active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <UIcon name="heart" size={15} /> {t('donor.tabAll')} ({donations.length})
        </button>
        <button
          className={`panel-tab ${activeTab === 'pending' ? 'panel-tab-active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <UIcon name="exclamation" size={15} /> {t('donor.tabPending')} {pending.length > 0 && <span className="app-tab-badge">{pending.length}</span>}
        </button>
        <button
          className={`panel-tab ${activeTab === 'confirmed' ? 'panel-tab-active' : ''}`}
          onClick={() => setActiveTab('confirmed')}
        >
          <UIcon name="check-circle" size={15} /> {t('donor.tabConfirmed')} ({confirmed.length})
        </button>
      </div>

      {/* Donation Cards */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<UIcon name="hand-holding-heart" size={36} />}
          title={activeTab === 'all' ? t('donor.noDonations') : activeTab === 'pending' ? t('donor.noPending') : t('donor.noConfirmed')}
          message={activeTab === 'all' ? t('donor.noDonationsMsg') : activeTab === 'pending' ? t('donor.noPendingMsg') : t('donor.noConfirmedMsg')}
        />
      ) : (
        <div className="app-orders-grid">
          {filtered.map((donation) => (
            <div
              key={donation.id}
              className={`app-order-card ${donation.status === 'PENDING' ? 'app-order-open' : 'app-order-done'}`}
            >
              <div className="app-order-inner">
                {/* Header Row */}
                <div className="app-order-header">
                  <span className="app-detail-amount">
                    {donation.amount?.toLocaleString()} MRU
                  </span>
                  <span className="app-time-badge">
                    <UIcon name="clock" size={12} /> {timeAgo(donation.createdAt, t)}
                  </span>
                </div>

                {/* Status */}
                <div className="app-order-header">
                  <StatusBadge status={donation.status} />
                  <span className="app-need-type">{donation.need?.type}</span>
                </div>

                {/* Description */}
                <p className="app-order-desc">{donation.need?.description}</p>

                {/* Details Grid */}
                <div className="app-order-details">
                  <div className="app-detail-item">
                    <UIcon name="marker" size={13} />
                    <span>{donation.need?.neighborhood}</span>
                  </div>
                  <div className="app-detail-item">
                    <UIcon name="calendar" size={13} />
                    <span>{new Date(donation.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="app-detail-item app-detail-tx">
                    <UIcon name="hastag" size={11} />
                    <TransactionHash hash={donation.transactionHash} />
                  </div>
                </div>

                {/* Impact Proof */}
                {donation.impactProof && (
                  <div className="app-impact-proof">
                    <div className="app-confirmed-tag">
                      <UIcon name="shield" size={14} /> {t('donor.impactProof')}
                    </div>
                    <p>{donation.impactProof.confirmationMessage}</p>
                    <div className="app-confirmed-date">
                      {t('donor.confirmed')}: {new Date(donation.impactProof.confirmedAt).toLocaleString()}
                    </div>
                  </div>
                )}

                {/* Awaiting Notice */}
                {donation.status === 'PENDING' && !donation.impactProof && (
                  <div className="app-pending-content">
                    <UIcon name="clock" size={14} /> {t('donor.awaitingConfirmation')}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Browse More Button */}
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <button className="btn btn-primary btn-lg" onClick={() => navigate('/needs')}>
          <UIcon name="heart" size={18} /> {t('donor.browseMore')}
        </button>
      </div>
    </div>
  );
}

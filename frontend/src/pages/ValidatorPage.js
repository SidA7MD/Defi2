import React, { useState, useEffect, useCallback } from 'react';
import { needService, impactProofService, restaurantService } from '../services';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LoadingSpinner, StatusBadge, EmptyState } from '../components/common';
import { useSocket } from '../hooks/useSocket';
import UIcon from '../components/common/UIcon';
import toast from 'react-hot-toast';
import './Pages.css';

function timeAgo(date, t) {
  if (!date) return '';
  const now = new Date();
  const diff = now - new Date(date);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('validator.justNow');
  if (mins < 60) {
    const label = t('validator.minsAgo');
    return typeof label === 'function' ? label(mins) : `${mins}m`;
  }
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) {
    const label = t('validator.hrsAgo');
    return typeof label === 'function' ? label(hrs) : `${hrs}h`;
  }
  const days = Math.floor(hrs / 24);
  const label = t('validator.daysAgo');
  return typeof label === 'function' ? label(days) : `${days}d`;
}

export default function ValidatorPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [tab, setTab] = useState('needs');
  const [needs, setNeeds] = useState([]);
  const [stats, setStats] = useState(null);
  const [validatorInfo, setValidatorInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: 'Iftar Meals',
    description: '',
    neighborhood: '',
    estimatedAmount: '',
    lat: '18.0866',
    lng: '-15.9785',
    restaurantId: '',
  });

  const [confirmingDonation, setConfirmingDonation] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [needsRes, restaurantsRes, statsRes] = await Promise.all([
        needService.getValidatorNeeds(),
        restaurantService.getAll(),
        needService.getValidatorStats(),
      ]);
      setNeeds(needsRes.data.data || []);
      setRestaurants(restaurantsRes.data.data || []);
      setStats(statsRes.data.data?.stats || null);
      setValidatorInfo(statsRes.data.data?.validator || null);
    } catch (err) {
      toast.error(t('validator.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useSocket('need:funded', useCallback((data) => {
    const msg = t('validator.needFunded');
    toast.success(typeof msg === 'function' ? msg(data.description) : msg, { duration: 6000, icon: '✦' });
    fetchData();
  }, [fetchData, t]));

  const handleCreateNeed = async (e) => {
    e.preventDefault();
    try {
      await needService.create({
        ...form,
        estimatedAmount: parseFloat(form.estimatedAmount),
        lat: parseFloat(form.lat),
        lng: parseFloat(form.lng),
        restaurantId: form.restaurantId || undefined,
      });
      toast.success(t('validator.needCreated'));
      setShowForm(false);
      setForm({ type: 'Iftar Meals', description: '', neighborhood: '', estimatedAmount: '', lat: '18.0866', lng: '-15.9785', restaurantId: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || t('validator.createFailed'));
    }
  };

  const handleConfirm = async (donationId) => {
    if (!confirmMessage.trim()) {
      toast.error(t('validator.confirmMsgRequired'));
      return;
    }
    try {
      await impactProofService.create({
        donationId,
        confirmationMessage: confirmMessage,
      });
      toast.success(t('validator.confirmSuccess'));
      setConfirmingDonation(null);
      setConfirmMessage('');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || t('validator.confirmFailed'));
    }
  };

  if (loading) return <LoadingSpinner size="lg" text={t('validator.loadingPanel')} />;

  const fundedNeeds = needs.filter((n) => n.status === 'FUNDED');
  const openNeeds = needs.filter((n) => n.status === 'OPEN');
  const confirmedNeeds = needs.filter((n) => n.status === 'CONFIRMED');

  return (
    <div className="container">
      {/* Validator Profile Header */}
      <div className="app-profile-header">
        <div className="app-profile-avatar"><UIcon name="star" variant="sr" size={32} /></div>
        <div className="app-profile-info">
          <h1 className="app-profile-name">{validatorInfo?.name || user.name}</h1>
          <div className="app-profile-meta">
            <span><UIcon name="star" size={13} /> {t('validator.reputation')}: {validatorInfo?.reputationScore ?? user.reputationScore ?? 0}</span>
            <span><UIcon name="calendar" size={13} /> {t('validator.memberSince')} {validatorInfo?.createdAt ? new Date(validatorInfo.createdAt).toLocaleDateString() : '—'}</span>
            <span><UIcon name="globe" size={13} /> {stats?.neighborhoodsCovered || 0} {t('validator.neighborhoods')}</span>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          {showForm ? <><UIcon name="cross" /> {t('validator.cancelCreate')}</> : <><UIcon name="plus" /> {t('validator.createNeed')}</>}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="app-stats-grid">
        <div className="app-stat-card">
          <div className="app-stat-icon" style={{ background: 'var(--primary-50)', color: 'var(--primary-700)' }}><UIcon name="clipboard" /></div>
          <div className="app-stat-value">{stats?.totalNeeds || 0}</div>
          <div className="app-stat-label">{t('validator.totalNeeds')}</div>
        </div>
        <div className="app-stat-card">
          <div className="app-stat-icon" style={{ background: 'var(--accent-50)', color: 'var(--accent)' }}><UIcon name="clock" /></div>
          <div className="app-stat-value" style={{ color: 'var(--warning)' }}>{stats?.openCount || 0}</div>
          <div className="app-stat-label">{t('validator.openNeeds')}</div>
        </div>
        <div className="app-stat-card">
          <div className="app-stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}><UIcon name="dollar" /></div>
          <div className="app-stat-value">{(stats?.totalAmountValidated || 0).toLocaleString()}</div>
          <div className="app-stat-label">{t('validator.totalValidated')}</div>
        </div>
        <div className="app-stat-card">
          <div className="app-stat-icon" style={{ background: '#d1fae5', color: '#059669' }}><UIcon name="check-circle" /></div>
          <div className="app-stat-value" style={{ color: '#059669' }}>{stats?.confirmedCount || 0}</div>
          <div className="app-stat-label">{t('validator.confirmedNeeds')}</div>
        </div>
      </div>

      {/* Funded Needs Banner */}
      {fundedNeeds.length > 0 && (
        <div className="app-pending-banner">
          <div className="app-pending-banner-icon">�</div>
          <div>
            <strong>{fundedNeeds.length} {t('validator.fundedNotice')}</strong>
            <span className="app-pending-amount">
              {fundedNeeds.reduce((s, n) => s + n.estimatedAmount, 0).toLocaleString()} MRU
            </span>
          </div>
        </div>
      )}

      {/* Create Need Form */}
      {showForm && (
        <div className="card fade-in" style={{ marginBottom: '2rem' }}>
          <div className="card-header"><h3>{t('validator.createNeedTitle')}</h3></div>
          <form className="app-order-inner" onSubmit={handleCreateNeed}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(250px, 100%), 1fr))', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">{t('validator.type')}</label>
                <select className="form-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="Iftar Meals">{t('validator.typeIftar')}</option>
                  <option value="Food Package">{t('validator.typeFood')}</option>
                  <option value="Medical Aid">{t('validator.typeMedical')}</option>
                  <option value="School Supplies">{t('validator.typeSchool')}</option>
                  <option value="Clothing">{t('validator.typeClothing')}</option>
                  <option value="Other">{t('validator.typeOther')}</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{t('validator.neighborhoodLabel')}</label>
                <input className="form-input" value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} placeholder={t('validator.neighborhoodPlaceholder')} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">{t('validator.descriptionLabel')}</label>
              <textarea className="form-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={t('validator.descriptionPlaceholder')} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">{t('validator.amountLabel')}</label>
                <input className="form-input" type="number" step="0.01" value={form.estimatedAmount} onChange={(e) => setForm({ ...form, estimatedAmount: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">{t('validator.latLabel')}</label>
                <input className="form-input" type="number" step="any" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">{t('validator.lngLabel')}</label>
                <input className="form-input" type="number" step="any" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">{t('validator.restaurantLabel')}</label>
              <select className="form-select" value={form.restaurantId} onChange={(e) => setForm({ ...form, restaurantId: e.target.value })}>
                <option value="">{t('validator.restaurantNone')}</option>
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id}>{r.name} — {r.neighborhood}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary">{t('validator.createBtn')}</button>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="panel-tabs" style={{ marginBottom: '1.5rem' }}>
        <button className={`panel-tab ${tab === 'needs' ? 'panel-tab-active' : ''}`} onClick={() => setTab('needs')}>
          <UIcon name="clipboard" size={15} /> {t('validator.tabOpen')} ({openNeeds.length})
        </button>
        <button className={`panel-tab ${tab === 'funded' ? 'panel-tab-active' : ''}`} onClick={() => setTab('funded')}>
          <UIcon name="exclamation" size={15} /> {t('validator.tabFunded')} {fundedNeeds.length > 0 && <span className="app-tab-badge">{fundedNeeds.length}</span>}
        </button>
        <button className={`panel-tab ${tab === 'confirmed' ? 'panel-tab-active' : ''}`} onClick={() => setTab('confirmed')}>
          <UIcon name="check-circle" size={15} /> {t('validator.tabConfirmed')} ({confirmedNeeds.length})
        </button>
      </div>

      {/* Open Needs Tab */}
      {tab === 'needs' && (
        openNeeds.length === 0 ? (
          <EmptyState icon="�" title={t('validator.noOpen')} message={t('validator.noOpenMsg')} />
        ) : (
          <div className="app-orders-grid">
            {openNeeds.map((need) => (
              <div key={need.id} className="app-order-card app-order-open">
                <div className="app-order-inner">
                  <div className="app-order-header">
                    <span className="app-need-type">{need.type}</span>
                    <span className="app-time-badge">
                      <UIcon name="clock" size={12} /> {timeAgo(need.createdAt, t)}
                    </span>
                  </div>
                  <p className="app-order-desc">{need.description}</p>
                  <div className="app-order-details">
                    <div className="app-detail-item">
                      <UIcon name="marker" size={13} />
                      <span>{need.neighborhood}</span>
                    </div>
                    <div className="app-detail-item">
                      <UIcon name="dollar" size={13} />
                      <span className="app-detail-amount">{need.estimatedAmount?.toLocaleString()} MRU</span>
                    </div>
                    {need.restaurant && (
                      <div className="app-detail-item">
                        <UIcon name="user" size={13} />
                        <span>{need.restaurant.name}</span>
                      </div>
                    )}
                  </div>
                  <StatusBadge status={need.status} />
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Funded Needs Tab */}
      {tab === 'funded' && (
        fundedNeeds.length === 0 ? (
          <EmptyState icon="–" title={t('validator.noFunded')} message={t('validator.noFundedMsg')} />
        ) : (
          <div className="app-orders-grid">
            {fundedNeeds.map((need) => (
              <div key={need.id} className="app-order-card app-order-urgent">
                <div className="app-order-inner">
                  <div className="app-order-header">
                    <span className="app-need-type">{need.type}</span>
                    <span className="app-time-badge">
                      <UIcon name="clock" size={12} /> {timeAgo(need.lockedAt || need.createdAt, t)}
                    </span>
                  </div>
                  <p className="app-order-desc">{need.description}</p>
                  <div className="app-order-details">
                    <div className="app-detail-item">
                      <UIcon name="marker" size={13} />
                      <span>{need.neighborhood}</span>
                    </div>
                    <div className="app-detail-item">
                      <UIcon name="dollar" size={13} />
                      <span className="app-detail-amount">{need.estimatedAmount?.toLocaleString()} MRU</span>
                    </div>
                  </div>

                  {/* Donation confirm flows */}
                  {need.donations?.filter(d => d.status === 'PENDING').map((donation) => (
                    <div key={donation.id} className="app-donation-block">
                      <div className="app-donation-info">
                        <strong>{t('validator.donation')}:</strong> {donation.amount?.toLocaleString()} MRU
                        <StatusBadge status={donation.status} />
                      </div>

                      {confirmingDonation === donation.id ? (
                        <div className="app-confirm-form">
                          <textarea
                            className="form-input"
                            placeholder={t('validator.confirmPlaceholder')}
                            value={confirmMessage}
                            onChange={(e) => setConfirmMessage(e.target.value)}
                            style={{ minHeight: '60px' }}
                          />
                          <div className="app-confirm-actions">
                            <button className="btn btn-primary btn-sm" onClick={() => handleConfirm(donation.id)}>
                              <UIcon name="paper-plane" size={14} /> {t('validator.submitConfirmation')}
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={() => { setConfirmingDonation(null); setConfirmMessage(''); }}>
                              {t('validator.cancelConfirm')}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button className="btn btn-accent btn-sm app-confirm-btn" onClick={() => setConfirmingDonation(donation.id)}>
                          <UIcon name="check-circle" size={14} /> {t('validator.confirmDelivery')}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Confirmed Needs Tab */}
      {tab === 'confirmed' && (
        confirmedNeeds.length === 0 ? (
          <EmptyState icon={<UIcon name="check-circle" size={36} />} title={t('validator.noConfirmed')} />
        ) : (
          <div className="app-orders-grid">
            {confirmedNeeds.map((need) => (
              <div key={need.id} className="app-order-card app-order-done">
                <div className="app-order-inner">
                  <div className="app-order-header">
                    <span className="app-need-type">{need.type}</span>
                    <StatusBadge status={need.status} />
                  </div>
                  <p className="app-order-desc">{need.description}</p>
                  <div className="app-order-details">
                    <div className="app-detail-item">
                      <UIcon name="marker" size={13} />
                      <span>{need.neighborhood}</span>
                    </div>
                    <div className="app-detail-item">
                      <UIcon name="dollar" size={13} />
                      <span className="app-detail-amount">{need.estimatedAmount?.toLocaleString()} MRU</span>
                    </div>
                    {need.donations?.map((d) => (
                      <div key={d.id} className="app-detail-item app-detail-tx">
                        <UIcon name="hastag" size={11} />
                        <span className="app-tx-hash">{d.transactionHash?.slice(0, 12)}…</span>
                      </div>
                    ))}
                  </div>
                  <div className="app-confirmed-tag">
                    <UIcon name="check-circle" size={13} /> {t('validator.deliveryConfirmed')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { needService, restaurantService } from '../services';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LoadingSpinner, StatusBadge, EmptyState, TransactionHash } from '../components/common';
import { useSocket } from '../hooks/useSocket';
import UIcon from '../components/common/UIcon';
import toast from 'react-hot-toast';
import './Pages.css';

function timeAgo(date, t) {
  if (!date) return '';
  const now = new Date();
  const diff = now - new Date(date);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('restaurant.justNow');
  if (mins < 60) {
    const label = t('restaurant.minsAgo');
    return typeof label === 'function' ? label(mins) : `${mins}m`;
  }
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) {
    const label = t('restaurant.hrsAgo');
    return typeof label === 'function' ? label(hrs) : `${hrs}h`;
  }
  const days = Math.floor(hrs / 24);
  const label = t('restaurant.daysAgo');
  return typeof label === 'function' ? label(days) : `${days}d`;
}

function getWeeklyData(needs) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekData = days.map(() => ({ count: 0, amount: 0 }));
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  oneWeekAgo.setHours(0, 0, 0, 0);

  needs.forEach(need => {
    const date = new Date(need.lockedAt || need.createdAt);
    if (date >= oneWeekAgo) {
      const dayIndex = date.getDay();
      weekData[dayIndex].count++;
      weekData[dayIndex].amount += parseFloat(need.estimatedAmount || 0);
    }
  });
  return { days, weekData };
}

export default function RestaurantPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [needs, setNeeds] = useState([]);
  const [stats, setStats] = useState(null);
  const [restaurantInfo, setRestaurantInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [confirming, setConfirming] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const [needsRes, statsRes] = await Promise.all([
        needService.getRestaurantNeeds(),
        restaurantService.getMyStats(),
      ]);
      setNeeds(needsRes.data.data || []);
      setStats(statsRes.data.data?.stats || null);
      setRestaurantInfo(statsRes.data.data?.restaurant || null);
    } catch (err) {
      toast.error(t('restaurant.loadFailed'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useSocket('order:new', useCallback((data) => {
    const msg = t('restaurant.newOrder');
    toast.success(typeof msg === 'function' ? msg(data.description) : msg, { duration: 6000, icon: '✨' });
    fetchData();
  }, [fetchData, t]));

  useSocket('donation:confirmed', useCallback(() => {
    fetchData();
  }, [fetchData]));

  useSocket('need:funded', useCallback(() => {
    toast.success(t('restaurant.newOrderFunded'), { duration: 5000, icon: '🪙' });
    fetchData();
  }, [fetchData, t]));

  const handleConfirm = async (needId) => {
    setConfirming(needId);
    try {
      await needService.confirmByRestaurant(needId, t('restaurant.defaultConfirmMsg'));
      toast.success(t('restaurant.confirmSuccess'), { icon: '✓' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || t('restaurant.confirmFailed'));
    } finally {
      setConfirming(null);
    }
  };

  const handleRefresh = () => {
    fetchData(true);
  };

  // Derived data
  const funded = useMemo(() => needs.filter((n) => n.status === 'FUNDED'), [needs]);
  const confirmed = useMemo(() => needs.filter((n) => n.status === 'CONFIRMED'), [needs]);
  const openNeeds = useMemo(() => needs.filter((n) => n.status === 'OPEN'), [needs]);
  const totalFundedAmount = useMemo(() => funded.reduce((s, n) => s + parseFloat(n.estimatedAmount || 0), 0), [funded]);

  // Weekly performance data — prefer server-computed, fall back to client
  const weeklyPerformance = useMemo(() => {
    if (stats?.weeklyData && stats?.weeklyDays) {
      return { days: stats.weeklyDays, weekData: stats.weeklyData };
    }
    return getWeeklyData(needs);
  }, [stats, needs]);

  const maxWeeklyCount = useMemo(
    () => Math.max(...weeklyPerformance.weekData.map(d => d.count), 1),
    [weeklyPerformance]
  );
  const totalWeeklyOrders = useMemo(
    () => weeklyPerformance.weekData.reduce((s, d) => s + d.count, 0),
    [weeklyPerformance]
  );

  // Average order value
  const avgOrderValue = useMemo(() => {
    return stats?.avgOrderValue || (() => {
      if (confirmed.length === 0) return 0;
      const total = confirmed.reduce((s, n) => s + parseFloat(n.estimatedAmount || 0), 0);
      return Math.round(total / confirmed.length);
    })();
  }, [stats, confirmed]);

  // Get unique meal types for filtering
  const mealTypes = useMemo(() => {
    const types = new Set(needs.map(n => n.type).filter(Boolean));
    return ['all', ...Array.from(types)];
  }, [needs]);

  // Filter orders based on search and type
  const filteredOrders = useMemo(() => {
    let filtered = activeTab === 'pending' ? funded
      : activeTab === 'completed' ? confirmed
        : needs;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(n =>
        n.description?.toLowerCase().includes(term) ||
        n.neighborhood?.toLowerCase().includes(term) ||
        n.type?.toLowerCase().includes(term)
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(n => n.type === filterType);
    }

    return filtered;
  }, [activeTab, funded, confirmed, needs, searchTerm, filterType]);

  if (loading) return <LoadingSpinner size="lg" text={t('restaurant.loadingOrders')} />;

  return (
    <div className="container">
      {/* Restaurant Profile Header */}
      <div className="app-profile-header">
        <div className="app-profile-avatar">🥘</div>
        <div className="app-profile-info">
          <h1 className="app-profile-name">{restaurantInfo?.name || user.name}</h1>
          <div className="app-profile-meta">
            <span><UIcon name="marker" size={13} /> {restaurantInfo?.neighborhood || '—'}</span>
            <span><UIcon name="calendar" size={13} /> {t('restaurant.memberSince')} {restaurantInfo?.createdAt ? new Date(restaurantInfo.createdAt).toLocaleDateString() : '—'}</span>
            <span className="app-rating-badge">
              <UIcon name="star" size={13} /> {stats?.avgRating ?? '—'}
            </span>
          </div>
        </div>
        <button
          className="app-refresh-btn-mobile"
          onClick={handleRefresh}
          disabled={refreshing}
          title={t('restaurant.refresh')}
          style={{
            position: 'absolute',
            top: '0.75rem',
            right: '0.75rem',
            width: '2rem',
            height: '2rem',
            borderRadius: '50%',
            border: '1.5px solid #fed7aa',
            background: 'white',
            color: '#d97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
            boxShadow: '0 2px 8px rgba(251,146,60,0.15)',
            zIndex: 10,
          }}
        >
          <UIcon name="refresh" size={14} className={refreshing ? 'spinning' : ''} />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="app-stats-grid">
        <div className="app-stat-card">
          <div className="app-stat-icon" style={{ background: 'var(--accent-50)', color: 'var(--accent)' }}><UIcon name="clock" /></div>
          <div className="app-stat-value" style={{ color: 'var(--warning)' }}>{stats?.funded ?? funded.length}</div>
          <div className="app-stat-label">{t('restaurant.pendingPrep')}</div>
        </div>
        <div className="app-stat-card">
          <div className="app-stat-icon" style={{ background: 'var(--primary-50)', color: 'var(--primary-700)' }}><UIcon name="check-circle" /></div>
          <div className="app-stat-value">{stats?.totalServed ?? confirmed.length}</div>
          <div className="app-stat-label">{t('restaurant.totalServed')}</div>
        </div>
        <div className="app-stat-card">
          <div className="app-stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}><UIcon name="dollar" /></div>
          <div className="app-stat-value">{(stats?.totalAmount || 0).toLocaleString()}</div>
          <div className="app-stat-label">{t('restaurant.totalRevenue')}</div>
        </div>
        <div className="app-stat-card">
          <div className="app-stat-icon" style={{ background: '#ede9fe', color: '#7c3aed' }}><UIcon name="chart-line-up" /></div>
          <div className="app-stat-value">{stats?.todayOrders ?? 0}</div>
          <div className="app-stat-label">{t('restaurant.todayOrders')}</div>
        </div>
        <div className="app-stat-card">
          <div className="app-stat-icon" style={{ background: '#dbeafe', color: '#2563eb' }}><UIcon name="chart-histogram" /></div>
          <div className="app-stat-value">{avgOrderValue.toLocaleString()}</div>
          <div className="app-stat-label">{t('restaurant.avgOrderValue')}</div>
        </div>
        <div className="app-stat-card">
          <div className="app-stat-icon" style={{ background: '#d1fae5', color: '#059669' }}><UIcon name="trophy" /></div>
          <div className="app-stat-value">{stats?.totalOrders ?? needs.length}</div>
          <div className="app-stat-label">{t('restaurant.totalOrders')}</div>
        </div>
      </div>

      {/* Weekly Performance Chart */}
      <div className="app-weekly-chart">
        <div className="app-weekly-header">
          <div className="app-weekly-title">
            <UIcon name="chart-histogram" size={18} />
            <h3>{t('restaurant.weeklyPerformance')}</h3>
          </div>
          <div className="app-weekly-meta">
            <span className="app-weekly-subtitle">{t('restaurant.last7Days')}</span>
            {totalWeeklyOrders > 0 && (
              <span className="app-weekly-total">{totalWeeklyOrders} orders</span>
            )}
          </div>
        </div>
        <div className="app-weekly-bars">
          {weeklyPerformance.days.map((day, idx) => {
            const d = weeklyPerformance.weekData[idx];
            const heightPct = d.count > 0 ? Math.max(12, (d.count / maxWeeklyCount) * 100) : 4;
            const isToday = new Date().getDay() === idx;
            return (
              <div
                key={day}
                className={`app-weekly-bar-container${isToday ? ' app-weekly-today' : ''}`}
                title={`${day}: ${d.count} orders · ${d.amount.toLocaleString()} MRU`}
              >
                <span className="app-weekly-count">{d.count > 0 ? d.count : ''}</span>
                <div className="app-weekly-bar-track">
                  <div
                    className={`app-weekly-bar${d.count > 0 ? ' app-weekly-bar-active' : ''}`}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
                <span className="app-weekly-day">{day.slice(0, 3)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pending Revenue Banner */}
      {funded.length > 0 && (
        <div className="app-pending-banner app-pending-urgent">
          <div className="app-pending-banner-icon">🔴</div>
          <div className="app-pending-content">
            <strong>{funded.length} {t('restaurant.ordersPending')}</strong>
            <span className="app-pending-amount">{totalFundedAmount.toLocaleString()} MRU</span>
          </div>
          <button
            className="btn btn-accent btn-sm"
            onClick={() => setActiveTab('pending')}
          >
            {t('restaurant.viewPending')}
          </button>
        </div>
      )}

      {/* Open Needs Info Banner */}
      {openNeeds.length > 0 && (
        <div className="app-info-banner">
          <div className="app-info-icon">�</div>
          <div>
            <strong>{openNeeds.length} {t('restaurant.openNeeds')}</strong>
            <span className="app-info-sub">{t('restaurant.awaitingFunding')}</span>
          </div>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="app-filter-bar">
        <div className="app-search-wrapper">
          <UIcon name="search" size={16} className="app-search-icon" />
          <input
            type="text"
            className="app-search-input"
            placeholder={t('restaurant.searchOrders')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="app-filter-wrapper">
          <UIcon name="filter" size={14} />
          <select
            className="app-filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            {mealTypes.map(type => (
              <option key={type} value={type}>
                {type === 'all' ? t('restaurant.allTypes') : type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="panel-tabs app-tabs">
        <button
          className={`panel-tab ${activeTab === 'all' ? 'panel-tab-active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <UIcon name="box" size={15} /> {t('restaurant.tabAll')} ({needs.length})
        </button>
        <button
          className={`panel-tab ${activeTab === 'pending' ? 'panel-tab-active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <UIcon name="exclamation" size={15} /> {t('restaurant.tabPending')}{' '}
          {funded.length > 0 && <span className="app-tab-badge">{funded.length}</span>}
        </button>
        <button
          className={`panel-tab ${activeTab === 'completed' ? 'panel-tab-active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          <UIcon name="check-circle" size={15} /> {t('restaurant.tabCompleted')} ({confirmed.length})
        </button>
      </div>

      {/* Results count */}
      {(searchTerm || filterType !== 'all') && (
        <div className="app-results-count">
          {t('restaurant.showing')} <strong>{filteredOrders.length}</strong> {t('restaurant.results')}
          <button
            className="app-clear-filters"
            onClick={() => { setSearchTerm(''); setFilterType('all'); }}
          >
            {t('restaurant.clearFilters')}
          </button>
        </div>
      )}

      {/* All Orders Tab */}
      {activeTab === 'all' && (
        <>
          {filteredOrders.length === 0 ? (
            <EmptyState icon="�" title={t('restaurant.noOrders')} message={t('restaurant.noOrdersMsg')} />
          ) : (
            <div className="app-orders-grid">
              {filteredOrders.map((need) => {
                const donationTotal = need.donations?.reduce((s, d) => s + parseFloat(d.amount || 0), 0) || 0;
                const isUrgent = need.status === 'FUNDED';
                const isCompleted = need.status === 'CONFIRMED';
                const cardClass = isUrgent ? 'app-order-urgent' : isCompleted ? 'app-order-done' : 'app-order-open';
                return (
                  <div key={need.id} className={`app-order-card ${cardClass}`}>
                    <div className="app-order-inner">
                      <div className="app-order-header">
                        <span className="app-need-type">{need.type}</span>
                        <div className="app-header-right">
                          <StatusBadge status={need.status} />
                          <span className={`app-time-badge${isUrgent ? ' app-time-urgent' : ''}`}>
                            <UIcon name="clock" size={11} /> {timeAgo(need.lockedAt || need.createdAt, t)}
                          </span>
                        </div>
                      </div>
                      <p className="app-order-desc">{need.description}</p>
                      <div className="app-order-details">
                        <div className="app-detail-item">
                          <UIcon name="marker" size={13} />
                          <span>{need.neighborhood}</span>
                        </div>
                        <div className="app-detail-item">
                          <UIcon name="dollar" size={13} />
                          <span className="app-detail-amount">{parseFloat(need.estimatedAmount || 0).toLocaleString()} MRU</span>
                        </div>
                        {need.validator && (
                          <div className="app-detail-item">
                            <UIcon name="user" size={13} />
                            <span>{t('restaurant.validatedBy')} {need.validator.name}</span>
                          </div>
                        )}
                        {need.donations?.length > 0 && (
                          <div className="app-detail-item">
                            <UIcon name="box" size={13} />
                            <span>{need.donations.length} {t('restaurant.donations')} · {donationTotal.toLocaleString()} MRU</span>
                          </div>
                        )}
                      </div>
                      {isUrgent && (
                        <button
                          className="btn btn-primary app-confirm-btn"
                          onClick={() => handleConfirm(need.id)}
                          disabled={confirming === need.id}
                        >
                          {confirming === need.id
                            ? <span className="spinner" />
                            : <><UIcon name="check-circle" size={16} /> {t('restaurant.confirmMeal')}</>}
                        </button>
                      )}
                      {isCompleted && (
                        <div className="app-confirmed-tag">
                          <UIcon name="check-circle" size={13} /> {t('restaurant.mealDelivered')}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Pending Orders Tab */}
      {activeTab === 'pending' && (
        <>
          {filteredOrders.length === 0 ? (
            <EmptyState icon="🥘" title={t('restaurant.noPending')} message={t('restaurant.noPendingMsg')} />
          ) : (
            <div className="app-orders-grid">
              {filteredOrders.map((need) => {
                const donationTotal = need.donations?.reduce((s, d) => s + parseFloat(d.amount || 0), 0) || 0;
                return (
                  <div key={need.id} className="app-order-card app-order-urgent">
                    <div className="app-order-inner">
                      {/* Header Row */}
                      <div className="app-order-header">
                        <span className="app-need-type">{need.type}</span>
                        <span className="app-time-badge app-time-urgent">
                          <UIcon name="clock" size={11} /> {timeAgo(need.lockedAt || need.createdAt, t)}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="app-order-desc">{need.description}</p>

                      {/* Progress bar */}
                      <div className="app-progress-bar">
                        <div className="app-progress-fill" style={{ width: '100%' }} />
                        <span className="app-progress-label">{t('restaurant.fullyFunded')}</span>
                      </div>

                      {/* Details */}
                      <div className="app-order-details">
                        <div className="app-detail-item">
                          <UIcon name="marker" size={13} />
                          <span>{need.neighborhood}</span>
                        </div>
                        <div className="app-detail-item">
                          <UIcon name="user" size={13} />
                          <span>{t('restaurant.validatedBy')} {need.validator?.name}</span>
                        </div>
                        <div className="app-detail-item">
                          <UIcon name="dollar" size={13} />
                          <span className="app-detail-amount">{parseFloat(need.estimatedAmount || 0).toLocaleString()} MRU</span>
                        </div>
                        {need.donations?.length > 0 && (
                          <div className="app-detail-item">
                            <UIcon name="box" size={13} />
                            <span>{need.donations.length} {t('restaurant.donations')} · {donationTotal.toLocaleString()} MRU</span>
                          </div>
                        )}
                      </div>

                      {/* Donor avatars */}
                      {need.donations?.length > 0 && (
                        <div className="app-donors-preview">
                          <span className="app-donors-label">{t('restaurant.fundedBy')}:</span>
                          <div className="app-app-avatars">
                            {need.donations.slice(0, 3).map((d) => (
                              <span key={d.id} className="app-app-avatar" title={d.donor?.name || 'Anonymous'}>
                                🤲
                              </span>
                            ))}
                            {need.donations.length > 3 && (
                              <span className="app-app-more">+{need.donations.length - 3}</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Confirm Action */}
                      <button
                        className="btn btn-primary app-confirm-btn"
                        onClick={() => handleConfirm(need.id)}
                        disabled={confirming === need.id}
                      >
                        {confirming === need.id
                          ? <span className="spinner" />
                          : <><UIcon name="check-circle" size={16} /> {t('restaurant.confirmMeal')}</>}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Completed Orders Tab */}
      {activeTab === 'completed' && (
        <>
          {filteredOrders.length === 0 ? (
            <EmptyState icon="✓" title={t('restaurant.noCompleted')} message={t('restaurant.noCompletedMsg')} />
          ) : (
            <div className="app-orders-grid">
              {filteredOrders.map((need) => {
                const donationTotal = need.donations?.reduce((s, d) => s + parseFloat(d.amount || 0), 0) || 0;
                return (
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
                          <span className="app-detail-amount">{parseFloat(need.estimatedAmount || 0).toLocaleString()} MRU</span>
                        </div>
                        <div className="app-detail-item">
                          <UIcon name="box" size={13} />
                          <span>{need.donations?.length || 0} {t('restaurant.donations')} · {donationTotal.toLocaleString()} MRU</span>
                        </div>
                        {need.donations?.length > 0 && need.donations.map((d) => (
                          <div key={d.id} className="app-detail-item app-detail-tx">
                            <UIcon name="hastag" size={11} />
                            <TransactionHash hash={d.transactionHash} />
                          </div>
                        ))}
                      </div>

                      {need.donations?.some(d => d.impactProof) && (
                        <div className="app-impact-proof">
                          <UIcon name="star" size={13} /> {t('restaurant.impactVerified')}
                        </div>
                      )}

                      <div className="app-confirmed-tag">
                        <UIcon name="check-circle" size={13} /> {t('restaurant.mealDelivered')}
                        {need.updatedAt && (
                          <span className="app-confirmed-date">
                            {new Date(need.updatedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

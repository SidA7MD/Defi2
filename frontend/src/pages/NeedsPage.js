import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { needService } from '../services';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LoadingSpinner, StatusBadge, EmptyState } from '../components/common';
import NeedsMap from '../components/common/NeedsMap';
import UIcon from '../components/common/UIcon';
import toast from 'react-hot-toast';
import './Pages.css';

export default function NeedsPage() {
  const [needs, setNeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', neighborhood: '', type: '' });
  const [showMap, setShowMap] = useState(true);
  const { isAuthenticated, user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const fetchNeeds = useCallback(async () => {
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.neighborhood) params.neighborhood = filters.neighborhood;
      if (filters.type) params.type = filters.type;

      const { data } = await needService.getAll(params);
      setNeeds(data.data || []);
    } catch (err) {
      toast.error(t('needs.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [filters, t]);

  useEffect(() => {
    fetchNeeds();
  }, [fetchNeeds]);

  const handleNeedClick = (need) => {
    if (need.status === 'OPEN' && isAuthenticated && (user?.role === 'DONOR' || user?.role === 'ADMIN')) {
      navigate(`/donate/${need.id}`);
    }
  };

  if (loading) return <LoadingSpinner size="lg" text={t('needs.loadingNeeds')} />;

  return (
    <div className="needs-page container">
      <div className="page-header">
        <h1 className="page-title">{t('needs.title')}</h1>
        <p className="page-subtitle">{t('needs.subtitle')}</p>
      </div>

      {/* Filters */}
      <div className="filters" style={{ background: 'white', padding: '1rem', borderRadius: 'var(--radius-2xl)', boxShadow: 'var(--shadow-card)', marginBottom: '1.75rem', border: '1px solid var(--border-color)' }}>
        <select
          className="form-select"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">{t('needs.allStatuses')}</option>
          <option value="OPEN">{t('needs.statusOpen')}</option>
          <option value="FUNDED">{t('needs.statusFunded')}</option>
          <option value="CONFIRMED">{t('needs.statusConfirmed')}</option>
        </select>
        <input
          className="form-input"
          placeholder={t('needs.filterNeighborhood')}
          value={filters.neighborhood}
          onChange={(e) => setFilters({ ...filters, neighborhood: e.target.value })}
        />
        <input
          className="form-input"
          placeholder={t('needs.filterType')}
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
        />
        <button
          className="btn btn-secondary"
          onClick={() => setShowMap(!showMap)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
        >
          <UIcon name="map" size={16} /> {showMap ? t('needs.hideMap') : t('needs.showMap')}
        </button>
      </div>

      {/* Map */}
      {showMap && (
        <div style={{ marginBottom: '2rem' }}>
          <NeedsMap needs={needs} onNeedClick={handleNeedClick} height={window.innerWidth <= 768 ? '280px' : '420px'} />
        </div>
      )}

      {/* Needs grid */}
      {needs.length === 0 ? (
        <EmptyState
          icon="—"
          title={t('needs.noNeeds')}
          message={t('needs.noNeedsMsg')}
        />
      ) : (
        <div className="grid grid-3">
          {needs.map((need) => (
            <div
              key={need.id}
              className="card need-card"
              onClick={() => handleNeedClick(need)}
              role={need.status === 'OPEN' ? 'button' : undefined}
              tabIndex={need.status === 'OPEN' ? 0 : undefined}
            >
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span className="need-type">{need.type}</span>
                  <StatusBadge status={need.status} />
                </div>
                <p className="need-desc">{need.description}</p>
                <div className="need-meta">
                  <span><UIcon name="map-marker" size={16} /> {need.neighborhood}</span>
                  {need.validator && <span><UIcon name="shield-check" size={13} /> {need.validator.name}</span>}
                  {need.restaurant && <span><UIcon name="restaurant" size={13} /> {need.restaurant.name}</span>}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span className="need-amount">{need.estimatedAmount?.toLocaleString()} MRU</span>
                  {need.status === 'OPEN' && isAuthenticated && (user?.role === 'DONOR' || user?.role === 'ADMIN') && (
                    <span className="btn btn-primary btn-sm">{t('needs.donate')}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

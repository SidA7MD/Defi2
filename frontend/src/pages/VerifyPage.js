import React, { useState } from 'react';
import { donationService } from '../services';
import { useLanguage } from '../context/LanguageContext';
import { LoadingSpinner, StatusBadge, TransactionHash } from '../components/common';
import UIcon from '../components/common/UIcon';
import toast from 'react-hot-toast';
import './Pages.css';

export default function VerifyPage() {
  const { t } = useLanguage();
  const [hash, setHash] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!hash.trim()) return;

    setLoading(true);
    setResult(null);
    setSearched(true);

    try {
      const { data } = await donationService.verify(hash.trim());
      setResult(data.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setResult(null);
        toast.error(t('verify.txNotFound'));
      } else {
        toast.error(t('verify.verifyFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container verify-container">
      <div className="page-header" style={{ textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', background: 'var(--primary-50)', color: 'var(--primary-700)', marginBottom: '1rem' }}>
          <UIcon name="shield" size={28} />
        </div>
        <h1 className="page-title">{t('verify.title')}</h1>
        <p className="page-subtitle">{t('verify.subtitle')}</p>
      </div>

      <form onSubmit={handleVerify} style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', position: 'relative', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <UIcon name="search" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              className="form-input"
              value={hash}
              onChange={(e) => setHash(e.target.value)}
              placeholder={t('verify.placeholder')}
              style={{ fontFamily: 'monospace', fontSize: '0.85rem', paddingLeft: '40px' }}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading || !hash.trim()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
            {loading ? <span className="spinner" /> : <><UIcon name="search" size={16} /> {t('verify.verifyBtn')}</>}
          </button>
        </div>
      </form>

      {loading && <LoadingSpinner text={t('verify.verifying')} />}

      {!loading && searched && !result && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '50%', background: '#FEF2F2', color: 'var(--error)', marginBottom: '1rem' }}>
            <UIcon name="cross-circle" size={28} />
          </div>
          <h3 style={{ color: 'var(--error)', marginBottom: '0.5rem' }}>{t('verify.notFound')}</h3>
          <p style={{ color: 'var(--text-secondary)' }}>{t('verify.notFoundMsg')}</p>
        </div>
      )}

      {result && (
        <div className="card fade-in">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {result.verified ? <UIcon name="check-circle" style={{ color: 'var(--success)' }} /> : <UIcon name="clock" style={{ color: 'var(--warning)' }} />}
              {result.verified ? t('verify.verified') : t('verify.pendingVerification')}
            </h3>
            <StatusBadge status={result.transaction.status} />
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div className="receipt-row">
                <span className="receipt-label">{t('verify.transactionId')}</span>
                <span className="receipt-value" style={{ fontSize: '0.75rem' }}>{result.transaction.id}</span>
              </div>
              <div className="receipt-row">
                <span className="receipt-label">{t('verify.amount')}</span>
                <span className="receipt-value" style={{ fontWeight: 700, color: 'var(--primary-700)' }}>
                  {result.transaction.amount?.toLocaleString()} MRU
                </span>
              </div>
              <div className="receipt-row">
                <span className="receipt-label">{t('verify.sha256')}</span>
                <span className="receipt-value">
                  <TransactionHash hash={result.transaction.transactionHash} short={false} />
                </span>
              </div>
              <div className="receipt-row">
                <span className="receipt-label">{t('verify.status')}</span>
                <span className="receipt-value">{result.transaction.status}</span>
              </div>
              <div className="receipt-row">
                <span className="receipt-label">{t('verify.immutable')}</span>
                <span className="receipt-value">{result.transaction.immutable ? t('verify.immutableYes') : t('verify.immutableNo')}</span>
              </div>
              <div className="receipt-row">
                <span className="receipt-label">{t('verify.created')}</span>
                <span className="receipt-value">{new Date(result.transaction.createdAt).toLocaleString()}</span>
              </div>
              {result.transaction.confirmedAt && (
                <div className="receipt-row">
                  <span className="receipt-label">{t('verify.confirmedAt')}</span>
                  <span className="receipt-value">{new Date(result.transaction.confirmedAt).toLocaleString()}</span>
                </div>
              )}
              {result.transaction.need && (
                <>
                  <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />
                  <div className="receipt-row">
                    <span className="receipt-label">{t('verify.needType')}</span>
                    <span className="receipt-value">{result.transaction.need.type}</span>
                  </div>
                  <div className="receipt-row">
                    <span className="receipt-label">{t('verify.description')}</span>
                    <span className="receipt-value">{result.transaction.need.description}</span>
                  </div>
                  <div className="receipt-row">
                    <span className="receipt-label">{t('verify.neighborhood')}</span>
                    <span className="receipt-value">{result.transaction.need.neighborhood}</span>
                  </div>
                </>
              )}
              {result.transaction.impactProof && (
                <>
                  <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />
                  <div style={{ background: 'var(--primary-50)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontWeight: 600, color: 'var(--primary-800)', marginBottom: '0.5rem' }}>
                      <UIcon name="check-circle" size={14} /> {t('verify.impactProof')}
                    </div>
                    <p style={{ fontSize: '0.9rem' }}>{result.transaction.impactProof.confirmationMessage}</p>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      {t('verify.confirmedAt')}: {new Date(result.transaction.impactProof.confirmedAt).toLocaleString()}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

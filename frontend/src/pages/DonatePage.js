import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { needService, donationService, walletService } from '../services';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LoadingSpinner, StatusBadge, TransactionHash } from '../components/common';
import UIcon from '../components/common/UIcon';
import toast from 'react-hot-toast';
import './Pages.css';

function StepIndicator({ current }) {
  const steps = ['review', 'paying', 'receipt'];
  const labels = ['①', '②', '③'];
  return (
    <div className="donate-steps">
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <div className={`donate-step ${current === s ? 'active' : ''} ${steps.indexOf(current) > i ? 'completed' : ''}`}>
            <span className="donate-step-dot">
              {steps.indexOf(current) > i ? <UIcon name="check" size={14} /> : labels[i]}
            </span>
          </div>
          {i < steps.length - 1 && (
            <span className={`donate-step-line ${steps.indexOf(current) > i ? 'active' : ''}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function DonatePage() {
  const { needId } = useParams();
  useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [need, setNeed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [, setDonating] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [step, setStep] = useState('review');
  const [walletBalance, setWalletBalance] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [needRes, walletRes] = await Promise.all([
          needService.getById(needId),
          walletService.getBalance(),
        ]);
        setNeed(needRes.data.data);
        setWalletBalance(walletRes.data.data.balance);
      } catch (err) {
        toast.error(t('donate.needNotFound'));
        navigate('/needs');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [needId, navigate, t]);

  const handleDonate = async () => {
    if (!need || need.status !== 'OPEN') return;

    setDonating(true);
    setStep('paying');

    await new Promise((r) => setTimeout(r, 2000));

    try {
      const { data } = await donationService.create({
        needId: need.id,
        amount: need.estimatedAmount,
      });

      setReceipt(data.data.receipt);
      setStep('receipt');
      toast.success(t('donate.donationSuccess'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('donate.donationFailed'));
      setStep('review');
    } finally {
      setDonating(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" text={t('donate.loadingNeed')} />;

  if (!need) return null;

  return (
    <div className="container donate-container">
      {step === 'review' && (
        <div className="fade-in">
          <StepIndicator current="review" />
          <div className="page-header" style={{ textAlign: 'center' }}>
            <h1 className="page-title">{t('donate.confirmTitle')}</h1>
            <p className="page-subtitle">{t('donate.reviewSubtitle')}</p>
          </div>

          <div className="card">
            <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span className="need-type">{need.type}</span>
                <StatusBadge status={need.status} />
              </div>

              <h3 style={{ marginBottom: '0.75rem' }}>{need.description}</h3>

              <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.25rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{t('donate.neighborhood')}</span>
                  <span>{need.neighborhood}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.25rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{t('donate.validatedBy')}</span>
                  <span>🛡️ {need.validator?.name} ({t('common.score')}: {need.validator?.reputationScore})</span>
                </div>
                {need.restaurant && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.25rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{t('donate.restaurant')}</span>
                    <span>🥘 {need.restaurant.name}</span>
                  </div>
                )}
                <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '0.5rem 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: '1rem' }}>{t('donate.totalAmount')}</span>
                  <span className="need-amount">{need.estimatedAmount?.toLocaleString()} MRU</span>
                </div>

                {/* Wallet balance info */}
                <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '0.5rem 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>🪙 {t('donate.walletBalance')}</span>
                  <span style={{ fontWeight: 600, color: walletBalance >= need.estimatedAmount ? 'var(--success)' : 'var(--danger, #e53e3e)' }}>
                    {walletBalance != null ? `${walletBalance.toLocaleString()} MRU` : '—'}
                  </span>
                </div>
                {walletBalance != null && walletBalance < need.estimatedAmount && (
                  <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--danger-light, #fff5f5)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: 'var(--danger, #e53e3e)', textAlign: 'center' }}>
                    ⚠️ {t('donate.insufficientBalance')}
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ marginLeft: '0.5rem', marginTop: '0.25rem' }}
                      onClick={() => navigate('/wallet')}
                    >
                      {t('donate.goToWallet')}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="card-footer" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" onClick={() => navigate('/needs')}>
                {t('donate.cancel')}
              </button>
              <button
                className="btn btn-primary btn-block"
                onClick={handleDonate}
                disabled={need.status !== 'OPEN' || (walletBalance != null && walletBalance < need.estimatedAmount)}
              >
                🪙 {t('donate.pay')} {need.estimatedAmount?.toLocaleString()} MRU
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'paying' && (
        <div className="fade-in" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <StepIndicator current="paying" />
          <div className="spinner spinner-lg" style={{ marginBottom: '1.5rem' }} />
          <h2 style={{ marginBottom: '0.5rem' }}>{t('donate.processingTitle')}</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            {t('donate.processingDesc')}
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
            {typeof t('donate.processingWait') === 'function'
              ? t('donate.processingWait')(need.estimatedAmount?.toLocaleString())
              : `${t('donate.processingWait')} ${need.estimatedAmount?.toLocaleString()} MRU`}
          </p>
        </div>
      )}

      {step === 'receipt' && receipt && (
        <div className="fade-in">
          <StepIndicator current="receipt" />
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✓</div>
            <h2 style={{ color: 'var(--success)' }}>{t('donate.successTitle')}</h2>
            <p style={{ color: 'var(--text-secondary)' }}>{t('donate.successDesc')}</p>
          </div>

          <div className="receipt">
            <div className="receipt-header">
              <h3>☪ {t('donate.receiptTitle')}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{t('donate.receiptSubtitle')}</p>
            </div>

            <div className="receipt-row">
              <span className="receipt-label">{t('donate.transactionId')}</span>
              <span className="receipt-value" style={{ fontSize: '0.75rem' }}>{receipt.transactionId}</span>
            </div>
            <div className="receipt-row">
              <span className="receipt-label">{t('donate.amount')}</span>
              <span className="receipt-value" style={{ fontWeight: 700, color: 'var(--primary-700)' }}>
                {receipt.amount?.toLocaleString()} MRU
              </span>
            </div>
            <div className="receipt-row">
              <span className="receipt-label">{t('donate.description')}</span>
              <span className="receipt-value">{receipt.needDescription}</span>
            </div>
            <div className="receipt-row">
              <span className="receipt-label">{t('donate.neighborhood')}</span>
              <span className="receipt-value">{receipt.neighborhood}</span>
            </div>
            <div className="receipt-row">
              <span className="receipt-label">{t('donate.timestamp')}</span>
              <span className="receipt-value">{new Date(receipt.timestamp).toLocaleString()}</span>
            </div>
            <div className="receipt-row">
              <span className="receipt-label">{t('donate.sha256')}</span>
              <span className="receipt-value">
                <TransactionHash hash={receipt.transactionHash} short={false} />
              </span>
            </div>

            <div style={{ marginTop: '1.5rem', padding: '0.75rem', background: 'var(--primary-50)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--primary-800)' }}>
              {t('donate.proofNotice')}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary btn-block" onClick={() => navigate('/donor')}>
              {t('donate.myDonations')}
            </button>
            <button className="btn btn-primary btn-block" onClick={() => navigate('/needs')}>
              {t('donate.browseMore')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

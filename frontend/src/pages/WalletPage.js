import React, { useState, useEffect, useCallback } from 'react';
import { walletService } from '../services';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LoadingSpinner } from '../components/common';
import { useSocket } from '../hooks/useSocket';
import UIcon from '../components/common/UIcon';
import toast from 'react-hot-toast';
import './Pages.css';

/* ─── Constants ─── */
const DEPOSIT_PRESETS = [500, 1000, 2000, 5000, 10000];
const WITHDRAW_PRESETS = [500, 1000, 2000, 5000];

/* ─── Saved cards (localStorage simulation) ─── */
function getSavedCards() {
  try { return JSON.parse(localStorage.getItem('ihsan_cards') || '[]'); } catch { return []; }
}
function saveCards(cards) { localStorage.setItem('ihsan_cards', JSON.stringify(cards)); }

/* ─── Helpers ─── */
function timeAgo(date, t) {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('wallet.justNow');
  if (mins < 60) { const fn = t('wallet.minsAgo'); return typeof fn === 'function' ? fn(mins) : `${mins}m`; }
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) { const fn = t('wallet.hrsAgo'); return typeof fn === 'function' ? fn(hrs) : `${hrs}h`; }
  const days = Math.floor(hrs / 24);
  const fn = t('wallet.daysAgo');
  return typeof fn === 'function' ? fn(days) : `${days}d`;
}

function cardBrand(num) {
  const d = (num || '').replace(/\s/g, '');
  if (/^4/.test(d)) return 'Visa';
  if (/^5[1-5]/.test(d)) return 'Mastercard';
  if (/^3[47]/.test(d)) return 'Amex';
  return 'Card';
}

function brandIcon(brand) {
  return <UIcon name="credit-card" size={16} />;
}

function TransactionIcon({ type }) {
  switch (type) {
    case 'DEPOSIT': return <UIcon name="arrow-small-down" />;
    case 'DONATION': return <UIcon name="heart" />;
    case 'DONATION_RECEIVED': return <UIcon name="arrow-small-down" />;
    case 'WITHDRAWAL': return <UIcon name="arrow-small-up" />;
    case 'BONUS': return <UIcon name="gift" />;
    case 'REWARD': return <UIcon name="chart-line-up" />;
    default: return <UIcon name="dollar" />;
  }
}

function txColor(type) {
  switch (type) {
    case 'DEPOSIT': case 'BONUS': case 'REWARD': case 'DONATION_RECEIVED': return 'var(--success)';
    case 'DONATION': case 'WITHDRAWAL': return 'var(--primary-700)';
    default: return 'var(--text-primary)';
  }
}

function txBg(type) {
  switch (type) {
    case 'DEPOSIT': case 'BONUS': case 'REWARD': case 'DONATION_RECEIVED': return 'var(--success-light, #e8f5e9)';
    case 'DONATION': return 'var(--primary-50)';
    case 'WITHDRAWAL': return '#fff3e0';
    default: return 'var(--bg-secondary)';
  }
}

/* ─────────────────────────────────────────── */
/*  MAIN COMPONENT                             */
/* ─────────────────────────────────────────── */
export default function WalletPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const role = user?.role || '';
  const canDeposit = ['DONOR', 'VALIDATOR'].includes(role);
  const canWithdraw = ['DONOR', 'VALIDATOR', 'RESTAURANT'].includes(role);

  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  /* ── Deposit flow state ── */
  const [depositStep, setDepositStep] = useState('idle'); // idle | amount | card | processing | done
  const [depositAmount, setDepositAmount] = useState('');
  const [customDeposit, setCustomDeposit] = useState('');
  const [depositing, setDepositing] = useState(false);
  const [depositCard, setDepositCard] = useState({ number: '', expiry: '', cvc: '', holder: '' });
  const [selectedSavedCard, setSelectedSavedCard] = useState(null);

  /* ── Withdraw flow state ── */
  const [withdrawStep, setWithdrawStep] = useState('idle'); // idle | method | details | processing
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [customWithdraw, setCustomWithdraw] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawMethod, setWithdrawMethod] = useState(''); // bank | card | mobile
  const [withdrawDetails, setWithdrawDetails] = useState({ bankName: '', iban: '', accountHolder: '', cardNumber: '', phone: '' });

  /* ── Saved cards ── */
  const [cards, setCards] = useState(getSavedCards);

  /* ─── Fetch ─── */
  const fetchWallet = useCallback(async () => {
    try {
      const { data } = await walletService.getWallet();
      setWallet(data.data);
    } catch { toast.error(t('wallet.loadFailed')); }
    finally { setLoading(false); }
  }, [t]);

  useEffect(() => { fetchWallet(); }, [fetchWallet]);

  /* ─── Sockets ─── */
  useSocket('wallet:updated', (data) => {
    setWallet((p) => p ? { ...p, balance: data.balance } : p);
    fetchWallet();
  });
  useSocket('wallet:bonus', (data) => {
    toast.success(`${t('wallet.bonusReceived')}: ${data.amount.toLocaleString()} MRU`);
    fetchWallet();
  });

  /* ──────────────── DEPOSIT FLOW ──────────────── */
  const startDeposit = () => { setDepositStep('amount'); setDepositAmount(''); setCustomDeposit(''); };

  const goToDepositCard = () => {
    const amt = parseFloat(depositAmount || customDeposit);
    if (!amt || amt <= 0) { toast.error(t('wallet.invalidAmount')); return; }
    // If user has saved cards, pre-select the default one
    const defaultCard = cards.find(c => c.isDefault) || cards[0];
    if (defaultCard) setSelectedSavedCard(defaultCard.id);
    else setSelectedSavedCard(null);
    setDepositCard({ number: '', expiry: '', cvc: '', holder: '' });
    setDepositStep('card');
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount || customDeposit);
    // Validate card
    if (!selectedSavedCard) {
      const clean = depositCard.number.replace(/\s/g, '');
      if (clean.length < 13 || !depositCard.expiry || !depositCard.cvc || !depositCard.holder.trim()) {
        toast.error(t('wallet.invalidCard')); return;
      }
    }
    setDepositing(true);
    setDepositStep('processing');
    try {
      // Simulate card processing delay
      await new Promise(r => setTimeout(r, 1500));
      const { data } = await walletService.deposit({ amount, description: t('wallet.depositDesc') });
      setWallet((p) => p ? {
        ...p, balance: data.data.balance,
        transactions: [data.data.transaction, ...(p.transactions || [])],
      } : p);

      // Save new card if entered manually and user wants
      if (!selectedSavedCard) {
        const clean = depositCard.number.replace(/\s/g, '');
        const newCard = {
          id: Date.now().toString(),
          last4: clean.slice(-4),
          brand: cardBrand(depositCard.number),
          expiry: depositCard.expiry,
          holder: depositCard.holder.trim(),
          isDefault: cards.length === 0,
        };
        const updated = [...cards, newCard];
        setCards(updated); saveCards(updated);
      }

      setDepositStep('idle');
      toast.success(t('wallet.depositSuccess'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('wallet.depositFailed'));
      setDepositStep('card');
    } finally { setDepositing(false); }
  };

  const cancelDeposit = () => { setDepositStep('idle'); setDepositAmount(''); setCustomDeposit(''); };

  /* ──────────────── WITHDRAW FLOW ──────────────── */
  const startWithdraw = () => { setWithdrawStep('method'); setWithdrawMethod(''); setWithdrawAmount(''); setCustomWithdraw(''); };

  const goToWithdrawDetails = () => {
    if (!withdrawMethod) { toast.error(t('wallet.selectMethod')); return; }
    setWithdrawDetails({ bankName: '', iban: '', accountHolder: '', cardNumber: '', phone: '' });
    setWithdrawStep('details');
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount || customWithdraw);
    if (!amount || amount <= 0) { toast.error(t('wallet.invalidAmount')); return; }
    // Validate destination details
    if (withdrawMethod === 'bank' && (!withdrawDetails.iban || !withdrawDetails.accountHolder)) {
      toast.error(t('wallet.fillWithdrawDetails')); return;
    }
    if (withdrawMethod === 'card' && !withdrawDetails.cardNumber) {
      toast.error(t('wallet.fillWithdrawDetails')); return;
    }
    if (withdrawMethod === 'mobile' && !withdrawDetails.phone) {
      toast.error(t('wallet.fillWithdrawDetails')); return;
    }

    setWithdrawing(true);
    setWithdrawStep('processing');
    try {
      await new Promise(r => setTimeout(r, 1500));
      const desc = withdrawMethod === 'bank'
        ? `${t('wallet.toBankAccount')} (${withdrawDetails.iban.slice(-4)})`
        : withdrawMethod === 'card'
          ? `${t('wallet.toCard')} (****${withdrawDetails.cardNumber.replace(/\s/g, '').slice(-4)})`
          : `${t('wallet.toMobile')} (${withdrawDetails.phone})`;

      const { data } = await walletService.withdraw({ amount, description: desc });
      setWallet((p) => p ? {
        ...p, balance: data.data.balance,
        transactions: [data.data.transaction, ...(p.transactions || [])],
      } : p);
      setWithdrawStep('idle');
      toast.success(t('wallet.withdrawSuccess'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('wallet.withdrawFailed'));
      setWithdrawStep('details');
    } finally { setWithdrawing(false); }
  };

  const cancelWithdraw = () => { setWithdrawStep('idle'); };

  /* ── Card management ── */
  const handleRemoveCard = (id) => {
    const updated = cards.filter(c => c.id !== id);
    if (updated.length > 0 && !updated.some(c => c.isDefault)) updated[0].isDefault = true;
    setCards(updated); saveCards(updated);
    toast.success(t('wallet.cardRemoved'));
  };
  const handleSetDefault = (id) => {
    const updated = cards.map(c => ({ ...c, isDefault: c.id === id }));
    setCards(updated); saveCards(updated);
  };

  /* ─── Computed ─── */
  const filteredTx = (wallet?.transactions || []).filter((tx) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'RECEIVED') return tx.type === 'DONATION_RECEIVED';
    return tx.type === activeTab;
  });
  const totalIn = (wallet?.transactions || []).filter(tx => tx.amount > 0).reduce((s, tx) => s + tx.amount, 0);
  const totalOut = (wallet?.transactions || []).filter(tx => tx.amount < 0).reduce((s, tx) => s + Math.abs(tx.amount), 0);
  const finalDepositAmt = parseFloat(depositAmount || customDeposit) || 0;
  const finalWithdrawAmt = parseFloat(withdrawAmount || customWithdraw) || 0;

  if (loading) return <LoadingSpinner size="lg" text={t('wallet.loading')} />;

  return (
    <div className="wallet-page">
      {/* ===== Balance Hero ===== */}
      <div className="wallet-balance-card">
        <div className="wallet-balance-bg">
          <div className="wallet-balance-icon"><UIcon name="coin" variant="sr" size={28} color="#eab308" /></div>
          <p className="wallet-balance-label">{t('wallet.currentBalance')}</p>
          <h2 className="wallet-balance-amount">
            {(wallet?.balance || 0).toLocaleString()} <span className="wallet-balance-currency">MRU</span>
          </h2>
          <p className="wallet-balance-note">{t('wallet.virtualCurrency')}</p>
        </div>
        <div className="wallet-mini-stats">
          <div className="wallet-mini-stat">
            <UIcon name="arrow-small-down" className="wallet-mini-icon wallet-mini-in" />
            <div>
              <div className="wallet-mini-value">+{totalIn.toLocaleString()}</div>
              <div className="wallet-mini-label">{t('wallet.tabDeposits')}</div>
            </div>
          </div>
          <div className="wallet-mini-divider" />
          <div className="wallet-mini-stat">
            <UIcon name="arrow-small-up" className="wallet-mini-icon wallet-mini-out" />
            <div>
              <div className="wallet-mini-value">-{totalOut.toLocaleString()}</div>
              <div className="wallet-mini-label">{t('wallet.tabDonations')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Action Buttons (when idle) ===== */}
      {depositStep === 'idle' && withdrawStep === 'idle' && (canDeposit || canWithdraw) && (
        <div className={`wallet-actions-grid ${!canDeposit || !canWithdraw ? 'wallet-actions-single' : ''}`}>
          {canDeposit && (
            <button className="wallet-big-action wallet-big-deposit" onClick={startDeposit}>
              <div className="wallet-big-action-icon"><UIcon name="plus" /></div>
              <div>
                <div className="wallet-big-action-title">{t('wallet.addFunds')}</div>
                <div className="wallet-big-action-desc">{t('wallet.depositViaCard')}</div>
              </div>
            </button>
          )}
          {canWithdraw && (
            <button className="wallet-big-action wallet-big-withdraw" onClick={startWithdraw}>
              <div className="wallet-big-action-icon"><UIcon name="minus" /></div>
              <div>
                <div className="wallet-big-action-title">{t('wallet.withdrawFunds')}</div>
                <div className="wallet-big-action-desc">{t('wallet.withdrawChoose')}</div>
              </div>
            </button>
          )}
        </div>
      )}

      {/* Restaurant-only info banner */}
      {role === 'RESTAURANT' && depositStep === 'idle' && withdrawStep === 'idle' && (
        <div className="wallet-role-banner wallet-role-restaurant">
          <span className="wallet-role-banner-icon"><UIcon name="restaurant" size={20} /></span>
          <div>
            <strong>{t('wallet.restaurantNotice')}</strong>
            <p>{t('wallet.restaurantNoticeDesc')}</p>
          </div>
        </div>
      )}

      {/* ═══════════════ DEPOSIT FLOW ═══════════════ */}
      {canDeposit && depositStep !== 'idle' && (
        <div className="wallet-flow-card fade-in">
          <div className="wallet-flow-header">
            <div className="wallet-flow-title-row">
              <UIcon name="plus" className="wallet-section-icon wallet-icon-deposit" />
              <h3 className="wallet-section-title">{t('wallet.addFunds')}</h3>
            </div>
            <button className="wallet-flow-close" onClick={cancelDeposit}><UIcon name="cross" /></button>
          </div>

          {/* Step indicator */}
          <div className="wallet-steps">
            <div className={`wallet-step-dot ${depositStep === 'amount' ? 'active' : (depositStep !== 'amount' ? 'done' : '')}`}>1</div>
            <div className="wallet-step-line" />
            <div className={`wallet-step-dot ${depositStep === 'card' ? 'active' : depositStep === 'processing' ? 'done' : ''}`}>2</div>
            <div className="wallet-step-line" />
            <div className={`wallet-step-dot ${depositStep === 'processing' ? 'active' : ''}`}>3</div>
          </div>

          {/* Step 1: Amount */}
          {depositStep === 'amount' && (
            <div className="wallet-flow-body fade-in">
              <p className="wallet-flow-label">{t('wallet.howMuchDeposit')}</p>
              <div className="wallet-presets">
                {DEPOSIT_PRESETS.map((p) => (
                  <button key={p}
                    className={`wallet-preset-btn ${depositAmount === String(p) ? 'active' : ''}`}
                    onClick={() => { setDepositAmount(String(p)); setCustomDeposit(''); }}
                  >
                    {p.toLocaleString()} MRU
                  </button>
                ))}
              </div>
              <div className="wallet-flow-or">{t('wallet.orEnterAmount')}</div>
              <input type="number" className="form-input" min="1"
                placeholder={t('wallet.customAmount')} value={customDeposit}
                onChange={(e) => { setCustomDeposit(e.target.value); setDepositAmount(''); }}
              />
              <button className="btn btn-primary btn-block wallet-flow-next"
                disabled={!depositAmount && !customDeposit}
                onClick={goToDepositCard}
              >
                {t('wallet.continue')} →
              </button>
            </div>
          )}

          {/* Step 2: Card info */}
          {depositStep === 'card' && (
            <div className="wallet-flow-body fade-in">
              <div className="wallet-flow-amount-badge">
                {t('wallet.depositOf')} <strong>{finalDepositAmt.toLocaleString()} MRU</strong>
              </div>

              {/* Saved cards */}
              {cards.length > 0 && (
                <div className="wallet-saved-cards">
                  <p className="wallet-flow-label">{t('wallet.useSavedCard')}</p>
                  {cards.map((card) => (
                    <label key={card.id} className={`wallet-saved-card-option ${selectedSavedCard === card.id ? 'selected' : ''}`}>
                      <input type="radio" name="savedCard"
                        checked={selectedSavedCard === card.id}
                        onChange={() => setSelectedSavedCard(card.id)}
                      />
                      <span className="wallet-saved-card-radio" />
                      <UIcon name="credit-card" />
                      <span className="wallet-saved-card-label">
                        {card.brand} •••• {card.last4}
                      </span>
                      <span className="wallet-saved-card-exp">{card.expiry}</span>
                    </label>
                  ))}
                  <label className={`wallet-saved-card-option ${selectedSavedCard === null ? 'selected' : ''}`}>
                    <input type="radio" name="savedCard"
                      checked={selectedSavedCard === null}
                      onChange={() => setSelectedSavedCard(null)}
                    />
                    <span className="wallet-saved-card-radio" />
                    <UIcon name="plus" />
                    <span className="wallet-saved-card-label">{t('wallet.useNewCard')}</span>
                  </label>
                </div>
              )}

              {/* New card form — shown if no saved card selected */}
              {selectedSavedCard === null && (
                <div className="wallet-card-form fade-in">
                  <p className="wallet-flow-label">{t('wallet.enterCardInfo')}</p>
                  <div className="wallet-card-form-grid">
                    <div className="form-group">
                      <label className="form-label">{t('wallet.cardNumber')}</label>
                      <input className="form-input" placeholder="4242 4242 4242 4242"
                        value={depositCard.number} maxLength={19}
                        onChange={(e) => {
                          let v = e.target.value.replace(/\D/g, '').slice(0, 16);
                          v = v.replace(/(.{4})/g, '$1 ').trim();
                          setDepositCard({ ...depositCard, number: v });
                        }}
                      />
                    </div>
                    <div className="wallet-card-row-2">
                      <div className="form-group">
                        <label className="form-label">{t('wallet.cardExpiry')}</label>
                        <input className="form-input" placeholder="MM/YY"
                          value={depositCard.expiry} maxLength={5}
                          onChange={(e) => {
                            let v = e.target.value.replace(/\D/g, '').slice(0, 4);
                            if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
                            setDepositCard({ ...depositCard, expiry: v });
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">{t('wallet.cardCvc')}</label>
                        <input className="form-input" placeholder="123"
                          value={depositCard.cvc} maxLength={4} type="password"
                          onChange={(e) => setDepositCard({ ...depositCard, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t('wallet.cardHolder')}</label>
                      <input className="form-input" placeholder={t('wallet.cardHolderPlaceholder')}
                        value={depositCard.holder}
                        onChange={(e) => setDepositCard({ ...depositCard, holder: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="wallet-test-notice">
                <UIcon name="lock" /> {t('wallet.testCardNotice')}
              </div>

              <div className="wallet-flow-actions">
                <button className="btn btn-secondary" onClick={() => setDepositStep('amount')}>
                  ← {t('wallet.back')}
                </button>
                <button className="btn btn-primary wallet-flow-pay-btn" onClick={handleDeposit} disabled={depositing}>
                  <UIcon name="lock" /> {t('wallet.payNow')} {finalDepositAmt.toLocaleString()} MRU
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Processing */}
          {depositStep === 'processing' && (
            <div className="wallet-flow-body wallet-flow-processing fade-in">
              <div className="spinner spinner-lg" />
              <h4>{t('wallet.processingPayment')}</h4>
              <p>{t('wallet.pleaseWait')}</p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ WITHDRAW FLOW ═══════════════ */}
      {canWithdraw && withdrawStep !== 'idle' && (
        <div className="wallet-flow-card fade-in">
          <div className="wallet-flow-header">
            <div className="wallet-flow-title-row">
              <UIcon name="paper-plane" className="wallet-section-icon wallet-icon-withdraw" />
              <h3 className="wallet-section-title">{t('wallet.withdrawFunds')}</h3>
            </div>
            <button className="wallet-flow-close" onClick={cancelWithdraw}><UIcon name="cross" /></button>
          </div>

          {/* Step 1: Choose method */}
          {withdrawStep === 'method' && (
            <div className="wallet-flow-body fade-in">
              <p className="wallet-flow-label">{t('wallet.whereToSend')}</p>

              <div className="wallet-method-grid">
                <button
                  className={`wallet-method-btn ${withdrawMethod === 'bank' ? 'active' : ''}`}
                  onClick={() => setWithdrawMethod('bank')}
                >
                  <span className="wallet-method-icon"><UIcon name="building" size={20} /></span>
                  <span className="wallet-method-name">{t('wallet.bankTransfer')}</span>
                  <span className="wallet-method-desc">{t('wallet.bankDesc')}</span>
                </button>
                <button
                  className={`wallet-method-btn ${withdrawMethod === 'card' ? 'active' : ''}`}
                  onClick={() => setWithdrawMethod('card')}
                >
                  <span className="wallet-method-icon"><UIcon name="credit-card" size={20} /></span>
                  <span className="wallet-method-name">{t('wallet.toCardMethod')}</span>
                  <span className="wallet-method-desc">{t('wallet.cardDesc')}</span>
                </button>
                <button
                  className={`wallet-method-btn ${withdrawMethod === 'mobile' ? 'active' : ''}`}
                  onClick={() => setWithdrawMethod('mobile')}
                >
                  <span className="wallet-method-icon"><UIcon name="mobile-notch" size={20} /></span>
                  <span className="wallet-method-name">{t('wallet.mobileMoney')}</span>
                  <span className="wallet-method-desc">{t('wallet.mobileDesc')}</span>
                </button>
              </div>

              <button className="btn btn-primary btn-block wallet-flow-next"
                disabled={!withdrawMethod}
                onClick={goToWithdrawDetails}
              >
                {t('wallet.continue')} →
              </button>
            </div>
          )}

          {/* Step 2: Details + amount */}
          {withdrawStep === 'details' && (
            <div className="wallet-flow-body fade-in">
              <p className="wallet-flow-label">{t('wallet.howMuchWithdraw')}</p>

              <div className="wallet-presets">
                {WITHDRAW_PRESETS.filter(p => p <= (wallet?.balance || 0)).map((p) => (
                  <button key={p}
                    className={`wallet-preset-btn wallet-preset-withdraw ${withdrawAmount === String(p) ? 'active' : ''}`}
                    onClick={() => { setWithdrawAmount(String(p)); setCustomWithdraw(''); }}
                  >
                    {p.toLocaleString()} MRU
                  </button>
                ))}
              </div>

              <input type="number" className="form-input" min="1"
                max={wallet?.balance || 0}
                placeholder={t('wallet.customAmount')}
                value={customWithdraw}
                onChange={(e) => { setCustomWithdraw(e.target.value); setWithdrawAmount(''); }}
              />

              <div className="wallet-flow-divider" />

              {/* Destination form - Bank */}
              {withdrawMethod === 'bank' && (
                <div className="wallet-card-form-grid fade-in">
                  <div className="form-group">
                    <label className="form-label">{t('wallet.accountHolder')}</label>
                    <input className="form-input" placeholder={t('wallet.fullName')}
                      value={withdrawDetails.accountHolder}
                      onChange={(e) => setWithdrawDetails({ ...withdrawDetails, accountHolder: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('wallet.bankName')}</label>
                    <input className="form-input" placeholder={t('wallet.bankNamePlaceholder')}
                      value={withdrawDetails.bankName}
                      onChange={(e) => setWithdrawDetails({ ...withdrawDetails, bankName: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('wallet.iban')}</label>
                    <input className="form-input" placeholder="MR00 0000 0000 0000 0000 000"
                      value={withdrawDetails.iban}
                      onChange={(e) => setWithdrawDetails({ ...withdrawDetails, iban: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* Destination form - Card */}
              {withdrawMethod === 'card' && (
                <div className="wallet-card-form-grid fade-in">
                  <div className="form-group">
                    <label className="form-label">{t('wallet.cardNumber')}</label>
                    <input className="form-input" placeholder="4242 4242 4242 4242"
                      value={withdrawDetails.cardNumber} maxLength={19}
                      onChange={(e) => {
                        let v = e.target.value.replace(/\D/g, '').slice(0, 16);
                        v = v.replace(/(.{4})/g, '$1 ').trim();
                        setWithdrawDetails({ ...withdrawDetails, cardNumber: v });
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Destination form - Mobile */}
              {withdrawMethod === 'mobile' && (
                <div className="wallet-card-form-grid fade-in">
                  <div className="form-group">
                    <label className="form-label">{t('wallet.phoneNumber')}</label>
                    <input className="form-input" placeholder="+222 XX XX XX XX" type="tel"
                      value={withdrawDetails.phone}
                      onChange={(e) => setWithdrawDetails({ ...withdrawDetails, phone: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className="wallet-test-notice">
                <UIcon name="exclamation" /> {t('wallet.testCardNotice')}
              </div>

              <div className="wallet-flow-actions">
                <button className="btn btn-secondary" onClick={() => setWithdrawStep('method')}>
                  ← {t('wallet.back')}
                </button>
                <button className="btn btn-primary wallet-flow-pay-btn" onClick={handleWithdraw}
                  disabled={withdrawing || (!withdrawAmount && !customWithdraw)}
                >
                  <UIcon name="paper-plane" /> {t('wallet.withdrawBtn')} {finalWithdrawAmt > 0 ? `${finalWithdrawAmt.toLocaleString()} MRU` : ''}
                </button>
              </div>
            </div>
          )}

          {/* Processing */}
          {withdrawStep === 'processing' && (
            <div className="wallet-flow-body wallet-flow-processing fade-in">
              <div className="spinner spinner-lg" />
              <h4>{t('wallet.processingWithdrawal')}</h4>
              <p>{t('wallet.pleaseWait')}</p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ SAVED CARDS ═══════════════ */}
      {canDeposit && cards.length > 0 && depositStep === 'idle' && withdrawStep === 'idle' && (
        <div className="wallet-section-card">
          <div className="wallet-section-header">
            <UIcon name="credit-card" className="wallet-section-icon wallet-icon-card" />
            <h3 className="wallet-section-title">{t('wallet.savedCards')}</h3>
          </div>
          <div className="wallet-cards-list">
            {cards.map((card) => (
              <div key={card.id} className={`wallet-card-item ${card.isDefault ? 'wallet-card-default' : ''}`}>
                <div className="wallet-card-chip">
                  {brandIcon(card.brand)}
                </div>
                <div className="wallet-card-info">
                  <div className="wallet-card-brand">{card.brand} •••• {card.last4}</div>
                  <div className="wallet-card-holder">{card.holder} · {card.expiry}</div>
                </div>
                <div className="wallet-card-actions">
                  {card.isDefault ? (
                    <span className="wallet-card-badge"><UIcon name="star" /> {t('wallet.defaultCard')}</span>
                  ) : (
                    <button className="btn btn-sm btn-ghost" onClick={() => handleSetDefault(card.id)}>{t('wallet.setDefault')}</button>
                  )}
                  <button className="btn btn-sm btn-ghost wallet-card-remove" onClick={() => handleRemoveCard(card.id)}>
                    <UIcon name="trash" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════ TRANSACTION HISTORY ═══════════════ */}
      <div className="wallet-section-card">
        <div className="wallet-section-header">
          <UIcon name="clock" className="wallet-section-icon wallet-icon-history" />
          <h3 className="wallet-section-title">{t('wallet.transactionHistory')}</h3>
        </div>
        <div className="wallet-tx-tabs">
          {[
            { key: 'all', label: t('wallet.tabAll') },
            { key: 'DEPOSIT', label: t('wallet.tabDeposits') },
            { key: 'DONATION', label: t('wallet.tabDonations') },
            { key: 'WITHDRAWAL', label: t('wallet.tabWithdrawals') },
            { key: 'RECEIVED', label: t('wallet.tabReceived') },
            { key: 'BONUS', label: t('wallet.tabBonuses') },
          ].map((tab) => (
            <button key={tab.key}
              className={`wallet-tx-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >{tab.label}</button>
          ))}
        </div>
        {filteredTx.length === 0 ? (
          <div className="wallet-empty-tx">
            <UIcon name="clock" size={28} />
            <p>{t('wallet.noTransactions')}</p>
            <p className="wallet-empty-tx-hint">{t('wallet.noTransactionsMsg')}</p>
          </div>
        ) : (
          <div className="wallet-tx-list">
            {filteredTx.map((tx) => (
              <div key={tx.id} className="wallet-tx-item">
                <div className="wallet-tx-icon" style={{ background: txBg(tx.type), color: txColor(tx.type) }}>
                  <TransactionIcon type={tx.type} />
                </div>
                <div className="wallet-tx-details">
                  <div className="wallet-tx-type">{t(`wallet.type_${tx.type}`) || tx.type}</div>
                  <div className="wallet-tx-desc">{tx.description}</div>
                </div>
                <div className="wallet-tx-amount-col">
                  <div className="wallet-tx-amount" style={{ color: tx.amount > 0 ? 'var(--success)' : 'var(--primary-700)' }}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} MRU
                  </div>
                  <div className="wallet-tx-time">{timeAgo(tx.createdAt, t)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

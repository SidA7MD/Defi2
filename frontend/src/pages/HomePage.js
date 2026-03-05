import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import UIcon from '../components/common/UIcon';
import { donationService } from '../services';
import './Pages.css';

function AnimatedCounter({ end, duration = 2000, suffix = '' }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (end === 0) return;
    let startTime = null;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [end, duration]);

  return <>{count.toLocaleString()}{suffix}</>;
}

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState({ total: 0, totalAmount: 0, confirmed: 0 });

  useEffect(() => {
    donationService.getDashboard()
      .then(({ data }) => {
        const txs = data.data || [];
        const confirmed = txs.filter((t) => t.status === 'CONFIRMED');
        const totalAmount = txs.reduce((sum, t) => sum + (t.amount || 0), 0);
        setStats({ total: txs.length, confirmed: confirmed.length, totalAmount });
      })
      .catch(() => {});
  }, []);

  return (
    <div className="home-page">
      {/* ===== HERO ===== */}
      <section className="hero">
        {/* Geometric decorations */}
        <div className="hero-decoration">
          <div className="geo" />
          <div className="geo" />
          <div className="geo" />
          <div className="geo" />
        </div>

        {/* Ramadan lanterns */}
        <div className="hero-lanterns" aria-hidden="true">
          <div className="lantern lantern-1">
            <div className="lantern-chain" />
            <div className="lantern-body">
              <div className="lantern-cap" />
              <div className="lantern-glass" />
              <div className="lantern-glow" />
              <div className="lantern-base" />
            </div>
          </div>
          <div className="lantern lantern-2">
            <div className="lantern-chain" />
            <div className="lantern-body">
              <div className="lantern-cap" />
              <div className="lantern-glass" />
              <div className="lantern-glow" />
              <div className="lantern-base" />
            </div>
          </div>
          <div className="lantern lantern-3">
            <div className="lantern-chain" />
            <div className="lantern-body">
              <div className="lantern-cap" />
              <div className="lantern-glass" />
              <div className="lantern-glow" />
              <div className="lantern-base" />
            </div>
          </div>
        </div>

        {/* Floating crescent moons */}
        <div className="hero-moons" aria-hidden="true">
          <span className="floating-moon moon-1"><UIcon name="moon" variant="sr" /></span>
          <span className="floating-moon moon-2"><UIcon name="moon" variant="sr" /></span>
          <span className="floating-moon moon-3"><UIcon name="moon" variant="sr" /></span>
          <span className="floating-moon moon-4"><UIcon name="moon" variant="sr" /></span>
          <span className="floating-moon moon-5"><UIcon name="moon" variant="sr" /></span>
        </div>

        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="live-dot" />
              {t('home.heroSubtitle')}
            </div>

            <h1 className="hero-title">
              <span className="hero-icon"><UIcon name="moon-stars" variant="sr" /></span>
              {t('appName')} <span className="hero-arabic">{t('appNameArabic')}</span>
            </h1>

            <p className="hero-subtitle">
              {t('home.heroSubtitle')}
            </p>

            <p className="hero-desc">
              {t('home.heroDesc')}
            </p>

            <div className="hero-actions">
              {isAuthenticated ? (
                <>
                  <Link to="/needs" className="btn btn-primary btn-lg">
                    <UIcon name="heart" /> {t('home.browseNeeds')}
                  </Link>
                  <Link to="/dashboard" className="btn btn-secondary btn-lg">
                    <UIcon name="pulse" /> {t('home.liveDashboard')}
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/register" className="btn btn-primary btn-lg">
                    {t('home.getStarted')} <UIcon name="arrow-right" />
                  </Link>
                  <Link to="/dashboard" className="btn btn-secondary btn-lg">
                    <UIcon name="eye" /> {t('home.viewDashboard')}
                  </Link>
                </>
              )}
            </div>

            {/* Live Stats */}
            <div className="hero-stats">
              <div className="hero-stat">
                <div className="hero-stat-value">
                  <AnimatedCounter end={stats.total} />
                </div>
                <div className="hero-stat-label">{t('dashboard.totalTransactions')}</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-value">
                  <AnimatedCounter end={stats.confirmed} />
                </div>
                <div className="hero-stat-label">{t('dashboard.confirmed')}</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-value">
                  <AnimatedCounter end={stats.totalAmount} suffix=" MRU" />
                </div>
                <div className="hero-stat-label">{t('dashboard.totalMru')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave separator */}
        <div className="hero-wave">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0 32L48 37.3C96 43 192 53 288 58.7C384 64 480 64 576 56C672 48 768 32 864 26.7C960 21 1056 27 1152 32C1248 37 1344 43 1392 45.3L1440 48V80H1392C1344 80 1248 80 1152 80C1056 80 960 80 864 80C768 80 672 80 576 80C480 80 384 80 288 80C192 80 96 80 48 80H0V32Z" fill="var(--bg-secondary)"/>
          </svg>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="how-it-works container" style={{ position: 'relative' }}>
        <span className="section-moon section-moon-left" aria-hidden="true"><UIcon name="moon" variant="sr" /></span>
        <span className="section-moon section-moon-right" aria-hidden="true"><UIcon name="moon" variant="sr" /></span>
        <div className="section-header">
          <span className="section-label">✦ {t('home.howItWorks')}</span>
          <h2 className="section-title">{t('home.howItWorks')}</h2>
          <p className="section-desc">{t('home.heroDesc')}</p>
        </div>

        <div className="grid grid-3">
          <div className="feature-card">
            <div className="feature-icon-wrapper green">◯</div>
            <h3>{t('home.targetedDonations')}</h3>
            <p>{t('home.targetedDesc')}</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-wrapper gold"><UIcon name="lock" /></div>
            <h3>{t('home.privacyPreserved')}</h3>
            <p>{t('home.privacyDesc')}</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-wrapper blue"><UIcon name="check-circle" /></div>
            <h3>{t('home.verifiedImpact')}</h3>
            <p>{t('home.verifiedDesc')}</p>
          </div>
        </div>
      </section>

      {/* ===== TRUST ARCHITECTURE ===== */}
      <section className="trust-section">
        <div className="container">
          <div className="section-header">
            <span className="section-label">✦ {t('home.trustArchitecture')}</span>
            <h2 className="section-title">{t('home.trustArchitecture')}</h2>
          </div>

          <div className="trust-flow">
            <div className="trust-step">
              <div className="step-number">1</div>
              <div className="step-icon"><UIcon name="shield" size={32} /></div>
              <h4>{t('home.step1Title')}</h4>
              <p>{t('home.step1Desc')}</p>
            </div>
            <div className="trust-arrow">→</div>
            <div className="trust-step">
              <div className="step-number">2</div>
              <div className="step-icon"><UIcon name="heart" size={32} /></div>
              <h4>{t('home.step2Title')}</h4>
              <p>{t('home.step2Desc')}</p>
            </div>
            <div className="trust-arrow">→</div>
            <div className="trust-step">
              <div className="step-number">3</div>
              <div className="step-icon"><UIcon name="restaurant" size={32} /></div>
              <h4>{t('home.step3Title')}</h4>
              <p>{t('home.step3Desc')}</p>
            </div>
            <div className="trust-arrow">→</div>
            <div className="trust-step">
              <div className="step-number">4</div>
              <div className="step-icon"><UIcon name="eye" size={32} /></div>
              <h4>{t('home.step4Title')}</h4>
              <p>{t('home.step4Desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="cta-section">
        <div className="cta-lanterns" aria-hidden="true">
          <div className="cta-lantern cta-lantern-left"><UIcon name="building" size={28} /></div>
          <div className="cta-lantern cta-lantern-right"><UIcon name="building" size={28} /></div>
        </div>
        <div className="container">
          <h2>{t('home.ctaTitle')}</h2>
          <p>{t('home.ctaDesc')}</p>
          {!isAuthenticated && (
            <Link to="/register" className="btn btn-accent btn-xl">
              {t('home.createAccount')} <UIcon name="arrow-right" />
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}

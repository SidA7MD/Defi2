import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import UIcon from '../common/UIcon';
import './Layout.css';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          {/* Brand column */}
          <div>
            <div className="footer-brand">
              <span className="footer-brand-icon"><UIcon name="moon-stars" variant="sr" /></span>
              <span>{t('appName')}</span>
              <span style={{ fontSize: '0.875rem', color: 'var(--primary-500)', fontWeight: 500 }}>
                {t('appNameArabic')}
              </span>
            </div>
            <p className="footer-desc">
              {t('home.heroDesc')}
            </p>
          </div>

          {/* Platform links */}
          <div className="footer-section">
            <h4>{t('nav.dashboard')}</h4>
            <div className="footer-links-list">
              <Link to="/dashboard"><UIcon name="pulse" size={14} /> {t('footer.dashboard')}</Link>
              <Link to="/verify"><UIcon name="search" size={14} /> {t('footer.verify')}</Link>
              <Link to="/needs"><UIcon name="heart" size={14} /> {t('nav.needs')}</Link>
            </div>
          </div>

          {/* Roles */}
          <div className="footer-section">
            <h4>{t('register.role')}</h4>
            <div className="footer-links-list">
              <Link to="/register"><UIcon name="heart" size={14} /> {t('register.roleDonor')}</Link>
              <Link to="/register"><UIcon name="shield" size={14} /> {t('register.roleValidator')}</Link>
              <Link to="/register"><UIcon name="restaurant" size={14} /> {t('register.roleRestaurant')}</Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="footer-bottom">
          <div className="footer-text">
            {t('footer.text')}
          </div>
          <div className="footer-bottom-links">
            <Link to="/dashboard">{t('footer.dashboard')}</Link>
            <Link to="/verify">{t('footer.verify')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

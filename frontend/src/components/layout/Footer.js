import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import UIcon from '../common/UIcon';
import './Layout.css';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="footer footer-compact">
      <div className="container">
        <div className="footer-compact-content">
          {/* Brand */}
          <div className="footer-compact-brand">
            <UIcon name="moon-stars" variant="sr" size={16} color="#f59e0b" />
            <span>{t('appName')}</span>
          </div>

          {/* Links */}
          <div className="footer-compact-links">
            <Link to="/dashboard">{t('footer.dashboard')}</Link>
            <Link to="/needs">{t('nav.needs')}</Link>
            <Link to="/verify">{t('footer.verify')}</Link>
          </div>

          {/* Copyright */}
          <div className="footer-compact-copy">
            {t('footer.text')}
          </div>
        </div>
      </div>
    </footer>
  );
}

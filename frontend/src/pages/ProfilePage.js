import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import UIcon from '../components/common/UIcon';
import './Pages.css';

export default function ProfilePage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  if (!user) return null;

  return (
    <div className="container profile-container">
      <div className="page-header">
        <h1 className="page-title">{t('profile.title')}</h1>
      </div>

      <div className="card" style={{ overflow: 'visible' }}>
        {/* Profile header with gradient */}
        <div style={{
          background: 'linear-gradient(160deg, var(--primary-900), var(--primary-700))',
          padding: '2rem 1.5rem 2.5rem',
          textAlign: 'center',
          position: 'relative',
          borderRadius: 'var(--radius-2xl) var(--radius-2xl) 0 0',
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent-400), var(--accent-500))',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            fontWeight: 800,
            margin: '0 auto 0.75rem',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            border: '3px solid rgba(255,255,255,0.3)',
          }}>
            {user.name?.charAt(0)?.toUpperCase()}
          </div>
          <h2 style={{ fontSize: '1.375rem', color: 'white', fontWeight: 800 }}>{user.name}</h2>
          <span className={`role-badge role-${user.role?.toLowerCase()}`} style={{ fontSize: '0.75rem', padding: '0.3rem 0.875rem', marginTop: '0.5rem', display: 'inline-block' }}>
            {user.role}
          </span>
        </div>

        <div className="card-body">
          <div style={{ display: 'grid', gap: '1.125rem' }}>
            <div className="receipt-row">
              <span className="receipt-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><UIcon name="envelope" size={14} /> {t('profile.email')}</span>
              <span className="receipt-value">{user.email}</span>
            </div>
            <div className="receipt-row">
              <span className="receipt-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><UIcon name="shield" size={14} /> {t('profile.role')}</span>
              <span className="receipt-value">{user.role}</span>
            </div>
            {user.role === 'VALIDATOR' && (
              <div className="receipt-row">
                <span className="receipt-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><UIcon name="star" size={14} /> {t('profile.reputationScore')}</span>
                <span className="receipt-value" style={{ color: 'var(--accent-600)', fontWeight: 700 }}>⭐ {user.reputationScore || 0}</span>
              </div>
            )}
            <div className="receipt-row">
              <span className="receipt-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><UIcon name="hastag" size={14} /> {t('profile.userId')}</span>
              <span className="receipt-value" style={{ fontSize: '0.7rem', fontFamily: 'monospace' }}>{user.id}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

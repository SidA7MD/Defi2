import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import UIcon from '../components/common/UIcon';
import './Pages.css';

const roleConfig = {
  DONOR: { icon: 'hand-holding-heart', color: 'var(--info)', bg: 'var(--info-light)' },
  VALIDATOR: { icon: 'star', color: 'var(--success)', bg: 'var(--success-light)' },
  RESTAURANT: { icon: 'restaurant', color: 'var(--warning)', bg: 'var(--warning-light)' },
  ADMIN: { icon: 'shield', color: '#7C3AED', bg: '#F3E8FF' },
};

export default function ProfilePage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  if (!user) return null;

  const rc = roleConfig[user.role] || roleConfig.DONOR;

  return (
    <div className="container profile-container">
      {/* Profile Card */}
      <div className="app-profile-details">
        {/* Header with gradient */}
        <div className="app-profile-details-header">
          <div className="app-profile-details-avatar">
            {user.name?.charAt(0)?.toUpperCase()}
          </div>
          <h2 className="app-profile-details-name">{user.name}</h2>
          <span
            className="app-profile-details-role"
            style={{ background: rc.bg, color: rc.color }}
          >
            <UIcon name={rc.icon} size={11} /> {user.role}
          </span>
        </div>

        {/* Details body */}
        <div className="app-profile-details-body">
          <div className="app-profile-detail-row">
            <span className="app-profile-detail-label">
              <UIcon name="envelope" size={15} color="var(--primary-500)" /> {t('profile.email')}
            </span>
            <span className="app-profile-detail-value">{user.email}</span>
          </div>

          <div className="app-profile-detail-row">
            <span className="app-profile-detail-label">
              <UIcon name="shield" size={15} color="var(--primary-500)" /> {t('profile.role')}
            </span>
            <span className="app-profile-detail-value">
              <span
                className={`role-badge role-${user.role?.toLowerCase()}`}
                style={{ fontSize: '0.7rem', padding: '0.25rem 0.75rem' }}
              >
                {user.role}
              </span>
            </span>
          </div>

          {user.role === 'VALIDATOR' && (
            <div className="app-profile-detail-row">
              <span className="app-profile-detail-label">
                <UIcon name="star" size={15} color="var(--accent-500)" /> {t('profile.reputationScore')}
              </span>
              <span className="app-profile-detail-value app-profile-detail-highlight">
                <UIcon name="star" variant="sr" size={13} color="var(--accent-500)" /> {user.reputationScore || 0}
              </span>
            </div>
          )}

          <div className="app-profile-detail-row">
            <span className="app-profile-detail-label">
              <UIcon name="hastag" size={15} color="var(--primary-500)" /> {t('profile.userId')}
            </span>
            <span className="app-profile-detail-value app-profile-detail-mono">
              {user.id}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

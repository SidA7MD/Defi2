import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { authService } from '../services';
import UIcon from '../components/common/UIcon';
import toast from 'react-hot-toast';
import './Pages.css';

const roleConfig = {
  DONOR: { icon: 'hand-holding-heart', color: 'var(--info)' },
  VALIDATOR: { icon: 'shield-check', color: 'var(--success)' },
  RESTAURANT: { icon: 'restaurant', color: 'var(--warning)' },
  ADMIN: { icon: 'pulse', color: '#7c3aed' },
};

const activityIcons = {
  LOGIN: 'sign-in',
  REGISTER: 'user-plus',
  UPDATE_PROFILE: 'edit',
  UPDATE_SETTINGS: 'settings',
  CHANGE_PASSWORD: 'lock',
  CREATE_NEED: 'plus-circle',
  FUND_NEED: 'hand-holding-heart',
  CONFIRM_DONATION: 'check-circle',
  VIEW_DONATION: 'eye',
  DEPOSIT: 'wallet',
  WITHDRAW: 'angle-down',
};

const activityLabels = {
  LOGIN: 'Connexion',
  REGISTER: 'Inscription',
  UPDATE_PROFILE: 'Profil mis à jour',
  UPDATE_SETTINGS: 'Paramètres modifiés',
  CHANGE_PASSWORD: 'Mot de passe changé',
  CREATE_NEED: 'Besoin créé',
  FUND_NEED: 'Don effectué',
  CONFIRM_DONATION: 'Don confirmé',
  VIEW_DONATION: 'Don consulté',
  DEPOSIT: 'Dépôt',
  WITHDRAW: 'Retrait',
};

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState('activity');
  const [emailNotifications, setEmailNotifications] = useState(user?.emailNotifications ?? true);
  const [pushNotifications, setPushNotifications] = useState(user?.pushNotifications ?? false);
  const [saving, setSaving] = useState(false);

  // Activities state
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  // Edit profile modal state
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editNeighborhood, setEditNeighborhood] = useState(user?.neighborhood || '');

  // Change password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Fetch activities
  const fetchActivities = useCallback(async () => {
    setLoadingActivities(true);
    try {
      const response = await authService.getActivities(30);
      setActivities(response.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    } finally {
      setLoadingActivities(false);
    }
  }, []);

  // Load activities when tab changes
  useEffect(() => {
    if (activeTab === 'activity') {
      fetchActivities();
    }
  }, [activeTab, fetchActivities]);

  // Sync settings from user on mount
  useEffect(() => {
    if (user) {
      setEmailNotifications(user.emailNotifications ?? true);
      setPushNotifications(user.pushNotifications ?? false);
      setEditName(user.name || '');
      setEditNeighborhood(user.neighborhood || '');
    }
  }, [user]);

  // Handle settings toggle
  const handleSettingsToggle = useCallback(async (field, value) => {
    setSaving(true);
    try {
      await authService.updateSettings({ [field]: value });
      if (refreshUser) await refreshUser();
      toast.success(t('profile.settingsSaved'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('profile.settingsFailed'));
      // Revert on error
      if (field === 'emailNotifications') setEmailNotifications(!value);
      if (field === 'pushNotifications') setPushNotifications(!value);
    } finally {
      setSaving(false);
    }
  }, [t, refreshUser]);

  const toggleEmailNotifications = () => {
    const newValue = !emailNotifications;
    setEmailNotifications(newValue);
    handleSettingsToggle('emailNotifications', newValue);
  };

  const togglePushNotifications = () => {
    const newValue = !pushNotifications;
    setPushNotifications(newValue);
    handleSettingsToggle('pushNotifications', newValue);
  };

  // Handle language change
  const handleLanguageChange = async (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    try {
      await authService.updateSettings({ language: newLang });
      if (refreshUser) await refreshUser();
    } catch (err) {
      console.error('Failed to save language preference:', err);
    }
  };

  // Handle profile update
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authService.updateProfile({ name: editName, neighborhood: editNeighborhood });
      if (refreshUser) await refreshUser();
      setShowEditProfile(false);
      toast.success(t('profile.profileUpdated'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('profile.updateFailed'));
    } finally {
      setSaving(false);
    }
  };

  // Handle password change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error(t('profile.passwordMismatch'));
      return;
    }
    if (newPassword.length < 8) {
      toast.error(t('profile.passwordTooShort'));
      return;
    }
    setChangingPassword(true);
    try {
      await authService.changePassword({ currentPassword, newPassword });
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success(t('profile.passwordChanged'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('profile.passwordChangeFailed'));
    } finally {
      setChangingPassword(false);
    }
  };

  if (!user) return null;

  const rc = roleConfig[user.role] || roleConfig.DONOR;
  const roleLower = user.role?.toLowerCase();

  return (
    <div className="profile-page-wrapper fade-in">
      {/* Cover Banner */}
      <div className={`profile-cover-banner role-${roleLower}`}>
        <div className="profile-cover-content">
          <div className="profile-cover-info">
            <h2 className="profile-cover-name">{user.name}</h2>
            <p className="profile-cover-role">
              <UIcon name={rc.icon} size={14} /> {user.role}
            </p>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="profile-content-grid">

        {/* Left Column: Sidebar Profile Detail */}
        <div className={`profile-sidebar-card role-${roleLower}`}>
          <div className="profile-avatar-large">
            {user.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <h2 className="profile-name-large">{user.name}</h2>

          <div className="profile-role-badge-wrapper">
            <span className={`role-badge role-${roleLower}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <UIcon name={rc.icon} size={11} /> {user.role}
            </span>
          </div>

          <div className="profile-sidebar-details">
            <div className="profile-detail-item">
              <UIcon name="envelope" size={15} />
              <span>{user.email || t('profile.noEmail')}</span>
            </div>

            <div className="profile-detail-item">
              <UIcon name="marker" size={15} />
              <span>{user.neighborhood || t('profile.global')}</span>
            </div>

            <div className="profile-detail-item">
              <UIcon name="calendar" size={15} />
              <span>{t('profile.memberSince')} {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '2024'}</span>
            </div>

            <div className="profile-detail-item">
              <UIcon name="hastag" size={15} />
              <span className="hash-text">{user.id?.slice(0, 16)}...</span>
            </div>

            {user.role === 'VALIDATOR' && (
              <div className="profile-detail-item">
                <UIcon name="star" size={15} />
                <span>{t('profile.reputation')}: <strong>{user.reputationScore || 0}</strong></span>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="profile-quick-actions">
            <button 
              className="btn btn-secondary btn-sm" 
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              onClick={() => setShowEditProfile(true)}
            >
              <UIcon name="edit" size={14} /> {t('profile.editProfile')}
            </button>
          </div>
        </div>

        {/* Right Column: Main Content (Tabs) */}
        <div className="profile-main-area">
          <div className="profile-tabs">
            <button
              className={`profile-tab ${activeTab === 'activity' ? 'active' : ''}`}
              onClick={() => setActiveTab('activity')}
            >
              <UIcon name="pulse" size={16} /> {t('profile.tabActivity')}
            </button>
            <button
              className={`profile-tab ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <UIcon name="settings" size={16} /> {t('profile.tabSettings')}
            </button>
          </div>

          {activeTab === 'activity' && (
            <div className="fade-in">
              {loadingActivities ? (
                <div className="profile-activity-loading">
                  <div className="spinner"></div>
                  <p>{t('common.loading')}</p>
                </div>
              ) : activities.length === 0 ? (
                <div className="profile-activity-empty">
                  <UIcon name="pulse" size={48} />
                  <h4>{t('profile.noActivity')}</h4>
                  <p>{t('profile.noActivityDesc')}</p>
                </div>
              ) : (
                <div className="activity-list">
                  {activities.map((activity) => (
                    <div key={activity.id} className="activity-item">
                      <div className="activity-icon">
                        <UIcon name={activityIcons[activity.action] || 'pulse'} size={18} />
                      </div>
                      <div className="activity-content">
                        <div className="activity-title">
                          {activityLabels[activity.action] || activity.action}
                        </div>
                        <div className="activity-meta">
                          <span className="activity-entity">{activity.entityType}</span>
                          <span className="activity-time">
                            {new Date(activity.createdAt).toLocaleDateString()} {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="fade-in">
              <div className="settings-section">
                <h3 className="settings-section-title"><UIcon name="bell" /> {t('profile.notifications')}</h3>
                <div className="settings-row">
                  <div className="settings-row-info">
                    <h4>{t('profile.emailAlerts')}</h4>
                    <p>{t('profile.emailAlertsDesc')}</p>
                  </div>
                  <div 
                    className={`toggle-switch ${emailNotifications ? 'on' : ''} ${saving ? 'disabled' : ''}`} 
                    onClick={!saving ? toggleEmailNotifications : undefined}
                  ></div>
                </div>
                <div className="settings-row">
                  <div className="settings-row-info">
                    <h4>{t('profile.pushNotifications')}</h4>
                    <p>{t('profile.pushNotificationsDesc')}</p>
                  </div>
                  <div 
                    className={`toggle-switch ${pushNotifications ? 'on' : ''} ${saving ? 'disabled' : ''}`} 
                    onClick={!saving ? togglePushNotifications : undefined}
                  ></div>
                </div>
              </div>

              <div className="settings-section">
                <h3 className="settings-section-title"><UIcon name="lock" /> {t('profile.security')}</h3>
                <div className="settings-row">
                  <div className="settings-row-info">
                    <h4>{t('profile.changePassword')}</h4>
                    <p>{t('profile.passwordDesc')}</p>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowPasswordModal(true)}>
                    {t('profile.update')}
                  </button>
                </div>
                <div className="settings-row">
                  <div className="settings-row-info">
                    <h4>{t('profile.twoFactor')}</h4>
                    <p>{t('profile.twoFactorDesc')}</p>
                  </div>
                  <button className="btn btn-secondary btn-sm" disabled>
                    {user.twoFactorEnabled ? t('profile.disable') : t('profile.enable')}
                  </button>
                </div>
              </div>

              <div className="settings-section">
                <h3 className="settings-section-title"><UIcon name="globe" /> {t('profile.preferences')}</h3>
                <div className="settings-row">
                  <div className="settings-row-info">
                    <h4>{t('profile.language')}</h4>
                    <p>{t('profile.languageDesc')}</p>
                  </div>
                  <select 
                    className="form-select" 
                    style={{ width: 'auto', minWidth: '120px' }}
                    value={language}
                    onChange={handleLanguageChange}
                  >
                    <option value="fr">Français</option>
                    <option value="ar">العربية</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="modal-overlay" onClick={() => setShowEditProfile(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><UIcon name="edit" size={18} /> {t('profile.editProfile')}</h3>
              <button className="modal-close" onClick={() => setShowEditProfile(false)}>
                <UIcon name="cross" size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveProfile}>
              <div className="form-group">
                <label className="form-label">{t('profile.name')}</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editName} 
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('profile.neighborhoodLabel')}</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editNeighborhood} 
                  onChange={(e) => setEditNeighborhood(e.target.value)}
                  placeholder={t('profile.neighborhoodPlaceholder')}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditProfile(false)}>
                  {t('profile.cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? t('profile.saving') : t('profile.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><UIcon name="lock" size={18} /> {t('profile.changePassword')}</h3>
              <button className="modal-close" onClick={() => setShowPasswordModal(false)}>
                <UIcon name="cross" size={20} />
              </button>
            </div>
            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label className="form-label">{t('profile.currentPassword')}</label>
                <input 
                  type="password" 
                  className="form-input" 
                  value={currentPassword} 
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('profile.newPassword')}</label>
                <input 
                  type="password" 
                  className="form-input" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('profile.confirmPassword')}</label>
                <input 
                  type="password" 
                  className="form-input" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPasswordModal(false)}>
                  {t('profile.cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={changingPassword}>
                  {changingPassword ? t('profile.saving') : t('profile.changePassword')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

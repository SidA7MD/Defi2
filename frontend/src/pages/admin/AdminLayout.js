import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import UIcon from '../../components/common/UIcon';
import './Admin.css';

export default function AdminLayout() {
    const { user } = useAuth();
    const { t } = useLanguage();

    return (
        <div className="admin-container fade-in">
            {/* Unified Admin Header */}
            <div className="app-profile-header role-admin" style={{ marginBottom: '2rem' }}>
                <div className="app-profile-avatar"><UIcon name="shield" size={32} /></div>
                <div className="app-profile-info">
                    <h1 className="app-profile-name">{user?.name || 'Administrator'}</h1>
                    <div className="app-profile-meta">
                        <span><UIcon name="crown" size={13} /> {t('admin.title', 'Administrator')}</span>
                        <span><UIcon name="shield-check" size={13} /> {t('admin.subtitle', 'System Management')}</span>
                    </div>
                </div>
            </div>

            <div className="admin-content-area">
                <Outlet />
            </div>
        </div>
    );
}

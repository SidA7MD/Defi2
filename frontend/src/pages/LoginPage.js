import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import UIcon from '../components/common/UIcon';
import toast from 'react-hot-toast';
import './Pages.css';

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      const welcomeMsg = t('login.welcomeMsg');
      toast.success(typeof welcomeMsg === 'function' ? welcomeMsg(user.name) : `${welcomeMsg} ${user.name}`);
      const roleRoutes = {
        DONOR: '/needs',
        VALIDATOR: '/validator',
        RESTAURANT: '/restaurant',
        ADMIN: '/admin',
      };
      navigate(roleRoutes[user.role] || '/');
    } catch (err) {
      toast.error(err.response?.data?.message || t('login.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <div className="auth-header">
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem', filter: 'drop-shadow(0 2px 8px rgba(245,158,11,0.3))' }}><UIcon name="moon-stars" variant="sr" color="#f59e0b" /></div>
          <h2>{t('login.welcomeBack')}</h2>
          <p>{t('login.signInTo')}</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label"><UIcon name="envelope" size={14} style={{ marginRight: '0.375rem', verticalAlign: '-2px' }} />{t('login.email')}</label>
            <input
              type="email"
              className="form-input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder={t('login.emailPlaceholder')}
              required
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label className="form-label"><UIcon name="lock" size={14} style={{ marginRight: '0.375rem', verticalAlign: '-2px' }} />{t('login.password')}</label>
            <input
              type="password"
              className="form-input"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={t('login.passwordPlaceholder')}
              required
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? <span className="spinner" /> : <><UIcon name="sign-in-alt" size={18} /> {t('login.signIn')}</>}
          </button>
        </form>
        <div className="auth-footer">
          {t('login.noAccount')} <Link to="/register">{t('login.registerHere')}</Link>
        </div>

        {/* Demo credentials */}
        <div className="demo-credentials">
          <details>
            <summary className="demo-credentials-toggle">
              <UIcon name="key" size={14} /> {t('login.demoCredentials')}
            </summary>
            <div className="demo-credentials-body">
              <strong>{t('login.demoDonor')}:</strong> ali@donor.com / password123<br />
              <strong>{t('login.demoValidator')}:</strong> sidi@ihsan.org / password123<br />
              <strong>{t('login.demoRestaurant')}:</strong> albaraka@restaurant.com / password123<br />
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}

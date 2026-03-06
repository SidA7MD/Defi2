import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import UIcon from '../components/common/UIcon';
import toast from 'react-hot-toast';
import './Pages.css';

export default function RegisterPage() {
  const { register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'DONOR',
    restaurantName: '',
    neighborhood: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await register(form);
      const welcomeMsg = t('register.welcomeMsg');
      toast.success(typeof welcomeMsg === 'function' ? welcomeMsg(user.name) : `${welcomeMsg} ${user.name}`);
      const roleRoutes = {
        DONOR: '/needs',
        VALIDATOR: '/validator',
        RESTAURANT: '/restaurant',
        ADMIN: '/admin',
      };
      navigate(roleRoutes[user.role] || '/');
    } catch (err) {
      toast.error(err.response?.data?.message || t('register.registerFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <div className="auth-header">
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem', filter: 'drop-shadow(0 2px 8px rgba(245,158,11,0.3))' }}><UIcon name="moon-stars" variant="sr" /></div>
          <h2>{t('register.joinIhsan')}</h2>
          <p>{t('register.createAccountDesc')}</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t('register.fullName')}</label>
            <input
              type="text"
              className="form-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={t('register.namePlaceholder')}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">{t('register.email')}</label>
            <input
              type="email"
              className="form-input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder={t('register.emailPlaceholder')}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">{t('register.password')}</label>
            <input
              type="password"
              className="form-input"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={t('register.passwordPlaceholder')}
              required
              minLength={6}
            />
          </div>
          <div className="form-group">
            <label className="form-label">{t('register.role')}</label>
            <select
              className="form-select"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="DONOR">{t('register.roleDonor')}</option>
              <option value="VALIDATOR">{t('register.roleValidator')}</option>
              <option value="RESTAURANT">{t('register.roleRestaurant')}</option>
            </select>
          </div>

          {form.role === 'RESTAURANT' && (
            <>
              <div className="form-group">
                <label className="form-label">{t('register.restaurantName')}</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.restaurantName}
                  onChange={(e) => setForm({ ...form, restaurantName: e.target.value })}
                  placeholder={t('register.restaurantPlaceholder')}
                  required={form.role === 'RESTAURANT'}
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('register.neighborhood')}</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.neighborhood}
                  onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
                  placeholder={t('register.neighborhoodPlaceholder')}
                />
              </div>
            </>
          )}

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? <span className="spinner" /> : <><UIcon name="user-add" size={18} /> {t('register.createAccount')}</>}
          </button>
        </form>
        <div className="auth-footer">
          {t('register.hasAccount')} <Link to="/login">{t('register.signIn')}</Link>
        </div>
      </div>
    </div>
  );
}

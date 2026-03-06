import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { adminService } from '../../services';
import UIcon from '../common/UIcon';
import './Layout.css';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { t, toggleLanguage, lang } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch pending users count for admin badge
  const fetchPendingCount = useCallback(async () => {
    if (user?.role === 'ADMIN') {
      try {
        const res = await adminService.getPendingUsers();
        setPendingCount(res.data.data?.length || 0);
      } catch {
        // Silently fail
      }
    }
  }, [user?.role]);

  useEffect(() => {
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 30000);
    return () => clearInterval(interval);
  }, [fetchPendingCount]);

  // Admin sub-navigation links
  const adminSubLinks = [
    { to: '/admin', label: t('admin.navOverview'), icon: <UIcon name="pulse" size={15} />, exact: true },
    { to: '/admin/users', label: t('admin.navUsers'), icon: <UIcon name="users" size={15} />, badge: pendingCount || null },
    { to: '/admin/needs', label: t('admin.navNeeds'), icon: <UIcon name="heart" size={15} />, badge: null },
    { to: '/admin/donations', label: t('admin.navDonations'), icon: <UIcon name="dollar" size={15} /> },
    { to: '/admin/audit', label: t('admin.navAudit'), icon: <UIcon name="document" size={15} /> },
  ];

  const isAdminLinkActive = (link) => {
    if (link.exact) return location.pathname === link.to;
    return location.pathname.startsWith(link.to) && location.pathname !== '/admin';
  };

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  const allNavLinks = [
    { to: '/', label: t('nav.home'), icon: <UIcon name="home" />, show: 'guest' },
    { to: '/dashboard', label: t('nav.dashboard'), icon: <UIcon name="pulse" />, show: 'auth' },
    { to: '/needs', label: t('nav.needs'), icon: <UIcon name="heart" />, show: 'auth', hideRoles: ['RESTAURANT', 'ADMIN'] },
    { to: '/verify', label: t('nav.verify'), icon: <UIcon name="search" />, show: 'auth', hideRoles: ['ADMIN'] },
  ];

  const navLinks = allNavLinks.filter((link) => {
    if (link.show === 'auth' && !isAuthenticated) return false;
    if (link.show === 'guest' && isAuthenticated) return false;
    if (link.hideRoles && user && link.hideRoles.includes(user.role)) return false;
    return true;
  });

  const roleLinks = {
    DONOR: [
      { to: '/wallet', label: t('nav.wallet'), icon: <UIcon name="dollar" /> },
      { to: '/donor', label: t('nav.myDonations'), icon: <UIcon name="apps" /> },
    ],
    VALIDATOR: [
      { to: '/wallet', label: t('nav.wallet'), icon: <UIcon name="dollar" /> },
      { to: '/validator', label: t('nav.validatorPanel'), icon: <UIcon name="shield" /> },
    ],
    RESTAURANT: [
      { to: '/wallet', label: t('nav.wallet'), icon: <UIcon name="dollar" /> },
      { to: '/restaurant', label: t('nav.orders'), icon: <UIcon name="apps" /> },
    ],
    // Admin links are handled separately via adminSubLinks
    ADMIN: [],
  };

  const userLinks = user ? (roleLinks[user.role] || []) : [];

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <Link to="/" className="navbar-brand" onClick={() => setMobileOpen(false)}>
            <span className="brand-icon"><UIcon name="moon-stars" variant="sr" color="#f59e0b" /></span>
            <span className="brand-text">{t('appName')}</span>
            <span className="brand-arabic">{t('appNameArabic')}</span>
          </Link>

          {/* Desktop nav links */}
          <div className="navbar-links hide-mobile">
            {/* Admin users always see admin links */}
            {isAuthenticated && user?.role === 'ADMIN' ? (
              <>
                {adminSubLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`nav-link ${isAdminLinkActive(link) || (link.exact && location.pathname === link.to) ? 'active' : ''}`}
                  >
                    {link.icon}
                    <span>{link.label}</span>
                    {link.badge > 0 && <span className="nav-badge">{link.badge}</span>}
                  </Link>
                ))}
              </>
            ) : (
              <>
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`nav-link ${location.pathname === link.to ? 'active' : ''}`}
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </Link>
                ))}

                {isAuthenticated && userLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`nav-link ${location.pathname === link.to || location.pathname.startsWith(link.to + '/') ? 'active' : ''}`}
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </Link>
                ))}
              </>
            )}

            <div className="nav-divider" />

            <button className="lang-toggle" onClick={toggleLanguage} title={lang === 'fr' ? 'العربية' : 'Français'}>
              <UIcon name="globe" />
              <span>{t('lang.switch')}</span>
            </button>

            {isAuthenticated ? (
              <div className="nav-user">
                <Link to="/profile" className="nav-link">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary-100)', color: 'var(--primary-700)', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>
                    {user.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <span>{user.name}</span>
                  <span className={`role-badge role-${user.role.toLowerCase()}`}>
                    {user.role}
                  </span>
                </Link>
                <button className="nav-link logout-btn" onClick={handleLogout} title={t('nav.logout')}>
                  <UIcon name="sign-out-alt" />
                  <span>{t('nav.logout')}</span>
                </button>
              </div>
            ) : (
              <div className="nav-auth">
                <Link to="/login" className="btn btn-secondary btn-sm">
                  {t('nav.login')}
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="navbar-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <UIcon name="cross" size={24} /> : <UIcon name="menu-burger" size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu — rendered OUTSIDE navbar for proper z-index stacking */}
      {mobileOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMobileOpen(false)}>
          <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            {/* Navigation links */}
            <div className="mobile-menu-section">
              {/* Admin users always see admin links */}
              {isAuthenticated && user?.role === 'ADMIN' ? (
                <>
                  {adminSubLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={`mobile-nav-link ${isAdminLinkActive(link) || (link.exact && location.pathname === link.to) ? 'active' : ''}`}
                      onClick={() => setMobileOpen(false)}
                    >
                      <span className="mobile-nav-icon">{link.icon}</span>
                      <span>{link.label}</span>
                      {link.badge > 0 && <span className="nav-badge" style={{ marginLeft: 'auto' }}>{link.badge}</span>}
                    </Link>
                  ))}
                </>
              ) : (
                <>
                  {navLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={`mobile-nav-link ${location.pathname === link.to ? 'active' : ''}`}
                      onClick={() => setMobileOpen(false)}
                    >
                      <span className="mobile-nav-icon">{link.icon}</span>
                      <span>{link.label}</span>
                    </Link>
                  ))}

                  {isAuthenticated && userLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={`mobile-nav-link ${location.pathname === link.to || location.pathname.startsWith(link.to + '/') ? 'active' : ''}`}
                      onClick={() => setMobileOpen(false)}
                    >
                      <span className="mobile-nav-icon">{link.icon}</span>
                      <span>{link.label}</span>
                    </Link>
                  ))}
                </>
              )}
            </div>

            <div className="mobile-menu-divider" />

            {/* Language switcher */}
            <button className="mobile-lang-toggle" onClick={() => { toggleLanguage(); setMobileOpen(false); }}>
              <UIcon name="globe" />
              <span>{t('lang.switch')}</span>
            </button>

            <div className="mobile-menu-divider" />

            {/* Auth section */}
            {isAuthenticated ? (
              <div className="mobile-menu-section">
                <Link
                  to="/profile"
                  className="mobile-nav-link"
                  onClick={() => setMobileOpen(false)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-100)', color: 'var(--primary-700)', fontSize: '0.8rem', fontWeight: 700 }}>
                    {user.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{user.name}</div>
                    <span className={`role-badge role-${user.role.toLowerCase()}`} style={{ marginTop: '0.125rem' }}>
                      {user.role}
                    </span>
                  </div>
                </Link>
                <button className="mobile-nav-link mobile-logout" onClick={handleLogout}>
                  <span className="mobile-nav-icon"><UIcon name="sign-out-alt" /></span>
                  <span>{t('nav.logout')}</span>
                </button>
              </div>
            ) : (
              <div className="mobile-auth-buttons">
                <Link to="/login" className="btn btn-secondary btn-block" onClick={() => setMobileOpen(false)}>
                  {t('nav.login')}
                </Link>
                <Link to="/register" className="btn btn-primary btn-block" onClick={() => setMobileOpen(false)}>
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

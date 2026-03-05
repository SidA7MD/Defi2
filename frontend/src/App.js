import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import Layout from './components/layout/Layout';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NeedsPage from './pages/NeedsPage';
import DonatePage from './pages/DonatePage';
import DonorPage from './pages/DonorPage';
import ValidatorPage from './pages/ValidatorPage';
import RestaurantPage from './pages/RestaurantPage';
import DashboardPage from './pages/DashboardPage';
import VerifyPage from './pages/VerifyPage';
import ProfilePage from './pages/ProfilePage';
import WalletPage from './pages/WalletPage';

// Admin pages
import AdminLayout from './pages/admin/AdminLayout';
import AdminOverview from './pages/admin/AdminOverview';
import AdminUsers from './pages/admin/AdminUsers';
import AdminNeeds from './pages/admin/AdminNeeds';
import AdminDonations from './pages/admin/AdminDonations';
import AdminAudit from './pages/admin/AdminAudit';

import './styles/globals.css';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <Layout>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/needs" element={<NeedsPage />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/verify" element={<VerifyPage />} />

              {/* Protected: Donor */}
              <Route
                path="/donate/:needId"
                element={
                  <ProtectedRoute roles={['DONOR']}>
                    <DonatePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/donor"
                element={
                  <ProtectedRoute roles={['DONOR']}>
                    <DonorPage />
                  </ProtectedRoute>
                }
              />

              {/* Protected: Validator */}
              <Route
                path="/validator"
                element={
                  <ProtectedRoute roles={['VALIDATOR']}>
                    <ValidatorPage />
                  </ProtectedRoute>
                }
              />

              {/* Protected: Restaurant */}
              <Route
                path="/restaurant"
                element={
                  <ProtectedRoute roles={['RESTAURANT']}>
                    <RestaurantPage />
                  </ProtectedRoute>
                }
              />

              {/* Protected: Profile */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Protected: Wallet (DONOR, VALIDATOR, RESTAURANT — not ADMIN) */}
              <Route
                path="/wallet"
                element={
                  <ProtectedRoute roles={['DONOR', 'VALIDATOR', 'RESTAURANT']}>
                    <WalletPage />
                  </ProtectedRoute>
                }
              />

              {/* Protected: Admin — nested routes with sidebar layout */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute roles={['ADMIN']}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminOverview />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="needs" element={<AdminNeeds />} />
                <Route path="donations" element={<AdminDonations />} />
                <Route path="audit" element={<AdminAudit />} />
              </Route>
            </Routes>
          </Layout>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1F2937',
                color: '#fff',
                fontSize: '0.9rem',
                borderRadius: '16px',
                padding: '14px 18px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                backdropFilter: 'blur(8px)',
              },
              success: {
                iconTheme: { primary: '#059669', secondary: '#fff' },
              },
              error: {
                iconTheme: { primary: '#DC2626', secondary: '#fff' },
              },
            }}
          />
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;

import api from './api';

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
};

export const needService = {
  getAll: (params) => api.get('/needs', { params }),
  getById: (id) => api.get(`/needs/${id}`),
  create: (data) => api.post('/needs', data),
  updateStatus: (id, status) => api.patch(`/needs/${id}/status`, { status }),
  getValidatorNeeds: () => api.get('/needs/validator/mine'),
  getValidatorStats: () => api.get('/needs/validator/mine/stats'),
  getRestaurantNeeds: () => api.get('/needs/restaurant/mine'),
  confirmByRestaurant: (id, message) => api.patch(`/needs/${id}/confirm`, { message }),
};

export const donationService = {
  create: (data) => api.post('/donations', data),
  getMine: () => api.get('/donations/mine'),
  getMyStats: () => api.get('/donations/mine/stats'),
  getById: (id) => api.get(`/donations/${id}`),
  verify: (hash) => api.get(`/donations/verify/${hash}`),
  getDashboard: () => api.get('/donations/dashboard'),
  getConfirmed: () => api.get('/donations/confirmed'),
};

export const impactProofService = {
  create: (data) => api.post('/impact-proofs', data),
  getByDonation: (donationId) => api.get(`/impact-proofs/${donationId}`),
};

export const restaurantService = {
  getAll: () => api.get('/restaurants'),
  getMine: () => api.get('/restaurants/mine'),
  getMyStats: () => api.get('/restaurants/mine/stats'),
};

export const walletService = {
  getWallet: () => api.get('/wallet'),
  getBalance: () => api.get('/wallet/balance'),
  deposit: (data) => api.post('/wallet/deposit', data),
  withdraw: (data) => api.post('/wallet/withdraw', data),
  getTransactions: (limit) => api.get('/wallet/transactions', { params: { limit } }),
};

export const adminService = {
  // Stats
  getStats: () => api.get('/admin/stats'),
  // Users
  getAllUsers: (params) => api.get('/admin/users', { params }),
  getPendingUsers: () => api.get('/admin/users/pending'),
  createUser: (data) => api.post('/admin/users', data),
  approveUser: (userId) => api.patch(`/admin/users/${userId}/approve`),
  toggleUserStatus: (userId) => api.patch(`/admin/users/${userId}/toggle-status`),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  // Needs
  getAllNeeds: (params) => api.get('/admin/needs', { params }),
  updateNeedStatus: (needId, status) => api.patch(`/admin/needs/${needId}/status`, { status }),
  deleteNeed: (needId) => api.delete(`/admin/needs/${needId}`),
  // Donations
  getAllDonations: (params) => api.get('/admin/donations', { params }),
  getFlaggedDonations: () => api.get('/admin/donations/flagged'),
  toggleDonationFlag: (donationId, flagReason) => api.patch(`/admin/donations/${donationId}/toggle-flag`, { flagReason }),
  deleteDonation: (donationId) => api.delete(`/admin/donations/${donationId}`),
  // Audit
  getAuditLog: (limit = 200) => api.get('/admin/audit-log', { params: { limit } }),
};

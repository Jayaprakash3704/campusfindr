import axios from 'axios';

const client = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 8000,
});

// ── Attach JWT to every request ───────────────────────────
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('cf_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auth ──────────────────────────────────────────────────

export async function login(email, password) {
  const { data } = await client.post('/auth/login', { email, password });
  return data; // { token, user }
}

export async function signup(payload) {
  const { data } = await client.post('/auth/signup', payload);
  return data; // { token, user }
}

export async function getMe() {
  const { data } = await client.get('/auth/me');
  return data.user;
}

// ── Admin Management (superadmin only) ───────────────────

export async function createAdmin(payload) {
  const { data } = await client.post('/auth/admins', payload);
  return data;
}

export async function listAdmins() {
  const { data } = await client.get('/auth/admins');
  return data.data;
}

export async function deleteAdmin(id) {
  const { data } = await client.delete(`/auth/admins/${id}`);
  return data;
}

// Superadmin global stats: users, wardens, items, resolution rate
export async function fetchGlobalStats() {
  const { data } = await client.get('/auth/global-stats');
  return data.data; // { totalUsers, totalWardens, totalItems, resolvedItems, activeItems, resolutionRate }
}

// ── Items ─────────────────────────────────────────────────

export async function fetchActive() {
  const { data } = await client.get('/items/active');
  return data.data; // { lost: [], found: [] }
}

export async function fetchStats() {
  const { data } = await client.get('/items/stats');
  return data.data; // { lost, found, resolved }
}

export async function fetchMyItems() {
  const { data } = await client.get('/items/mine');
  return data.data; // Item[]
}

export async function reportItem(payload) {
  const { data } = await client.post('/items/report', payload);
  return data;
}

export async function resolveItem(id, body) {
  const { data } = await client.patch(`/items/resolve/${id}`, body);
  return data;
}

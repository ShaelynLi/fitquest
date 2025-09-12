// Lightweight API client using fetch
// Reads BACKEND_URL from env with sensible fallback

import { BACKEND_URL } from '@env';

const BASE_URL = (BACKEND_URL && BACKEND_URL.trim()) || 'http://localhost:8000';

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const detail = data && (data.detail || data.message);
    throw new Error(detail || `Request failed: ${res.status}`);
  }
  return data;
}

export const api = {
  // Auth
  async login(email, password) {
    return request('/auth/login', { method: 'POST', body: { email, password } });
  },
  async register(email, password, displayName) {
    return request('/auth/register', { method: 'POST', body: { email, password, display_name: displayName } });
  },
  async me(token) {
    return request('/auth/me', { token });
  },
};

export default api;


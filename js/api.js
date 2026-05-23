const API_BASE = '/api';

async function api(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(url, { ...options, headers });
  let data = {};
  try {
    data = await res.json();
  } catch {
    const text = await res.text().catch(() => '');
    data = { error: text || `HTTP ${res.status}` };
  }

  if (!res.ok) throw new Error(data.error || data.message || `请求失败 (${res.status})`);
  return data.data;
}

const apiClient = {
  login: (password) => api('/auth/login', { method: 'POST', body: JSON.stringify({ password }) }),
  getPhotos: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api(`/photos?${qs}`);
  },
  createPhotos: (photos) => api('/photos', { method: 'POST', body: JSON.stringify(photos) }),
  deletePhoto: (id) => api(`/photos/${id}`, { method: 'DELETE' }),
  getAlbums: () => api('/albums'),
  getAlbum: (id) => api(`/albums/${id}`),
  updateAlbum: (data) => api('/albums', { method: 'PUT', body: JSON.stringify(data) }),
  getMapData: () => api('/map-data'),
  getSts: () => api('/upload-sts'),
  createShare: (data) => api('/shares', { method: 'POST', body: JSON.stringify(data) }),
  verifyShare: (token, password) => api('/shares/verify', { method: 'POST', body: JSON.stringify({ token, password }) }),
};

// Centralized API Client & Toast Notification System for Placeonix

// Toast notification helper
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconMap = {
    success: '✓',
    danger: '✕',
    warning: '!',
    info: 'i',
  };

  toast.innerHTML = `
    <span class="toast-icon">${iconMap[type] || 'i'}</span>
    <div style="flex: 1;">
      <p style="margin: 0; font-size: var(--text-sm); font-weight: 500;">${message}</p>
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Unified API fetcher with token injection
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('placeonix_token');

  let baseUrl;
  if (window.CONFIG && window.CONFIG.API_BASE_URL) {
    baseUrl = window.CONFIG.API_BASE_URL;
  } else if (typeof window !== 'undefined' && window.location && window.location.protocol !== 'file:') {
    baseUrl = `${window.location.origin}/api`;
  } else {
    baseUrl = 'http://localhost:5000/api';
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;

  const headers = {
    ...options.headers,
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('placeonix_token');
        localStorage.removeItem('placeonix_user');
      }
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  } catch (error) {
    console.error(`API Error on [${endpoint}]:`, error);
    throw error;
  }
}

// API helper object
const API = {
  get: (endpoint) => apiFetch(endpoint, { method: 'GET' }),
  post: (endpoint, body) => apiFetch(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body) => apiFetch(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint) => apiFetch(endpoint, { method: 'DELETE' }),
  upload: (endpoint, file) => {
    const formData = new FormData();
    formData.append('resume', file);
    return apiFetch(endpoint, { method: 'POST', body: formData });
  },
};

window.showToast = showToast;
window.apiFetch = apiFetch;
window.API = API;

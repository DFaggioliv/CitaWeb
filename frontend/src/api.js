const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function safeApiPath(path) {
  if (typeof path !== 'string') throw new Error('Ruta de API no permitida.');
  const parts = path.split('?');
  if (parts.length > 2) throw new Error('Ruta de API no permitida.');
  const [pathname, query] = parts;
  const fixed = {
    '/auth/register': '/auth/register',
    '/auth/login': '/auth/login',
    '/auth/me': '/auth/me',
    '/appointments': '/appointments',
    '/admin/appointments': '/admin/appointments',
  };
  if (pathname === '/slots') {
    const search = new URLSearchParams(query);
    if ([...search.keys()].some(key => key !== 'date')) throw new Error('Ruta de API no permitida.');
    return search.has('date') ? `/slots?date=${encodeURIComponent(search.get('date'))}` : '/slots';
  }
  if (query) throw new Error('Ruta de API no permitida.');
  if (Object.hasOwn(fixed, pathname)) return fixed[pathname];
  const appointment = /^\/appointments\/(\d+)\/(cancel|reschedule)$/.exec(pathname);
  if (appointment) {
    const action = appointment[2] === 'cancel' ? 'cancel' : 'reschedule';
    return `/appointments/${encodeURIComponent(appointment[1])}/${action}`;
  }
  const admin = /^\/admin\/appointments\/(\d+)\/status$/.exec(pathname);
  if (admin) return `/admin/appointments/${encodeURIComponent(admin[1])}/status`;
  throw new Error('Ruta de API no permitida.');
}

export async function api(path, options = {}) {
  const safePath = safeApiPath(path);
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_URL}${safePath}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Ocurrió un error inesperado.');
  }

  return data;
}

vi.mock('../src/db.js', () => ({ pool: { query: vi.fn() } }));
vi.mock('bcryptjs', () => ({ default: { hash: vi.fn(), compare: vi.fn() } }));
import app from '../src/app.js';
import { pool } from '../src/db.js';
import bcrypt from 'bcryptjs';

const user = { id: 7, name: 'Usuario QA', email: 'qa@example.invalid', role: 'user' };
const valid = { appointment_date: '2026-10-06', appointment_time: '08:00', reason: 'Consulta general' };
const registration = { name: user.name, email: user.email, password: 'password-de-prueba' };
const response = () => ({ status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() });
function handler(method, path) {
  return app._router.stack.find(layer => layer.route?.path === path && layer.route.methods[method]).route.stack.at(-1).handle;
}
const request = overrides => ({ body: {}, params: { id: '42' }, query: {}, user: { id: 7 }, ...overrides });
beforeEach(() => {
  pool.query.mockReset();
  bcrypt.hash.mockReset().mockResolvedValue('hash-simulado');
  bcrypt.compare.mockReset().mockResolvedValue(true);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubEnv('JWT_SECRET', 'clave-exclusiva-para-pruebas');
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-05T18:00:00Z'));
});
afterEach(() => vi.useRealTimers());

test('health comprueba persistencia antes de declarar salud', async () => {
  pool.query.mockResolvedValue({ rows: [{ '?column?': 1 }] }); const res = response();
  await handler('get', '/api/health')(request(), res);
  expect(pool.query).toHaveBeenCalledWith('SELECT 1');
  expect(res.json).toHaveBeenCalledWith({ ok: true, service: 'CitaWeb API' });
});
test('health falla con 500 si la base no está disponible', async () => {
  pool.query.mockRejectedValue(new Error('sin conexión')); const res = response();
  await handler('get', '/api/health')(request(), res);
  expect(res.status).toHaveBeenCalledWith(500); expect(res.json.mock.calls[0][0].ok).toBe(false);
});
test.each([
  [{ ...registration, name: 'AB' }, 'nombre'],
  [{ ...registration, name: 'A'.repeat(51) }, 'nombre'],
  [{ ...registration, email: 'no-es-correo' }, 'correo'],
  [{ ...registration, password: 'A'.repeat(7) }, 'contraseña'],
  [{ ...registration, password: 'A'.repeat(65) }, 'contraseña'],
])('registro rechaza datos inválidos %j', async (body, expected) => {
  const res = response(); await handler('post', '/api/auth/register')(request({ body }), res);
  expect(res.status).toHaveBeenCalledWith(400); expect(res.json.mock.calls[0][0].error).toContain(expected);
  expect(pool.query).not.toHaveBeenCalled(); expect(bcrypt.hash).not.toHaveBeenCalled();
});
test('registro duplicado no calcula hash ni inserta usuario', async () => {
  pool.query.mockResolvedValue({ rowCount: 1, rows: [{ id: 7 }] }); const res = response();
  await handler('post', '/api/auth/register')(request({ body: registration }), res);
  expect(res.status).toHaveBeenCalledWith(409); expect(bcrypt.hash).not.toHaveBeenCalled(); expect(pool.query).toHaveBeenCalledTimes(1);
});
test('registro normaliza el correo y persiste el hash, no la contraseña', async () => {
  pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] }).mockResolvedValueOnce({ rows: [user] });
  const res = response();
  await handler('post', '/api/auth/register')(request({ body: { ...registration, email: ' QA@Example.Invalid ' } }), res);
  expect(pool.query.mock.calls[0][1]).toEqual([user.email]);
  expect(bcrypt.hash).toHaveBeenCalledWith(registration.password, 10);
  expect(pool.query.mock.calls[1][1]).toEqual([user.name, user.email, 'hash-simulado']);
  expect(res.status).toHaveBeenCalledWith(201);
  expect(res.json).toHaveBeenCalledWith({ user, token: expect.any(String) });
});
test('registro devuelve 500 sin exponer error de persistencia', async () => {
  pool.query.mockRejectedValue(new Error('detalle interno SQL')); const res = response();
  await handler('post', '/api/auth/register')(request({ body: registration }), res);
  expect(res.status).toHaveBeenCalledWith(500); expect(res.json.mock.calls[0][0].error).not.toContain('SQL');
});
test('login sin usuario no compara contraseñas', async () => {
  pool.query.mockResolvedValue({ rowCount: 0, rows: [] }); const res = response();
  await handler('post', '/api/auth/login')(request({ body: registration }), res);
  expect(res.status).toHaveBeenCalledWith(401); expect(bcrypt.compare).not.toHaveBeenCalled();
});
test('login rechaza contraseña incorrecta sin emitir token', async () => {
  pool.query.mockResolvedValue({ rowCount: 1, rows: [{ ...user, password_hash: 'hash-simulado' }] });
  bcrypt.compare.mockResolvedValue(false); const res = response();
  await handler('post', '/api/auth/login')(request({ body: registration }), res);
  expect(res.status).toHaveBeenCalledWith(401); expect(res.json.mock.calls[0][0]).not.toHaveProperty('token');
});
test('login válido omite password_hash en la respuesta', async () => {
  pool.query.mockResolvedValue({ rowCount: 1, rows: [{ ...user, password_hash: 'hash-simulado' }] }); const res = response();
  await handler('post', '/api/auth/login')(request({ body: registration }), res);
  expect(bcrypt.compare).toHaveBeenCalledWith(registration.password, 'hash-simulado');
  expect(res.json).toHaveBeenCalledWith({ user, token: expect.any(String) });
  expect(res.json.mock.calls[0][0].user).not.toHaveProperty('password_hash');
});
test('login maneja error de persistencia con 500', async () => {
  pool.query.mockRejectedValue(new Error('sin conexión')); const res = response();
  await handler('post', '/api/auth/login')(request({ body: registration }), res);
  expect(res.status).toHaveBeenCalledWith(500);
});
test('perfil se consulta exclusivamente por identidad autenticada', async () => {
  pool.query.mockResolvedValue({ rowCount: 1, rows: [user] }); const res = response();
  await handler('get', '/api/auth/me')(request(), res);
  expect(pool.query.mock.calls[0][1]).toEqual([7]); expect(res.json).toHaveBeenCalledWith({ user });
});
test('perfil inexistente devuelve 404', async () => {
  pool.query.mockResolvedValue({ rowCount: 0, rows: [] }); const res = response();
  await handler('get', '/api/auth/me')(request(), res); expect(res.status).toHaveBeenCalledWith(404);
});
test('perfil maneja fallo de base de datos', async () => {
  pool.query.mockRejectedValue(new Error('sin conexión')); const res = response();
  await handler('get', '/api/auth/me')(request(), res); expect(res.status).toHaveBeenCalledWith(500);
});
test('disponibilidad rechaza formato inválido antes de consultar datos', async () => {
  const res = response(); await handler('get', '/api/slots')(request({ query: { date: 'incorrecta' } }), res);
  expect(res.status).toHaveBeenCalledWith(400); expect(pool.query).not.toHaveBeenCalled();
});
test.each(['2026-10-05', '2026-11-05', '2026-10-10'])('disponibilidad vacía para fecha no permitida %s', async date => {
  const res = response(); await handler('get', '/api/slots')(request({ query: { date } }), res);
  expect(res.json).toHaveBeenCalledWith({ date, available: [] }); expect(pool.query).not.toHaveBeenCalled();
});
test('disponibilidad maneja fallo de consulta', async () => {
  pool.query.mockRejectedValue(new Error('sin conexión')); const res = response();
  await handler('get', '/api/slots')(request({ query: { date: valid.appointment_date } }), res);
  expect(res.status).toHaveBeenCalledWith(500);
});
test('listado propio utiliza el identificador autenticado', async () => {
  const rows = [{ id: 42, ...valid, status: 'pending' }]; pool.query.mockResolvedValue({ rows }); const res = response();
  await handler('get', '/api/appointments')(request(), res);
  expect(pool.query.mock.calls[0][1]).toEqual([7]); expect(res.json).toHaveBeenCalledWith({ appointments: rows });
});
test('listado propio maneja error de base de datos', async () => {
  pool.query.mockRejectedValue(new Error('sin conexión')); const res = response();
  await handler('get', '/api/appointments')(request(), res); expect(res.status).toHaveBeenCalledWith(500);
});
test('creación maneja error distinto de conflicto sin revelar detalles SQL', async () => {
  pool.query.mockRejectedValue(new Error('SQL interno')); const res = response();
  await handler('post', '/api/appointments')(request({ body: valid }), res);
  expect(res.status).toHaveBeenCalledWith(500); expect(res.json.mock.calls[0][0].error).not.toContain('SQL');
});
test('reprogramación valida nueva fecha antes de actualizar', async () => {
  pool.query.mockResolvedValue({ rowCount: 1, rows: [{ status: 'pending', reason: valid.reason }] }); const res = response();
  await handler('patch', '/api/appointments/:id/reschedule')(request({ body: { ...valid, appointment_date: '2026-10-05' } }), res);
  expect(res.status).toHaveBeenCalledWith(400); expect(pool.query).toHaveBeenCalledTimes(1);
});
test.each([['23505', 409], ['XX000', 500]])('reprogramación distingue error %s', async (code, status) => {
  pool.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ status: 'pending', reason: valid.reason }] }).mockRejectedValueOnce({ code }); const res = response();
  await handler('patch', '/api/appointments/:id/reschedule')(request({ body: valid }), res);
  expect(res.status).toHaveBeenCalledWith(status);
});
test('cancelación ajena/inexistente no modifica datos', async () => {
  pool.query.mockResolvedValue({ rowCount: 0, rows: [] }); const res = response();
  await handler('patch', '/api/appointments/:id/cancel')(request(), res);
  expect(res.status).toHaveBeenCalledWith(404); expect(pool.query).toHaveBeenCalledTimes(1);
});
test('listado administrativo devuelve los datos previstos', async () => {
  const rows = [{ id: 42, user_name: user.name, status: 'pending' }]; pool.query.mockResolvedValue({ rows }); const res = response();
  await handler('get', '/api/admin/appointments')(request(), res);
  expect(res.json).toHaveBeenCalledWith({ appointments: rows });
});
test('listado administrativo maneja fallo de consulta', async () => {
  pool.query.mockRejectedValue(new Error('sin conexión')); const res = response();
  await handler('get', '/api/admin/appointments')(request(), res); expect(res.status).toHaveBeenCalledWith(500);
});
test('cambio de estado de cita inexistente devuelve 404', async () => {
  pool.query.mockResolvedValue({ rowCount: 0, rows: [] }); const res = response();
  await handler('patch', '/api/admin/appointments/:id/status')(request({ body: { status: 'confirmed' } }), res);
  expect(res.status).toHaveBeenCalledWith(404); expect(pool.query).toHaveBeenCalledTimes(1);
});
test.each([
  ['/api/appointments/:id/reschedule', { ...valid }, false],
  ['/api/appointments/:id/cancel', {}, false],
  ['/api/appointments/:id/cancel', {}, true],
  ['/api/admin/appointments/:id/status', { status: 'confirmed' }, false],
  ['/api/admin/appointments/:id/status', { status: 'confirmed' }, true],
])('fallo asíncrono de %s pasa al middleware de errores (actualización=%s)', async (path, body, afterRead) => {
  const error = new Error('base no disponible'); const next = vi.fn(); const res = response();
  if (afterRead) pool.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ status: 'pending' }] }).mockRejectedValueOnce(error);
  else pool.query.mockRejectedValueOnce(error);
  await handler('patch', path)(request({ body }), res, next);
  expect(next).toHaveBeenCalledWith(error); expect(res.json).not.toHaveBeenCalled();
});
test('ruta desconocida devuelve 404', () => {
  const fallback = app._router.stack.filter(layer => !layer.route && layer.handle.length === 2).at(-1).handle;
  const res = response(); fallback(request(), res); expect(res.status).toHaveBeenCalledWith(404);
});
test('middleware de errores devuelve 500 genérico', () => {
  const fallback = app._router.stack.find(layer => layer.handle.length === 4).handle;
  const res = response(); fallback(new Error('dato confidencial interno'), request(), res, vi.fn());
  expect(res.status).toHaveBeenCalledWith(500); expect(res.json).toHaveBeenCalledWith({ error: 'Error interno del servidor.' });
});

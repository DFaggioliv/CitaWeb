import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { pool } from './db.js';
import { requireAuth, requireAdmin, signToken } from './auth.js';
import {
  buildSlots,
  isValidEmail,
  isWeekend,
  normalizeEmail,
  validateAppointment,
  validDateFormat,
  daysFromToday
} from './utils.js';

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL?.split(',').map(v => v.trim()) || '*'
}));
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, service: 'CitaWeb API' });
  } catch {
    res.status(500).json({ ok: false, error: 'Base de datos no disponible.' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const name = String(req.body.name ?? '').trim();
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password ?? '');

  if (name.length < 3 || name.length > 50) {
    return res.status(400).json({ error: 'El nombre debe contener entre 3 y 50 caracteres.' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'El correo electrónico no es válido.' });
  }

  if (password.length < 8 || password.length > 64) {
    return res.status(400).json({ error: 'La contraseña debe contener entre 8 y 64 caracteres.' });
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rowCount) {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese correo.' });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'user')
       RETURNING id, name, email, role`,
      [name, email, hash]
    );

    const user = result.rows[0];
    res.status(201).json({ token: signToken(user), user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'No fue posible registrar al usuario.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password ?? '');

  try {
    const result = await pool.query(
      'SELECT id, name, email, password_hash, role FROM users WHERE email = $1',
      [email]
    );

    if (!result.rowCount) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const row = result.rows[0];
    const ok = await bcrypt.compare(password, row.password_hash);

    if (!ok) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const user = { id: row.id, name: row.name, email: row.email, role: row.role };
    res.json({ token: signToken(user), user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'No fue posible iniciar sesión.' });
  }
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role FROM users WHERE id = $1',
      [req.user.id]
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    res.json({ user: result.rows[0] });
  } catch {
    res.status(500).json({ error: 'No fue posible cargar el perfil.' });
  }
});

app.get('/api/slots', requireAuth, async (req, res) => {
  const date = String(req.query.date ?? '');

  if (!validDateFormat(date)) {
    return res.status(400).json({ error: 'Fecha inválida.' });
  }

  const days = daysFromToday(date);
  if (days < 1 || days > 30 || isWeekend(date)) {
    return res.json({ date, available: [] });
  }

  try {
    const result = await pool.query(
      `SELECT TO_CHAR(appointment_time, 'HH24:MI') AS appointment_time
       FROM appointments
       WHERE appointment_date = $1 AND status <> 'cancelled'`,
      [date]
    );

    const occupied = new Set(result.rows.map(r => r.appointment_time));
    const available = buildSlots().filter(slot => !occupied.has(slot));
    res.json({ date, available });
  } catch {
    res.status(500).json({ error: 'No fue posible consultar disponibilidad.' });
  }
});

app.get('/api/appointments', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id,
              TO_CHAR(appointment_date, 'YYYY-MM-DD') AS appointment_date,
              TO_CHAR(appointment_time, 'HH24:MI') AS appointment_time,
              reason, status, created_at, updated_at
       FROM appointments
       WHERE user_id = $1
       ORDER BY appointment_date, appointment_time`,
      [req.user.id]
    );

    res.json({ appointments: result.rows });
  } catch {
    res.status(500).json({ error: 'No fue posible cargar las citas.' });
  }
});

app.post('/api/appointments', requireAuth, async (req, res) => {
  const payload = {
    appointment_date: String(req.body.appointment_date ?? ''),
    appointment_time: String(req.body.appointment_time ?? ''),
    reason: String(req.body.reason ?? '').trim()
  };

  const errors = validateAppointment(payload);
  if (errors.length) {
    return res.status(400).json({ error: errors.join(' ') });
  }

  try {
    const result = await pool.query(
      `INSERT INTO appointments (user_id, appointment_date, appointment_time, reason)
       VALUES ($1, $2, $3, $4)
       RETURNING id,
                 TO_CHAR(appointment_date, 'YYYY-MM-DD') AS appointment_date,
                 TO_CHAR(appointment_time, 'HH24:MI') AS appointment_time,
                 reason, status`,
      [req.user.id, payload.appointment_date, payload.appointment_time, payload.reason]
    );

    res.status(201).json({ appointment: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Ese horario ya está ocupado.' });
    }
    console.error(error);
    res.status(500).json({ error: 'No fue posible crear la cita.' });
  }
});

app.patch('/api/appointments/:id/reschedule', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const appointment_date = String(req.body.appointment_date ?? '');
  const appointment_time = String(req.body.appointment_time ?? '');

  const current = await pool.query(
    'SELECT id, status, reason FROM appointments WHERE id = $1 AND user_id = $2',
    [id, req.user.id]
  );

  if (!current.rowCount) {
    return res.status(404).json({ error: 'Cita no encontrada.' });
  }

  if (current.rows[0].status !== 'pending') {
    return res.status(409).json({ error: 'Solo las citas pendientes pueden reprogramarse.' });
  }

  const errors = validateAppointment({
    appointment_date,
    appointment_time,
    reason: current.rows[0].reason
  });

  if (errors.length) {
    return res.status(400).json({ error: errors.join(' ') });
  }

  try {
    const result = await pool.query(
      `UPDATE appointments
       SET appointment_date = $1,
           appointment_time = $2,
           updated_at = NOW()
       WHERE id = $3
       RETURNING id,
                 TO_CHAR(appointment_date, 'YYYY-MM-DD') AS appointment_date,
                 TO_CHAR(appointment_time, 'HH24:MI') AS appointment_time,
                 reason, status`,
      [appointment_date, appointment_time, id]
    );

    res.json({ appointment: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Ese horario ya está ocupado.' });
    }
    res.status(500).json({ error: 'No fue posible reprogramar la cita.' });
  }
});

app.patch('/api/appointments/:id/cancel', requireAuth, async (req, res) => {
  const id = Number(req.params.id);

  const current = await pool.query(
    'SELECT id, status FROM appointments WHERE id = $1 AND user_id = $2',
    [id, req.user.id]
  );

  if (!current.rowCount) {
    return res.status(404).json({ error: 'Cita no encontrada.' });
  }

  if (!['pending', 'confirmed'].includes(current.rows[0].status)) {
    return res.status(409).json({ error: 'La cita ya no puede cancelarse.' });
  }

  const result = await pool.query(
    `UPDATE appointments
     SET status = 'cancelled', updated_at = NOW()
     WHERE id = $1
     RETURNING id, status`,
    [id]
  );

  res.json({ appointment: result.rows[0] });
});

app.get('/api/admin/appointments', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.id,
              u.name AS user_name,
              u.email AS user_email,
              TO_CHAR(a.appointment_date, 'YYYY-MM-DD') AS appointment_date,
              TO_CHAR(a.appointment_time, 'HH24:MI') AS appointment_time,
              a.reason,
              a.status,
              a.created_at,
              a.updated_at
       FROM appointments a
       JOIN users u ON u.id = a.user_id
       ORDER BY a.appointment_date, a.appointment_time`
    );

    res.json({ appointments: result.rows });
  } catch {
    res.status(500).json({ error: 'No fue posible cargar las citas.' });
  }
});

app.patch('/api/admin/appointments/:id/status', requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const newStatus = String(req.body.status ?? '');

  const result = await pool.query(
    'SELECT id, status FROM appointments WHERE id = $1',
    [id]
  );

  if (!result.rowCount) {
    return res.status(404).json({ error: 'Cita no encontrada.' });
  }

  const current = result.rows[0].status;
  const allowed = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['attended', 'cancelled'],
    attended: [],
    cancelled: []
  };

  if (!allowed[current].includes(newStatus)) {
    return res.status(409).json({
      error: `Transición inválida: ${current} -> ${newStatus}.`
    });
  }

  const updated = await pool.query(
    `UPDATE appointments
     SET status = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING id, status`,
    [newStatus, id]
  );

  res.json({ appointment: updated.rows[0] });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada.' });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

export default app;

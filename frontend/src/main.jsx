import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { api } from './api';
import './styles.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('token')));

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      setLoading(false);
      return;
    }

    api('/auth/me')
      .then(data => setUser(data.user))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  function onLogin(data) {
    localStorage.setItem('token', data.token);
    setUser(data.user);
  }

  function logout() {
    localStorage.removeItem('token');
    setUser(null);
  }

  if (loading) return <div className="center-screen">Cargando CitaWeb…</div>;
  if (!user) return <AuthScreen onLogin={onLogin} />;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1>CitaWeb</h1>
          <p>Sistema web de gestión de citas</p>
        </div>
        <div className="user-box">
          <span>{user.name}</span>
          <small>{user.role === 'admin' ? 'Administrador' : 'Usuario'}</small>
          <button className="secondary" onClick={logout}>Cerrar sesión</button>
        </div>
      </header>

      <main className="page">
        {user.role === 'admin'
          ? <AdminDashboard />
          : <UserDashboard />}
      </main>
    </div>
  );
}

function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage('');

    try {
      const data = await api(`/auth/${mode === 'login' ? 'login' : 'register'}`, {
        method: 'POST',
        body: JSON.stringify(form)
      });
      onLogin(data);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-card">
        <div className="brand-badge">CW</div>
        <h1>CitaWeb</h1>
        <p className="muted">Gestión simple y segura de citas.</p>

        <div className="tabs">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
            Iniciar sesión
          </button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>
            Registrarse
          </button>
        </div>

        <form onSubmit={submit} className="form-stack">
          {mode === 'register' && (
            <label>
              Nombre
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Nombre completo"
              />
            </label>
          )}

          <label>
            Correo
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="usuario@correo.com"
            />
          </label>

          <label>
            Contraseña
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="Mínimo 8 caracteres"
            />
          </label>

          {message && <div className="alert error">{message}</div>}
          <button disabled={busy}>{busy ? 'Procesando…' : mode === 'login' ? 'Ingresar' : 'Crear cuenta'}</button>
        </form>
      </section>
    </div>
  );
}

function UserDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [message, setMessage] = useState('');
  const [booking, setBooking] = useState({
    appointment_date: '',
    appointment_time: '',
    reason: ''
  });
  const [slots, setSlots] = useState([]);
  const [rescheduleId, setRescheduleId] = useState(null);

  async function refresh() {
    try {
      const data = await api('/appointments');
      setAppointments(data.appointments);
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => { refresh(); }, []);

  async function loadSlots(date) {
    setBooking(prev => ({ ...prev, appointment_date: date, appointment_time: '' }));
    if (!date) {
      setSlots([]);
      return;
    }
    try {
      const data = await api(`/slots?date=${encodeURIComponent(date)}`);
      setSlots(data.available);
    } catch (error) {
      setSlots([]);
      setMessage(error.message);
    }
  }

  async function submitBooking(event) {
    event.preventDefault();
    setMessage('');
    try {
      if (rescheduleId) {
        await api(`/appointments/${rescheduleId}/reschedule`, {
          method: 'PATCH',
          body: JSON.stringify({
            appointment_date: booking.appointment_date,
            appointment_time: booking.appointment_time
          })
        });
        setMessage('Cita reprogramada correctamente.');
      } else {
        await api('/appointments', {
          method: 'POST',
          body: JSON.stringify(booking)
        });
        setMessage('Cita creada correctamente.');
      }

      setBooking({ appointment_date: '', appointment_time: '', reason: '' });
      setSlots([]);
      setRescheduleId(null);
      await refresh();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function cancelAppointment(id) {
    if (!confirm('¿Desea cancelar esta cita?')) return;

    try {
      await api(`/appointments/${id}/cancel`, { method: 'PATCH' });
      setMessage('Cita cancelada.');
      await refresh();
    } catch (error) {
      setMessage(error.message);
    }
  }

  function startReschedule(appt) {
    setRescheduleId(appt.id);
    setBooking({
      appointment_date: '',
      appointment_time: '',
      reason: appt.reason
    });
    setSlots([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const upcoming = useMemo(
    () => appointments.filter(a => ['pending', 'confirmed'].includes(a.status)),
    [appointments]
  );

  return (
    <>
      <section className="hero">
        <div>
          <span className="eyebrow">Portal del usuario</span>
          <h2>{rescheduleId ? 'Reprogramar cita' : 'Agendar una nueva cita'}</h2>
          <p>Seleccione un día hábil entre 1 y 30 días a futuro.</p>
        </div>
        <div className="stat">
          <strong>{upcoming.length}</strong>
          <span>Citas activas</span>
        </div>
      </section>

      {message && <div className="alert">{message}</div>}

      <section className="card">
        <form onSubmit={submitBooking} className="booking-grid">
          <label>
            Fecha
            <input
              type="date"
              value={booking.appointment_date}
              onChange={e => loadSlots(e.target.value)}
              required
            />
          </label>

          <label>
            Hora
            <select
              value={booking.appointment_time}
              onChange={e => setBooking({ ...booking, appointment_time: e.target.value })}
              required
            >
              <option value="">Seleccione…</option>
              {slots.map(slot => <option key={slot} value={slot}>{slot}</option>)}
            </select>
          </label>

          {!rescheduleId && (
            <label className="wide">
              Motivo
              <textarea
                value={booking.reason}
                onChange={e => setBooking({ ...booking, reason: e.target.value })}
                placeholder="Describa brevemente el motivo de la cita."
                required
              />
            </label>
          )}

          <div className="actions wide">
            <button>{rescheduleId ? 'Guardar reprogramación' : 'Crear cita'}</button>
            {rescheduleId && (
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setRescheduleId(null);
                  setBooking({ appointment_date: '', appointment_time: '', reason: '' });
                  setSlots([]);
                }}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="section-head">
        <h2>Mis citas</h2>
        <button className="secondary" onClick={refresh}>Actualizar</button>
      </section>

      <AppointmentsTable
        appointments={appointments}
        userMode
        onCancel={cancelAppointment}
        onReschedule={startReschedule}
      />
    </>
  );
}

function AdminDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [message, setMessage] = useState('');

  async function refresh() {
    try {
      const data = await api('/admin/appointments');
      setAppointments(data.appointments);
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => { refresh(); }, []);

  async function changeStatus(id, status) {
    try {
      await api(`/admin/appointments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      setMessage(`Estado actualizado a ${labelStatus(status)}.`);
      await refresh();
    } catch (error) {
      setMessage(error.message);
    }
  }

  const counters = {
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    attended: appointments.filter(a => a.status === 'attended').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length
  };

  return (
    <>
      <section className="hero">
        <div>
          <span className="eyebrow">Panel administrativo</span>
          <h2>Control de citas</h2>
          <p>Administre el ciclo de vida de las citas registradas.</p>
        </div>
      </section>

      <section className="stats-grid">
        {Object.entries(counters).map(([key, value]) => (
          <div className="stat-card" key={key}>
            <strong>{value}</strong>
            <span>{labelStatus(key)}</span>
          </div>
        ))}
      </section>

      {message && <div className="alert">{message}</div>}

      <section className="section-head">
        <h2>Todas las citas</h2>
        <button className="secondary" onClick={refresh}>Actualizar</button>
      </section>

      <AppointmentsTable appointments={appointments} adminMode onChangeStatus={changeStatus} />
    </>
  );
}

function AppointmentsTable({ appointments, userMode, adminMode, onCancel, onReschedule, onChangeStatus }) {
  if (!appointments.length) {
    return <div className="empty">No hay citas registradas.</div>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {adminMode && <th>Usuario</th>}
            <th>Fecha</th>
            <th>Hora</th>
            <th>Motivo</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map(appt => (
            <tr key={appt.id}>
              {adminMode && (
                <td>
                  <strong>{appt.user_name}</strong>
                  <small className="block">{appt.user_email}</small>
                </td>
              )}
              <td>{appt.appointment_date}</td>
              <td>{appt.appointment_time}</td>
              <td>{appt.reason}</td>
              <td><span className={`status ${appt.status}`}>{labelStatus(appt.status)}</span></td>
              <td>
                <div className="row-actions">
                  {userMode && appt.status === 'pending' && (
                    <button className="mini secondary" onClick={() => onReschedule(appt)}>
                      Reprogramar
                    </button>
                  )}
                  {userMode && ['pending', 'confirmed'].includes(appt.status) && (
                    <button className="mini danger" onClick={() => onCancel(appt.id)}>
                      Cancelar
                    </button>
                  )}

                  {adminMode && appt.status === 'pending' && (
                    <>
                      <button className="mini" onClick={() => onChangeStatus(appt.id, 'confirmed')}>
                        Confirmar
                      </button>
                      <button className="mini danger" onClick={() => onChangeStatus(appt.id, 'cancelled')}>
                        Cancelar
                      </button>
                    </>
                  )}

                  {adminMode && appt.status === 'confirmed' && (
                    <>
                      <button className="mini" onClick={() => onChangeStatus(appt.id, 'attended')}>
                        Atendida
                      </button>
                      <button className="mini danger" onClick={() => onChangeStatus(appt.id, 'cancelled')}>
                        Cancelar
                      </button>
                    </>
                  )}

                  {(['attended', 'cancelled'].includes(appt.status)) && <span className="muted">Sin acciones</span>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function labelStatus(status) {
  return ({
    pending: 'Pendiente',
    confirmed: 'Confirmada',
    attended: 'Atendida',
    cancelled: 'Cancelada'
  })[status] || status;
}

createRoot(document.getElementById('root')).render(<App />);

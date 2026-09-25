export function normalizeEmail(email = '') {
  return String(email).trim().toLowerCase();
}

export function isValidEmail(email = '') {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function getTodayGuatemala() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Guatemala',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());

  const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function toUtcDate(ymd) {
  const [year, month, day] = ymd.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function daysFromToday(date) {
  const today = toUtcDate(getTodayGuatemala());
  const target = toUtcDate(date);
  return Math.round((target - today) / 86400000);
}

export function isWeekend(date) {
  const day = toUtcDate(date).getUTCDay();
  return day === 0 || day === 6;
}

export function validDateFormat(value = '') {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function validTimeFormat(value = '') {
  return /^\d{2}:\d{2}$/.test(value);
}

export function validSlot(time) {
  if (!validTimeFormat(time)) return false;
  const [h, m] = time.split(':').map(Number);
  if (![0, 30].includes(m)) return false;
  const total = h * 60 + m;
  return total >= 8 * 60 && total <= 17 * 60;
}

export function validateAppointment({ appointment_date, appointment_time, reason }) {
  const errors = [];

  if (!validDateFormat(appointment_date)) {
    errors.push('La fecha no tiene un formato válido.');
  } else {
    const days = daysFromToday(appointment_date);
    if (days < 1 || days > 30) {
      errors.push('La cita debe programarse entre 1 y 30 días a futuro.');
    }
    if (isWeekend(appointment_date)) {
      errors.push('No se permiten citas sábado ni domingo.');
    }
  }

  if (!validSlot(appointment_time)) {
    errors.push('El horario debe estar entre 08:00 y 17:00 en intervalos de 30 minutos.');
  }

  const cleanReason = String(reason ?? '').trim();
  if (cleanReason.length < 10 || cleanReason.length > 200) {
    errors.push('El motivo debe contener entre 10 y 200 caracteres.');
  }

  return errors;
}

export function buildSlots() {
  const slots = [];
  for (let minutes = 8 * 60; minutes <= 17 * 60; minutes += 30) {
    const h = String(Math.floor(minutes / 60)).padStart(2, '0');
    const m = String(minutes % 60).padStart(2, '0');
    slots.push(`${h}:${m}`);
  }
  return slots;
}

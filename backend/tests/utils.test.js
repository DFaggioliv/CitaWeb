import { normalizeEmail, isValidEmail, getTodayGuatemala, daysFromToday, isWeekend, validSlot, validateAppointment, buildSlots } from '../src/utils.js';

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-05T18:00:00Z')); });
afterEach(() => vi.useRealTimers());
const valid = { appointment_date: '2026-10-06', appointment_time: '08:00', reason: 'Consulta general' };

test('normaliza espacios y mayúsculas del correo', () => expect(normalizeEmail('  USER@Example.COM ')).toBe('user@example.com'));
test('correo sin dominio se rechaza', () => expect(isValidEmail('usuario@')).toBe(false));
test('correo válido se acepta', () => expect(isValidEmail('usuario@example.com')).toBe(true));
test('fecha actual usa Guatemala cerca de medianoche UTC', () => { vi.setSystemTime(new Date('2026-10-06T02:00:00Z')); expect(getTodayGuatemala()).toBe('2026-10-05'); });
test('diferencia de fechas cruza el mes correctamente', () => expect(daysFromToday('2026-11-04')).toBe(30));
test.each(['2026-10-10', '2026-10-11'])('rechaza día de fin de semana %s', date => expect(isWeekend(date)).toBe(true));
test.each(['08:00', '08:30', '17:00'])('acepta horario de frontera/intervalo %s', time => expect(validSlot(time)).toBe(true));
test.each(['07:30', '17:30', '08:15', '24:00', '8:00'])('rechaza horario inválido %s', time => expect(validSlot(time)).toBe(false));
test('genera 19 horarios únicos sin omitir intervalos', () => { const slots=buildSlots(); expect(slots).toHaveLength(19); expect(new Set(slots).size).toBe(19); expect(slots[0]).toBe('08:00'); expect(slots.at(-1)).toBe('17:00'); expect(slots.every(validSlot)).toBe(true); });
test.each([['2026-10-06', 1], ['2026-11-04', 30]])('acepta frontera hábil %s (+%i)', date => expect(validateAppointment({...valid, appointment_date: date})).toEqual([]));
test.each(['2026-10-05','2026-10-04','2026-11-05'])('rechaza fecha fuera del rango %s', date => expect(validateAppointment({...valid, appointment_date: date}).join(' ')).toContain('entre 1 y 30'));
test('rechaza fin de semana aunque esté dentro del rango', () => expect(validateAppointment({...valid, appointment_date:'2026-10-10'}).join(' ')).toContain('sábado ni domingo'));
test('rechaza formato de fecha incorrecto', () => expect(validateAppointment({...valid, appointment_date:'06/10/2026'}).join(' ')).toContain('formato'));
test.each([10,200])('acepta motivo con longitud límite %i', n => expect(validateAppointment({...valid,reason:'a'.repeat(n)})).toEqual([]));
test.each([9,201])('rechaza motivo fuera de límites %i', n => expect(validateAppointment({...valid,reason:'a'.repeat(n)}).join(' ')).toContain('10 y 200'));
test('no cuenta espacios exteriores como parte del motivo', () => expect(validateAppointment({...valid,reason:'   abc   '}).join(' ')).toContain('10 y 200'));

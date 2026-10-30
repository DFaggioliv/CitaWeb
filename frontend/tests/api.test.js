import { api } from '../src/api.js';
let fetchMock,storage;
beforeEach(()=>{fetchMock=vi.fn();storage={getItem:vi.fn().mockReturnValue(null)};vi.stubGlobal('fetch',fetchMock);vi.stubGlobal('localStorage',storage);});
const reply=(data,ok=true)=>({ok,json:vi.fn().mockResolvedValue(data)});
test('devuelve contenido JSON de una respuesta correcta',async()=>{fetchMock.mockResolvedValue(reply({available:['08:00']}));expect(await api('/slots')).toEqual({available:['08:00']});});
test('envía token almacenado en Authorization',async()=>{storage.getItem.mockReturnValue('test-token');fetchMock.mockResolvedValue(reply({}));await api('/appointments');expect(storage.getItem).toHaveBeenCalledWith('token');expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer test-token');});
test('no envía Authorization si no existe sesión',async()=>{fetchMock.mockResolvedValue(reply({}));await api('/slots');expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty('Authorization');});
test('conserva método y cuerpo al crear una cita',async()=>{fetchMock.mockResolvedValue(reply({}));const body=JSON.stringify({reason:'Consulta general'});await api('/appointments',{method:'POST',body});expect(fetchMock.mock.calls[0][1]).toMatchObject({method:'POST',body,headers:{'Content-Type':'application/json'}});});
test('permite encabezados específicos de una solicitud',async()=>{fetchMock.mockResolvedValue(reply({}));await api('/appointments',{headers:{'X-Request-ID':'test-42'}});expect(fetchMock.mock.calls[0][1].headers['X-Request-ID']).toBe('test-42');});
test('expone mensaje de rechazo de la API',async()=>{fetchMock.mockResolvedValue(reply({error:'Ese horario ya está ocupado.'},false));await expect(api('/appointments')).rejects.toThrow('Ese horario ya está ocupado.');});
test('usa mensaje genérico cuando el error no tiene JSON',async()=>{fetchMock.mockResolvedValue({ok:false,json:vi.fn().mockRejectedValue(new SyntaxError('invalid JSON'))});await expect(api('/appointments')).rejects.toThrow('Ocurrió un error inesperado.');});
test('propaga fallo de red para que la interfaz pueda manejarlo',async()=>{fetchMock.mockRejectedValue(new Error('Sin conexión'));await expect(api('/slots')).rejects.toThrow('Sin conexión');});


test.each(['https://example.invalid/steal', '//example.invalid/steal', '/appointments/../auth/login', '/appointments/1/unknown', '/slots?redirect=https://example.invalid'])('rechaza ruta no permitida antes de enviar el token: %s', async path => {
  storage.getItem.mockReturnValue('private-test-token');
  await expect(api(path)).rejects.toThrow('Ruta de API no permitida.');
  expect(fetchMock).not.toHaveBeenCalled();
});
test.each(['/appointments/42/cancel', '/appointments/42/reschedule', '/admin/appointments/42/status'])('conserva ruta de cita autorizada %s', async path => {
 fetchMock.mockResolvedValue(reply({})); await api(path); expect(fetchMock.mock.calls[0][0]).toMatch(new RegExp(path+'$'));
});
test('codifica el valor de fecha sin permitir inyectar otra query',async()=>{
 fetchMock.mockResolvedValue(reply({})); await api('/slots?date=2026-11-02%26redirect%3Dexternal');
 expect(fetchMock.mock.calls[0][0]).toContain('?date=2026-11-02%26redirect%3Dexternal');
});

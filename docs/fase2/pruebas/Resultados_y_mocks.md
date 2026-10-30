# Pruebas unitarias de Fase 2 — resultados

Ejecución: 30 de octubre de 2026. Vitest 5.0.5 y proveedor de cobertura V8.

## Resultado

**62 pruebas aprobadas, cero fallidas, cuatro archivos de pruebas.** Distribución: 54 backend y 8 frontend. Las pruebas parametrizadas representan casos ejecutados distintos (fronteras, estados y entradas); no se cuenta la comprobación de infraestructura de baseline.

**Cobertura de líneas: 0/313 (0 %) → 122/313 (38.97 %): +38.97 puntos porcentuales.** Se supera el incremento agregado de 20 puntos; el alcance y sus límites se desglosan abajo. No se afirma cobertura del 100 % de los módulos críticos ni cumplimiento completo de E10: falta ejecución en CI y resolver la aceptación de la línea base retrospectiva si no existe registro original.

## Suites

- appointments.test.js: 18 casos aprobados.
- auth.test.js: 8 casos aprobados.
- utils.test.js: 28 casos aprobados.
- api.test.js: 8 casos aprobados.

## Cobertura por archivo

| Archivo | Líneas cubiertas/medibles | Cobertura |
|---|---:|---:|
| `backend/src/app.js` | 65/131 | 49.61 % |
| `backend/src/auth.js` | 12/12 | 100 % |
| `backend/src/db.js` | 0/3 | 0 % |
| `backend/src/server.js` | 0/3 | 0 % |
| `backend/src/utils.js` | 38/39 | 97.43 % |
| `frontend/src/api.js` | 7/7 | 100 % |
| `frontend/src/main.jsx` | 0/118 | 0 % |

## Relación con módulos críticos E2

- MC-01: token JWT, expiración, ausencia/corrupción de token y rol administrador; auth.js 100 %. Los handlers de registro/login en app.js aún no se prueban aquí.
- MC-02: fronteras de fecha +1/+30 hábiles, fuera de rango, fin de semana, zona Guatemala, horarios y motivo. utils.js 97.43 %; disponibilidad con horario ocupado mediante handler aislado.
- MC-03: creación válida/inválida, conflicto de unicidad y reprogramación propia/inexistente/confirmada/pendiente.
- MC-04: cuatro transiciones permitidas, tres inválidas y cancelación de estados activos/finales.
- MC-05: persistencia simulada; no se mide la conexión real. db.js permanece 0 %.
- MC-06: ocho pruebas del cliente HTTP, api.js 100 %. main.jsx permanece 0 %: estas pruebas no ejercitan componentes visuales.

Los casos sobre handlers se invocan directamente con solicitud, respuesta y persistencia simuladas; son pruebas aisladas de esa unidad, no una ejecución HTTP integral. Se comprueba por separado el middleware de autenticación/roles. Las pruebas API encadenadas corresponden al siguiente bloque.

## Mocks y justificación

1. **PostgreSQL, pool.query**: el módulo db.js se reemplaza antes de importar la aplicación. Permite reproducir conflictos 23505, ausencia de citas y transiciones, sin contactar Neon. Por ejemplo, la creación válida verifica parámetros y propietario; el conflicto verifica HTTP 409; la reprogramación confirmada verifica que no se actualice la cita.
2. **HTTP, fetch**: reemplazado por función simulada en las ocho pruebas del frontend. Permite controlar éxito, rechazo, JSON inválido y fallo de red sin depender del backend.
3. **Almacenamiento, localStorage**: doble de getItem para verificar envío u omisión del token sin navegador ni sesión real.
4. **Reloj**: fecha fija 5 de octubre de 2026 en pruebas de citas. Hace reproducibles +1 y +30 días hábiles y permite comprobar Guatemala cerca de medianoche UTC.
5. **Respuesta/continuación Express**: status, json y next son espías para verificar respuestas y que un rechazo no continúe al recurso.

Se usan dobles en más de tres pruebas distintas. Las pruebas JWT utilizan la biblioteca real con secreto exclusivo de pruebas, no credenciales de producción.

## Cambio mínimo para aislar unidades

Las rutas y middleware antes contenidos en backend/src/server.js se movieron a backend/src/app.js, que exporta la aplicación sin abrir puertos. server.js conserva el arranque y el puerto. No se cambiaron reglas de negocio ni contratos de rutas. La cobertura compara el antiguo server.js contra el conjunto app.js + server.js: 134 líneas medibles antes y 131 + 3 después. El total comparable permanece en 313 líneas. Se mantienen db.js y main.jsx sin cubrir en el denominador.

## Validación adicional

- Frontend: npm run build aprobado tras los cambios.
- Backend: arranque real en puerto local asignado por el sistema (PORT=0), sin consultar la base de datos; proceso cerrado al observar el mensaje de inicio.
- No se conectó Neon ni se ejecutó seed. No hubo despliegues ni cambios remotos.
- OneDrive bloqueó la limpieza de una carpeta de reportes en una segunda ejecución. Se repitió correctamente con carpeta nueva. La configuración ahora genera una subcarpeta por ejecución para evitar sobrescribir reportes bloqueados.

## Reproducción

Desde la raíz de CitaWeb:

```powershell
npm.cmd test
npm.cmd run test:coverage
```

Los nuevos informes se guardan en coverage/current/run-<marca-de-tiempo>/. La evidencia de esta ejecución se conserva en docs/fase2/pruebas: resultados.json y cobertura/ (HTML, LCOV y JSON). La línea base permanece intacta en coverage/baseline. Su comando se niega a ejecutarse sobre código ya modificado.

## Límites pendientes

La revisión detectó posibles casos de fechas inexistentes y consultas asíncronas fuera de try/catch; este bloque no corrige ni certifica esos comportamientos. Quedan pendientes pruebas integrales de API, Sonar, CI/CD, carga, evidencia de PR/revisión y defensa. El incremento de cobertura no certifica ausencia de defectos.

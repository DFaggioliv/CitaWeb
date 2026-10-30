# Pruebas API — ejecución local aislada

Fecha: 30 de octubre de 2026. Resultado: **23 solicitudes ejecutadas, 0 fallidas; 69 aserciones aprobadas, 0 fallidas**.

## Artefactos

- Colección importable en Postman: tests/api/CitaWeb.postman_collection.json.
- Ejecución automatizada: scripts/run-api-local.mjs y comando npm run test:api:local desde la raíz.
- Evidencia sin tokens, contraseñas ni cuerpos de autenticación: docs/fase2/api/resultado-local.json.

Cada solicitud comprueba código HTTP, esquema JSON y contenido de negocio. Se cubren éxito y errores: credenciales incorrectas, falta de token, rol insuficiente, registro duplicado, longitud de nombre, conflicto de horario, reprogramación de cita confirmada, transición desde estado final y cancelación repetida.

## Flujo encadenado

Registro → login → perfil → disponibilidad → crear cita → conflicto por duplicación → listar → reprogramar → login administrativo → listado global → confirmar → rechazar reprogramación → atender → rechazar reactivación. Un segundo flujo crea y cancela una cita y verifica el rechazo de una segunda cancelación. Tokens e identificadores pasan entre solicitudes mediante variables; la fecha hábil se calcula respecto a Guatemala (UTC-6).

## Entorno y límites

Se ejecutaron las rutas reales de Express mediante HTTP local, con puerto asignado por el sistema. El controlador de base de datos se sustituyó únicamente en el ejecutor local por pg-mem, usando el esquema SQL del proyecto y un administrador temporal con contraseña aleatoria. El ejecutor proporciona las dos conversiones TO_CHAR usadas por las consultas. No se modificó el código productivo para activar este modo; no se leyó .env del backend, no se conectó Neon y no se conservaron usuarios/citas al finalizar el proceso.

Esto verifica el flujo HTTP y las aserciones con persistencia simulada; **no certifica compatibilidad completa con PostgreSQL real, despliegue cloud ni cumplimiento completo de E11**. La colección aún debe ejecutarse en CI contra PostgreSQL real de prueba. Los tiempos locales no son resultados de carga ni deben usarse para concluir cumplimiento de RNF-01.

## Reproducción local

```powershell
npm.cmd ci --prefix backend
npm.cmd run test:api:local
```

Requiere Node 24 (incluye registerHooks) y las dependencias fijadas de Newman y pg-mem. Debe permitirse comunicación HTTP entre procesos locales; no requiere administrador de Windows. El primer intento encontró restricciones de comunicación local y dos incompatibilidades del entorno de scripts de Newman; se corrigieron y la ejecución final indicada arriba terminó correctamente.

## Ejecutar en Postman o QA real

Importar la colección y configurar mediante un entorno privado: baseUrl (terminado en /api), adminEmail y adminPassword. Debe ser una API de QA con base de datos aislada y esquema inicializado; la colección crea un usuario y dos citas. No usar la base de producción para este flujo. Iniciar cada nueva corrida con las variables de ejecución vacías (runEmail, userToken, adminToken, appointmentId y cancelId), o importar la colección original; el ejecutor local siempre carga una copia nueva. Usar una base de datos efímera por corrida en CI para liberar los datos al terminar.

## Siguiente paso

Conectar las pruebas al pipeline con PostgreSQL de prueba real; preparar Sonar y controles de calidad. Para ello hará falta acceso del usuario a GitHub y Sonar, sin compartir contraseñas ni tokens por el chat.

# CitaWeb Fase 2
Automatización integración continua y calidad interna
Dino Alexander Faggioli Valenzuela | 0900-20-5088

## Índice

| Contenido | Página |
| --- | --- |
| Resultado y alcance | 3 |
| E9 Estrategia de ramas y cambios | 4 |
| E10 Unitarias y cobertura | 5 |
| E10 Dobles de prueba y línea base | 6 |
| E11 Pruebas de API | 7 |
| E12 Análisis estático y remediación | 8 |
| E13 Integración y despliegue continuo | 9 |
| E14 Pruebas de carga | 10 |
| E15 E16 y condiciones de cierre | 11 |
| Anexo de uso de inteligencia artificial | 12 |
| Referencias y reproducción | 13 |

El documento presenta resultados verificables y distingue los logros técnicos de las condiciones académicas pendientes. Los reportes históricos se conservan como evidencia, sin reemplazar las cifras finales.

## Resultado y alcance

La versión final de CitaWeb está publicada en producción y el pipeline completo aprobó. Se ejecutaron 133 pruebas unitarias y 23 solicitudes API con 69 aserciones. Sonar sobre main aprobó el quality gate con cero bugs, vulnerabilidades y code smells. La carga de QA cumplió el criterio de P95 de 2 segundos a 20 usuarios y completó cinco minutos a 50 usuarios sin errores.

Objeto evaluado: React 18 y Vite 6, Node.js 24 y Express, PostgreSQL en Neon, JWT y roles usuario/administrador. Código original addbcaa10645c35cf92caebae286b34ae72fb2e2; revisión productiva 7dd3b98d6b7579dc87c4727cb639adeae3e5b6a3.

| Entregable | Resultado y condición |
| --- | --- |
| E9 | Ramas y promociones protegidas. Más de tres PR integrados; revisión por otro integrante no entregada. |
| E10 | 133 unitarias y dobles en CI. Línea base 0 % reconstruida retrospectivamente, sin acreditar registro de septiembre. |
| E11 | 23 solicitudes encadenadas y 69 aserciones aprobadas con PostgreSQL real en CI. |
| E12 | Comparativa antes/después y gate main OK; cero Blocker/Critical abiertos. |
| E13 | QA y producción publicados por pipeline. DEV no tiene destino cloud configurado. |
| E14 | Dos endpoints medidos con 20 y 50 VUs; registro temporal y datos originales conservados. |
| E15 | Guía de ensayo preparada. Falta grabar y publicar defensa de Fase 2. |
| E16 | Bitácora individual redactada con la dificultad personal comunicada por el autor. |

No se declara cumplimiento académico total. La defensa y la revisión de otro integrante no se sustituyen por documentos técnicos. La línea base se identifica como retrospectiva. Las comprobaciones HTTP no equivalen a una interacción visual del navegador.

## E9 Estrategia de ramas y cambios

DEV concentra integración; QA valida promociones con infraestructura separada; main representa producción. QA y main exigen PR, control Calidad CitaWeb aprobado, actualización respecto a la base y prohibición de bypass. Require approvals quedó desmarcado para la modalidad individual. Esto no acredita revisión por otro integrante.

| PR | Contenido | Destino |
| --- | --- | --- |
| 1 | Unitarias y línea base | DEV |
| 2 | Colección API | DEV |
| 3 | Sonar e integración continua | DEV |
| 4 | Promoción completa validada | QA |
| 5 | Cobertura de rutas y errores asíncronos | DEV |
| 6 | Separación de controles push DEV y PR | DEV |
| 7 | Gate de PR para promociones idénticas | QA |
| 8 | Identidad de ejecución tras cerrar PR | QA |
| 9 | Comprobación estricta de destinos | QA |
| 10 | Evidencias de carga | QA |
| 11 | Promoción final | main |

Historial: https://github.com/DFaggioliv/CitaWeb/pulls?q=is%3Apr. Los commits se prepararon con asistencia de Codex bajo la cuenta del autor. No hay revisión independiente ni autorización del catedrático para sustituirla; ese requisito de E9 se declara no cubierto, sin inventar revisores.

GitHub rechazó una integración del PR 4 con HTTP 405 por control fallido, evidenciando la protección. DEV conserva una revisión anterior a ajustes posteriores de QA; debe sincronizarse mediante PR antes de nuevos desarrollos. No se afirma igualdad de las ramas.

## E10 Unitarias y cobertura

Vitest 5.0.5 y cobertura V8 ejecutan pruebas aisladas. La suite final aprobó en CI; los casos parametrizados se contabilizan como casos ejecutados distintos. Las aserciones API no se suman a las unitarias.

| Suite | Casos | Unidad |
| --- | --- | --- |
| appointments.test.js | 19 | Citas, conflictos y estados |
| auth.test.js | 8 | JWT y roles |
| routes.test.js | 39 | Rutas, validaciones y errores |
| utils.test.js | 35 | Fechas, horarios y reglas |
| promotion.test.js | 6 | Identidad y gate de promoción |
| deployment-target.test.js | 4 | Destinos QA y producción |
| api.test.js frontend | 22 | Cliente HTTP y rutas permitidas |
| Total | 133 | 111 backend/plataforma; 22 frontend |

| Archivo actual | Líneas | Porcentaje |
| --- | --- | --- |
| backend/src/app.js | 132 / 133 | 99.24 % |
| backend/src/auth.js | 12 / 12 | 100 % |
| backend/src/utils.js | 44 / 45 | 97.77 % |
| backend/src/db.js | 0 / 3 | 0 % |
| backend/src/server.js | 0 / 3 | 0 % |
| frontend/src/api.js | 35 / 35 | 100 % |
| frontend/src/main.jsx | 0 / 118 | 0 % |
| Total Vitest | 223 / 349 | 63.89 % |

El desglose procede del reporte local ampliado. Las diez pruebas posteriores de plataforma no cambian los archivos fuente incluidos en cobertura; la suite de 133 y el control de incremento aprobaron en CI. No hay cobertura unitaria de componentes visuales main.jsx ni conexión db.js.

## E10 Dobles de prueba y línea base

| Dependencia aislada | Ejemplo y justificación |
| --- | --- |
| PostgreSQL pool.query | Conflicto 23505 devuelve 409; consulta sin filas devuelve 404. Aísla red y motor para probar decisiones del handler. |
| fetch del frontend | Simula éxito, error de red y JSON inválido; verifica rutas y errores sin backend. |
| localStorage | Simula token presente/ausente para comprobar Authorization sin sesión real. |
| bcrypt en rutas | Controla comparación y hash para probar registro/login sin coste criptográfico en cada caso. |
| Reloj y respuesta Express | Fecha fija para límites +1/+30 días; espías status, json y next para verificar respuestas y propagación de errores. |

Los JWT se firman y verifican con la biblioteca real y secreto exclusivo de pruebas. Hay dobles en más de tres casos. Las pruebas de rutas invocan handlers aislados; Newman verifica por separado el flujo HTTP real y PostgreSQL de CI.

### Comparación de cobertura

El código original obtuvo retrospectivamente 0/313 líneas, 0 %. La medición final obtiene 223/349, 63.89 %: incremento agregado de 63.89 puntos porcentuales. Se mantiene el alcance lógico backend/src y frontend/src; server.js original se separó en app.js y arranque. El denominador aumentó por remediaciones. Solo seed-admin.js se excluye por ser inicialización operativa.

MC-01 autenticación, MC-02 validaciones, MC-03 gestión y MC-04 transiciones comparten app.js, auth.js y utils.js. No se atribuye el porcentaje de un archivo como medición independiente de cada módulo. MC-05 persistencia y MC-06 integración siguen visibles mediante db.js, api.js y main.jsx, incluyendo partes sin cubrir.

Limitación: la base se midió el 30 de octubre sobre el commit original. No demuestra el registro de septiembre exigido en la sección 2.4. Se conservan manifiestos y hashes sin retrodata. La aceptación académica de este contraste debe valorarse con esa condición.

## E11 Pruebas de API

Colección tests/api/CitaWeb.postman_collection.json ejecutada con Newman 6.2.3. Cada una de las 23 solicitudes comprueba estado HTTP, esquema y contenido: 69 aserciones. El pipeline final aprobó contra PostgreSQL 16 efímero, sin usar la base productiva.

| Solicitudes | Flujo y alternativas |
| --- | --- |
| 01 a 04 | Salud; registro válido; duplicado; nombre inválido. |
| 05 a 09 | Login incorrecto/correcto; perfil; rechazo sin token y sin rol admin. |
| 10 a 14 | Disponibilidad; crear pending; horario ocupado; listado propio; reprogramación. |
| 15 a 20 | Login admin; listado global; confirmar; rechazar reprogramación confirmada; atender; impedir reactivar estado final. |
| 21 a 23 | Crear otra cita; cancelar pending; rechazar cancelación repetida. |

La colección encadena tokens e identificadores recibidos y calcula fechas futuras hábiles en UTC-6. Valida el flujo completo y alternativas sin depender de IDs fijos. Los contratos comprueban campos y tipos además del estado HTTP.

### Ejecución local y CI

npm run test:api:local inicia Express temporal y pg-mem. Es HTTP con base emulada, no PostgreSQL real. GitHub Actions levanta PostgreSQL 16, prepara esquema e inicia el backend de la revisión evaluada antes de ejecutar Newman.

Evidencia: pipeline final 41163716026. La fase de calidad utiliza una base local efímera aunque el destino sea producción. Las cuentas y citas de la colección no se crean en Neon productivo.

Los secretos de CI son desechables y los reportes se sanitizan. Las 69 aserciones API no son pruebas unitarias ni mediciones de carga.

## E12 Análisis estático y remediación

Proyecto SonarQube Cloud DFaggioliv_CitaWeb. Estado inicial capturado el 30 de octubre antes de integrar Fase 2 en main original. El final usa el mismo proyecto y main 7dd3b98d6b7579dc87c4727cb639adeae3e5b6a3. No se compara un PR con el global.

| Métrica global Sonar | Inicial | Final |
| --- | --- | --- |
| Bugs | 4 | 0 |
| Vulnerabilidades | 2 | 0 |
| Code smells | 1 | 0 |
| Duplicación | 0.0 % | 0.0 % |
| Deuda técnica sqale_index | 20 min | 0 min |
| Quality gate | NONE | OK |
| Blocker/Critical abiertos | 0 | 0 |

Los siete hallazgos iniciales eran MINOR/MAJOR, sin Blocker/Critical. Se remediaron los siete; no se afirma corregir severidades inexistentes. La deuda de 20 minutos corresponde a sqale_index, no a sumar esfuerzos de todas las categorías.

| Regla | Corrección |
| --- | --- |
| S5689 | Desactivar x-powered-by en Express. |
| S8786 | Reemplazar validación de correo potencialmente costosa por comprobaciones acotadas. |
| S8476 | Reconstruir rutas permitidas y validar IDs/fechas antes de fetch. |
| S9011 y S9383 | Declarar tipo de botones y tratar explícitamente llamadas asíncronas. |

Gate final: cobertura de código nuevo 85.4 %, duplicación nueva 0 %, ratings A y hotspots nuevos revisados 100 %. Cobertura global Sonar combinada 62.2 %, líneas 61.8 % y ramas 62.8 %. No confundir código nuevo con cobertura global ni con 63.89 % de líneas Vitest.

Se añadieron regresiones para entradas maliciosas, correos y manejo de errores. No se redujeron los umbrales ni se excluyó lógica crítica adicional para aprobar.

## E13 Integración y despliegue continuo

GitHub Actions ejecuta en orden instalación reproducible y compilación, unitarias/cobertura, Sonar y gate, API PostgreSQL real, despliegue y comprobaciones HTTP. Publicar depende de calidad aprobada y no se ejecuta en PR.

| Ambiente | Destino y estado |
| --- | --- |
| DEV | Integración de código. No tiene destino cloud; falla cerrado si se intenta desplegar sin destino verificado. |
| QA | Render citaweb-api-qa, Neon CitaWeb-QA y Vercel citaweb-qa. Publicación aprobada en 41145778733. |
| PROD main | Render CitaWeb-api, base productiva existente y Vercel citaweb. Publicación final aprobada en 41163716026. |

### Integridad y secretos

Antes de publicar se comparan servicio Render, URL de salud, equipo y proyecto Vercel con los destinos permitidos. Render recibe el SHA aprobado, se espera live y se verifica ese commit. Vercel recibe el artefacto compilado por calidad. Los secretos se guardan en GitHub Environments y no se incluyen en la entrega.

PR y main se analizan directamente en Sonar. El plan de la organización rechazó consultas de ramas no main; la promoción QA consulta el gate del PR integrado, tras verificar identidad del árbol completo, SHA, rama, repositorio y ejecución aprobada. Se declara reutilización de análisis idéntico, no un nuevo análisis QA.

### Incidentes y correcciones

Un hook productivo guardado en QA publicó temporalmente código QA en producción. Se restauró main original, se comprobó salud y se añadió validación estricta con pruebas antes de reintentar. También se corrigió la raíz frontend/frontend de Vercel para artefactos precompilados. El despliegue final corresponde al destino y SHA correctos.

No se migraron datos ni se ejecutó carga sobre producción. La comprobación HTTP final aprobó HTML, JavaScript, URL API, CORS, salud y rechazo 401 de citas sin token.

## E14 Pruebas de carga

k6 v2.3.0 portátil, desde Windows, contra QA fa7f29881aecbc7495b3ae19655fa21be261ccd5. Ejecutado el 30 de octubre de 19:19 a 19:27 Guatemala, con salida 0 en ambos perfiles.

| VUs | Endpoint | Peticiones | Media ms | P95 ms | Req/s | Error |
| --- | --- | --- | --- | --- | --- | --- |
| 20 | Horarios | 1047 | 267.37 | 364.62 | 10.29 | 0 % |
| 20 | Citas | 1047 | 262.68 | 382.54 | 10.29 | 0 % |
| 50 | Horarios | 10729 | 247.16 | 319.57 | 31.34 | 0 % |
| 50 | Citas | 10729 | 245.00 | 294.40 | 31.34 | 0 % |

rnf20: rampa 0 a 20 en 30 s, meseta 60 s y bajada 10 s. RNF-01 exige P95 máximo de 2 s bajo carga de hasta 20 usuarios. Ambos endpoints cumplen en este ensayo; peor P95 382.54 ms.

load50: rampa 0 a 50 en 30 s, meseta configurada 300 s y bajada 10 s. Se registraron 300 muestras consecutivas a 50 VUs, de 19:21:59 a 19:26:58. La primera muestra inferior apareció 300.001 s después de la primera a 50. Con resolución de 1 s y finalización normal se corroboran cinco minutos sostenidos.

Las métricas agrupan cada ejecución, incluidas rampa y bajada, no solo la meseta. La tasa de error incluye HTTP fallido o contenido inválido; las prevalidaciones de salud/perfil no se suman a los contadores de estos endpoints.

### Alcance de la conclusión

Los VUs comparten una cuenta nueva con historial vacío y realizan lecturas desde un generador por Internet. No se prueban escrituras concurrentes, grandes historiales, múltiples cuentas, navegador ni arranque en frío. El escenario de 50 no transforma el criterio de 20 en otro requisito. RNF-02 de 99 % de disponibilidad durante todo el período no queda certificado.

Se conservan resúmenes JSON, muestras CSV, comprobación temporal y ZIP original con hashes SHA-256. Los JWT y contraseñas permanecen en memoria durante la carga y no forman parte de las evidencias.

## E15 E16 y condiciones de cierre

Los siguientes puntos se distinguen del resultado técnico para no presentar evidencia incompleta como cumplimiento total.

| Condición | Estado y acción |
| --- | --- |
| E15 defensa | Falta grabar una sola toma de máximo 10 minutos, con cámara, identificación y pipeline completo en vivo; publicar en YouTube público/no listado y pegar URL en el cuerpo de entrega. |
| E16 bitácora | Texto individual preparado con la dificultad de conexión de servicios comunicada por el autor; leer y ajustar antes de entregar. |
| Revisión por otro integrante | No se entrega esta revisión. El autor indicó que no consultó adaptación al catedrático; no se simulan revisores. |
| Línea base | La reconstrucción del 30 de octubre no reemplaza el registro original exigido. Se mantiene esa limitación. |
| DEV | Sincronizar ajustes de QA mediante PR antes de nuevos desarrollos; no hay destino cloud DEV. |
| Cobertura adicional | Futuras pruebas de interfaz, historial poblado y escrituras concurrentes. |

No se cerraron automáticamente los diez defectos de Fase 1 en Azure DevOps: esta fase no recuperó el detalle ni verificó su resolución. Tampoco se afirma cumplimiento de todos los RNF por tener pruebas unitarias, Sonar o carga aprobados.

### Defensa

La guía separada propone un ensayo de nueve minutos. No debe leerse en cámara. Durante la espera del pipeline se muestran PR, pruebas, Sonar y carga; antes de concluir debe comprobarse finalización real. El video de Fase 1 no sustituye la defensa de Fase 2.

El enlace de YouTube Fase 2 está pendiente. El paquete se identifica como PENDIENTE_VIDEO hasta incorporar la defensa y comprobar sus accesos.

## Anexo de uso de inteligencia artificial

La aplicación original fue generada con ChatGPT de OpenAI, según la declaración de Fase 1. Se adjunta la especificación original docs/AI_GENERATION_PROMPT.md: React/Vite, Express, PostgreSQL, JWT, roles y reglas de citas.

En Fase 2 se utilizó Codex de OpenAI para inspección, implementación y ajuste de pruebas, colección API, cobertura, remediación Sonar, configuración cloud, carga, diagnóstico y documentación. No se afirma escritura manual de cada línea por el estudiante.

| Entregables | Forma de asistencia |
| --- | --- |
| E9 y E13 | Preparación de ramas, PR, pipeline y configuración. El autor introdujo secretos y autorizó acceso público. |
| E10 y E11 | Generación de casos y dobles, ejecución de Vitest/Newman y análisis de reportes. |
| E12 | Diagnóstico y remediación de hallazgos, captura de métricas inicial/final de main. |
| E14 | Diseño y ejecución real de k6 en QA, análisis temporal y resultados. |
| Documentos | Síntesis y maquetación sobre evidencias. Bitácora adaptada con dificultad personal aportada por el autor. |

Ejemplos textuales de instrucciones del usuario: «Ok, procedamos con configurar las pruebas y medir la cobertura incial»; «Sigamos con el próximo paso»; «Me ayudas por favor». Son ejemplos de instrucciones de Fase 2, no historial completo ni prompts originales de generación de la aplicación.

La responsabilidad del contenido y la defensa corresponde al estudiante. La asistencia de IA no equivale a revisión independiente ni demuestra por sí sola comprensión. Se conservan las mediciones reales, sus límites y las tareas pendientes.

## Referencias y reproducción

Enunciado Proyecto Final Aseguramiento de la Calidad de Software 2026, UMG: pp. 7 y 8 E9 a E16; p. 9 defensa; p. 12 IA y formato. Fase1_Proyecto_Final_DF_5088, p. 14 RNF-01 y E2 módulos críticos. Fuentes suministradas por el estudiante.

Repositorio: https://github.com/DFaggioliv/CitaWeb

Producción: https://citaweb-iota.vercel.app

API: https://citaweb-api.onrender.com/api/health

QA: https://citaweb-qa-dfaggioliv.vercel.app

Sonar main: https://sonarcloud.io/summary/overall?id=DFaggioliv_CitaWeb&amp;branch=main

Pipeline final: https://github.com/DFaggioliv/CitaWeb/actions/runs/41163716026

PR final: https://github.com/DFaggioliv/CitaWeb/pull/11

### Comandos desde la raíz

npm ci --prefix backend

npm ci --prefix frontend

npm test

npm run test:coverage

npm run test:api:local

npm run build --prefix frontend

API local utiliza pg-mem; CI prepara PostgreSQL real. test:baseline solo debe ejecutarse sobre copia original con hashes coincidentes. Para carga, verificar SHA QA y consultar tests/load/README.md. K6_TESTED_COMMIT es una declaración del operador, no una comprobación automática del servidor.

GitHub Actions: seleccionar CitaWeb - calidad y despliegue y Run workflow sobre main para una demostración completa; si aprueba, vuelve a publicar esa revisión con PROD. Las ejecuciones previas están en Actions.

Evidencia: coverage/baseline; docs/fase2/pruebas; tests/api; docs/fase2/api; docs/fase2/sonar; .github/workflows/quality.yml; docs/fase2/prod; docs/fase2/carga y ZIP de k6. El paquete incluye copias seleccionadas, sin secretos ni dependencias.

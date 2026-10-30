# Línea base de cobertura — CitaWeb

Medición retrospectiva realizada el 30 de octubre de 2026 sobre código sin cambios funcionales del commit `addbcaa10645c35cf92caebae286b34ae72fb2e2` (25 de septiembre). No es un registro de septiembre ni sustituye el registro original exigido por la sección 2.4 del enunciado. Su aceptación para evaluar el incremento debe aclararse con el catedrático si no existe registro previo.

## Resultado inicial

**Líneas: 0 % (0/313). Sentencias: 0/327. Ramas: 0/180. Funciones: 0/81.**

El ZIP y el commit no contienen pruebas propias ni scripts de prueba. Vitest 5.0.5 con proveedor V8 incluye explícitamente los archivos de aplicación no ejecutados. El control de infraestructura solo verifica que el runner funciona: no importa código de negocio, no contacta PostgreSQL y no cuenta entre las 30 unitarias. El resultado de una comprobación de infraestructura aprobada NO demuestra calidad funcional de CitaWeb.

| Archivo | Líneas cubiertas/medibles | Cobertura |
|---|---:|---:|
| `backend/src/auth.js` | 0/12 | 0 % |
| `backend/src/db.js` | 0/3 | 0 % |
| `backend/src/server.js` | 0/134 | 0 % |
| `backend/src/utils.js` | 0/39 | 0 % |
| `frontend/src/api.js` | 0/7 | 0 % |
| `frontend/src/main.jsx` | 0/118 | 0 % |

## Alcance y módulos críticos

- MC-01: auth.js y autenticación en server.js.
- MC-02: utils.js y disponibilidad en server.js.
- MC-03/04: creación, reprogramación, cancelación y transiciones dentro de server.js.
- MC-05: db.js y persistencia de server.js.
- MC-06: api.js y main.jsx del frontend.

Los módulos comparten server.js: la cobertura por archivo no equivale a una medición independiente por módulo. El informe final deberá explicar esta correspondencia y mantener todo este alcance, incluso tras extraer unidades. Solo se excluye seed-admin.js, un script operativo de inicialización; no se excluye lógica de aplicación. HTML/CSS no forman parte de la cobertura JavaScript.

## Reproducción

Desde la raíz de CitaWeb, con Node 24 y dependencias del backend instaladas:

```powershell
npm.cmd ci --prefix backend
npm.cmd run test:baseline
```

La configuración de Vitest se añadió en Fase 2; no existía en el commit original. El script valida los hashes de todos los archivos de src contra el manifiesto guardado: si cambia el código, se niega a sobrescribir la línea base. Para repetirla después de los cambios, usar otra copia del ZIP original y estas herramientas de medición. No crear una línea base nueva con el código ya mejorado.

Los reportes están en coverage/baseline: index.html para lectura, coverage-summary.json para cifras, coverage-final.json y lcov.info para herramientas, execution.txt y metadata.json para fecha, versión, commit y hashes. La carpeta baseline se conserva como evidencia; coverage/current está ignorada en Git para evitar mezclar ejecuciones posteriores.

La instalación de Vitest y coverage-v8 terminó correctamente y actualizó el lockfile del backend. Se fijaron ambas versiones en 5.0.5. La instalación limpia completa desde cero todavía debe comprobarse en CI.

## Próxima medición

```powershell
npm.cmd test
npm.cmd run test:coverage
```

Estos comandos apuntan a backend/tests y frontend/tests; las suites de aplicación todavía están pendientes. No incluyen el control de infraestructura de baseline. El objetivo mínimo de incremento es pasar de 0 a por lo menos 20 % de cobertura en el alcance crítico comparable, además de cumplir las 30 unitarias y los tres mocks exigidos; el conteo por sí solo no asegura cobertura suficiente. Mostrar resultados por archivo y correspondencia con MC-01 a MC-06, no solo un agregado que oculte módulos sin cubrir.

No se han modificado las reglas de negocio, conectado Neon ni desplegado cambios. No se usaron permisos de administrador de Windows.

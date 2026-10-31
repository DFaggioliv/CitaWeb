# CitaWeb

Aplicación de gestión de citas evaluada en Aseguramiento de la Calidad de Software. Monorepo con React/Vite en frontend, Express/Node.js 24 en backend, PostgreSQL en Neon y JWT con roles user/admin.

## Aplicación y evidencias

- Producción: https://citaweb-iota.vercel.app
- API salud: https://citaweb-api.onrender.com/api/health
- QA: https://citaweb-qa-dfaggioliv.vercel.app
- Sonar: https://sonarcloud.io/summary/overall?id=DFaggioliv_CitaWeb&branch=main
- Pipeline productivo validado: https://github.com/DFaggioliv/CitaWeb/actions/runs/41163716026
- Informe consolidado: [docs/fase2/Informe_final.md](docs/fase2/Informe_final.md)

## Instalación y ejecución local

Requiere Node.js 24 y PostgreSQL. Desde la raíz:

```powershell
npm ci --prefix backend
npm ci --prefix frontend
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

Configurar backend/.env con DATABASE_URL local, JWT_SECRET propio, FRONTEND_URL=http://localhost:5173 y PORT=3000. Configurar frontend/.env con VITE_API_URL=http://localhost:3000/api. No publicar estos archivos ni usar datos productivos para pruebas. Crear una base vacía y ejecutar backend/sql/init.sql con el cliente PostgreSQL elegido.

En terminales separadas:

```powershell
npm run dev --prefix backend
npm run dev --prefix frontend
```

Para crear un administrador solo en una base local o QA propia, configurar ADMIN_EMAIL/ADMIN_PASSWORD y ejecutar npm run seed --prefix backend. No ejecutar seed ni init contra producción por defecto.

## Pruebas y compilación

```powershell
npm test
npm run test:coverage
npm run test:api:local
npm run build --prefix frontend
```

La suite final tiene 133 casos: 111 backend/plataforma y 22 frontend. Vitest 5.0.5 y V8 miden líneas globales de aplicación: 223/349, 63.89 %. Incluye archivos sin cubrir. El informe explica alcance, mocks y limitaciones. Los reportes de 62, 84 y 123 pruebas son etapas históricas.

La API local ejecuta 23 solicitudes y 69 aserciones con Newman sobre Express HTTP y pg-mem. CI usa PostgreSQL 16 real y efímero. Son niveles distintos de las unitarias.

La línea base 0/313 es retrospectiva sobre el commit original addbcaa10645c35cf92caebae286b34ae72fb2e2. npm run test:baseline solo debe ejecutarse en una copia original con hashes coincidentes; se niega a sobrescribir la base si cambió el código. No reemplaza el registro académico original de septiembre.

## Pipeline y ramas

.github/workflows/quality.yml ejecuta compilación, unitarias/cobertura, Sonar y gate, API y despliegue. Los PR ejecutan calidad sin publicación. Los push QA/main publican únicamente después de aprobar. Para demostrarlo en GitHub: Actions → CitaWeb - calidad y despliegue → Run workflow → main. Esta acción puede volver a publicar el mismo commit con el ambiente PROD.

QA y main tienen protección con PR, Calidad CitaWeb, rama actualizada y sin bypass. DEV es integración y no tiene destino cloud configurado; necesita sincronizar los ajustes posteriores antes de nuevos desarrollos. No se entrega revisión de otro integrante; la autorrevisión asistida no la sustituye.

QA y PROD requieren variables VITE_API_URL, BACKEND_HEALTH_URL, VERCEL_ORG_ID y VERCEL_PROJECT_ID; secretos RENDER_DEPLOY_HOOK_URL, RENDER_API_KEY y VERCEL_TOKEN. SONAR_TOKEN se guarda en GitHub. No incluir valores secretos en código o evidencias. El pipeline comprueba destinos y revisión exactos antes de publicar.

Sonar analiza PR y main. Por la limitación de ramas del plan, la promoción QA verifica el gate del PR integrado con contenido idéntico, ejecución aprobada y metadatos exactos. No omite el gate ni lo presenta como análisis nuevo de rama.

## Sonar y carga

Sonar main validado: 0 bugs, 0 vulnerabilidades, 0 code smells y gate OK. Cobertura de código nuevo 85.4 %, global Sonar combinada 62.2 %; no confundir con cobertura Vitest.

La carga en QA evaluó horarios y citas propias a 20 y 50 VUs, incluyendo cinco minutos sostenidos a 50. Cero errores; RNF-01 cumplido en el ensayo de 20. Véanse [resultados](docs/fase2/carga/Resultados.md), [metodología](docs/fase2/carga/Metodologia.md) y [reproducción](tests/load/README.md). Una identidad compartida e historial vacío no representan todas las cargas posibles ni certifican disponibilidad de 99 %.

## Declaración de IA y estado académico

La aplicación original declara generación con ChatGPT en [docs/AI_GENERATION_PROMPT.md](docs/AI_GENERATION_PROMPT.md). Fase 2 utilizó Codex para implementación, diagnóstico, ejecución y documentación bajo instrucciones del autor. El informe declara ese alcance y la responsabilidad de revisión y defensa del estudiante.

El video de Fase 2 está pendiente de grabación/publicación. No se sustituye con el video de Fase 1 ni se afirma cierre académico total. Documentación PDF y paquete final se entregan por la plataforma del curso.

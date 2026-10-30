# Preparación de Sonar, CI/CD y estrategia de ramas

Fecha: 30 de octubre de 2026. Estado: archivos locales preparados y validación estática aprobada. **No se ha ejecutado GitHub Actions ni Sonar; no hay un gate aprobado, despliegue nuevo ni protecciones remotas confirmadas.** GitHub ya está conectado y se verificó el remoto: main conserva el commit original, sin protección. Todavía no se dispone del proyecto/token de Sonar.

## Archivos preparados

- .github/workflows/quality.yml: compilación → unitarias/cobertura → Sonar/gate → API con PostgreSQL 16 efímero → despliegue por ambiente.
- sonar-project.properties: análisis backend/frontend y pruebas; importación de LCOV; espera obligatoria del gate. No se ocultan fuentes críticas. Se excluye de cobertura únicamente el script operativo seed-admin.js, igual que en Vitest.
- scripts/check-coverage.mjs: verifica incremento agregado mínimo de 20 puntos porcentuales y presencia del alcance crítico. No reemplaza la revisión del informe por módulo.
- scripts/init-api-ci.mjs: inicializa exclusivamente PostgreSQL local con nombre citaweb_ci; no acepta Neon ni otra base externa.
- scripts/run-api-ci.mjs: ejecuta la colección de 23 solicitudes sobre la API local con PostgreSQL real de CI y guarda un resumen sin credenciales.
- scripts/export-sonar.mjs: exporta métricas, gate y hallazgos Blocker/Critical para conservar evidencia inicial y posterior. Si el servicio rechaza una consulta, falla y deja el error visible.
- scripts/check-deploy-config.mjs, deploy-render.mjs y package-vercel.mjs: comprueban configuración, despliegan el commit exacto en Render, esperan estado live y health check, y empaquetan el frontend compilado para Vercel.

## Paso inmediato del usuario

1. GitHub conectado y repositorio DFaggioliv/CitaWeb verificado. No compartir contraseñas ni tokens en el chat.
2. Iniciar sesión en SonarQube Cloud con GitHub e importar CitaWeb; si no existe cuenta, crearla. Compartir solo organization key y project key (identificadores públicos), o indicar que el proyecto está abierto para guiar la configuración.
3. Crear el token de análisis directamente en Sonar y guardarlo como secreto SONAR_TOKEN en GitHub, Settings → Secrets and variables → Actions. No copiarlo en archivos del repositorio. Confirmar la región/host del proyecto, sin asumir que un proyecto de otra región usa sonarcloud.io.

Sonar requiere análisis desde CI para importar cobertura LCOV. Desactivar Automatic Analysis si estaba activado. Al realizar el primer análisis, conservar el artefacto sonar.json como estado inicial antes de corregir hallazgos. Registrar commit y fecha reales; no inventar un análisis inicial en septiembre.

## Variables de GitHub

Variables de repositorio: SONAR_ORGANIZATION, SONAR_PROJECT_KEY y SONAR_HOST_URL (por defecto https://sonarcloud.io si corresponde a la región del proyecto). Secreto de repositorio: SONAR_TOKEN.

El proyecto y su plan de Sonar deben admitir los análisis de las ramas/PR que se van a usar. Si el servicio rechaza una rama por limitaciones del plan, no omitir el análisis ni convertir el fallo en aprobación: revisar un servidor SonarQube disponible o una configuración compatible con las condiciones del curso.

Crear ambientes GitHub DEV, QA y PROD. Para cada uno, configurar:

| Tipo | Nombre | Uso |
|---|---|---|
| Variable | VITE_API_URL | URL pública de la API de ese ambiente, terminada en /api; se incorpora al frontend durante compilación |
| Variable | BACKEND_HEALTH_URL | URL HTTPS de ese backend terminada en /api/health |
| Variable | VERCEL_ORG_ID | Organización/cuenta propietaria del proyecto Vercel |
| Variable | VERCEL_PROJECT_ID | Proyecto Vercel exclusivo del ambiente |
| Secreto | RENDER_DEPLOY_HOOK_URL | Hook secreto del servicio Render de ese ambiente |
| Secreto | RENDER_API_KEY | Permite consultar el resultado del despliegue en Render |
| Secreto | VERCEL_TOKEN | Permite publicar en el proyecto correspondiente |

La API de CI usa PostgreSQL efímero del propio runner, no estos datos cloud. Las contraseñas visibles del servicio PostgreSQL son desechables y no corresponden a Neon ni producción.

Para separación real, usar servicios/bases cloud y proyectos Vercel distintos por ambiente. El comando Vercel --prod publica el dominio estable del proyecto específico de DEV, QA o PROD; no deben apuntar los tres ambientes al mismo proyecto. Revisar si los límites de las cuentas permiten estos recursos antes de crearlos. La configuración local no demuestra separación operativa por sí sola.

## Política propuesta de promoción

feature/* → DEV → QA → main (PROD). Los cambios entran mediante PR. DEV es integración, QA valida y main conserva la versión liberada. PROD es el ambiente de main; no hace falta mantener una rama PROD adicional si se elige main como rama productiva. El workflow también admite una rama PROD si ya existe, pero no mantener dos fuentes distintas de producción.

Crear DEV y QA a partir de una referencia remota verificada, sin reescribir historial. La copia del ZIP solo tiene el commit inicial y no confirma el estado actual del remoto. Antes de publicar, consultar las ramas y cambios actuales y conservar las contribuciones existentes.

Exigir en QA y main el check **Calidad CitaWeb**, PR antes de merge, conversaciones resueltas y bloqueo de bypass incluso para administradores cuando corresponda. El nombre del check debe seleccionarse después de la primera ejecución real. Una política escrita o un archivo YAML no activa estas protecciones: deben guardarse y verificarse en GitHub. Probar que un check fallido impide el merge.

Se exigen tres PR con revisión efectiva de otro integrante. La modalidad individual sigue requiriendo aclaración del catedrático; no registrar autorrevisiones como revisiones de otro integrante ni fabricar evidencia.

## Despliegue y evidencia

Desactivar o ajustar despliegues automáticos independientes de Git para que Render/Vercel no publiquen cambios saltándose las pruebas. Revisar ese ajuste con las cuentas del usuario; todavía no se modificó. El pipeline de PR termina tras calidad y no despliega. En push a DEV/QA/main, el despliegue depende de que calidad apruebe.

Render recibe el SHA del commit aprobado mediante ref; el script espera estado live y /api/health correcto. Vercel recibe el artefacto estático compilado en ese mismo workflow, sin recompilar otro estado del repositorio. Si faltan credenciales, el despliegue falla con mensaje explícito; no se considera completado.

Los artefactos de Actions conservan cobertura, resultados de unitarias/API, metadatos del scanner, exportación Sonar y evidencia del despliegue. Guardar la primera ejecución Sonar como inicial, corregir Blocker/Critical que realmente reporte y comparar con la ejecución posterior. No hay todavía cifras de bugs, vulnerabilidades, smells, duplicación o deuda: solo Sonar puede aportar esos resultados.

## Verificaciones locales realizadas

- YAML analizado correctamente con parser YAML 1.2; disparadores, dependencia entre trabajos y orden de etapas comprobados.
- Sintaxis JavaScript de los scripts aprobada con node --check.
- Control de cobertura aprobado sobre evidencia existente: +38.97 puntos porcentuales.
- Artefacto Vercel generado correctamente desde el frontend compilado localmente; esto no es un despliegue.

Falta verificar instalación limpia en Linux, ejecución contra PostgreSQL real, Sonar, gate, publicación, smoke tests cloud, reglas de protección y separación de ambientes. No se ejecutó ningún despliegue ni se cambiaron datos de Neon.

## Fuentes oficiales consultadas

- https://github.com/SonarSource/sonarqube-scan-action
- https://docs.sonarsource.com/sonarqube-cloud/analyzing-source-code/test-coverage/javascript-typescript-test-coverage
- https://docs.github.com/en/actions/tutorials/use-containerized-services/create-postgresql-service-containers
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches
- https://render.com/docs/deploy-hooks
- https://api-docs.render.com/reference/retrieve-deploy
- https://vercel.com/docs/cli/deploy

Se fijó vercel@65.8.0 tras consultar la versión publicada. Los servicios externos todavía no se han configurado ni ejecutado.

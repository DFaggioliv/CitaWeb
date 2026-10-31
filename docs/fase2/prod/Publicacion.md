# Publicación productiva de Fase 2

Fecha local: 30 de octubre de 2026, aproximadamente 21:20, Guatemala.

- PR de promoción: https://github.com/DFaggioliv/CitaWeb/pull/11 (QA → main, integrado con control requerido aprobado).
- Commit final: 7dd3b98d6b7579dc87c4727cb639adeae3e5b6a3.
- Pipeline: https://github.com/DFaggioliv/CitaWeb/actions/runs/41163716026 . Calidad y despliegue aprobados.
- Frontend público: https://citaweb-iota.vercel.app . Vercel dpl_9uGB2wzyruw78qHyGkHEojWNUyck READY, commit exacto.
- Backend: https://citaweb-api.onrender.com . Render dep-dbilsblg1s2s73dke9gg live, commit exacto.

133 unitarias aprobadas, 23 solicitudes API y 69 aserciones contra PostgreSQL efímero en CI. La colección API y la carga no se ejecutaron contra la base productiva. No se realizaron migraciones de datos productivos.

Sonar main del commit final: quality gate OK, 0 bugs, 0 vulnerabilidades, 0 code smells y 0 Blocker/Critical abiertos. Antes de integrar Fase 2: 4 bugs, 2 vulnerabilidades y 1 code smell. Cobertura de código nuevo 85.4 %. Cobertura global combinada Sonar 62.2 %, de líneas Sonar 61.8 % y ramas 62.8 %. Estas métricas no deben confundirse con la cobertura de líneas de Vitest (63.89 %), dado que las herramientas difieren en instrumentación y cómputo. Evidencia: ../sonar/estado-final-main.json, contrastada contra ../sonar/estado-inicial-main.json.

El usuario guardó 3 secretos y 4 variables del ambiente PROD directamente en GitHub y autorizó desactivar SSO de Vercel para acceso público. El inicio de sesión propio de CitaWeb continúa vigente. Se configuró el origen https://citaweb-iota.vercel.app en Render y raíz null en Vercel, porque CI publica un artefacto precompilado desde frontend. Render queda con despliegue automático directo desactivado: publica el pipeline tras aprobar calidad.

Comprobación HTTP posterior: salud, HTML, archivo JavaScript, URL API compilada, CORS y respuesta 401 de citas sin autenticación, todos aprobados. Ver smoke-final.json. No equivale a interacción visual del navegador, pendiente de comprobación manual/video.

Pendientes del cierre: sincronizar DEV con QA/operación final, completar informe, bitácora individual, declaración de IA, PDFs y ZIP final, video con cámara y enlace YouTube; confirmar adaptación académica del requisito de revisión por otro integrante y carácter retrospectivo de la línea base. No afirmar cumplimiento total de la rúbrica antes de resolver esas condiciones.

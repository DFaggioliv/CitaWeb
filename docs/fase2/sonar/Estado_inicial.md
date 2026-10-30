# Sonar: estado inicial confirmado

Consulta pública del 30 de octubre de 2026. Organización dfaggioliv; proyecto DFaggioliv_CitaWeb. Análisis inicial del 30 de octubre a las 15:10 de Guatemala, revisión addbcaa10645c35cf92caebae286b34ae72fb2e2 (código original de septiembre).

| Métrica | Inicial |
|---|---:|
| Bugs | 4 |
| Vulnerabilidades | 2 |
| Code smells | 1 |
| Duplicación | 0.0 % |
| Deuda técnica (sqale_index, minutos) | 20 |
| Cobertura importada | No reportada; no equivale a 0 % medido por Sonar |
| Hallazgos abiertos Blocker/Critical | 0 |
| Estado de quality gate | NONE; no aprobado |

La suma de esfuerzos visibles de los siete hallazgos no debe confundirse con sqale_index: la métrica de deuda técnica corresponde a mantenibilidad.

Hallazgos: exposición implícita de Express (S5689), regex de email con posible retroceso excesivo (S8786), URL de fetch con entrada no saneada (S8476), dos botones sin tipo explícito (S9011) y dos promesas sin manejo explícito (S9383). Ninguno tiene severidad Blocker o Critical en el análisis inicial. Conservar estos hallazgos y su revisión original antes de remediar.

Los JSON estado-inicial-main.json y hallazgos-iniciales-main.json conservan respuestas de la API pública. El proyecto ya existe, pero todavía falta ejecutar el análisis desde GitHub con token y cobertura. Debe desactivarse Automatic Analysis si estaba activo. No presentar NONE como gate aprobado ni como evidencia de ejecución CI.

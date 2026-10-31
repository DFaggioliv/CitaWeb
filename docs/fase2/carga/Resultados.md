# Resultados de carga — CitaWeb QA

Fecha: 30 de octubre de 2026, hora de Guatemala. Ejecución desde 30/10/2026, 7:19:43 p. m. hasta 30/10/2026, 7:27:09 p. m.. Revisión desplegada: fa7f29881aecbc7495b3ae19655fa21be261ccd5. Herramienta: k6 v2.3.0.

## Resultados por endpoint

| VUs objetivo | Endpoint | Solicitudes | Promedio (ms) | P95 (ms) | Solicitudes/s | Error |
|---|---|---:|---:|---:|---:|---:|
| 20 | Horarios disponibles | 1047 | 267.37 | 364.62 | 10.29 | 0.00 % |
| 20 | Citas propias | 1047 | 262.68 | 382.54 | 10.29 | 0.00 % |
| 50 | Horarios disponibles | 10729 | 247.16 | 319.57 | 31.34 | 0.00 % |
| 50 | Citas propias | 10729 | 245.00 | 294.40 | 31.34 | 0.00 % |

Los valores agrupan cada ejecución completa (rampa, meseta y bajada); no representan exclusivamente la meseta. El conteo corresponde a los endpoints medidos, sin sumar salud y perfil de prevalidación.

## Contraste con requisitos

RNF-01: cumplido en este ensayo: ambos P95 del perfil de hasta 20 VUs son menores de 2000 ms. Se aprobaron las comprobaciones HTTP y de contenido con cero errores.

E14: escenario adicional 0 → 50 VUs ejecutado normalmente, con etapa configurada de 300 s a 50. El registro tiene 300 muestras consecutivas a 50 VUs, desde 30/10/2026, 7:21:59 p. m. hasta 30/10/2026, 7:26:58 p. m.; la primera muestra inferior aparece 300.001 s después de la primera a 50. La resolución de muestreo es de 1 s. Este registro, la configuración y la finalización normal corroboran la etapa de cinco minutos.

Estado de ambas ejecuciones: aprobadas, código de salida k6 0. No se convierte el límite RNF-01 de 20 usuarios en una obligación para 50.

## Alcance y límites

QA utiliza recursos gratuitos de Render y Neon. Las solicitudes salen de un único equipo Windows por Internet. Los VUs comparten una cuenta nueva de QA y su historial está vacío; no se mide una población de cuentas diferentes, escrituras concurrentes ni grandes volúmenes de citas. El servicio se comprueba antes de medir y no se evalúa el arranque en frío. Los resultados no certifican disponibilidad de 99 % durante todo el período de evaluación ni tiempos completos del navegador.

## Evidencias

- Metodologia.md: diseño, umbrales y limitaciones.
- ejecucion.json: revisión, horarios y códigos de salida, sin credenciales.
- rnf20-report.json y load50-report.json: métricas resumidas por endpoint.
- rnf20-summary.json y load50-summary.json: resúmenes originales de k6.
- verificacion-temporal.json y usuarios-*.csv: contraste de usuarios activos.
- manifiesto.json: hashes SHA-256 y tamaños de registros originales conservados en el ZIP de evidencia.

El guion de video puede mostrar la revisión de QA, el comando reproducible, estos resultados y el registro temporal. No presentar resultados como si correspondieran a producción.

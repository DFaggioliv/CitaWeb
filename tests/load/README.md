# Pruebas de carga de CitaWeb

Las ejecuciones de QA del 30 de octubre de 2026 están completas: ambos perfiles terminaron con código k6 0 y cero errores. Ver [resultados](../../docs/fase2/carga/Resultados.md) y [metodología](../../docs/fase2/carga/Metodologia.md).

- rnf20: rampa de 0 a 20 VUs en 30 s, meseta de 60 s y descenso de 10 s. P95 por endpoint ≤ 2000 ms.
- load50: rampa de 0 a 50 VUs en 30 s, meseta de 300 s y descenso de 10 s. Comprueba contenido y errores; informa latencia como escenario adicional.

Para reproducir, confirmar primero en Render que la revisión QA coincide con la que se registrará. k6 v2.3.0 portátil está en ../tools/k6/k6.exe y no necesita instalación como administrador. Desde la raíz del proyecto, definir K6_TESTED_COMMIT con el SHA verificado y ejecutar:

```powershell
$env:K6_TESTED_COMMIT = '<SHA comprobado en Render QA>'
node scripts/run-load-qa.mjs
node scripts/analyze-load-evidence.mjs
node scripts/build-load-report.mjs
```

El ejecutor crea una cuenta exclusivamente en QA y mantiene contraseña/JWT en memoria. Los VUs comparten la cuenta y consultan disponibilidad y citas propias sin modificarlas. El ejecutor solo admite la URL fija de QA; no cambiarla por producción. K6_TESTED_COMMIT es una declaración del operador y debe contrastarse con Render antes de ejecutar. El ejecutor no tiene credenciales de administración para verificarlo por sí mismo.

Conservar métricas, códigos de salida y registro temporal aunque falle un umbral. Los resultados del perfil completo incluyen rampa y bajada, no son exclusivos de la meseta. El registro de usuarios activos se usa para corroborar la etapa sostenida; no basta declarar scheduledHoldSeconds. Una prueba breve no demuestra disponibilidad del 99 % en todo el período.

Los registros temporales originales se conservan en el ZIP local de evidencias con hashes SHA-256, evitando subir más de 100 MB de muestras al repositorio.

# Metodología de carga — CitaWeb QA

E14 se ejecuta en el ambiente QA, con k6 v2.3.0 portátil desde Windows. Backend Render gratuito en Oregon y PostgreSQL Neon QA separado. Revisión desplegada comprobada antes de iniciar: fa7f29881aecbc7495b3ae19655fa21be261ccd5. No se genera carga contra producción.

Se crea una cuenta exclusiva de QA con contraseña aleatoria y se mantiene su JWT solo en memoria. Los usuarios virtuales comparten esa identidad; no representan 50 cuentas diferentes. Durante la medición se consultan GET /api/slots?date=<día hábil> y GET /api/appointments, con pausa de un segundo entre iteraciones. No se crean ni modifican citas durante la carga. La cuenta nueva tiene una lista de citas vacía, por lo que estos resultados no representan grandes historiales ni contención de escrituras.

- Perfil rnf20: 0 → 20 VUs en 30 s, 20 durante 60 s, descenso durante 10 s. Umbral P95 ≤ 2000 ms por endpoint, contenido válido y cero errores.
- Perfil load50: 0 → 50 VUs en 30 s, 50 durante 300 s, descenso durante 10 s. Comprueba contenido válido y cero errores; se informa latencia sin convertir el límite de 20 usuarios en una obligación a 50.

RNF-01 exige que el 95 % de solicitudes HTTP responda en un máximo de 2 s hasta 20 usuarios concurrentes (Fase 1, página 14). La conclusión usa el perfil rnf20. RNF-02 de disponibilidad de 99 % durante el período de evaluación no se puede certificar mediante esta prueba breve.

El promedio y P95 provienen de la duración HTTP de cada endpoint en toda su ejecución, incluidas rampa y bajada; no son métricas exclusivas de la meseta ni tiempos completos del navegador. El throughput es el contador de solicitudes dividido por la duración de la ejecución medida por k6. Se realiza un control de salud y autenticación antes de medir; la prueba no evalúa el arranque en frío.

La salida JSON temporal conserva muestras de usuarios activos aproximadamente cada segundo. Se contrasta la configuración de 300 s, finalización normal y continuidad de las muestras a 50 VUs. La resolución de muestreo impone un margen cercano a un segundo al describir los límites de la meseta. Los resultados originales se conservan aunque incumplan umbrales. Los archivos de evidencia no incluyen JWT ni contraseñas.

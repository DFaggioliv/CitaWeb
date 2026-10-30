# Remediación de hallazgos iniciales

Se conserva el análisis original en estado-inicial-main.json y hallazgos-iniciales-main.json, revisión addbcaa10645c35cf92caebae286b34ae72fb2e2: 4 bugs, 2 vulnerabilidades, 1 code smell, 0 % duplicación y 20 minutos de deuda. No había Blocker/Critical abiertos.

| Hallazgo | Cambio implementado |
|---|---|
| S5689, exposición de Express | app.disable('x-powered-by') y prueba de la configuración |
| S8786, retroceso excesivo de regex de email | Validación por separación de usuario/dominio y recorrido lineal, sin regex anidada; pruebas de entradas inválidas y una entrada extensa |
| S8476, ruta no saneada del cliente HTTP | Lista de rutas permitidas, reconstrucción de rutas con identificadores codificados y query de fecha controlada; rechazo de URLs absolutas, rutas relativas y parámetros inesperados antes de enviar el token |
| S9011, dos botones | type=submit explícito conservando su función en el formulario |
| S9383, dos promesas | void refresh() explícito; refresh ya captura errores y actualiza el mensaje |

Validación local: 79 pruebas aprobadas (62 backend y 17 frontend), 0 fallidas. Cobertura de líneas: 148/339 = 43.65 %, frente a 0 % de la línea base retrospectiva. La remediación añadió lógica de validación y nuevas líneas; se mantiene el alcance de archivos/módulos y por eso el denominador aumentó respecto a las 313 líneas anteriores. No reducir el alcance para simular una mejora. La interfaz main.jsx continúa sin cobertura unitaria; la revisión visual de los botones no se presenta como prueba automatizada.

Frontend compilado tras los cambios. La API real de PostgreSQL se validó antes de estas remediaciones en GitHub Actions, ejecución 41129652697, intento 2: gate Sonar PASSED y 23 solicitudes/69 aserciones aprobadas. El nuevo commit deberá volver a validar Sonar y la colección API para confirmar que la remediación no introduce regresiones.

Esta tabla describe correcciones implementadas; la resolución efectiva de cada hallazgo la debe confirmar el análisis posterior de Sonar. No se marca un hallazgo como resuelto por modificar su severidad ni desactivar reglas.


## Refuerzo de saneamiento de rutas

La ejecución 41132388750 sobre 4c77b8a9b3a7b782408ded7ba4c7a7fb85d1443b rechazó el gate por S8476: Sonar seguía considerando contaminado un identificador reconstruido con encodeURIComponent. La cobertura nueva sí pasó con 80.3 % y duplicación nueva 0 %. Se reforzó la validación convirtiendo los identificadores a enteros seguros positivos y reconstruyendo la fecha desde sus componentes numéricos. No se suprimió la regla ni se relajó el gate.

Después del refuerzo: 84 pruebas locales aprobadas (62 backend y 22 frontend), 0 fallidas; cobertura de líneas 157/348 = 45.11 %. Frontend compilado correctamente. Los reportes previos de 79 casos se conservan como evidencia intermedia y no representan esta ejecución final. El siguiente análisis CI debe confirmar el resultado del nuevo código.

# Declaración de generación con IA

Herramienta utilizada: ChatGPT (OpenAI).

## Especificación utilizada

Generar una aplicación web cliente-servidor denominada **CitaWeb**, destinada a la
gestión de citas. Debe separar claramente frontend y backend y utilizar React + Vite
en frontend, Node.js + Express en backend y PostgreSQL como base de datos.

La aplicación debe incluir autenticación con dos roles: usuario y administrador.

El usuario debe poder:
1. Registrarse.
2. Iniciar sesión.
3. Consultar horarios disponibles.
4. Crear una cita.
5. Reprogramar una cita pendiente.
6. Cancelar una cita pendiente o confirmada.
7. Consultar historial de citas.

El administrador debe poder:
1. Iniciar sesión.
2. Consultar todas las citas.
3. Confirmar citas pendientes.
4. Marcar citas confirmadas como atendidas.
5. Cancelar citas.

Reglas de negocio:
- Nombre de 3 a 50 caracteres.
- Contraseña de 8 a 64 caracteres.
- Motivo de 10 a 200 caracteres.
- Citas únicamente de 1 a 30 días a futuro.
- No se permiten sábados ni domingos.
- Horarios entre 08:00 y 17:00, en intervalos de 30 minutos.
- No debe existir más de una cita activa para el mismo horario.
- Solo una cita pendiente puede reprogramarse.
- Transiciones válidas: pending -> confirmed -> attended; pending/confirmed -> cancelled.
- Estados attended y cancelled son finales.

La aplicación debe incluir validaciones del lado del servidor, autenticación JWT,
persistencia en PostgreSQL, una interfaz sencilla y documentación suficiente para
ser evaluada mediante técnicas de partición de equivalencia, análisis de valores
límite, tabla de decisión y transición de estados.

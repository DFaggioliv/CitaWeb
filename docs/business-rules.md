# Reglas de negocio de CitaWeb

| Código | Regla |
|---|---|
| RN-01 | El nombre debe contener entre 3 y 50 caracteres. |
| RN-02 | La contraseña debe contener entre 8 y 64 caracteres. |
| RN-03 | El motivo de la cita debe contener entre 10 y 200 caracteres. |
| RN-04 | Una cita debe programarse entre 1 y 30 días a futuro. |
| RN-05 | No se aceptan citas sábados ni domingos. |
| RN-06 | Los horarios permitidos son de 08:00 a 17:00 en intervalos de 30 minutos. |
| RN-07 | No pueden existir dos citas activas en el mismo día y hora. |
| RN-08 | Solo las citas pendientes pueden reprogramarse. |
| RN-09 | Las transiciones válidas son pending -> confirmed -> attended y pending/confirmed -> cancelled. |
| RN-10 | Una cita atendida o cancelada se considera final. |

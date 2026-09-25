# Arquitectura de alto nivel

## Contexto

CitaWeb permite que usuarios gestionen citas y que un administrador controle su
ciclo de vida.

Actores:
- Usuario registrado.
- Administrador.

Sistemas externos:
- Navegador web.
- Base de datos PostgreSQL.

## Contenedores

1. **Frontend React**
   - Interfaz de usuario.
   - Consume la API REST.
   - Mantiene el token JWT en almacenamiento local.

2. **Backend Express**
   - API REST.
   - Autenticación y autorización.
   - Validación de reglas de negocio.
   - Gestión de citas y transiciones de estado.

3. **PostgreSQL**
   - Usuarios.
   - Citas.
   - Restricciones de integridad.

## Módulos críticos

- Autenticación y autorización.
- Validación de disponibilidad.
- Creación/reprogramación de citas.
- Transiciones de estado.
- Persistencia de citas.

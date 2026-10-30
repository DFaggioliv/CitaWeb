# CitaWeb

Sistema web de gestión de citas preparado para el proyecto de **Aseguramiento de la Calidad de Software**.

## Arquitectura

- Frontend: React + Vite
- Backend: Node.js + Express
- Base de datos: PostgreSQL
- Autenticación: JWT
- Roles: `user` y `admin`

## Funcionalidades principales

### Usuario
- Registro e inicio de sesión.
- Consulta de horarios disponibles.
- Creación de citas.
- Reprogramación de citas pendientes.
- Cancelación de citas pendientes o confirmadas.
- Consulta del historial de citas.

### Administrador
- Inicio de sesión.
- Consulta de todas las citas.
- Confirmación de citas pendientes.
- Marcado de citas confirmadas como atendidas.
- Cancelación administrativa.

## Reglas de negocio

- Nombre: 3 a 50 caracteres.
- Contraseña: 8 a 64 caracteres.
- Motivo de la cita: 10 a 200 caracteres.
- Las citas solo pueden programarse entre 1 y 30 días a futuro.
- No se permiten citas sábado ni domingo.
- Horarios válidos: 08:00 a 17:00, en intervalos de 30 minutos.
- No se permiten dos citas activas para el mismo día y hora.
- Solo las citas `pending` pueden reprogramarse.
- Una cita `pending` puede pasar a `confirmed`.
- Una cita `confirmed` puede pasar a `attended`.
- Las citas `pending` o `confirmed` pueden pasar a `cancelled`.
- Una cita `attended` o `cancelled` no puede volver a un estado anterior.

## 1. Preparar PostgreSQL

Cree una base de datos, por ejemplo `citaweb`, y ejecute:

```sql
backend/sql/init.sql
```

## 2. Backend

```bash
cd backend
copy .env.example .env
npm install
npm run seed
npm run dev
```

Edite `.env` antes de ejecutar `seed`.

## 3. Frontend

En otra terminal:

```bash
cd frontend
copy .env.example .env
npm install
npm run dev
```

La aplicación abrirá normalmente en:

- Frontend: http://localhost:5173
- Backend: http://localhost:3000

## Usuario administrador inicial

Se crea con:

```bash
npm run seed
```

Las credenciales se toman de `ADMIN_EMAIL` y `ADMIN_PASSWORD` en el `.env` del backend.

## Despliegue sugerido

- Frontend: Vercel
- Backend: Render
- PostgreSQL: Neon

Variables del backend:
- `DATABASE_URL`
- `JWT_SECRET`
- `FRONTEND_URL`
- `PORT`
- `NODE_ENV`

Variable del frontend:
- `VITE_API_URL`

## Nota académica

La carpeta `docs/` incluye:
- especificación funcional resumida,
- reglas de negocio,
- arquitectura de alto nivel,
- prompt utilizado para generar la aplicación con IA.

Estos documentos servirán como base para E1, E2, E3 y E4 del proyecto.


## Fase 2: pruebas unitarias

Desde la raíz: `npm ci --prefix backend`, `npm test`, `npm run test:coverage`. Consulte `docs/fase2/pruebas/Resultados_y_mocks.md` y `docs/fase2/Linea_base_cobertura.md`.

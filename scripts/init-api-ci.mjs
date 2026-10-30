import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

// This initializer is exclusively for the disposable CI PostgreSQL service.
const url = new URL(process.env.DATABASE_URL || '');
if (!['localhost', '127.0.0.1'].includes(url.hostname) || url.pathname !== '/citaweb_ci') {
  throw new Error('El inicializador solo admite PostgreSQL local con base citaweb_ci.');
}
if (!process.env.API_ADMIN_EMAIL || !process.env.API_ADMIN_PASSWORD) {
  throw new Error('Faltan las credenciales temporales del administrador de prueba.');
}
const require = createRequire(new URL('../backend/package.json', import.meta.url));
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
try {
  await pool.query(readFileSync('backend/sql/init.sql', 'utf8'));
  await pool.query(
    "INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,'admin')",
    ['Admin CI', process.env.API_ADMIN_EMAIL, await bcrypt.hash(process.env.API_ADMIN_PASSWORD, 10)],
  );
  console.log('Esquema y administrador temporal preparados en PostgreSQL de CI.');
} finally {
  await pool.end();
}

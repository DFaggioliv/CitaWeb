import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { pool } from './db.js';
import { normalizeEmail } from './utils.js';

dotenv.config();

const name = process.env.ADMIN_NAME || 'Administrador';
const email = normalizeEmail(process.env.ADMIN_EMAIL || 'admin@citaweb.local');
const password = process.env.ADMIN_PASSWORD || 'Admin1234';

if (password.length < 8) {
  console.error('ADMIN_PASSWORD debe tener al menos 8 caracteres.');
  process.exit(1);
}

try {
  const hash = await bcrypt.hash(password, 10);
  await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (email)
     DO UPDATE SET name = EXCLUDED.name,
                   password_hash = EXCLUDED.password_hash,
                   role = 'admin'`,
    [name, email, hash]
  );
  console.log(`Administrador listo: ${email}`);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await pool.end();
}

import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";

import { neon } from "@neondatabase/serverless";

const scrypt = promisify(scryptCallback);

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set.");
}

if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
  throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required.");
}

const sql = neon(process.env.DATABASE_URL);
const email = process.env.ADMIN_EMAIL.toLowerCase();
const passwordHash = await hashPassword(process.env.ADMIN_PASSWORD);

await sql`
  insert into daily_words_users (email, name, role, password_hash)
  values (${email}, ${process.env.ADMIN_NAME ?? "管理者"}, 'admin', ${passwordHash})
  on conflict (email) do update set
    name = excluded.name,
    role = 'admin',
    password_hash = excluded.password_hash,
    updated_at = now()
`;

console.log(`Admin user is ready: ${email}`);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

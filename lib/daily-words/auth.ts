import {
  randomBytes,
  randomUUID,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

import { cookies } from "next/headers";

import { getSql } from "@/lib/daily-words/db";
import type { DailyWordsUser } from "@/lib/daily-words/types";

const scrypt = promisify(scryptCallback);
const sessionCookieName = "daily_words_session";
const sessionMaxAgeSeconds = 60 * 60 * 24 * 30;

type UserRow = DailyWordsUser & {
  password_hash: string;
};

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, salt, key] = storedHash.split(":");
  if (algorithm !== "scrypt" || !salt || !key) return false;

  const expected = Buffer.from(key, "hex");
  const actual = (await scrypt(password, salt, expected.length)) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function findUserByEmail(email: string) {
  const sql = getSql();
  const rows = (await sql`
    select id, email, name, role, password_hash
    from daily_words_users
    where email = ${email.toLowerCase()}
    limit 1
  `) as UserRow[];

  return rows[0] ?? null;
}

export async function createSession(userId: string) {
  const token = randomUUID();
  const tokenHash = await hashSessionToken(token);
  const sql = getSql();

  await sql`
    insert into daily_words_sessions (user_id, token_hash, expires_at)
    values (
      ${userId},
      ${tokenHash},
      now() + (${sessionMaxAgeSeconds} || ' seconds')::interval
    )
  `;

  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    maxAge: sessionMaxAgeSeconds,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function getCurrentUser(): Promise<DailyWordsUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;
  if (!token) return null;

  const sql = getSql();
  const rows = (await sql`
    select u.id, u.email, u.name, u.role
    from daily_words_sessions s
    join daily_words_users u on u.id = s.user_id
    where s.token_hash = ${await hashSessionToken(token)}
      and s.expires_at > now()
    limit 1
  `) as DailyWordsUser[];

  return rows[0] ?? null;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return null;
  return user;
}

export async function destroyCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;
  const sql = getSql();

  if (token) {
    await sql`
      delete from daily_words_sessions
      where token_hash = ${await hashSessionToken(token)}
    `;
  }

  cookieStore.delete(sessionCookieName);
}

async function hashSessionToken(token: string) {
  const data = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Buffer.from(digest).toString("hex");
}

import { DatabaseSync } from "node:sqlite";

export interface UserRecord {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

/*
 * Both the API server and Playwright tests connect to this file.
 */
export const database = new DatabaseSync("test-users.db");

/*
 * WAL mode improves concurrent database access.
 *
 * busy_timeout tells SQLite to wait for up to 10 seconds
 * instead of immediately throwing "database is locked".
 *
 * foreign_keys enables foreign-key validation for future tables.
 */
database.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA busy_timeout = 10000;
  PRAGMA foreign_keys = ON;
`);

/*
 * Create the users table if it does not already exist.
 */
database.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

/*
 * Deletes all users.
 *
 * Keep this helper for database-specific test files, but do not call it
 * before every security test while the API server is using the same DB.
 */
export function clearUsers(): void {
  const statement = database.prepare(`
    DELETE FROM users
  `);

  statement.run();
}

/*
 * Find one user using the generated user ID.
 */
export function findUserById(
  id: number
): UserRecord | undefined {
  const statement = database.prepare(`
    SELECT
      id,
      name,
      email,
      role,
      created_at
    FROM users
    WHERE id = ?
  `);

  return statement.get(id) as UserRecord | undefined;
}

/*
 * Find one user using the unique email address.
 */
export function findUserByEmail(
  email: string
): UserRecord | undefined {
  const statement = database.prepare(`
    SELECT
      id,
      name,
      email,
      role,
      created_at
    FROM users
    WHERE email = ?
  `);

  return statement.get(
    email.toLowerCase()
  ) as UserRecord | undefined;
}

/*
 * Return the current number of users.
 */
export function countUsers(): number {
  const statement = database.prepare(`
    SELECT COUNT(*) AS count
    FROM users
  `);

  const result = statement.get() as {
    count: number;
  };

  return result.count;
}
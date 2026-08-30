import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "@/db/schema";
import { seedDefaultUsers, seedIfEmpty } from "@/db/seed";
import type { DB } from "@/db/type";

const globalForDb = globalThis as unknown as { _ovoraDb?: Database.Database; _ovoraSeed?: boolean };

mkdirSync("data", { recursive: true });
const sqlite = globalForDb._ovoraDb ?? new Database("data/ovora.db");
if (process.env.NODE_ENV !== "production") globalForDb._ovoraDb = sqlite;

sqlite.pragma("journal_mode = WAL");

const db = (drizzle(sqlite, { schema }) as unknown) as DB;

export function initSchema() {
  migrate(db, { migrationsFolder: "drizzle" });
  seedIfEmpty(db);
  seedDefaultUsers(db);
}

let initialized = false;
export function ensureDb() {
  if (!initialized && !globalForDb._ovoraSeed) {
    globalForDb._ovoraSeed = true;
    initSchema();
    initialized = true;
  }
  return db;
}

export { db, sqlite };

export default db;
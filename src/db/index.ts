import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import * as schema from "@/db/schema";
import { seedDefaultUsers, seedIfEmpty } from "@/db/seed";
import type { DB } from "@/db/type";

const globalForDb = globalThis as unknown as { _ovoraClient?: postgres.Sql; _ovoraSeed?: boolean };

const connectionString = process.env.DATABASE_URL;

const client = globalForDb._ovoraClient
  ?? postgres(connectionString!, { ssl: "require", max: 10 });
if (process.env.NODE_ENV !== "production") globalForDb._ovoraClient = client;

const db = (drizzle(client, { schema }) as unknown) as DB;

export async function initSchema() {
  if (!connectionString) throw new Error("DATABASE_URL belum diset");
  if (process.env.RUN_MIGRATIONS === "1") {
    const migrationClient = postgres(process.env.DIRECT_URL ?? connectionString, { ssl: "require", max: 1 });
    await migrate(db, { migrationsFolder: "drizzle" });
    await migrationClient.end();
  }
  await seedIfEmpty(db);
  await seedDefaultUsers(db);
}

let initialized = false;
export async function ensureDb() {
  if (!initialized && !globalForDb._ovoraSeed) {
    globalForDb._ovoraSeed = true;
    await initSchema();
    initialized = true;
  }
  return db;
}

export { db };

export default db;
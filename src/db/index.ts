import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import * as schema from "@/db/schema";
import { seedDefaultUsers, seedIfEmpty } from "@/db/seed";
import type { DB } from "@/db/type";

type Sql = postgres.Sql;

const globalForDb = globalThis as unknown as {
  _ovoraClient?: Sql;
  _ovoraSeed?: boolean;
};

function getClient(): Sql {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL belum diset");
  if (!globalForDb._ovoraClient) {
    globalForDb._ovoraClient = postgres(connectionString, { ssl: "require", max: 10 });
  }
  return globalForDb._ovoraClient;
}

export function getDb(): DB {
  return (drizzle(getClient(), { schema }) as unknown) as DB;
}

export async function initSchema() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL belum diset");
  const db = getDb();
  if (process.env.RUN_MIGRATIONS === "1") {
    const migrationClient = postgres(process.env.DIRECT_URL ?? process.env.DATABASE_URL, {
      ssl: "require",
      max: 1,
    });
    await migrate(db, { migrationsFolder: "drizzle" });
    await migrationClient.end();
  }
  await seedIfEmpty(db);
  await seedDefaultUsers(db);
}

let initialized = false;
export async function ensureDb(): Promise<DB> {
  if (!initialized && !globalForDb._ovoraSeed) {
    globalForDb._ovoraSeed = true;
    await initSchema();
    initialized = true;
  }
  return getDb();
}

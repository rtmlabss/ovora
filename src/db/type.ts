import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "@/db/schema";

export type DB = BetterSQLite3Database<typeof schema>;
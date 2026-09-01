import { and, desc, eq, gte, inArray, lte, or } from "drizzle-orm";
import { ensureDb } from "@/db/index";
import { auditLogs, users } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const db = await ensureDb();
  const { searchParams } = new URL(request.url);
  const userId = Number(searchParams.get("userId")) || null;
  const module = searchParams.get("module") || null;
  const action = searchParams.get("action") || null;
  const from = searchParams.get("from") || null;
  const to = searchParams.get("to") || null;
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 50, 1), 500);

  const filters = [];
  if (userId) filters.push(eq(auditLogs.userId, userId));
  if (module) filters.push(eq(auditLogs.module, module));
  if (action) filters.push(eq(auditLogs.action, action));
  if (from) filters.push(gte(auditLogs.createdAt, from));
  if (to) filters.push(lte(auditLogs.createdAt, to));

  const rows = await db
    .select()
    .from(auditLogs)
    .where(and(...filters))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);

  const userIds = [...new Set(rows.flatMap((r) => (r.userId != null ? [r.userId] : [])))];
  const usersFound = userIds.length
    ? await db.select().from(users).where(inArray(users.id, userIds))
    : [];
  const userMap = new Map(usersFound.map((u) => [u.id, u.name]));

  const logs = rows.map((r) => ({
    ...r,
    userName: r.userId != null ? userMap.get(r.userId) ?? null : null,
    oldData: r.oldData ? JSON.parse(r.oldData) : null,
    newData: r.newData ? JSON.parse(r.newData) : null,
  }));

  return Response.json({ total: logs.length, logs });
}

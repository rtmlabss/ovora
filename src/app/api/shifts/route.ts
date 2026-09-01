import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { ensureDb } from "@/db/index";
import { employeeShifts, users } from "@/db/schema";
import { logAudit, getClientIp } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const db = await ensureDb();
  const { searchParams } = new URL(request.url);
  const userId = Number(searchParams.get("userId")) || null;
  const branchId = Number(searchParams.get("branchId")) || null;
  const status = searchParams.get("status") || null;
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 50, 1), 200);

  const filters = [];
  if (userId) filters.push(eq(employeeShifts.userId, userId));
  if (branchId) filters.push(eq(employeeShifts.branchId, branchId));
  if (status) filters.push(eq(employeeShifts.status, status));

  const rows = await db
    .select()
    .from(employeeShifts)
    .where(and(...filters))
    .orderBy(desc(employeeShifts.updatedAt))
    .limit(limit);

  const userIds = [...new Set(rows.map((r) => r.userId))];
  const usersFound = userIds.length
    ? await db.select().from(users).where(inArray(users.id, userIds))
    : [];
  const userMap = new Map(usersFound.map((u) => [u.id, u]));

  const result = rows.map((r) => ({
    ...r,
    user: userMap.get(r.userId) ? { id: userMap.get(r.userId)?.id, name: userMap.get(r.userId)?.name } : null,
  }));

  return Response.json({ total: result.length, shifts: result });
}

export async function POST(request: Request) {
  const db = await ensureDb();
  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }

  const { userId, branchId, shiftName, startTime, endTime, workDays } = body;
  if (!userId || !branchId || !shiftName || !startTime || !endTime || !workDays) {
    return Response.json({ error: "Data shift tidak lengkap" }, { status: 400 });
  }

  try {
    const now = new Date();
    const timestampStr = now.toISOString();

    const result = await db.transaction(async (tx) => {
      // Check if user exists
      const userRows = await tx.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!userRows[0]) throw new Error("Pengguna tidak ditemukan");

      const rows = await tx
        .insert(employeeShifts)
        .values({
          userId,
          branchId,
          shiftName,
          startTime,
          endTime,
          workDays: JSON.stringify(workDays),
          status: "aktif",
          createdAt: timestampStr,
          updatedAt: timestampStr,
        })
        .returning();

      return rows[0];
    });

    await logAudit({
      userId,
      action: "create",
      module: "employee_shifts",
      resourceId: String(result.id),
      newData: { shiftName, startTime, endTime, workDays },
      ipAddress: getClientIp(request),
    });

    return Response.json({ shift: result }, { status: 201 });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 400 });
  }
}

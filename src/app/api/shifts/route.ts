import { and, desc, eq, gte, inArray, lte, sum } from "drizzle-orm";
import { ensureDb } from "@/db/index";
import { cashShifts, financialTransactions, users } from "@/db/schema";
import { logAudit, getClientIp } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const db = await ensureDb();
  const { searchParams } = new URL(request.url);
  const branchId = Number(searchParams.get("branchId")) || null;
  const userId = Number(searchParams.get("userId")) || null;
  const status = searchParams.get("status") || null;
  const from = searchParams.get("from") || null;
  const to = searchParams.get("to") || null;
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 50, 1), 200);

  const filters = [];
  if (branchId) filters.push(eq(cashShifts.branchId, branchId));
  if (userId) filters.push(eq(cashShifts.userId, userId));
  if (status) filters.push(eq(cashShifts.status, status));
  if (from) filters.push(gte(cashShifts.openedAt, from));
  if (to) filters.push(lte(cashShifts.openedAt, to));

  const rows = await db
    .select()
    .from(cashShifts)
    .where(and(...filters))
    .orderBy(desc(cashShifts.openedAt))
    .limit(limit);

  const userIds = [...new Set(rows.flatMap((r) => (r.userId != null ? [r.userId] : [])))];
  const usrs = userIds.length
    ? await db.select().from(users).where(inArray(users.id, userIds))
    : [];
  const userMap = new Map(usrs.map((u) => [u.id, u.name]));

  const shifts = rows.map((r) => ({
    ...r,
    userName: userMap.get(r.userId) ?? null,
  }));

  return Response.json({ total: shifts.length, shifts });
}

export async function POST(request: Request) {
  const db = await ensureDb();
  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }

  const { userId, branchId, openingCash, note } = body;
  if (!userId || !branchId) {
    return Response.json({ error: "userId dan branchId wajib diisi" }, { status: 400 });
  }

  try {
    // Check if user already has open shift
    const openShift = await db
      .select()
      .from(cashShifts)
      .where(and(eq(cashShifts.userId, userId), eq(cashShifts.status, "open")))
      .limit(1);
    if (openShift.length > 0) {
      return Response.json({ error: "Kasir masih memiliki shift terbuka" }, { status: 400 });
    }

    const now = new Date();
    const shift = await db
      .insert(cashShifts)
      .values({
        userId,
        branchId,
        openingCash: openingCash || 0,
        status: "open",
        openedAt: now.toISOString(),
        note: note || null,
      })
      .returning();

    await logAudit({
      userId,
      action: "open",
      module: "cash_shifts",
      resourceId: String(shift[0].id),
      newData: { openingCash: shift[0].openingCash },
      ipAddress: getClientIp(request),
    });

    return Response.json({ shift: shift[0] }, { status: 201 });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 400 });
  }
}
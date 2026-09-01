import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { ensureDb } from "@/db/index";
import { attendances, employeeShifts, users, branches } from "@/db/schema";
import { logAudit, getClientIp } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const db = await ensureDb();
  const { searchParams } = new URL(request.url);
  const userId = Number(searchParams.get("userId")) || null;
  const branchId = Number(searchParams.get("branchId")) || null;
  const from = searchParams.get("from") || null;
  const to = searchParams.get("to") || null;
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 50, 1), 200);

  const filters = [];
  if (userId) filters.push(eq(attendances.userId, userId));
  if (branchId) filters.push(eq(attendances.branchId, branchId));
  if (from) filters.push(gte(attendances.timestamp, from));
  if (to) filters.push(lte(attendances.timestamp, to));

  const rows = await db
    .select()
    .from(attendances)
    .where(and(...filters))
    .orderBy(desc(attendances.timestamp))
    .limit(limit);

  const userIds = [...new Set(rows.map((r) => r.userId))];
  const usersFound = userIds.length
    ? await db.select().from(users).where(inArray(users.id, userIds))
    : [];
  const userMap = new Map(usersFound.map((u) => [u.id, u]));

  const branchIds = [...new Set(rows.map((r) => r.branchId))];
  const branchesFound = branchIds.length
    ? await db.select().from(branches).where(inArray(branches.id, branchIds))
    : [];
  const branchMap = new Map(branchesFound.map((b) => [b.id, b]));

  const result = rows.map((r) => ({
    ...r,
    user: userMap.get(r.userId) ? { id: userMap.get(r.userId)?.id, name: userMap.get(r.userId)?.name } : null,
    branch: branchMap.get(r.branchId) ? { id: branchMap.get(r.branchId)?.id, name: branchMap.get(r.branchId)?.name } : null,
  }));

  return Response.json({ total: result.length, attendances: result });
}

export async function POST(request: Request) {
  const db = await ensureDb();
  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }

  const { userId, branchId, type, selfiePhoto, latitude, longitude, accuracy, locationAddress, note, deviceInfo } = body;

  if (!userId || !branchId || !type || !latitude || !longitude) {
    return Response.json({ error: "Data absensi tidak lengkap (userId, branchId, type, koordinat GPS wajib)" }, { status: 400 });
  }

  if (!["masuk", "pulang"].includes(type)) {
    return Response.json({ error: "Tipe absensi harus 'masuk' atau 'pulang'" }, { status: 400 });
  }

  try {
    const now = new Date();
    const timestampStr = now.toISOString();

    const result = await db.transaction(async (tx) => {
      // Check user shift
      const shiftRows = await tx
        .select()
        .from(employeeShifts)
        .where(and(eq(employeeShifts.userId, userId), eq(employeeShifts.status, "aktif")))
        .limit(1);
      
      const shift = shiftRows[0] || null;
      let status = "tepat";

      if (shift && type === "masuk") {
        const [targetHour, targetMinute] = shift.startTime.split(":").map(Number);
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        const targetMinutesTotal = targetHour * 60 + targetMinute;
        const currentMinutesTotal = currentHour * 60 + currentMinute;

        if (currentMinutesTotal > targetMinutesTotal + 15) {
          status = "telat";
        }
      }

      const rows = await tx
        .insert(attendances)
        .values({
          userId,
          branchId,
          shiftId: shift?.id || null,
          type,
          selfiePhoto: selfiePhoto || null,
          latitude,
          longitude,
          accuracy: accuracy || null,
          locationAddress: locationAddress || null,
          timestamp: timestampStr,
          deviceInfo: deviceInfo || null,
          status,
          note: note || null,
          createdAt: timestampStr,
        })
        .returning();

      return rows[0];
    });

    await logAudit({
      userId,
      action: type,
      module: "attendances",
      resourceId: String(result.id),
      newData: { type, latitude, longitude, status },
      ipAddress: getClientIp(request),
    });

    return Response.json({ attendance: result }, { status: 201 });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 400 });
  }
}

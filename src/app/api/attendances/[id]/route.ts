import { and, eq, gte } from "drizzle-orm";
import { ensureDb } from "@/db/index";
import { attendances, employeeShifts, users, branches } from "@/db/schema";
import { logAudit, getClientIp } from "@/lib/audit";

import type { NextRequest } from "next/server";


export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = await ensureDb();
  const { id: idRaw } = await params;
  const attendanceId = Number(idRaw);
  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }

  const { latitude, longitude, accuracy, locationAddress, deviceInfo } = body;
  if (!latitude || !longitude) {
    return Response.json({ error: "Koordinat GPS wajib diisi" }, { status: 400 });
  }

  try {
    const result = await db.transaction(async (tx) => {
      const rows = await tx.select().from(attendances).where(eq(attendances.id, attendanceId)).limit(1);
      const attendance = rows[0];
      if (!attendance) throw new Error("Absensi tidak ditemukan");

      const now = new Date();
      const timestampStr = now.toISOString();

      const updated = (
        await tx
          .update(attendances)
          .set({
            latitude,
            longitude,
            accuracy: accuracy || null,
            locationAddress: locationAddress || null,
            deviceInfo: deviceInfo || null,
            timestamp: timestampStr,
            createdAt: timestampStr,
          })
          .where(eq(attendances.id, attendanceId))
          .returning()
      )[0];

      await logAudit({
        userId: attendance.userId,
        action: "update_location",
        module: "attendances",
        resourceId: String(attendanceId),
        oldData: { latitude: attendance.latitude, longitude: attendance.longitude },
        newData: { latitude, longitude, accuracy, locationAddress },
        ipAddress: getClientIp(request),
      });

      return updated;
    });

    return Response.json({ attendance: result });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 400 });
  }
}

import { and, eq } from "drizzle-orm";
import { ensureDb } from "@/db/index";
import { employeeShifts } from "@/db/schema";
import { logAudit, getClientIp } from "@/lib/audit";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = await ensureDb();
  const { id: idRaw } = await params;
  const shiftId = Number(idRaw);
  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }

  const { shiftName, startTime, endTime, workDays, status } = body;

  try {
    const result = await db.transaction(async (tx) => {
      const rows = await tx.select().from(employeeShifts).where(eq(employeeShifts.id, shiftId)).limit(1);
      const shift = rows[0];
      if (!shift) throw new Error("Shift tidak ditemukan");

      const now = new Date();
      const timestampStr = now.toISOString();

      const updateData: any = {};
      if (shiftName !== undefined) updateData.shiftName = shiftName;
      if (startTime !== undefined) updateData.startTime = startTime;
      if (endTime !== undefined) updateData.endTime = endTime;
      if (workDays !== undefined) updateData.workDays = JSON.stringify(workDays);
      if (status !== undefined) updateData.status = status;
      updateData.updatedAt = timestampStr;

      const updated = (
        await tx
          .update(employeeShifts)
          .set(updateData)
          .where(eq(employeeShifts.id, shiftId))
          .returning()
      )[0];

      await logAudit({
        userId: shift.userId,
        action: "update",
        module: "employee_shifts",
        resourceId: String(shiftId),
        oldData: shift,
        newData: updated,
        ipAddress: getClientIp(request),
      });

      return updated;
    });

    return Response.json({ shift: result });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = await ensureDb();
  const { id: idRaw } = await params;
  const shiftId = Number(idRaw);

  try {
    const result = await db.transaction(async (tx) => {
      const rows = await tx.select().from(employeeShifts).where(eq(employeeShifts.id, shiftId)).limit(1);
      const shift = rows[0];
      if (!shift) throw new Error("Shift tidak ditemukan");

      await tx.delete(employeeShifts).where(eq(employeeShifts.id, shiftId));

      await logAudit({
        userId: shift.userId,
        action: "delete",
        module: "employee_shifts",
        resourceId: String(shiftId),
        ipAddress: getClientIp(request),
      });

      return { message: "Shift berhasil dihapus" };
    });

    return Response.json(result);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 400 });
  }
}

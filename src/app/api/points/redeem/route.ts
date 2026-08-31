import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { ensureDb } from "@/db";
import { members, pointMovements } from "@/db/schema";
import { POINT_VALUE } from "@/lib/pos";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body harus berupa JSON" }, { status: 400 });
  }

  const { memberId, points, note, transactionId, branchId } = (body ?? {}) as {
    memberId?: number;
    points?: number;
    note?: string;
    transactionId?: number;
    branchId?: number;
  };

  const memberIdNum = Number(memberId);
  if (!Number.isInteger(memberIdNum) || memberIdNum <= 0) {
    return NextResponse.json({ error: "memberId wajib angka bulat > 0" }, { status: 400 });
  }

  const pointsNum = Number(points);
  if (!Number.isInteger(pointsNum) || pointsNum <= 0) {
    return NextResponse.json({ error: "Jumlah poin harus angka bulat > 0" }, { status: 400 });
  }

  const noteStr = typeof note === "string" && note.trim() ? note.trim() : null;

  const db = await ensureDb();

  const existingRows = await db.select().from(members).where(eq(members.id, memberIdNum)).limit(1);
  const existing = existingRows[0];
  if (!existing) {
    return NextResponse.json({ error: "Member tidak ditemukan" }, { status: 404 });
  }

  if (pointsNum > existing.pointsBalance) {
    return NextResponse.json(
      {
        error: `Poin tidak mencukupi. Saldo ${existing.pointsBalance}, diminta ${pointsNum}`,
      },
      { status: 400 }
    );
  }

  const branchIdNum = Number(branchId);
  const branchIdValue = Number.isInteger(branchIdNum) && branchIdNum > 0 ? branchIdNum : existing.branchId;
  const transactionIdNum = Number(transactionId);
  const transactionIdValue =
    Number.isInteger(transactionIdNum) && transactionIdNum > 0 ? transactionIdNum : null;

  const result = await db.transaction(async (tx) => {
    await tx.update(members)
      .set({
        pointsBalance: sql`${members.pointsBalance} - ${pointsNum}`,
      })
      .where(eq(members.id, memberIdNum));

    const movements = await tx
      .insert(pointMovements)
      .values({
        memberId: memberIdNum,
        branchId: branchIdValue,
        kind: "penukaran",
        points: -pointsNum,
        note: noteStr ?? `Tukar ${pointsNum} poin = potongan Rp${(pointsNum * POINT_VALUE).toLocaleString("id-ID")}`,
        transactionId: transactionIdValue,
        createdAt: new Date().toISOString(),
      })
      .returning();
    const movement = movements[0];

    const updatedRows = await tx.select().from(members).where(eq(members.id, memberIdNum)).limit(1);
    const updated = updatedRows[0];

    return { movement, member: updated };
  });

  return NextResponse.json({ pointMovement: result.movement, member: result.member }, { status: 201 });
}
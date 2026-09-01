import { and, eq, inArray } from "drizzle-orm";
import { ensureDb } from "@/db/index";
import { rolePermissions, roles, users } from "@/db/schema";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = await ensureDb();
  const { id: idRaw } = await params;
  const roleId = Number(idRaw);
  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }

  const { name, description, permissionIds } = body;

  try {
    await db.transaction(async (tx) => {
      if (name) {
        await tx.update(roles).set({ name, description: description || null }).where(eq(roles.id, roleId));
      }

      if (Array.isArray(permissionIds)) {
        // Delete existing permissions
        await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
        // Add new permissions
        if (permissionIds.length > 0) {
          await tx.insert(rolePermissions).values(
            permissionIds.map((pid: number) => ({ roleId, permissionId: pid }))
          );
        }
      }
    });

    const updated = await db.select().from(roles).where(eq(roles.id, roleId)).limit(1);
    return Response.json({ role: updated[0] });
  } catch (err: any) {
    if (err.code === "23505") return Response.json({ error: "Nama role sudah ada" }, { status: 400 });
    return Response.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = await ensureDb();
  const { id: idRaw } = await params;
  const roleId = Number(idRaw);

  try {
    // Check if role is used by any user
    const { users } = require("@/db/schema");
    const userCount = await db
      .select({ count: users.id })
      .from(users)
      .where(eq(users.role, roleId))
      .then((r) => r.length);
    if (userCount > 0) {
      return Response.json({ error: "Role sedang digunakan oleh user" }, { status: 400 });
    }

    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
    await db.delete(roles).where(eq(roles.id, roleId));

    return Response.json({ message: "Role dihapus" });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 400 });
  }
}

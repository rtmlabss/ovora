import { and, eq, inArray } from "drizzle-orm";
import { ensureDb } from "@/db/index";
import { permissions, rolePermissions, roles } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const db = await ensureDb();
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type"); // "roles" or "permissions"

  if (type === "permissions") {
    const rows = await db.select().from(permissions).orderBy(permissions.module, permissions.code);
    return Response.json({ total: rows.length, permissions: rows });
  }

  const rows = await db.select().from(roles).orderBy(roles.name);
  const roleIds = rows.map((r) => r.id);
  const rp = roleIds.length
    ? await db.select().from(rolePermissions).where(inArray(rolePermissions.roleId, roleIds))
    : [];
  const permIds = [...new Set(rp.map((p) => p.permissionId))];
  const perms = permIds.length
    ? await db.select().from(permissions).where(inArray(permissions.id, permIds))
    : [];
  const permMap = new Map(perms.map((p) => [p.id, p]));

  const result = rows.map((r) => ({
    ...r,
    permissions: rp.filter((p) => p.roleId === r.id).map((p) => permMap.get(p.permissionId)).filter(Boolean),
  }));

  return Response.json({ total: result.length, roles: result });
}

export async function POST(request: Request) {
  const db = await ensureDb();
  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  if (type === "permission") {
    const { code, description, module } = body;
    if (!code || !module) return Response.json({ error: "Code dan module wajib diisi" }, { status: 400 });

    try {
      const rows = await db
        .insert(permissions)
        .values({ code, description: description || null, module })
        .returning();
      return Response.json({ permission: rows[0] }, { status: 201 });
    } catch (err: any) {
      if (err.code === "23505") return Response.json({ error: "Permission code sudah ada" }, { status: 400 });
      return Response.json({ error: err.message }, { status: 400 });
    }
  }

  // Create role
  const { name, description, permissionIds } = body;
  if (!name) return Response.json({ error: "Nama role wajib diisi" }, { status: 400 });

  try {
    const role = await db.transaction(async (tx) => {
      const roleRows = await tx.insert(roles).values({ name, description: description || null }).returning();
      const roleId = roleRows[0].id;

      if (Array.isArray(permissionIds) && permissionIds.length > 0) {
        await tx.insert(rolePermissions).values(
          permissionIds.map((pid: number) => ({ roleId, permissionId: pid }))
        );
      }

      return roleRows[0];
    });

    return Response.json({ role }, { status: 201 });
  } catch (err: any) {
    if (err.code === "23505") return Response.json({ error: "Nama role sudah ada" }, { status: 400 });
    return Response.json({ error: err.message }, { status: 400 });
  }
}
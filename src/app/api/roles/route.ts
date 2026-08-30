import { NextResponse } from "next/server";
import { PERMISSIONS, ROLES_WITH_PERMISSIONS } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const permissions = PERMISSIONS.map((p) => ({ id: p.id, label: p.label, desc: p.desc }));
  const roles = ROLES_WITH_PERMISSIONS.map((r) => ({
    id: r.id,
    desc: r.desc,
    count: r.count,
    permissions: r.permissions,
  }));
  return NextResponse.json({ roles, permissions });
}

import { ensureDb } from "@/db/index";
import { auditLogs } from "@/db/schema";

export interface AuditLogData {
  userId?: number | null;
  action: string;
  module: string;
  resourceId?: string | null;
  oldData?: any;
  newData?: any;
  ipAddress?: string | null;
}

export async function logAudit(data: AuditLogData) {
  const db = await ensureDb();
  try {
    await db.insert(auditLogs).values({
      userId: data.userId || null,
      action: data.action,
      module: data.module,
      resourceId: data.resourceId || null,
      oldData: data.oldData ? JSON.stringify(data.oldData) : null,
      newData: data.newData ? JSON.stringify(data.newData) : null,
      ipAddress: data.ipAddress || null,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Audit log error:", err);
  }
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

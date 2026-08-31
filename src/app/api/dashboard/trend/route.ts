import { ensureDb } from "@/db/index";
import { getDashboardData, parseRange } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const db = await ensureDb();
  const { searchParams } = new URL(request.url);
  const range = parseRange(searchParams.get("range"));

  const data = await getDashboardData(db, range, new Date());

  const trend = data.trend.map((point) => ({
    label: point.label,
    sales: point.sales,
  }));

  return Response.json({
    range,
    total: trend.reduce((sum, p) => sum + p.sales, 0),
    trend,
  });
}
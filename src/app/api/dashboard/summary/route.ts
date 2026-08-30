import { ensureDb } from "@/db/index";
import { getDashboardData, parseRange } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const db = ensureDb();
  const { searchParams } = new URL(request.url);
  const range = parseRange(searchParams.get("range"));

  const data = getDashboardData(db, range, new Date());

  return Response.json({
    range,
    today: data.today,
    summary: data.summary,
    trend: data.trend,
  });
}
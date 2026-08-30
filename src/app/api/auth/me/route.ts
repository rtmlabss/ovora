import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionUser, SESSION_COOKIE } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = getSessionUser(token);
  if (!user) {
    return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  }
  return NextResponse.json({
    user: { id: user.uid, name: user.name, email: user.email, role: user.role, branch: user.branch },
  });
}

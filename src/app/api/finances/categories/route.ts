import { NextResponse } from "next/server";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/keuangan";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    pemasukan: INCOME_CATEGORIES,
    pengeluaran: EXPENSE_CATEGORIES,
  });
}
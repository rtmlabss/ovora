"use client";

import { ExpenseEntryForm } from "@/components/keuangan/expense-entry-form";
import { IncomeEntryForm } from "@/components/keuangan/income-entry-form";

export function CashEntryForms() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <IncomeEntryForm />
      <ExpenseEntryForm />
    </div>
  );
}
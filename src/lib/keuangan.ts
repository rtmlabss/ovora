export type CashType = "pemasukan" | "pengeluaran";

export interface CategoryOption {
  value: string;
  label: string;
}

export const INCOME_CATEGORIES: CategoryOption[] = [
  { value: "Penjualan", label: "Penjualan" },
  { value: "Investasi", label: "Investasi" },
  { value: "Penerimaan PO", label: "Penerimaan PO" },
  { value: "Lain-lain", label: "Lain-lain" },
];

export const EXPENSE_CATEGORIES: CategoryOption[] = [
  { value: "Belanja Stok", label: "Belanja Stok" },
  { value: "Gaji Karyawan", label: "Gaji Karyawan" },
  { value: "Pengiriman Stok", label: "Pengiriman Stok" },
  { value: "Lain-lain", label: "Lain-lain" },
];

export const CATEGORIES_BY_TYPE: Record<CashType, CategoryOption[]> = {
  pemasukan: INCOME_CATEGORIES,
  pengeluaran: EXPENSE_CATEGORIES,
};

export interface CashEntry {
  id: number;
  type: CashType;
  category: string;
  amount: number;
  note: string;
  createdAt: string;
}

export const ALL_CATEGORIES: string[] = Array.from(
  new Set([...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES].map((c) => c.value))
);
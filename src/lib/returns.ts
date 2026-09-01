export interface ReturnItem {
  transactionItemId: number;
  productId: number;
  qty: number;
  price: number;
  condition: "baik" | "rusak";
  restock: boolean;
}

export interface CreateReturnBody {
  transactionId: number;
  branchId: number;
  memberId?: number | null;
  reason: string;
  items: ReturnItem[];
  refundMethod?: "tunai" | "qris" | "transfer" | "credit";
  note?: string;
}

export interface ReturnReason {
  value: string;
  label: string;
}

export const RETURN_REASONS: ReturnReason[] = [
  { value: "rusak", label: "Produk Rusak" },
  { value: "salah_kirim", label: "Salah Kirim / Pesanan" },
  { value: "expired", label: "Kedaluwarsa / Hampir Expired" },
  { value: "tidak_sesuai", label: "Tidak Sesuai Deskripsi" },
  { value: "lainnya", label: "Lainnya" },
];
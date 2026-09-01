export interface Voucher {
  id: number;
  code: string;
  description: string | null;
  type: "fixed" | "percentage";
  value: number;
  minPurchase: number;
  maxDiscount: number | null;
  startDate: string;
  endDate: string;
  quota: number | null;
  usedCount: number;
  status: "aktif" | "nonaktif";
}

export interface AuditLog {
  id: number;
  userId: number | null;
  action: string;
  module: string;
  resourceId: string | null;
  oldData: string | null;
  newData: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface Supplier {
  id: number;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  status: "aktif" | "nonaktif";
}

export interface PurchaseOrder {
  id: number;
  poNo: string;
  supplierId: number;
  supplierName: string;
  branchId: number;
  totalAmount: number;
  status: "draft" | "ordered" | "received" | "cancelled";
  note: string | null;
  userId: number | null;
  createdAt: string;
  items: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: number;
  productId: number;
  productName: string;
  unit: string;
  qty: number;
  costPrice: number;
  subtotal: number;
}

export interface CreatePOBody {
  supplierId: number;
  branchId: number;
  items: { productId: number; qty: number; costPrice: number }[];
  note?: string;
}

export interface ReceivePOBody {
  poId: number;
  items: { productId: number; qtyReceived: number }[];
}
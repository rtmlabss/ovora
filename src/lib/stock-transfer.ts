export interface StockTransferItem {
  productId: number;
  qty: number;
}

export interface StockTransfer {
  transferNo: string;
  fromBranchId: number;
  toBranchId: number;
  note?: string;
  items: StockTransferItem[];
}

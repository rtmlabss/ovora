export type StockMoveType = "masuk" | "keluar" | "transfer";

export interface StockMovement {
  id: number;
  productId: number;
  productName: string;
  type: StockMoveType;
  qty: number;
  note: string;
  createdAt: string;
  unit?: string;
}

export const MOCK_STOCK_IN: StockMovement[] = [
  {
    id: 1,
    productId: 1,
    productName: "Telur Ayam Negeri",
    type: "masuk",
    qty: 50,
    note: "Restock dari peternak Pak Santo",
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    productId: 5,
    productName: "Telur Puyuh",
    type: "masuk",
    qty: 20,
    note: "Setoran gudang cabang",
    createdAt: new Date(Date.now() - 86_400_000).toISOString(),
  },
];

export const MOCK_STOCK_OUT: StockMovement[] = [
  {
    id: 201,
    productId: 1,
    productName: "Telur Ayam Negeri",
    type: "keluar",
    qty: 15,
    note: "Stok rusak / pecah saat packing",
    createdAt: new Date().toISOString(),
  },
  {
    id: 202,
    productId: 3,
    productName: "Telur Itik",
    type: "keluar",
    qty: 5,
    note: "Pindah stok ke cabang",
    createdAt: new Date(Date.now() - 86_400_000).toISOString(),
  },
];
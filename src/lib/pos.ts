export interface Product {
  id: number;
  name: string;
  unit: string;
  price: number;
  stockQty: number;
  minStock: number;
}

export const PRODUCT_STUB: Product[] = [
  { id: 1, name: "Telur Ayam Negeri", unit: "kg", price: 28_000, stockQty: 45, minStock: 10 },
  { id: 2, name: "Telur Ayam Kampung", unit: "kg", price: 38_000, stockQty: 12, minStock: 8 },
  { id: 3, name: "Telur Itik", unit: "kg", price: 33_000, stockQty: 20, minStock: 6 },
  { id: 4, name: "Telur Bebek", unit: "kg", price: 35_000, stockQty: 8, minStock: 5 },
  { id: 5, name: "Telur Puyuh", unit: "papan", price: 12_000, stockQty: 30, minStock: 15 },
  { id: 6, name: "Telur Ayam Omega-3", unit: "kg", price: 44_000, stockQty: 6, minStock: 4 },
];

export interface Member {
  id: number;
  name: string;
  points: number;
}

export const MEMBER_STUB: Member[] = [
  { id: 1, name: "John Doe", points: 150 },
  { id: 2, name: "Jane Smith", points: 85 },
];

export const POINT_VALUE = 100;

export const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});
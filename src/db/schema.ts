import { integer, pgTable, real, serial, text, uniqueIndex } from "drizzle-orm/pg-core";

export const branches = pgTable("branches", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  city: text("city"),
  status: text("status").notNull().default("aktif"),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("kasir"),
  status: text("status").notNull().default("aktif"),
  branchId: integer("branch_id").references(() => branches.id),
  createdAt: text("created_at").notNull(),
});

export const storeProfiles = pgTable("store_profiles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  tagline: text("tagline"),
  address: text("address"),
  city: text("city"),
  phone: text("phone"),
  currency: text("currency").notNull().default("IDR"),
  description: text("description"),
  updatedAt: text("updated_at").notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  branchId: integer("branch_id").notNull(),
  name: text("name").notNull(),
  unit: text("unit").notNull(),
  price: real("price").notNull(),
  stockQty: real("stock_qty").notNull().default(0),
  minStock: real("min_stock").notNull().default(0),
});

export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  branchId: integer("branch_id").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  pointsBalance: integer("points_balance").notNull().default(0),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  invoiceNo: text("invoice_no").notNull().unique(),
  branchId: integer("branch_id").notNull(),
  memberId: integer("member_id"),
  subtotal: real("subtotal").notNull(),
  discount: real("discount").notNull().default(0),
  pointsUsed: integer("points_used").notNull().default(0),
  total: real("total").notNull(),
  paymentMethod: text("payment_method").notNull().default("tunai"),
  userId: integer("user_id"),
  createdAt: text("created_at").notNull(),
});

export const transactionItems = pgTable("transaction_items", {
  id: serial("id").primaryKey(),
  transactionId: integer("transaction_id").notNull(),
  productId: integer("product_id").notNull(),
  qty: real("qty").notNull(),
  price: real("price").notNull(),
  subtotal: real("subtotal").notNull(),
});

export const financialTransactions = pgTable("financial_transactions", {
  id: serial("id").primaryKey(),
  branchId: integer("branch_id").notNull(),
  type: text("type").notNull(),
  category: text("category").notNull(),
  amount: real("amount").notNull(),
  note: text("note"),
  transactionId: integer("transaction_id"),
  userId: integer("user_id"),
  createdAt: text("created_at").notNull(),
});

export const stockMovements = pgTable("stock_movements", {
  id: serial("id").primaryKey(),
  branchId: integer("branch_id").notNull(),
  productId: integer("product_id").notNull(),
  type: text("type").notNull(),
  qty: real("qty").notNull(),
  note: text("note"),
  userId: integer("user_id"),
  createdAt: text("created_at").notNull(),
});

export const branchStocks = pgTable(
  "branch_stocks",
  {
    id: serial("id").primaryKey(),
    branchId: integer("branch_id").notNull(),
    productId: integer("product_id").notNull(),
    stockQty: real("stock_qty").notNull().default(0),
    minStock: real("min_stock").notNull().default(0),
  },
  (t) => ({
    uniq: uniqueIndex("branch_stocks_branch_product_uniq").on(t.branchId, t.productId),
  })
);

export const pointMovements = pgTable("point_movements", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").notNull(),
  branchId: integer("branch_id").notNull(),
  kind: text("kind").notNull(),
  points: integer("points").notNull(),
  note: text("note"),
  transactionId: integer("transaction_id"),
  userId: integer("user_id"),
  createdAt: text("created_at").notNull(),
});

export const rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  period: text("period").notNull().unique(),
  title: text("title").notNull(),
  createdAt: text("created_at").notNull(),
});

export const rewardWinners = pgTable("reward_winners", {
  id: serial("id").primaryKey(),
  rewardId: integer("reward_id")
    .notNull()
    .references(() => rewards.id),
  memberId: integer("member_id")
    .notNull()
    .references(() => members.id),
  rank: integer("rank").notNull(),
  status: text("status").notNull().default("dijadwalkan"),
  deliveredDate: text("delivered_date"),
  note: text("note"),
  createdAt: text("created_at").notNull(),
});
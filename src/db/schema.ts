import { integer, real, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

export const branches = sqliteTable("branches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  address: text("address"),
  city: text("city"),
  status: text("status").notNull().default("aktif"),
});

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("kasir"),
  status: text("status").notNull().default("aktif"),
  branchId: integer("branch_id").references(() => branches.id),
  createdAt: text("created_at").notNull(),
});

export const storeProfiles = sqliteTable("store_profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  tagline: text("tagline"),
  address: text("address"),
  city: text("city"),
  phone: text("phone"),
  currency: text("currency").notNull().default("IDR"),
  description: text("description"),
  updatedAt: text("updated_at").notNull(),
});

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  branchId: integer("branch_id").notNull(),
  name: text("name").notNull(),
  unit: text("unit").notNull(),
  price: real("price").notNull(),
  stockQty: real("stock_qty").notNull().default(0),
  minStock: real("min_stock").notNull().default(0),
});

export const members = sqliteTable("members", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  branchId: integer("branch_id").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  pointsBalance: integer("points_balance").notNull().default(0),
});

export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
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

export const transactionItems = sqliteTable("transaction_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  transactionId: integer("transaction_id").notNull(),
  productId: integer("product_id").notNull(),
  qty: real("qty").notNull(),
  price: real("price").notNull(),
  subtotal: real("subtotal").notNull(),
});

export const financialTransactions = sqliteTable("financial_transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  branchId: integer("branch_id").notNull(),
  type: text("type").notNull(),
  category: text("category").notNull(),
  amount: real("amount").notNull(),
  note: text("note"),
  transactionId: integer("transaction_id"),
  userId: integer("user_id"),
  createdAt: text("created_at").notNull(),
});

export const stockMovements = sqliteTable("stock_movements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  branchId: integer("branch_id").notNull(),
  productId: integer("product_id").notNull(),
  type: text("type").notNull(),
  qty: real("qty").notNull(),
  note: text("note"),
  userId: integer("user_id"),
  createdAt: text("created_at").notNull(),
});

export const branchStocks = sqliteTable(
  "branch_stocks",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    branchId: integer("branch_id").notNull(),
    productId: integer("product_id").notNull(),
    stockQty: real("stock_qty").notNull().default(0),
    minStock: real("min_stock").notNull().default(0),
  },
  (t) => ({
    uniq: unique().on(t.branchId, t.productId),
  })
);

export const pointMovements = sqliteTable("point_movements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  memberId: integer("member_id").notNull(),
  branchId: integer("branch_id").notNull(),
  kind: text("kind").notNull(),
  points: integer("points").notNull(),
  note: text("note"),
  transactionId: integer("transaction_id"),
  userId: integer("user_id"),
  createdAt: text("created_at").notNull(),
});

export const rewards = sqliteTable("rewards", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  period: text("period").notNull().unique(),
  title: text("title").notNull(),
  createdAt: text("created_at").notNull(),
});

export const rewardWinners = sqliteTable("reward_winners", {
  id: integer("id").primaryKey({ autoIncrement: true }),
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
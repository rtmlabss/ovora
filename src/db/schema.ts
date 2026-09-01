import { integer, pgTable, real, serial, text, uniqueIndex, timestamp, boolean } from "drizzle-orm/pg-core";

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
  barcode: text("barcode"),
  expiryDays: integer("expiry_days").default(30), // default shelf life in days
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
  tax: real("tax").notNull().default(0),
  serviceCharge: real("service_charge").notNull().default(0),
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
  batchNo: text("batch_no"),
  expiryDate: text("expiry_date"),
  costPrice: real("cost_price"),
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

export const stockBatches = pgTable("stock_batches", {
  id: serial("id").primaryKey(),
  branchId: integer("branch_id").notNull(),
  productId: integer("product_id").notNull(),
  batchNo: text("batch_no").notNull(),
  expiryDate: text("expiry_date").notNull(),
  qty: real("qty").notNull(),
  costPrice: real("cost_price"),
  receivedAt: text("received_at").notNull(),
});

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

export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactName: text("contact_name"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  status: text("status").notNull().default("aktif"),
});

export const purchaseOrders = pgTable("purchase_orders", {
  id: serial("id").primaryKey(),
  poNo: text("po_no").notNull().unique(),
  supplierId: integer("supplier_id").notNull(),
  branchId: integer("branch_id").notNull(),
  totalAmount: real("total_amount").notNull(),
  status: text("status").notNull().default("draft"), // draft, ordered, received, cancelled
  note: text("note"),
  userId: integer("user_id"),
  createdAt: text("created_at").notNull(),
});

export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: serial("id").primaryKey(),
  poId: integer("po_id").notNull(),
  productId: integer("product_id").notNull(),
  qty: real("qty").notNull(),
  costPrice: real("cost_price").notNull(),
  subtotal: real("subtotal").notNull(),
});

export const stockTransfers = pgTable("stock_transfers", {
  id: serial("id").primaryKey(),
  transferNo: text("transfer_no").notNull().unique(),
  fromBranchId: integer("from_branch_id").notNull(),
  toBranchId: integer("to_branch_id").notNull(),
  status: text("status").notNull().default("pending"), // pending, shipped, received, cancelled
  note: text("note"),
  userId: integer("user_id"),
  createdAt: text("created_at").notNull(),
});

export const stockTransferItems = pgTable("stock_transfer_items", {
  id: serial("id").primaryKey(),
  transferId: integer("transfer_id").notNull(),
  productId: integer("product_id").notNull(),
  qty: real("qty").notNull(),
});

export const vouchers = pgTable("vouchers", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  description: text("description"),
  type: text("type").notNull(), // fixed, percentage
  value: real("value").notNull(),
  minPurchase: real("min_purchase").notNull().default(0),
  maxDiscount: real("max_discount"),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  quota: integer("quota"),
  usedCount: integer("used_count").notNull().default(0),
  status: text("status").notNull().default("aktif"),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  action: text("action").notNull(),
  module: text("module").notNull(),
  resourceId: text("resource_id"),
  oldData: text("old_data"),
  newData: text("new_data"),
  ipAddress: text("ip_address"),
  createdAt: text("created_at").notNull(),
});

export const returns = pgTable("returns", {
  id: serial("id").primaryKey(),
  returnNo: text("return_no").notNull().unique(),
  transactionId: integer("transaction_id").notNull(),
  branchId: integer("branch_id").notNull(),
  memberId: integer("member_id"),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected, completed
  refundAmount: real("refund_amount").notNull().default(0),
  refundMethod: text("refund_method"), // tunai, qris, transfer, credit
  note: text("note"),
  userId: integer("user_id"),
  createdAt: text("created_at").notNull(),
  processedAt: text("processed_at"),
});

export const returnItems = pgTable("return_items", {
  id: serial("id").primaryKey(),
  returnId: integer("return_id").notNull(),
  transactionItemId: integer("transaction_item_id").notNull(),
  productId: integer("product_id").notNull(),
  qty: real("qty").notNull(),
  price: real("price").notNull(),
  subtotal: real("subtotal").notNull(),
  condition: text("condition").notNull().default("baik"), // baik, rusak
  restock: boolean("restock").notNull().default(true),
});

export const cashShifts = pgTable("cash_shifts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  branchId: integer("branch_id").notNull(),
  openingCash: real("opening_cash").notNull().default(0),
  closingCash: real("closing_cash"),
  expectedCash: real("expected_cash"),
  variance: real("variance"),
  status: text("status").notNull().default("open"), // open, closed
  openedAt: text("opened_at").notNull(),
  closedAt: text("closed_at"),
  note: text("note"),
});

export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
});

export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  description: text("description"),
  module: text("module").notNull(),
});

export const rolePermissions = pgTable(
  "role_permissions",
  {
    id: serial("id").primaryKey(),
    roleId: integer("role_id").notNull().references(() => roles.id),
    permissionId: integer("permission_id").notNull().references(() => permissions.id),
  },
  (t) => ({
    uniq: uniqueIndex("role_permissions_role_permission_uniq").on(t.roleId, t.permissionId),
  })
);

export const customerCredits = pgTable("customer_credits", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").notNull().unique(),
  creditLimit: real("credit_limit").notNull().default(0),
  usedCredit: real("used_credit").notNull().default(0),
  status: text("status").notNull().default("aktif"), // aktif, blocked, overdue
  note: text("note"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const creditPayments = pgTable("credit_payments", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").notNull(),
  amount: real("amount").notNull(),
  paymentMethod: text("payment_method").notNull(),
  note: text("note"),
  userId: integer("user_id"),
  createdAt: text("created_at").notNull(),
});

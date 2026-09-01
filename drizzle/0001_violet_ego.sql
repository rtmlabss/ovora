CREATE TABLE "attendances" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"branch_id" integer NOT NULL,
	"shift_id" integer,
	"type" text NOT NULL,
	"photo_url" text,
	"selfie_photo" text,
	"latitude" real,
	"longitude" real,
	"accuracy" real,
	"location_address" text,
	"timestamp" text NOT NULL,
	"device_info" text,
	"status" text DEFAULT 'tepat' NOT NULL,
	"note" text,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"action" text NOT NULL,
	"module" text NOT NULL,
	"resource_id" text,
	"old_data" text,
	"new_data" text,
	"ip_address" text,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cash_shifts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"branch_id" integer NOT NULL,
	"opening_cash" real DEFAULT 0 NOT NULL,
	"closing_cash" real,
	"expected_cash" real,
	"variance" real,
	"status" text DEFAULT 'open' NOT NULL,
	"opened_at" text NOT NULL,
	"closed_at" text,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "credit_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"member_id" integer NOT NULL,
	"amount" real NOT NULL,
	"payment_method" text NOT NULL,
	"note" text,
	"user_id" integer,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_credits" (
	"id" serial PRIMARY KEY NOT NULL,
	"member_id" integer NOT NULL,
	"credit_limit" real DEFAULT 0 NOT NULL,
	"used_credit" real DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'aktif' NOT NULL,
	"note" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "customer_credits_member_id_unique" UNIQUE("member_id")
);
--> statement-breakpoint
CREATE TABLE "employee_shifts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"branch_id" integer NOT NULL,
	"shift_name" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"work_days" text NOT NULL,
	"status" text DEFAULT 'aktif' NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"module" text NOT NULL,
	CONSTRAINT "permissions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "purchase_order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"po_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"qty" real NOT NULL,
	"cost_price" real NOT NULL,
	"subtotal" real NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"po_no" text NOT NULL,
	"supplier_id" integer NOT NULL,
	"branch_id" integer NOT NULL,
	"total_amount" real NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"note" text,
	"user_id" integer,
	"created_at" text NOT NULL,
	CONSTRAINT "purchase_orders_po_no_unique" UNIQUE("po_no")
);
--> statement-breakpoint
CREATE TABLE "return_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"return_id" integer NOT NULL,
	"transaction_item_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"qty" real NOT NULL,
	"price" real NOT NULL,
	"subtotal" real NOT NULL,
	"condition" text DEFAULT 'baik' NOT NULL,
	"restock" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "returns" (
	"id" serial PRIMARY KEY NOT NULL,
	"return_no" text NOT NULL,
	"transaction_id" integer NOT NULL,
	"branch_id" integer NOT NULL,
	"member_id" integer,
	"reason" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"refund_amount" real DEFAULT 0 NOT NULL,
	"refund_method" text,
	"note" text,
	"user_id" integer,
	"created_at" text NOT NULL,
	"processed_at" text,
	CONSTRAINT "returns_return_no_unique" UNIQUE("return_no")
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"role_id" integer NOT NULL,
	"permission_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "stock_batches" (
	"id" serial PRIMARY KEY NOT NULL,
	"branch_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"batch_no" text NOT NULL,
	"expiry_date" text NOT NULL,
	"qty" real NOT NULL,
	"cost_price" real,
	"received_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_transfer_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"transfer_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"qty" real NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_transfers" (
	"id" serial PRIMARY KEY NOT NULL,
	"transfer_no" text NOT NULL,
	"from_branch_id" integer NOT NULL,
	"to_branch_id" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"note" text,
	"user_id" integer,
	"created_at" text NOT NULL,
	CONSTRAINT "stock_transfers_transfer_no_unique" UNIQUE("transfer_no")
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"contact_name" text,
	"phone" text,
	"email" text,
	"address" text,
	"status" text DEFAULT 'aktif' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vouchers" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"value" real NOT NULL,
	"min_purchase" real DEFAULT 0 NOT NULL,
	"max_discount" real,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"quota" integer,
	"used_count" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'aktif' NOT NULL,
	"created_at" text NOT NULL,
	CONSTRAINT "vouchers_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "barcode" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "expiry_days" integer DEFAULT 30;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD COLUMN "batch_no" text;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD COLUMN "expiry_date" text;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD COLUMN "cost_price" real;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "tax" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "service_charge" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "role_permissions_role_permission_uniq" ON "role_permissions" USING btree ("role_id","permission_id");
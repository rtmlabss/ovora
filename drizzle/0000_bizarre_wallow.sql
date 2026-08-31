CREATE TABLE "branch_stocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"branch_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"stock_qty" real DEFAULT 0 NOT NULL,
	"min_stock" real DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "branches" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"city" text,
	"status" text DEFAULT 'aktif' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financial_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"branch_id" integer NOT NULL,
	"type" text NOT NULL,
	"category" text NOT NULL,
	"amount" real NOT NULL,
	"note" text,
	"transaction_id" integer,
	"user_id" integer,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" serial PRIMARY KEY NOT NULL,
	"branch_id" integer NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"email" text,
	"points_balance" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "point_movements" (
	"id" serial PRIMARY KEY NOT NULL,
	"member_id" integer NOT NULL,
	"branch_id" integer NOT NULL,
	"kind" text NOT NULL,
	"points" integer NOT NULL,
	"note" text,
	"transaction_id" integer,
	"user_id" integer,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"branch_id" integer NOT NULL,
	"name" text NOT NULL,
	"unit" text NOT NULL,
	"price" real NOT NULL,
	"stock_qty" real DEFAULT 0 NOT NULL,
	"min_stock" real DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reward_winners" (
	"id" serial PRIMARY KEY NOT NULL,
	"reward_id" integer NOT NULL,
	"member_id" integer NOT NULL,
	"rank" integer NOT NULL,
	"status" text DEFAULT 'dijadwalkan' NOT NULL,
	"delivered_date" text,
	"note" text,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rewards" (
	"id" serial PRIMARY KEY NOT NULL,
	"period" text NOT NULL,
	"title" text NOT NULL,
	"created_at" text NOT NULL,
	CONSTRAINT "rewards_period_unique" UNIQUE("period")
);
--> statement-breakpoint
CREATE TABLE "stock_movements" (
	"id" serial PRIMARY KEY NOT NULL,
	"branch_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"type" text NOT NULL,
	"qty" real NOT NULL,
	"note" text,
	"user_id" integer,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"tagline" text,
	"address" text,
	"city" text,
	"phone" text,
	"currency" text DEFAULT 'IDR' NOT NULL,
	"description" text,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transaction_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"transaction_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"qty" real NOT NULL,
	"price" real NOT NULL,
	"subtotal" real NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_no" text NOT NULL,
	"branch_id" integer NOT NULL,
	"member_id" integer,
	"subtotal" real NOT NULL,
	"discount" real DEFAULT 0 NOT NULL,
	"points_used" integer DEFAULT 0 NOT NULL,
	"total" real NOT NULL,
	"payment_method" text DEFAULT 'tunai' NOT NULL,
	"user_id" integer,
	"created_at" text NOT NULL,
	CONSTRAINT "transactions_invoice_no_unique" UNIQUE("invoice_no")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'kasir' NOT NULL,
	"status" text DEFAULT 'aktif' NOT NULL,
	"branch_id" integer,
	"created_at" text NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "reward_winners" ADD CONSTRAINT "reward_winners_reward_id_rewards_id_fk" FOREIGN KEY ("reward_id") REFERENCES "public"."rewards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_winners" ADD CONSTRAINT "reward_winners_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "branch_stocks_branch_product_uniq" ON "branch_stocks" USING btree ("branch_id","product_id");
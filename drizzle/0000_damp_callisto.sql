CREATE TABLE `branches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`address` text,
	`city` text
);
--> statement-breakpoint
CREATE TABLE `financial_transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`branch_id` integer NOT NULL,
	`type` text NOT NULL,
	`category` text NOT NULL,
	`amount` real NOT NULL,
	`note` text,
	`transaction_id` integer,
	`user_id` integer,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `members` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`branch_id` integer NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`email` text,
	`points_balance` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`branch_id` integer NOT NULL,
	`name` text NOT NULL,
	`unit` text NOT NULL,
	`price` real NOT NULL,
	`stock_qty` real DEFAULT 0 NOT NULL,
	`min_stock` real DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `transaction_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`transaction_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`qty` real NOT NULL,
	`price` real NOT NULL,
	`subtotal` real NOT NULL
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invoice_no` text NOT NULL,
	`branch_id` integer NOT NULL,
	`member_id` integer,
	`subtotal` real NOT NULL,
	`discount` real DEFAULT 0 NOT NULL,
	`points_used` integer DEFAULT 0 NOT NULL,
	`total` real NOT NULL,
	`payment_method` text DEFAULT 'tunai' NOT NULL,
	`user_id` integer,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `transactions_invoice_no_unique` ON `transactions` (`invoice_no`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'kasir' NOT NULL,
	`branch_id` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
CREATE TABLE `stock_movements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`branch_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`type` text NOT NULL,
	`qty` real NOT NULL,
	`note` text,
	`user_id` integer,
	`created_at` text NOT NULL
);

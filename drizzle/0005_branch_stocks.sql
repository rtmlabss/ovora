CREATE TABLE `branch_stocks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`branch_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`stock_qty` real DEFAULT 0 NOT NULL,
	`min_stock` real DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `branch_stocks_branch_id_product_id_unique` ON `branch_stocks` (`branch_id`,`product_id`);
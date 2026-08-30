CREATE TABLE `point_movements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`branch_id` integer NOT NULL,
	`kind` text NOT NULL,
	`points` integer NOT NULL,
	`note` text,
	`transaction_id` integer,
	`user_id` integer,
	`created_at` text NOT NULL
);

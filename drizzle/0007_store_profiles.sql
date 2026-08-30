CREATE TABLE `store_profiles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`tagline` text,
	`address` text,
	`city` text,
	`phone` text,
	`currency` text DEFAULT 'IDR' NOT NULL,
	`description` text,
	`updated_at` text NOT NULL
);

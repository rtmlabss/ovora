CREATE TABLE `reward_winners` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`reward_id` integer NOT NULL,
	`member_id` integer NOT NULL,
	`rank` integer NOT NULL,
	`status` text DEFAULT 'dijadwalkan' NOT NULL,
	`delivered_date` text,
	`note` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`reward_id`) REFERENCES `rewards`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `rewards` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`period` text NOT NULL,
	`title` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rewards_period_unique` ON `rewards` (`period`);
CREATE TABLE `class` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`name` text NOT NULL,
	`semester_id` integer NOT NULL,
	`created_by` integer NOT NULL,
	FOREIGN KEY (`semester_id`) REFERENCES `semester`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `student_class` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`attendant_id` integer NOT NULL,
	`class_id` integer NOT NULL,
	FOREIGN KEY (`attendant_id`) REFERENCES `attendant`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`class_id`) REFERENCES `class`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_semester` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`name` text NOT NULL,
	`is_active` integer DEFAULT false NOT NULL,
	`created_by` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_semester`("id", "created_at", "name", "is_active", "created_by") SELECT "id", "created_at", "name", "is_active", "created_by" FROM `semester`;--> statement-breakpoint
DROP TABLE `semester`;--> statement-breakpoint
ALTER TABLE `__new_semester` RENAME TO `semester`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
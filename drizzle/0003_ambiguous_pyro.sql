CREATE TABLE `poll` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`is_open` integer DEFAULT true NOT NULL,
	`require_identification` integer DEFAULT false NOT NULL,
	`created_by` integer NOT NULL,
	`semester_id` integer,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`semester_id`) REFERENCES `semester`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `poll_question` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`poll_id` integer NOT NULL,
	`question_text` text NOT NULL,
	`question_type` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_required` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`poll_id`) REFERENCES `poll`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `poll_question_option` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`question_id` integer NOT NULL,
	`option_text` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`question_id`) REFERENCES `poll_question`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `poll_response` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`poll_id` integer NOT NULL,
	`question_id` integer NOT NULL,
	`respondent_id` text NOT NULL,
	`answer_text` text,
	`selected_option_id` integer,
	FOREIGN KEY (`poll_id`) REFERENCES `poll`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`question_id`) REFERENCES `poll_question`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`selected_option_id`) REFERENCES `poll_question_option`(`id`) ON UPDATE no action ON DELETE no action
);

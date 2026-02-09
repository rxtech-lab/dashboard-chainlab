ALTER TABLE `attendance_room` ADD `class_id` integer REFERENCES class(id);--> statement-breakpoint
ALTER TABLE `attendant` ADD `email` text;
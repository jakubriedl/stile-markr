CREATE TABLE `import_request_keys` (
	`test_id` text NOT NULL,
	`student_number` integer NOT NULL,
	PRIMARY KEY(`test_id`, `student_number`),
	CONSTRAINT "import_request_keys_test_id_canonical" CHECK(length("import_request_keys"."test_id") > 0 AND "import_request_keys"."test_id" NOT GLOB '*[^a-z0-9_-]*'),
	CONSTRAINT "import_request_keys_student_number_safe" CHECK("import_request_keys"."student_number" >= 1 AND "import_request_keys"."student_number" <= 9007199254740991)
);
--> statement-breakpoint
CREATE TABLE `results` (
	`test_id` text NOT NULL,
	`student_number` integer NOT NULL,
	`obtained` integer NOT NULL,
	`available` integer NOT NULL,
	`first_name` text,
	`last_name` text,
	`scanned_on_ms` integer,
	`created_at_ms` integer NOT NULL,
	`updated_at_ms` integer NOT NULL,
	PRIMARY KEY(`test_id`, `student_number`),
	CONSTRAINT "results_test_id_canonical" CHECK(length("results"."test_id") > 0 AND "results"."test_id" NOT GLOB '*[^a-z0-9_-]*'),
	CONSTRAINT "results_student_number_safe" CHECK("results"."student_number" >= 1 AND "results"."student_number" <= 9007199254740991),
	CONSTRAINT "results_available_positive" CHECK("results"."available" > 0),
	CONSTRAINT "results_obtained_bounded" CHECK("results"."obtained" >= 0 AND "results"."obtained" <= "results"."available")
);

CREATE TABLE `activity_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`ts` text NOT NULL,
	`correlation_id` text NOT NULL,
	`actor` text NOT NULL,
	`source` text NOT NULL,
	`level` text NOT NULL,
	`event` text NOT NULL,
	`entity_type` text,
	`entity_id` text,
	`status` text NOT NULL,
	`duration_ms` integer,
	`error_code` text,
	`error_message` text,
	`metadata` text,
	CONSTRAINT "activity_logs_source_check" CHECK("activity_logs"."source" IN ('server','client','cron')),
	CONSTRAINT "activity_logs_level_check" CHECK("activity_logs"."level" IN ('info','warn','error')),
	CONSTRAINT "activity_logs_status_check" CHECK("activity_logs"."status" IN ('started','success','failed'))
);
--> statement-breakpoint
CREATE INDEX `idx_logs_entity` ON `activity_logs` (`entity_type`,`entity_id`,`ts`);--> statement-breakpoint
CREATE INDEX `idx_logs_level_ts` ON `activity_logs` (`level`,`ts`);--> statement-breakpoint
CREATE INDEX `idx_logs_correlation` ON `activity_logs` (`correlation_id`);--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`type` text NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`phone` text,
	`address` text,
	`npwp` text,
	`is_archived` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "contacts_type_check" CHECK("contacts"."type" IN ('sender','client'))
);
--> statement-breakpoint
CREATE INDEX `idx_contacts_org_type` ON `contacts` (`org_id`,`type`,`is_archived`);--> statement-breakpoint
CREATE TABLE `email_deliveries` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_id` text NOT NULL,
	`to_email` text NOT NULL,
	`provider_message_id` text,
	`status` text NOT NULL,
	`error_message` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "email_deliveries_status_check" CHECK("email_deliveries"."status" IN ('queued','sent','failed','bounced'))
);
--> statement-breakpoint
CREATE TABLE `exports` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`kind` text NOT NULL,
	`scope` text NOT NULL,
	`filters_json` text,
	`row_count` integer,
	`r2_key` text,
	`created_at` text NOT NULL,
	CONSTRAINT "exports_kind_check" CHECK("exports"."kind" IN ('xlsx','csv','json','zip')),
	CONSTRAINT "exports_scope_check" CHECK("exports"."scope" IN ('single','selected','filtered','all'))
);
--> statement-breakpoint
CREATE TABLE `idempotency_keys` (
	`key` text PRIMARY KEY NOT NULL,
	`response_json` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `invoice_files` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_id` text NOT NULL,
	`kind` text DEFAULT 'pdf' NOT NULL,
	`r2_key` text NOT NULL,
	`sha256` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`render_ms` integer,
	`created_at` text NOT NULL,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `invoice_items` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_id` text NOT NULL,
	`sort_order` integer NOT NULL,
	`description` text NOT NULL,
	`unit` text,
	`qty_milli` integer NOT NULL,
	`unit_price` integer NOT NULL,
	`line_total` integer NOT NULL,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "invoice_items_qty_check" CHECK("invoice_items"."qty_milli" > 0),
	CONSTRAINT "invoice_items_unit_price_check" CHECK("invoice_items"."unit_price" >= 0)
);
--> statement-breakpoint
CREATE INDEX `idx_items_invoice` ON `invoice_items` (`invoice_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`number` text,
	`status` text NOT NULL,
	`issue_date` text,
	`due_date` text,
	`currency` text DEFAULT 'IDR' NOT NULL,
	`template_version_id` text,
	`client_id` text,
	`sender_snapshot` text,
	`client_snapshot` text,
	`discount_type` text DEFAULT 'none' NOT NULL,
	`discount_value` integer DEFAULT 0 NOT NULL,
	`tax_rate_bp` integer DEFAULT 1200 NOT NULL,
	`dpp_num` integer DEFAULT 11 NOT NULL,
	`dpp_den` integer DEFAULT 12 NOT NULL,
	`shipping_amount` integer DEFAULT 0 NOT NULL,
	`shipping_taxable` integer DEFAULT false NOT NULL,
	`subtotal` integer DEFAULT 0 NOT NULL,
	`discount_total` integer DEFAULT 0 NOT NULL,
	`dpp_amount` integer DEFAULT 0 NOT NULL,
	`tax_amount` integer DEFAULT 0 NOT NULL,
	`grand_total` integer DEFAULT 0 NOT NULL,
	`amount_paid` integer DEFAULT 0 NOT NULL,
	`notes` text,
	`logo_key` text,
	`signature_key` text,
	`faktur_pajak_number` text,
	`pdf_status` text DEFAULT 'none' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`issued_at` text,
	`voided_at` text,
	`void_reason` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`template_version_id`) REFERENCES `template_versions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`client_id`) REFERENCES `contacts`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "invoices_status_check" CHECK("invoices"."status" IN ('draft','issued','sent','partially_paid','paid','void')),
	CONSTRAINT "invoices_discount_type_check" CHECK("invoices"."discount_type" IN ('none','percent','fixed')),
	CONSTRAINT "invoices_pdf_status_check" CHECK("invoices"."pdf_status" IN ('none','pending','ready','failed'))
);
--> statement-breakpoint
CREATE INDEX `idx_invoices_org_status` ON `invoices` (`org_id`,`status`,`issue_date`);--> statement-breakpoint
CREATE INDEX `idx_invoices_org_client` ON `invoices` (`org_id`,`client_id`);--> statement-breakpoint
CREATE INDEX `idx_invoices_org_due` ON `invoices` (`org_id`,`due_date`);--> statement-breakpoint
CREATE UNIQUE INDEX `invoices_org_number_unique` ON `invoices` (`org_id`,`number`);--> statement-breakpoint
CREATE TABLE `number_sequences` (
	`org_id` text NOT NULL,
	`scope` text NOT NULL,
	`last_value` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`org_id`, `scope`)
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`npwp` text,
	`address` text,
	`logo_key` text,
	`default_template_id` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_id` text NOT NULL,
	`amount` integer NOT NULL,
	`paid_at` text NOT NULL,
	`method` text,
	`note` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "payments_amount_check" CHECK("payments"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE `template_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`template_id` text NOT NULL,
	`version` integer NOT NULL,
	`schema_json` text NOT NULL,
	`background_key` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`template_id`) REFERENCES `templates`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `template_versions_template_version_unique` ON `template_versions` (`template_id`,`version`);--> statement-breakpoint
CREATE TABLE `templates` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`name` text NOT NULL,
	`current_version` integer DEFAULT 1 NOT NULL,
	`is_archived` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);

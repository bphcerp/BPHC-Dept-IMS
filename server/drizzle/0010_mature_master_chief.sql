DO $$ BEGIN
 CREATE TYPE "public"."modules" AS ENUM('Conference Approval', 'Course Handout', 'PhD Progress', 'PhD Proposal', 'Question Paper', 'SFC Meeting', 'Project Info', 'Patent Info');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "file_field_status" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_email" text NOT NULL,
	"comments" text NOT NULL,
	"updated_as" text NOT NULL,
	"text_field" text NOT NULL,
	"status" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "file_fields" (
	"id" serial PRIMARY KEY NOT NULL,
	"file" serial NOT NULL,
	"module" "modules" NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "files" (
	"id" serial PRIMARY KEY NOT NULL,
	"file_path" text NOT NULL,
	"created_at" text NOT NULL,
	"uploaded_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "text_field_status" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_email" text NOT NULL,
	"comments" text NOT NULL,
	"updated_as" text NOT NULL,
	"text_field" text NOT NULL,
	"status" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "text_fields" (
	"id" serial PRIMARY KEY NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "file_field_status" ADD CONSTRAINT "file_field_status_user_email_users_email_fk" FOREIGN KEY ("user_email") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "file_field_status" ADD CONSTRAINT "file_field_status_text_field_file_fields_id_fk" FOREIGN KEY ("text_field") REFERENCES "public"."file_fields"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "file_fields" ADD CONSTRAINT "file_fields_file_files_id_fk" FOREIGN KEY ("file") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "files" ADD CONSTRAINT "files_uploaded_by_users_email_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "text_field_status" ADD CONSTRAINT "text_field_status_user_email_users_email_fk" FOREIGN KEY ("user_email") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "text_field_status" ADD CONSTRAINT "text_field_status_text_field_text_fields_id_fk" FOREIGN KEY ("text_field") REFERENCES "public"."text_fields"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "course_handout_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_email" text NOT NULL,
	"course_code" integer,
	"course_name" integer,
	"course_strength" integer,
	"open_book" integer,
	"closed_book" integer,
	"mid_sem" integer,
	"compre" integer,
	"num_components" integer,
	"frequency" integer,
	"handout_file_path" integer
);
--> statement-breakpoint
ALTER TABLE "phd_courses" ADD COLUMN "course_ids" text[];--> statement-breakpoint
ALTER TABLE "phd_courses" ADD COLUMN "course_id" text[];--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_handout_requests" ADD CONSTRAINT "course_handout_requests_user_email_users_email_fk" FOREIGN KEY ("user_email") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_handout_requests" ADD CONSTRAINT "course_handout_requests_course_code_text_fields_id_fk" FOREIGN KEY ("course_code") REFERENCES "public"."text_fields"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_handout_requests" ADD CONSTRAINT "course_handout_requests_course_name_text_fields_id_fk" FOREIGN KEY ("course_name") REFERENCES "public"."text_fields"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_handout_requests" ADD CONSTRAINT "course_handout_requests_course_strength_text_fields_id_fk" FOREIGN KEY ("course_strength") REFERENCES "public"."text_fields"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_handout_requests" ADD CONSTRAINT "course_handout_requests_open_book_text_fields_id_fk" FOREIGN KEY ("open_book") REFERENCES "public"."text_fields"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_handout_requests" ADD CONSTRAINT "course_handout_requests_closed_book_text_fields_id_fk" FOREIGN KEY ("closed_book") REFERENCES "public"."text_fields"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_handout_requests" ADD CONSTRAINT "course_handout_requests_mid_sem_text_fields_id_fk" FOREIGN KEY ("mid_sem") REFERENCES "public"."text_fields"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_handout_requests" ADD CONSTRAINT "course_handout_requests_compre_text_fields_id_fk" FOREIGN KEY ("compre") REFERENCES "public"."text_fields"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_handout_requests" ADD CONSTRAINT "course_handout_requests_num_components_text_fields_id_fk" FOREIGN KEY ("num_components") REFERENCES "public"."text_fields"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_handout_requests" ADD CONSTRAINT "course_handout_requests_frequency_text_fields_id_fk" FOREIGN KEY ("frequency") REFERENCES "public"."text_fields"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_handout_requests" ADD CONSTRAINT "course_handout_requests_handout_file_path_file_fields_id_fk" FOREIGN KEY ("handout_file_path") REFERENCES "public"."file_fields"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

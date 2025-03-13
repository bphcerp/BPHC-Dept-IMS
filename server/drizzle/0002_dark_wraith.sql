CREATE TABLE IF NOT EXISTS "qp_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" integer NOT NULL,
	"dca" integer NOT NULL,
	"course_no" integer NOT NULL,
	"course" integer NOT NULL,
	"fic" integer NOT NULL,
	"fic_deadline" integer NOT NULL,
	"midsem" integer NOT NULL,
	"midsem_sol" integer NOT NULL,
	"compre" integer NOT NULL,
	"compre_sol" integer NOT NULL,
	"documents_uploaded" boolean NOT NULL,
	"faculty_1" integer NOT NULL,
	"review_1" jsonb NOT NULL,
	"faculty_2" integer NOT NULL,
	"review_2" jsonb NOT NULL,
	"approval_status" boolean NOT NULL,
	"review_deadline" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "qp_requests" ADD CONSTRAINT "qp_requests_request_id_applications_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "qp_requests" ADD CONSTRAINT "qp_requests_dca_text_fields_id_fk" FOREIGN KEY ("dca") REFERENCES "public"."text_fields"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "qp_requests" ADD CONSTRAINT "qp_requests_course_no_text_fields_id_fk" FOREIGN KEY ("course_no") REFERENCES "public"."text_fields"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "qp_requests" ADD CONSTRAINT "qp_requests_course_text_fields_id_fk" FOREIGN KEY ("course") REFERENCES "public"."text_fields"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "qp_requests" ADD CONSTRAINT "qp_requests_fic_text_fields_id_fk" FOREIGN KEY ("fic") REFERENCES "public"."text_fields"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "qp_requests" ADD CONSTRAINT "qp_requests_fic_deadline_date_fields_id_fk" FOREIGN KEY ("fic_deadline") REFERENCES "public"."date_fields"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "qp_requests" ADD CONSTRAINT "qp_requests_midsem_file_fields_id_fk" FOREIGN KEY ("midsem") REFERENCES "public"."file_fields"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "qp_requests" ADD CONSTRAINT "qp_requests_midsem_sol_file_fields_id_fk" FOREIGN KEY ("midsem_sol") REFERENCES "public"."file_fields"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "qp_requests" ADD CONSTRAINT "qp_requests_compre_file_fields_id_fk" FOREIGN KEY ("compre") REFERENCES "public"."file_fields"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "qp_requests" ADD CONSTRAINT "qp_requests_compre_sol_file_fields_id_fk" FOREIGN KEY ("compre_sol") REFERENCES "public"."file_fields"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "qp_requests" ADD CONSTRAINT "qp_requests_faculty_1_text_fields_id_fk" FOREIGN KEY ("faculty_1") REFERENCES "public"."text_fields"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "qp_requests" ADD CONSTRAINT "qp_requests_faculty_2_text_fields_id_fk" FOREIGN KEY ("faculty_2") REFERENCES "public"."text_fields"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "qp_requests" ADD CONSTRAINT "qp_requests_review_deadline_date_fields_id_fk" FOREIGN KEY ("review_deadline") REFERENCES "public"."date_fields"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

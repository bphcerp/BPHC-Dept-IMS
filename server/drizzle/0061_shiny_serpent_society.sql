CREATE TYPE "public"."qp_status_enum" AS ENUM('review pending', 'reviewed', 'approved', 'rejected', 'notsubmitted');--> statement-breakpoint
CREATE TYPE "public"."type_enum" AS ENUM('Mid Sem', 'Comprehensive', 'Both');--> statement-breakpoint
CREATE TABLE "qp_review_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"ic_email" text,
	"reviewer_email" text,
	"course_name" text NOT NULL,
	"course_code" text NOT NULL,
	"midSem_qp_file_path" integer,
	"midSem_sol_file_path" integer,
	"compre_qp_file_path" integer,
	"compre_sol_file_path" integer,
	"review" jsonb,
	"documents_uploaded" boolean DEFAULT false NOT NULL,
	"status" "qp_status_enum" DEFAULT 'notsubmitted' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"category" "category_enum" NOT NULL,
	"submitted_on" timestamp with time zone,
	"request_type" "type_enum" NOT NULL
);
--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD CONSTRAINT "qp_review_requests_ic_email_users_email_fk" FOREIGN KEY ("ic_email") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD CONSTRAINT "qp_review_requests_reviewer_email_users_email_fk" FOREIGN KEY ("reviewer_email") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD CONSTRAINT "qp_review_requests_midSem_qp_file_path_file_fields_id_fk" FOREIGN KEY ("midSem_qp_file_path") REFERENCES "public"."file_fields"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD CONSTRAINT "qp_review_requests_midSem_sol_file_path_file_fields_id_fk" FOREIGN KEY ("midSem_sol_file_path") REFERENCES "public"."file_fields"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD CONSTRAINT "qp_review_requests_compre_qp_file_path_file_fields_id_fk" FOREIGN KEY ("compre_qp_file_path") REFERENCES "public"."file_fields"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD CONSTRAINT "qp_review_requests_compre_sol_file_path_file_fields_id_fk" FOREIGN KEY ("compre_sol_file_path") REFERENCES "public"."file_fields"("id") ON DELETE set null ON UPDATE no action;
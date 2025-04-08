CREATE TYPE "public"."qp_status_enum" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP CONSTRAINT "qp_review_requests_application_id_applications_id_fk";
--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP CONSTRAINT "qp_review_requests_dca_member_text_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP CONSTRAINT "qp_review_requests_course_no_text_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP CONSTRAINT "qp_review_requests_course_name_text_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP CONSTRAINT "qp_review_requests_fic_text_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP CONSTRAINT "qp_review_requests_fic_deadline_date_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP CONSTRAINT "qp_review_requests_mid_sem_file_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP CONSTRAINT "qp_review_requests_mid_sem_sol_file_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP CONSTRAINT "qp_review_requests_compre_file_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP CONSTRAINT "qp_review_requests_compre_sol_file_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP CONSTRAINT "qp_review_requests_faculty_1_text_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP CONSTRAINT "qp_review_requests_faculty_2_text_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP CONSTRAINT "qp_review_requests_review_deadline_date_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP COLUMN "fic_deadline";
--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP COLUMN "review_deadline";
--> statement-breakpoint
ALTER TABLE "qp_review_requests" ALTER COLUMN "course_name" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ALTER COLUMN "course_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD COLUMN "fic_deadline" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD COLUMN "review_deadline" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "course_handout_requests" ADD COLUMN "deadline" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "course_handout_requests" ADD COLUMN "comments" text;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD COLUMN "dca_member_email" text NOT NULL;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD COLUMN "fic_email" text;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD COLUMN "faculty_1_email" text;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD COLUMN "faculty_2_email" text;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD COLUMN "course_code" text NOT NULL;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD COLUMN "mid_sem_file_id" integer;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD COLUMN "mid_sem_sol_file_id" integer;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD COLUMN "compre_file_id" integer;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD COLUMN "compre_sol_file_id" integer;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD COLUMN "reviewed" text DEFAULT 'review pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD COLUMN "status" "qp_status_enum" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD CONSTRAINT "qp_review_requests_dca_member_email_users_email_fk" FOREIGN KEY ("dca_member_email") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD CONSTRAINT "qp_review_requests_fic_email_users_email_fk" FOREIGN KEY ("fic_email") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD CONSTRAINT "qp_review_requests_faculty_1_email_users_email_fk" FOREIGN KEY ("faculty_1_email") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD CONSTRAINT "qp_review_requests_faculty_2_email_users_email_fk" FOREIGN KEY ("faculty_2_email") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD CONSTRAINT "qp_review_requests_mid_sem_file_id_file_fields_id_fk" FOREIGN KEY ("mid_sem_file_id") REFERENCES "public"."file_fields"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD CONSTRAINT "qp_review_requests_mid_sem_sol_file_id_file_fields_id_fk" FOREIGN KEY ("mid_sem_sol_file_id") REFERENCES "public"."file_fields"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD CONSTRAINT "qp_review_requests_compre_file_id_file_fields_id_fk" FOREIGN KEY ("compre_file_id") REFERENCES "public"."file_fields"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD CONSTRAINT "qp_review_requests_compre_sol_file_id_file_fields_id_fk" FOREIGN KEY ("compre_sol_file_id") REFERENCES "public"."file_fields"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP COLUMN "application_id";--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP COLUMN "dca_member";--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP COLUMN "course_no";--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP COLUMN "fic";--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP COLUMN "mid_sem";--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP COLUMN "mid_sem_sol";--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP COLUMN "compre";--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP COLUMN "compre_sol";--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP COLUMN "faculty_1";--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP COLUMN "faculty_2";
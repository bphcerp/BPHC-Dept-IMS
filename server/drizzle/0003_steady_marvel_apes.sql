CREATE TYPE "public"."handout_status_enum" AS ENUM('pending', 'approved', 'rejected', 'notsubmitted');--> statement-breakpoint
ALTER TABLE "course_handout_requests" DROP CONSTRAINT "course_handout_requests_application_id_applications_id_fk";
--> statement-breakpoint
ALTER TABLE "course_handout_requests" DROP CONSTRAINT "course_handout_requests_course_code_text_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "course_handout_requests" DROP CONSTRAINT "course_handout_requests_course_name_text_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "course_handout_requests" DROP CONSTRAINT "course_handout_requests_course_strength_text_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "course_handout_requests" DROP CONSTRAINT "course_handout_requests_open_book_text_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "course_handout_requests" DROP CONSTRAINT "course_handout_requests_closed_book_text_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "course_handout_requests" DROP CONSTRAINT "course_handout_requests_mid_sem_text_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "course_handout_requests" DROP CONSTRAINT "course_handout_requests_compre_text_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "course_handout_requests" DROP CONSTRAINT "course_handout_requests_num_components_text_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "course_handout_requests" DROP CONSTRAINT "course_handout_requests_frequency_text_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "course_handout_requests" ALTER COLUMN "course_code" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "course_handout_requests" ALTER COLUMN "course_code" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "course_handout_requests" ALTER COLUMN "course_name" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "course_handout_requests" ALTER COLUMN "course_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "course_handout_requests" ADD COLUMN "ic_email" text NOT NULL;--> statement-breakpoint
ALTER TABLE "course_handout_requests" ADD COLUMN "reviewer_email" text;--> statement-breakpoint
ALTER TABLE "course_handout_requests" ADD COLUMN "scope_and_objective" boolean;--> statement-breakpoint
ALTER TABLE "course_handout_requests" ADD COLUMN "text_book_prescribed" boolean;--> statement-breakpoint
ALTER TABLE "course_handout_requests" ADD COLUMN "lecturewise_plan_learning_objective" boolean;--> statement-breakpoint
ALTER TABLE "course_handout_requests" ADD COLUMN "lecturewise_plan_course_topics" boolean;--> statement-breakpoint
ALTER TABLE "course_handout_requests" ADD COLUMN "number_of_lp" boolean;--> statement-breakpoint
ALTER TABLE "course_handout_requests" ADD COLUMN "evaluation_scheme" boolean;--> statement-breakpoint
ALTER TABLE "course_handout_requests" ADD COLUMN "status" "handout_status_enum" DEFAULT 'notsubmitted' NOT NULL;--> statement-breakpoint
ALTER TABLE "course_handout_requests" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "course_handout_requests" ADD CONSTRAINT "course_handout_requests_ic_email_users_email_fk" FOREIGN KEY ("ic_email") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_handout_requests" ADD CONSTRAINT "course_handout_requests_reviewer_email_users_email_fk" FOREIGN KEY ("reviewer_email") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_handout_requests" DROP COLUMN "application_id";--> statement-breakpoint
ALTER TABLE "course_handout_requests" DROP COLUMN "course_strength";--> statement-breakpoint
ALTER TABLE "course_handout_requests" DROP COLUMN "open_book";--> statement-breakpoint
ALTER TABLE "course_handout_requests" DROP COLUMN "closed_book";--> statement-breakpoint
ALTER TABLE "course_handout_requests" DROP COLUMN "mid_sem";--> statement-breakpoint
ALTER TABLE "course_handout_requests" DROP COLUMN "compre";--> statement-breakpoint
ALTER TABLE "course_handout_requests" DROP COLUMN "num_components";--> statement-breakpoint
ALTER TABLE "course_handout_requests" DROP COLUMN "frequency";
ALTER TABLE "qp_review_requests" DROP CONSTRAINT "qp_review_requests_dca_member_email_users_email_fk";
--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP CONSTRAINT "qp_review_requests_fic_email_users_email_fk";
--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP CONSTRAINT "qp_review_requests_faculty_1_email_users_email_fk";
--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP CONSTRAINT "qp_review_requests_faculty_2_email_users_email_fk";
--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP CONSTRAINT "qp_review_requests_mid_sem_file_id_file_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP CONSTRAINT "qp_review_requests_mid_sem_sol_file_id_file_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP CONSTRAINT "qp_review_requests_compre_file_id_file_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP CONSTRAINT "qp_review_requests_compre_sol_file_id_file_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "qp_review_requests" ALTER COLUMN "status" SET DEFAULT 'notsubmitted';--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD COLUMN "ic_email" text;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD COLUMN "reviewer_email" text;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD COLUMN "previous_submission_id" integer;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD COLUMN "mid_sem_file_path" integer;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD COLUMN "mid_sem_sol_file_path" integer;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD COLUMN "compre_file_path" integer;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD COLUMN "compre_sol_file_path" integer;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD COLUMN "review" jsonb;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD COLUMN "category" "category_enum" NOT NULL;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD CONSTRAINT "qp_review_requests_ic_email_users_email_fk" FOREIGN KEY ("ic_email") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD CONSTRAINT "qp_review_requests_reviewer_email_users_email_fk" FOREIGN KEY ("reviewer_email") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD CONSTRAINT "qp_review_requests_mid_sem_file_path_file_fields_id_fk" FOREIGN KEY ("mid_sem_file_path") REFERENCES "public"."file_fields"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD CONSTRAINT "qp_review_requests_mid_sem_sol_file_path_file_fields_id_fk" FOREIGN KEY ("mid_sem_sol_file_path") REFERENCES "public"."file_fields"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD CONSTRAINT "qp_review_requests_compre_file_path_file_fields_id_fk" FOREIGN KEY ("compre_file_path") REFERENCES "public"."file_fields"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD CONSTRAINT "qp_review_requests_compre_sol_file_path_file_fields_id_fk" FOREIGN KEY ("compre_sol_file_path") REFERENCES "public"."file_fields"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP COLUMN "dca_member_email";--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP COLUMN "fic_email";--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP COLUMN "faculty_1_email";--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP COLUMN "faculty_2_email";--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP COLUMN "mid_sem_file_id";--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP COLUMN "mid_sem_sol_file_id";--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP COLUMN "compre_file_id";--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP COLUMN "compre_sol_file_id";--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP COLUMN "review_1";--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP COLUMN "review_2";--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP COLUMN "reviewed";--> statement-breakpoint
ALTER TABLE "public"."qp_review_requests" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."qp_status_enum";--> statement-breakpoint
CREATE TYPE "public"."qp_status_enum" AS ENUM('review pending', 'reviewed', 'approved', 'rejected', 'notsubmitted');--> statement-breakpoint
ALTER TABLE "public"."qp_review_requests" ALTER COLUMN "status" SET DATA TYPE "public"."qp_status_enum" USING "status"::"public"."qp_status_enum";
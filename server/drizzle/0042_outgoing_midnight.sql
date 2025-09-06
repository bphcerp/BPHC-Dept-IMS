CREATE TYPE "public"."type_enum" AS ENUM('Mid Sem', 'Comprehensive');--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP CONSTRAINT "qp_review_requests_mid_sem_file_path_file_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP CONSTRAINT "qp_review_requests_mid_sem_sol_file_path_file_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP CONSTRAINT "qp_review_requests_compre_file_path_file_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP CONSTRAINT "qp_review_requests_compre_sol_file_path_file_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD COLUMN "qp_file_path" integer;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD COLUMN "sol_file_path" integer;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD COLUMN "request_type" "type_enum" NOT NULL;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD CONSTRAINT "qp_review_requests_qp_file_path_file_fields_id_fk" FOREIGN KEY ("qp_file_path") REFERENCES "public"."file_fields"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD CONSTRAINT "qp_review_requests_sol_file_path_file_fields_id_fk" FOREIGN KEY ("sol_file_path") REFERENCES "public"."file_fields"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP COLUMN "mid_sem_file_path";--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP COLUMN "mid_sem_sol_file_path";--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP COLUMN "compre_file_path";--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP COLUMN "compre_sol_file_path";
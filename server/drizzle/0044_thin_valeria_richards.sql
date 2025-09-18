ALTER TABLE "qp_review_requests" RENAME COLUMN "qp_file_path" TO "midSem_qp_file_path";--> statement-breakpoint
ALTER TABLE "qp_review_requests" RENAME COLUMN "sol_file_path" TO "midSem_sol_file_path";--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP CONSTRAINT "qp_review_requests_qp_file_path_file_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP CONSTRAINT "qp_review_requests_sol_file_path_file_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD COLUMN "compre_qp_file_path" integer;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD COLUMN "compre_sol_file_path" integer;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD CONSTRAINT "qp_review_requests_midSem_qp_file_path_file_fields_id_fk" FOREIGN KEY ("midSem_qp_file_path") REFERENCES "public"."file_fields"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD CONSTRAINT "qp_review_requests_midSem_sol_file_path_file_fields_id_fk" FOREIGN KEY ("midSem_sol_file_path") REFERENCES "public"."file_fields"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD CONSTRAINT "qp_review_requests_compre_qp_file_path_file_fields_id_fk" FOREIGN KEY ("compre_qp_file_path") REFERENCES "public"."file_fields"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD CONSTRAINT "qp_review_requests_compre_sol_file_path_file_fields_id_fk" FOREIGN KEY ("compre_sol_file_path") REFERENCES "public"."file_fields"("id") ON DELETE set null ON UPDATE no action;
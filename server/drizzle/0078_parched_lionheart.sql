ALTER TABLE "qp_review_requests" DROP CONSTRAINT "qp_review_requests_midSem_qp_file_path_file_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP CONSTRAINT "qp_review_requests_midSem_sol_file_path_file_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP CONSTRAINT "qp_review_requests_compre_qp_file_path_file_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP CONSTRAINT "qp_review_requests_compre_sol_file_path_file_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD CONSTRAINT "qp_review_requests_midSem_qp_file_path_files_id_fk" FOREIGN KEY ("midSem_qp_file_path") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD CONSTRAINT "qp_review_requests_midSem_sol_file_path_files_id_fk" FOREIGN KEY ("midSem_sol_file_path") REFERENCES "public"."files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD CONSTRAINT "qp_review_requests_compre_qp_file_path_files_id_fk" FOREIGN KEY ("compre_qp_file_path") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD CONSTRAINT "qp_review_requests_compre_sol_file_path_files_id_fk" FOREIGN KEY ("compre_sol_file_path") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "course_handout_requests" DROP CONSTRAINT "course_handout_requests_handout_file_path_file_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "course_handout_requests" DROP COLUMN "handout_file_path";--> statement-breakpoint
ALTER TABLE "course_handout_requests" ADD COLUMN "handout_file_path" integer;--> statement-breakpoint
ALTER TABLE "course_handout_requests" ADD CONSTRAINT "course_handout_requests_handout_file_path_files_id_fk" FOREIGN KEY ("handout_file_path") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;
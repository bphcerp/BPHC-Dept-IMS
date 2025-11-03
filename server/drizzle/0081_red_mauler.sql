ALTER TABLE "date_field_status" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "date_fields" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "file_field_status" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "number_field_status" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "number_fields" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "text_field_status" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "text_fields" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "date_field_status" CASCADE;--> statement-breakpoint
DROP TABLE "date_fields" CASCADE;--> statement-breakpoint
DROP TABLE "file_field_status" CASCADE;--> statement-breakpoint
DROP TABLE "number_field_status" CASCADE;--> statement-breakpoint
DROP TABLE "number_fields" CASCADE;--> statement-breakpoint
DROP TABLE "text_field_status" CASCADE;--> statement-breakpoint
DROP TABLE "text_fields" CASCADE;--> statement-breakpoint
ALTER TABLE "faculty" DROP CONSTRAINT "faculty_profile_file_id_files_id_fk";
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "profile_file_id" integer;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_profile_file_id_files_id_fk" FOREIGN KEY ("profile_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faculty" DROP COLUMN "profile_file_id";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "profile_image";
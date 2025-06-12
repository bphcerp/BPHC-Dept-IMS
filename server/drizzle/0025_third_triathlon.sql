ALTER TYPE "public"."modules_enum" ADD VALUE 'Profile' BEFORE 'Patent Info';--> statement-breakpoint
ALTER TABLE "faculty" ADD COLUMN "signature_file_id" integer;--> statement-breakpoint
ALTER TABLE "faculty" ADD CONSTRAINT "faculty_signature_file_id_files_id_fk" FOREIGN KEY ("signature_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;
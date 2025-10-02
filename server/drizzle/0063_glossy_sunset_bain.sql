ALTER TABLE "allocation_semester" DROP CONSTRAINT "allocation_semester_hod_at_start_users_email_fk";
--> statement-breakpoint
ALTER TABLE "allocation_semester" DROP CONSTRAINT "allocation_semester_dca_at_start_users_email_fk";
--> statement-breakpoint
ALTER TABLE "allocation_master_allocation" ALTER COLUMN "instructor_email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "allocation_course" ADD COLUMN "marked_for_allocation" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "allocation_semester" ADD CONSTRAINT "allocation_semester_hod_at_start_faculty_email_fk" FOREIGN KEY ("hod_at_start") REFERENCES "public"."faculty"("email") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocation_semester" ADD CONSTRAINT "allocation_semester_dca_at_start_faculty_email_fk" FOREIGN KEY ("dca_at_start") REFERENCES "public"."faculty"("email") ON DELETE no action ON UPDATE no action;
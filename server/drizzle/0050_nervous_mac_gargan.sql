ALTER TABLE "phd_proposal_co_supervisors" DROP CONSTRAINT "phd_proposal_co_supervisors_co_supervisor_email_faculty_email_fk";
--> statement-breakpoint
ALTER TABLE "phd_examiner_assignments" ADD COLUMN "has_accepted" boolean;--> statement-breakpoint
ALTER TABLE "phd_proposal_co_supervisors" ADD COLUMN "co_supervisor_name" text;--> statement-breakpoint
ALTER TABLE "phd_examiner_assignments" ADD CONSTRAINT "phd_examiner_assignments_examiner_email_faculty_email_fk" FOREIGN KEY ("examiner_email") REFERENCES "public"."faculty"("email") ON DELETE cascade ON UPDATE no action;
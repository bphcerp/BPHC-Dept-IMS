ALTER TABLE "conference_member_reviews" DROP CONSTRAINT "conference_member_reviews_application_id_applications_id_fk";
--> statement-breakpoint
ALTER TABLE "conference_member_reviews" ALTER COLUMN "review" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "conference_member_reviews" ADD COLUMN "status" boolean NOT NULL;--> statement-breakpoint
ALTER TABLE "conference_member_reviews" ADD CONSTRAINT "conference_member_reviews_application_id_conference_approval_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."conference_approval_applications"("id") ON DELETE cascade ON UPDATE no action;
CREATE TABLE "conference_application_members" (
	"application_id" integer NOT NULL,
	"member_email" text NOT NULL,
	"review_status" boolean,
	"comments" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "conference_application_members_application_id_member_email_pk" PRIMARY KEY("application_id","member_email")
);
--> statement-breakpoint
DROP TABLE "conference_member_reviews" CASCADE;--> statement-breakpoint
ALTER TABLE "conference_application_members" ADD CONSTRAINT "conference_application_members_application_id_conference_approval_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."conference_approval_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conference_application_members" ADD CONSTRAINT "conference_application_members_member_email_users_email_fk" FOREIGN KEY ("member_email") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "conference_app_members_status_idx" ON "conference_application_members" USING btree ("review_status");--> statement-breakpoint
CREATE INDEX "conference_app_members_email_idx" ON "conference_application_members" USING btree ("member_email");
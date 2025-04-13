CREATE TABLE "conference_global" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conference_member_reviews" (
	"application_id" integer NOT NULL,
	"reviewer_email" text NOT NULL,
	"review" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "conference_member_reviews_application_id_reviewer_email_pk" PRIMARY KEY("application_id","reviewer_email")
);
--> statement-breakpoint
CREATE TABLE "conference_status_log" (
	"application_id" integer NOT NULL,
	"user_email" text NOT NULL,
	"action" text NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"comments" text,
	CONSTRAINT "conference_status_log_application_id_user_email_action_timestamp_pk" PRIMARY KEY("application_id","user_email","action","timestamp")
);
--> statement-breakpoint
ALTER TABLE "conference_approval_applications" DROP CONSTRAINT "conference_approval_applications_application_id_applications_id_fk";
--> statement-breakpoint
ALTER TABLE "conference_approval_applications" DROP CONSTRAINT "conference_approval_applications_purpose_text_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "conference_approval_applications" DROP CONSTRAINT "conference_approval_applications_content_title_text_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "conference_approval_applications" DROP CONSTRAINT "conference_approval_applications_event_name_text_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "conference_approval_applications" DROP CONSTRAINT "conference_approval_applications_venue_text_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "conference_approval_applications" DROP CONSTRAINT "conference_approval_applications_date_date_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "conference_approval_applications" DROP CONSTRAINT "conference_approval_applications_organized_by_text_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "conference_approval_applications" DROP CONSTRAINT "conference_approval_applications_mode_of_event_text_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "conference_approval_applications" DROP CONSTRAINT "conference_approval_applications_description_text_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "conference_approval_applications" DROP CONSTRAINT "conference_approval_applications_travel_reimbursement_number_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "conference_approval_applications" DROP CONSTRAINT "conference_approval_applications_registration_fee_reimbursement_number_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "conference_approval_applications" DROP CONSTRAINT "conference_approval_applications_daily_allowance_reimbursement_number_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "conference_approval_applications" DROP CONSTRAINT "conference_approval_applications_accommodation_reimbursement_number_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "conference_approval_applications" DROP CONSTRAINT "conference_approval_applications_other_reimbursement_number_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "conference_approval_applications" ALTER COLUMN "purpose" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "conference_approval_applications" ALTER COLUMN "content_title" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "conference_approval_applications" ALTER COLUMN "event_name" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "conference_approval_applications" ALTER COLUMN "venue" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "conference_approval_applications" ALTER COLUMN "organized_by" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "conference_approval_applications" ALTER COLUMN "mode_of_event" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "conference_approval_applications" ALTER COLUMN "description" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "conference_approval_applications" ADD COLUMN "user_email" text NOT NULL;--> statement-breakpoint
ALTER TABLE "conference_approval_applications" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "conference_approval_applications" ADD COLUMN "date_from" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "conference_approval_applications" ADD COLUMN "date_to" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "conference_member_reviews" ADD CONSTRAINT "conference_member_reviews_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conference_member_reviews" ADD CONSTRAINT "conference_member_reviews_reviewer_email_users_email_fk" FOREIGN KEY ("reviewer_email") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conference_status_log" ADD CONSTRAINT "conference_status_log_application_id_conference_approval_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."conference_approval_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conference_status_log" ADD CONSTRAINT "conference_status_log_user_email_users_email_fk" FOREIGN KEY ("user_email") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conference_approval_applications" ADD CONSTRAINT "conference_approval_applications_user_email_users_email_fk" FOREIGN KEY ("user_email") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conference_approval_applications" DROP COLUMN "application_id";--> statement-breakpoint
ALTER TABLE "conference_approval_applications" DROP COLUMN "date";
ALTER TABLE "conference_approval_applications" DROP CONSTRAINT "conference_approval_applications_letter_of_invitation_file_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "conference_approval_applications" DROP CONSTRAINT "conference_approval_applications_first_page_of_paper_file_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "conference_approval_applications" DROP CONSTRAINT "conference_approval_applications_reviewers_comments_file_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "conference_approval_applications" DROP CONSTRAINT "conference_approval_applications_details_of_event_file_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "conference_approval_applications" DROP CONSTRAINT "conference_approval_applications_other_documents_file_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "files" ALTER COLUMN "user_email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "conference_approval_applications" ADD COLUMN "approval_form_file_id" integer;--> statement-breakpoint
ALTER TABLE "conference_approval_applications" ADD COLUMN "letter_of_invitation_file_id" integer;--> statement-breakpoint
ALTER TABLE "conference_approval_applications" ADD COLUMN "first_page_of_paper_file_id" integer;--> statement-breakpoint
ALTER TABLE "conference_approval_applications" ADD COLUMN "reviewers_comments_file_id" integer;--> statement-breakpoint
ALTER TABLE "conference_approval_applications" ADD COLUMN "details_of_event_file_id" integer;--> statement-breakpoint
ALTER TABLE "conference_approval_applications" ADD COLUMN "other_documents_file_id" integer;--> statement-breakpoint
ALTER TABLE "conference_approval_applications" ADD CONSTRAINT "conference_approval_applications_approval_form_file_id_files_id_fk" FOREIGN KEY ("approval_form_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conference_approval_applications" ADD CONSTRAINT "conference_approval_applications_letter_of_invitation_file_id_files_id_fk" FOREIGN KEY ("letter_of_invitation_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conference_approval_applications" ADD CONSTRAINT "conference_approval_applications_first_page_of_paper_file_id_files_id_fk" FOREIGN KEY ("first_page_of_paper_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conference_approval_applications" ADD CONSTRAINT "conference_approval_applications_reviewers_comments_file_id_files_id_fk" FOREIGN KEY ("reviewers_comments_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conference_approval_applications" ADD CONSTRAINT "conference_approval_applications_details_of_event_file_id_files_id_fk" FOREIGN KEY ("details_of_event_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conference_approval_applications" ADD CONSTRAINT "conference_approval_applications_other_documents_file_id_files_id_fk" FOREIGN KEY ("other_documents_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conference_approval_applications" DROP COLUMN "letter_of_invitation";--> statement-breakpoint
ALTER TABLE "conference_approval_applications" DROP COLUMN "first_page_of_paper";--> statement-breakpoint
ALTER TABLE "conference_approval_applications" DROP COLUMN "reviewers_comments";--> statement-breakpoint
ALTER TABLE "conference_approval_applications" DROP COLUMN "details_of_event";--> statement-breakpoint
ALTER TABLE "conference_approval_applications" DROP COLUMN "other_documents";
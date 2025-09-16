CREATE TYPE "public"."phd_type" AS ENUM('part-time', 'full-time');--> statement-breakpoint
CREATE TYPE "public"."meeting_availability_status" AS ENUM('best_available', 'tentative', 'unavailable');--> statement-breakpoint
CREATE TYPE "public"."phd_proposal_status" AS ENUM('deleted', 'supervisor_review', 'supervisor_revert', 'drc_review', 'drc_revert', 'dac_review', 'dac_revert', 'seminar_incomplete', 'finalising', 'formalising', 'completed');--> statement-breakpoint
ALTER TYPE "public"."modules_enum" ADD VALUE 'Meeting';--> statement-breakpoint
CREATE TABLE "meeting_availability" (
	"id" serial PRIMARY KEY NOT NULL,
	"time_slot_id" integer NOT NULL,
	"participant_email" text NOT NULL,
	"availability" "meeting_availability_status" NOT NULL,
	CONSTRAINT "meeting_availability_time_slot_id_participant_email_unique" UNIQUE("time_slot_id","participant_email")
);
--> statement-breakpoint
CREATE TABLE "meeting_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"meeting_id" integer NOT NULL,
	"participant_email" text NOT NULL,
	CONSTRAINT "meeting_participants_meeting_id_participant_email_unique" UNIQUE("meeting_id","participant_email")
);
--> statement-breakpoint
CREATE TABLE "meeting_time_slots" (
	"id" serial PRIMARY KEY NOT NULL,
	"meeting_id" integer NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meetings" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"purpose" text,
	"duration" integer NOT NULL,
	"organizer_email" text NOT NULL,
	"deadline" timestamp with time zone NOT NULL,
	"finalized_time" timestamp with time zone,
	"venue" text,
	"google_meet_link" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "phd_proposal_dac_review_forms" (
	"id" serial PRIMARY KEY NOT NULL,
	"review_id" integer NOT NULL,
	"form_data" jsonb NOT NULL,
	CONSTRAINT "phd_proposal_dac_review_forms_review_id_unique" UNIQUE("review_id")
);
--> statement-breakpoint
CREATE TABLE "phd_proposal_semesters" (
	"id" serial PRIMARY KEY NOT NULL,
	"semester_id" integer NOT NULL,
	"student_submission_date" timestamp with time zone NOT NULL,
	"faculty_review_date" timestamp with time zone NOT NULL,
	"drc_review_date" timestamp with time zone NOT NULL,
	"dac_review_date" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "phd_proposal_dac_reviews" DROP CONSTRAINT "phd_proposal_dac_reviews_suggestion_file_id_files_id_fk";
--> statement-breakpoint
ALTER TABLE "phd_proposals" DROP CONSTRAINT "phd_proposals_abstract_file_id_files_id_fk";
--> statement-breakpoint
ALTER TABLE "phd_proposals" DROP CONSTRAINT "phd_proposals_proposal_file_id_files_id_fk";
--> statement-breakpoint
ALTER TABLE "phd_proposals" drop column "active";--> statement-breakpoint
ALTER TABLE "phd_proposals" drop COLUMN "status";--> statement-breakpoint
ALTER TABLE "phd_proposals" ADD COLUMN "status" "public"."phd_proposal_status" DEFAULT 'supervisor_review' NOT NULL;--> statement-breakpoint
ALTER TABLE "phd_proposals" ADD COLUMN "active" boolean GENERATED ALWAYS AS (CASE WHEN status IN('deleted', 'completed')THEN NULL ELSE true END) STORED;--> statement-breakpoint
ALTER TABLE "phd" ADD COLUMN "phd_type" "phd_type" DEFAULT 'full-time' NOT NULL;--> statement-breakpoint
ALTER TABLE "phd_proposal_dac_reviews" ADD COLUMN "feedback_file_id" integer;--> statement-breakpoint
ALTER TABLE "phd_proposals" ADD COLUMN "proposal_semester_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "phd_proposals" ADD COLUMN "seminar_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "phd_proposals" ADD COLUMN "seminar_time" text;--> statement-breakpoint
ALTER TABLE "phd_proposals" ADD COLUMN "seminar_venue" text;--> statement-breakpoint
ALTER TABLE "phd_proposals" ADD COLUMN "has_outside_co_supervisor" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "phd_proposals" ADD COLUMN "declaration" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "phd_proposals" ADD COLUMN "appendix_file_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "phd_proposals" ADD COLUMN "summary_file_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "phd_proposals" ADD COLUMN "outline_file_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "phd_proposals" ADD COLUMN "place_of_research_file_id" integer;--> statement-breakpoint
ALTER TABLE "phd_proposals" ADD COLUMN "outside_co_supervisor_format_file_id" integer;--> statement-breakpoint
ALTER TABLE "phd_proposals" ADD COLUMN "outside_supervisor_biodata_file_id" integer;--> statement-breakpoint
ALTER TABLE "meeting_availability" ADD CONSTRAINT "meeting_availability_time_slot_id_meeting_time_slots_id_fk" FOREIGN KEY ("time_slot_id") REFERENCES "public"."meeting_time_slots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_availability" ADD CONSTRAINT "meeting_availability_participant_email_users_email_fk" FOREIGN KEY ("participant_email") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_participants" ADD CONSTRAINT "meeting_participants_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_participants" ADD CONSTRAINT "meeting_participants_participant_email_users_email_fk" FOREIGN KEY ("participant_email") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_time_slots" ADD CONSTRAINT "meeting_time_slots_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_organizer_email_users_email_fk" FOREIGN KEY ("organizer_email") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_proposal_dac_review_forms" ADD CONSTRAINT "phd_proposal_dac_review_forms_review_id_phd_proposal_dac_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."phd_proposal_dac_reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_proposal_semesters" ADD CONSTRAINT "phd_proposal_semesters_semester_id_phd_semesters_id_fk" FOREIGN KEY ("semester_id") REFERENCES "public"."phd_semesters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_proposal_dac_reviews" ADD CONSTRAINT "phd_proposal_dac_reviews_feedback_file_id_files_id_fk" FOREIGN KEY ("feedback_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_proposals" ADD CONSTRAINT "phd_proposals_proposal_semester_id_phd_proposal_semesters_id_fk" FOREIGN KEY ("proposal_semester_id") REFERENCES "public"."phd_proposal_semesters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_proposals" ADD CONSTRAINT "phd_proposals_appendix_file_id_files_id_fk" FOREIGN KEY ("appendix_file_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_proposals" ADD CONSTRAINT "phd_proposals_summary_file_id_files_id_fk" FOREIGN KEY ("summary_file_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_proposals" ADD CONSTRAINT "phd_proposals_outline_file_id_files_id_fk" FOREIGN KEY ("outline_file_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_proposals" ADD CONSTRAINT "phd_proposals_place_of_research_file_id_files_id_fk" FOREIGN KEY ("place_of_research_file_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_proposals" ADD CONSTRAINT "phd_proposals_outside_co_supervisor_format_file_id_files_id_fk" FOREIGN KEY ("outside_co_supervisor_format_file_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_proposals" ADD CONSTRAINT "phd_proposals_outside_supervisor_biodata_file_id_files_id_fk" FOREIGN KEY ("outside_supervisor_biodata_file_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_proposal_dac_reviews" DROP COLUMN "suggestion_file_id";--> statement-breakpoint
ALTER TABLE "phd_proposals" DROP COLUMN "abstract_file_id";--> statement-breakpoint
ALTER TABLE "phd_proposals" DROP COLUMN "proposal_file_id";--> statement-breakpoint
ALTER TABLE "phd_proposals" DROP COLUMN "suggested_dac_members";--> statement-breakpoint
DROP TYPE "public"."phd_proposal_status_enum";
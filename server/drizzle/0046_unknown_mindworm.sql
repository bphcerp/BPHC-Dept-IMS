CREATE TYPE "public"."phd_proposal_status_enum" AS ENUM('deleted', 'supervisor_review', 'cosupervisor_review', 'drc_review', 'dac_review', 'dac_rejected', 'completed');--> statement-breakpoint
CREATE TABLE "phd_exam_timetable_slots" (
	"id" serial PRIMARY KEY NOT NULL,
	"exam_id" integer NOT NULL,
	"student_email" text NOT NULL,
	"qualifying_area" text NOT NULL,
	"examiner_email" text NOT NULL,
	"slot_number" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "phd_exam_timetable_slots_exam_id_student_email_qualifying_area_unique" UNIQUE("exam_id","student_email","qualifying_area")
);
--> statement-breakpoint
CREATE TABLE "phd_proposal_dac_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"proposal_id" integer NOT NULL,
	"dac_member_email" text NOT NULL,
	"approved" boolean NOT NULL,
	"comments" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "phd_proposal_dac_reviews_proposal_id_dac_member_email_unique" UNIQUE("proposal_id","dac_member_email")
);
--> statement-breakpoint
ALTER TABLE "phd_proposals" drop column "active";--> statement-breakpoint
ALTER TABLE "phd_proposals" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "phd_proposals" ADD COLUMN "status" "public"."phd_proposal_status_enum" DEFAULT 'supervisor_review' NOT NULL;--> statement-breakpoint
ALTER TABLE "phd_proposals" ADD COLUMN "active" boolean GENERATED ALWAYS AS (CASE WHEN status IN('completed', 'deleted', 'dac_rejected')THEN NULL ELSE true END) STORED;--> statement-breakpoint
ALTER TABLE "phd_proposals" ADD COLUMN "suggested_dac_members" text[] DEFAULT '{}'::text[];--> statement-breakpoint
ALTER TABLE "phd_exam_timetable_slots" ADD CONSTRAINT "phd_exam_timetable_slots_exam_id_phd_qualifying_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."phd_qualifying_exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_exam_timetable_slots" ADD CONSTRAINT "phd_exam_timetable_slots_student_email_phd_email_fk" FOREIGN KEY ("student_email") REFERENCES "public"."phd"("email") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_proposal_dac_reviews" ADD CONSTRAINT "phd_proposal_dac_reviews_proposal_id_phd_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."phd_proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_proposal_dac_reviews" ADD CONSTRAINT "phd_proposal_dac_reviews_dac_member_email_faculty_email_fk" FOREIGN KEY ("dac_member_email") REFERENCES "public"."faculty"("email") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "phd_exam_timetable_slots_exam_id_index" ON "phd_exam_timetable_slots" USING btree ("exam_id");--> statement-breakpoint
DROP TYPE "public"."phd_proposal_status";
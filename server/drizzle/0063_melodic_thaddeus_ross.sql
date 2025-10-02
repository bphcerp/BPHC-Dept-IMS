CREATE TYPE "public"."drc_assignment_status" AS ENUM('pending', 'approved', 'reverted');--> statement-breakpoint
CREATE TYPE "public"."phd_request_status" AS ENUM('supervisor_draft', 'supervisor_submitted', 'drc_convener_review', 'drc_member_review', 'hod_review', 'completed', 'reverted_by_drc_convener', 'reverted_by_drc_member', 'reverted_by_hod', 'student_review', 'supervisor_review_final_thesis');--> statement-breakpoint
CREATE TYPE "public"."phd_request_type" AS ENUM('pre_submission', 'draft_notice', 'change_of_title', 'thesis_submission', 'final_thesis_submission', 'jrf_recruitment', 'jrf_to_phd_conversion', 'project_fellow_conversion', 'manage_co_supervisor', 'stipend_payment', 'international_travel_grant', 'rp_grades', 'change_of_workplace', 'semester_drop', 'thesis_submission_extension', 'endorsements', 'phd_aspire_application', 'not_registered_student');--> statement-breakpoint
ALTER TYPE "public"."phd_proposal_status" ADD VALUE 'draft' BEFORE 'deleted';--> statement-breakpoint
CREATE TABLE "phd_seminar_slots" (
	"id" serial PRIMARY KEY NOT NULL,
	"drc_convener_email" text NOT NULL,
	"venue" text NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"is_booked" boolean DEFAULT false NOT NULL,
	"booked_by_proposal_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "phd_seminar_slots_start_time_venue_unique" UNIQUE("start_time","venue")
);
--> statement-breakpoint
CREATE TABLE "phd_request_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" integer NOT NULL,
	"file_id" integer NOT NULL,
	"uploaded_by_email" text NOT NULL,
	"document_type" text NOT NULL,
	"is_private" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "phd_request_drc_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" integer NOT NULL,
	"drc_member_email" text NOT NULL,
	"status" "drc_assignment_status" DEFAULT 'pending' NOT NULL,
	CONSTRAINT "phd_request_drc_assignments_request_id_drc_member_email_unique" UNIQUE("request_id","drc_member_email")
);
--> statement-breakpoint
CREATE TABLE "phd_request_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" integer NOT NULL,
	"reviewer_email" text NOT NULL,
	"reviewer_role" text NOT NULL,
	"approved" boolean NOT NULL,
	"comments" text,
	"student_comments" text,
	"supervisor_comments" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status_at_review" text
);
--> statement-breakpoint
CREATE TABLE "phd_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_email" text NOT NULL,
	"supervisor_email" text NOT NULL,
	"semester_id" integer NOT NULL,
	"request_type" "phd_request_type" NOT NULL,
	"status" "phd_request_status" NOT NULL,
	"comments" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "phd_seminar_slots" ADD CONSTRAINT "phd_seminar_slots_drc_convener_email_faculty_email_fk" FOREIGN KEY ("drc_convener_email") REFERENCES "public"."faculty"("email") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_seminar_slots" ADD CONSTRAINT "phd_seminar_slots_booked_by_proposal_id_phd_proposals_id_fk" FOREIGN KEY ("booked_by_proposal_id") REFERENCES "public"."phd_proposals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_request_documents" ADD CONSTRAINT "phd_request_documents_request_id_phd_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."phd_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_request_documents" ADD CONSTRAINT "phd_request_documents_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_request_documents" ADD CONSTRAINT "phd_request_documents_uploaded_by_email_users_email_fk" FOREIGN KEY ("uploaded_by_email") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_request_drc_assignments" ADD CONSTRAINT "phd_request_drc_assignments_request_id_phd_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."phd_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_request_drc_assignments" ADD CONSTRAINT "phd_request_drc_assignments_drc_member_email_faculty_email_fk" FOREIGN KEY ("drc_member_email") REFERENCES "public"."faculty"("email") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_request_reviews" ADD CONSTRAINT "phd_request_reviews_request_id_phd_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."phd_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_request_reviews" ADD CONSTRAINT "phd_request_reviews_reviewer_email_users_email_fk" FOREIGN KEY ("reviewer_email") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_requests" ADD CONSTRAINT "phd_requests_student_email_phd_email_fk" FOREIGN KEY ("student_email") REFERENCES "public"."phd"("email") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_requests" ADD CONSTRAINT "phd_requests_supervisor_email_faculty_email_fk" FOREIGN KEY ("supervisor_email") REFERENCES "public"."faculty"("email") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_requests" ADD CONSTRAINT "phd_requests_semester_id_phd_semesters_id_fk" FOREIGN KEY ("semester_id") REFERENCES "public"."phd_semesters"("id") ON DELETE restrict ON UPDATE no action;
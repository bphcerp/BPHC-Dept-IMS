CREATE TYPE "public"."phd_proposal_status" AS ENUM('deleted', 'supervisor_review', 'cosupervisor_review', 'drc_send_to_dac', 'dac_review', 'completed');--> statement-breakpoint
CREATE TABLE "phd_proposal_co_supervisors" (
	"id" serial PRIMARY KEY NOT NULL,
	"proposal_id" integer NOT NULL,
	"co_supervisor_email" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"approval_status" boolean,
	CONSTRAINT "phd_proposal_co_supervisors_proposal_id_co_supervisor_email_unique" UNIQUE("proposal_id","co_supervisor_email")
);
--> statement-breakpoint
CREATE TABLE "phd_proposal_dac_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"proposal_id" integer NOT NULL,
	"dac_member_email" text NOT NULL,
	CONSTRAINT "phd_proposal_dac_members_proposal_id_dac_member_email_unique" UNIQUE("proposal_id","dac_member_email")
);
--> statement-breakpoint
CREATE TABLE "phd_proposals" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_email" text NOT NULL,
	"supervisor_email" text NOT NULL,
	"title" text NOT NULL,
	"abstract_file_id" integer NOT NULL,
	"proposal_file_id" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" "phd_proposal_status" DEFAULT 'supervisor_review' NOT NULL,
	"comments" text,
	"active" boolean GENERATED ALWAYS AS (CASE WHEN status IN ('completed', 'deleted') THEN NULL ELSE true END) STORED,
	CONSTRAINT "phd_proposals_student_email_active_unique" UNIQUE("student_email","active")
);
--> statement-breakpoint
ALTER TABLE "phd" DROP CONSTRAINT "phd_co_supervisor_email_users_email_fk";
--> statement-breakpoint
ALTER TABLE "phd" DROP CONSTRAINT "phd_co_supervisor_email_2_users_email_fk";
--> statement-breakpoint
ALTER TABLE "phd" DROP CONSTRAINT "phd_dac_1_email_users_email_fk";
--> statement-breakpoint
ALTER TABLE "phd" DROP CONSTRAINT "phd_dac_2_email_users_email_fk";
--> statement-breakpoint
ALTER TABLE "phd" DROP CONSTRAINT "phd_notional_supervisor_email_users_email_fk";
--> statement-breakpoint
ALTER TABLE "phd" DROP CONSTRAINT "phd_supervisor_email_users_email_fk";
--> statement-breakpoint
ALTER TABLE "phd_proposal_co_supervisors" ADD CONSTRAINT "phd_proposal_co_supervisors_proposal_id_phd_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."phd_proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_proposal_co_supervisors" ADD CONSTRAINT "phd_proposal_co_supervisors_co_supervisor_email_faculty_email_fk" FOREIGN KEY ("co_supervisor_email") REFERENCES "public"."faculty"("email") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_proposal_dac_members" ADD CONSTRAINT "phd_proposal_dac_members_proposal_id_phd_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."phd_proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_proposal_dac_members" ADD CONSTRAINT "phd_proposal_dac_members_dac_member_email_faculty_email_fk" FOREIGN KEY ("dac_member_email") REFERENCES "public"."faculty"("email") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_proposals" ADD CONSTRAINT "phd_proposals_student_email_phd_email_fk" FOREIGN KEY ("student_email") REFERENCES "public"."phd"("email") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_proposals" ADD CONSTRAINT "phd_proposals_supervisor_email_faculty_email_fk" FOREIGN KEY ("supervisor_email") REFERENCES "public"."faculty"("email") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_proposals" ADD CONSTRAINT "phd_proposals_abstract_file_id_files_id_fk" FOREIGN KEY ("abstract_file_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_proposals" ADD CONSTRAINT "phd_proposals_proposal_file_id_files_id_fk" FOREIGN KEY ("proposal_file_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "phd_proposal_co_supervisors_proposal_id_index" ON "phd_proposal_co_supervisors" USING btree ("proposal_id");--> statement-breakpoint
CREATE INDEX "phd_proposal_dac_members_proposal_id_index" ON "phd_proposal_dac_members" USING btree ("proposal_id");--> statement-breakpoint
CREATE INDEX "phd_proposals_student_email_index" ON "phd_proposals" USING btree ("student_email");--> statement-breakpoint
CREATE INDEX "phd_proposals_supervisor_email_index" ON "phd_proposals" USING btree ("supervisor_email");--> statement-breakpoint
ALTER TABLE "phd" ADD CONSTRAINT "phd_notional_supervisor_email_users_email_fk" FOREIGN KEY ("notional_supervisor_email") REFERENCES "public"."users"("email") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd" ADD CONSTRAINT "phd_supervisor_email_users_email_fk" FOREIGN KEY ("supervisor_email") REFERENCES "public"."users"("email") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd" DROP COLUMN "co_supervisor_email";--> statement-breakpoint
ALTER TABLE "phd" DROP COLUMN "co_supervisor_email_2";--> statement-breakpoint
ALTER TABLE "phd" DROP COLUMN "dac_1_email";--> statement-breakpoint
ALTER TABLE "phd" DROP COLUMN "dac_2_email";
DO $$ BEGIN
 CREATE TYPE "public"."user_type" AS ENUM('faculty', 'phd', 'staff');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."application_status_enum" AS ENUM('pending', 'approved', 'rejected');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."modules_enum" AS ENUM('Conference Approval', 'Course Handout', 'PhD Progress', 'PhD Proposal', 'Question Paper', 'SFC Meeting', 'Project Info', 'Patent Info');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "faculty" (
	"psrn" text,
	"email" text PRIMARY KEY NOT NULL,
	"name" text,
	"department" text,
	"designation" text[] DEFAULT '{}'::text[],
	"room" text,
	"phone" text,
	CONSTRAINT "faculty_psrn_unique" UNIQUE("psrn")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "permissions" (
	"permission" text PRIMARY KEY NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "phd" (
	"email" text PRIMARY KEY NOT NULL,
	"department" text,
	"phone" text,
	"id_number" text,
	"erp_id" text,
	"name" text,
	"institute_email" text,
	"mobile" text,
	"personal_email" text,
	"notional_supervisor_email" text,
	"supervisor_email" text,
	"co_supervisor_email" text,
	"co_supervisor_email_2" text,
	"dac_1_email" text,
	"dac_2_email" text,
	"nature_of_phd" text,
	"qualifying_exam_1" boolean,
	"qualifying_exam_2" boolean,
	"qualifying_exam_1_date" timestamp with time zone DEFAULT NULL,
	"qualifying_exam_2_date" timestamp with time zone DEFAULT NULL,
	"qualifying_area_1" text,
	"qualifying_area_2" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "refresh_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_email" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"role_name" text NOT NULL,
	"member_count" integer DEFAULT 0 NOT NULL,
	"allowed" text[] DEFAULT '{}'::text[] NOT NULL,
	"disallowed" text[] DEFAULT '{}'::text[] NOT NULL,
	CONSTRAINT "roles_role_name_unique" UNIQUE("role_name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "staff" (
	"email" text PRIMARY KEY NOT NULL,
	"name" text,
	"department" text,
	"phone" text,
	"designation" text[] DEFAULT '{}'::text[]
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"email" text PRIMARY KEY NOT NULL,
	"roles" integer[] DEFAULT '{}'::integer[] NOT NULL,
	"deactivated" boolean DEFAULT false NOT NULL,
	"type" "user_type" NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "conference_approval_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer NOT NULL,
	"purpose" integer,
	"content_title" integer,
	"event_name" integer,
	"venue" integer,
	"date" integer,
	"organized_by" integer,
	"mode_of_event" integer,
	"description" integer,
	"travel_reimbursement" integer,
	"registration_fee_reimbursement" integer,
	"daily_allowance_reimbursement" integer,
	"accomodation_reimbursement" integer,
	"other_reimbursement" integer,
	"letter_of_invitation" integer,
	"first_page_of_paper" integer,
	"reviewers_comments" integer,
	"details_of_event" integer,
	"other_documents" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "application_status" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_email" text NOT NULL,
	"comments" text NOT NULL,
	"updated_as" text NOT NULL,
	"status" boolean NOT NULL,
	"application_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"module" "modules_enum" NOT NULL,
	"field_name" text,
	"user_email" text NOT NULL,
	"status" "application_status_enum" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "date_field_status" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_email" text NOT NULL,
	"comments" text NOT NULL,
	"updated_as" text NOT NULL,
	"status" boolean NOT NULL,
	"date_field" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "date_fields" (
	"id" serial PRIMARY KEY NOT NULL,
	"module" "modules_enum" NOT NULL,
	"field_name" text,
	"user_email" text NOT NULL,
	"value" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "file_field_status" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_email" text NOT NULL,
	"comments" text NOT NULL,
	"updated_as" text NOT NULL,
	"status" boolean NOT NULL,
	"file_field" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "file_fields" (
	"id" serial PRIMARY KEY NOT NULL,
	"module" "modules_enum" NOT NULL,
	"field_name" text,
	"user_email" text NOT NULL,
	"file" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "files" (
	"id" serial PRIMARY KEY NOT NULL,
	"module" "modules_enum" NOT NULL,
	"field_name" text,
	"user_email" text NOT NULL,
	"original_name" text,
	"mimetype" text,
	"file_path" text NOT NULL,
	"size" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "number_field_status" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_email" text NOT NULL,
	"comments" text NOT NULL,
	"updated_as" text NOT NULL,
	"status" boolean NOT NULL,
	"number_field" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "number_fields" (
	"id" serial PRIMARY KEY NOT NULL,
	"module" "modules_enum" NOT NULL,
	"field_name" text,
	"user_email" text NOT NULL,
	"value" numeric NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "text_field_status" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_email" text NOT NULL,
	"comments" text NOT NULL,
	"updated_as" text NOT NULL,
	"status" boolean NOT NULL,
	"text_field" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "text_fields" (
	"id" serial PRIMARY KEY NOT NULL,
	"module" "modules_enum" NOT NULL,
	"field_name" text,
	"user_email" text NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "course_handout_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer NOT NULL,
	"course_code" integer,
	"course_name" integer,
	"course_strength" integer,
	"open_book" integer,
	"closed_book" integer,
	"mid_sem" integer,
	"compre" integer,
	"num_components" integer,
	"frequency" integer,
	"handout_file_path" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "phd_applications" (
	"application_id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"file_id_1" text[] DEFAULT '{}'::text[] NOT NULL,
	"file_id_2" text[] DEFAULT '{}'::text[] NOT NULL,
	"file_id_3" text[] DEFAULT '{}'::text[] NOT NULL,
	"file_id_4" text[] DEFAULT '{}'::text[] NOT NULL,
	"file_id_5" text[] DEFAULT '{}'::text[] NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "phd_config" (
	"key" text NOT NULL,
	"value" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "phd_courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_email" text NOT NULL,
	"course_names" text[],
	"course_grades" text[],
	"course_units" integer[]
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "faculty" ADD CONSTRAINT "faculty_email_users_email_fk" FOREIGN KEY ("email") REFERENCES "public"."users"("email") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "phd" ADD CONSTRAINT "phd_email_users_email_fk" FOREIGN KEY ("email") REFERENCES "public"."users"("email") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "phd" ADD CONSTRAINT "phd_notional_supervisor_email_users_email_fk" FOREIGN KEY ("notional_supervisor_email") REFERENCES "public"."users"("email") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "phd" ADD CONSTRAINT "phd_supervisor_email_users_email_fk" FOREIGN KEY ("supervisor_email") REFERENCES "public"."users"("email") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "phd" ADD CONSTRAINT "phd_co_supervisor_email_users_email_fk" FOREIGN KEY ("co_supervisor_email") REFERENCES "public"."users"("email") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "phd" ADD CONSTRAINT "phd_co_supervisor_email_2_users_email_fk" FOREIGN KEY ("co_supervisor_email_2") REFERENCES "public"."users"("email") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "phd" ADD CONSTRAINT "phd_dac_1_email_users_email_fk" FOREIGN KEY ("dac_1_email") REFERENCES "public"."users"("email") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "phd" ADD CONSTRAINT "phd_dac_2_email_users_email_fk" FOREIGN KEY ("dac_2_email") REFERENCES "public"."users"("email") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_email_users_email_fk" FOREIGN KEY ("user_email") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "staff" ADD CONSTRAINT "staff_email_users_email_fk" FOREIGN KEY ("email") REFERENCES "public"."users"("email") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conference_approval_applications" ADD CONSTRAINT "conference_approval_applications_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conference_approval_applications" ADD CONSTRAINT "conference_approval_applications_purpose_text_fields_id_fk" FOREIGN KEY ("purpose") REFERENCES "public"."text_fields"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conference_approval_applications" ADD CONSTRAINT "conference_approval_applications_content_title_text_fields_id_fk" FOREIGN KEY ("content_title") REFERENCES "public"."text_fields"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conference_approval_applications" ADD CONSTRAINT "conference_approval_applications_event_name_text_fields_id_fk" FOREIGN KEY ("event_name") REFERENCES "public"."text_fields"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conference_approval_applications" ADD CONSTRAINT "conference_approval_applications_venue_text_fields_id_fk" FOREIGN KEY ("venue") REFERENCES "public"."text_fields"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conference_approval_applications" ADD CONSTRAINT "conference_approval_applications_date_date_fields_id_fk" FOREIGN KEY ("date") REFERENCES "public"."date_fields"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conference_approval_applications" ADD CONSTRAINT "conference_approval_applications_organized_by_text_fields_id_fk" FOREIGN KEY ("organized_by") REFERENCES "public"."text_fields"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conference_approval_applications" ADD CONSTRAINT "conference_approval_applications_mode_of_event_text_fields_id_fk" FOREIGN KEY ("mode_of_event") REFERENCES "public"."text_fields"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conference_approval_applications" ADD CONSTRAINT "conference_approval_applications_description_text_fields_id_fk" FOREIGN KEY ("description") REFERENCES "public"."text_fields"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conference_approval_applications" ADD CONSTRAINT "conference_approval_applications_travel_reimbursement_number_fields_id_fk" FOREIGN KEY ("travel_reimbursement") REFERENCES "public"."number_fields"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conference_approval_applications" ADD CONSTRAINT "conference_approval_applications_registration_fee_reimbursement_number_fields_id_fk" FOREIGN KEY ("registration_fee_reimbursement") REFERENCES "public"."number_fields"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conference_approval_applications" ADD CONSTRAINT "conference_approval_applications_daily_allowance_reimbursement_number_fields_id_fk" FOREIGN KEY ("daily_allowance_reimbursement") REFERENCES "public"."number_fields"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conference_approval_applications" ADD CONSTRAINT "conference_approval_applications_accomodation_reimbursement_number_fields_id_fk" FOREIGN KEY ("accomodation_reimbursement") REFERENCES "public"."number_fields"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conference_approval_applications" ADD CONSTRAINT "conference_approval_applications_other_reimbursement_number_fields_id_fk" FOREIGN KEY ("other_reimbursement") REFERENCES "public"."number_fields"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conference_approval_applications" ADD CONSTRAINT "conference_approval_applications_letter_of_invitation_file_fields_id_fk" FOREIGN KEY ("letter_of_invitation") REFERENCES "public"."file_fields"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conference_approval_applications" ADD CONSTRAINT "conference_approval_applications_first_page_of_paper_file_fields_id_fk" FOREIGN KEY ("first_page_of_paper") REFERENCES "public"."file_fields"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conference_approval_applications" ADD CONSTRAINT "conference_approval_applications_reviewers_comments_file_fields_id_fk" FOREIGN KEY ("reviewers_comments") REFERENCES "public"."file_fields"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conference_approval_applications" ADD CONSTRAINT "conference_approval_applications_details_of_event_file_fields_id_fk" FOREIGN KEY ("details_of_event") REFERENCES "public"."file_fields"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conference_approval_applications" ADD CONSTRAINT "conference_approval_applications_other_documents_file_fields_id_fk" FOREIGN KEY ("other_documents") REFERENCES "public"."file_fields"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "application_status" ADD CONSTRAINT "application_status_user_email_users_email_fk" FOREIGN KEY ("user_email") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "application_status" ADD CONSTRAINT "application_status_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "applications" ADD CONSTRAINT "applications_user_email_users_email_fk" FOREIGN KEY ("user_email") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "date_field_status" ADD CONSTRAINT "date_field_status_user_email_users_email_fk" FOREIGN KEY ("user_email") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "date_field_status" ADD CONSTRAINT "date_field_status_date_field_date_fields_id_fk" FOREIGN KEY ("date_field") REFERENCES "public"."date_fields"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "date_fields" ADD CONSTRAINT "date_fields_user_email_users_email_fk" FOREIGN KEY ("user_email") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "file_field_status" ADD CONSTRAINT "file_field_status_user_email_users_email_fk" FOREIGN KEY ("user_email") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "file_field_status" ADD CONSTRAINT "file_field_status_file_field_file_fields_id_fk" FOREIGN KEY ("file_field") REFERENCES "public"."file_fields"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "file_fields" ADD CONSTRAINT "file_fields_user_email_users_email_fk" FOREIGN KEY ("user_email") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "file_fields" ADD CONSTRAINT "file_fields_file_files_id_fk" FOREIGN KEY ("file") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "files" ADD CONSTRAINT "files_user_email_users_email_fk" FOREIGN KEY ("user_email") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "number_field_status" ADD CONSTRAINT "number_field_status_user_email_users_email_fk" FOREIGN KEY ("user_email") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "number_field_status" ADD CONSTRAINT "number_field_status_number_field_number_fields_id_fk" FOREIGN KEY ("number_field") REFERENCES "public"."number_fields"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "number_fields" ADD CONSTRAINT "number_fields_user_email_users_email_fk" FOREIGN KEY ("user_email") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "text_field_status" ADD CONSTRAINT "text_field_status_user_email_users_email_fk" FOREIGN KEY ("user_email") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "text_field_status" ADD CONSTRAINT "text_field_status_text_field_text_fields_id_fk" FOREIGN KEY ("text_field") REFERENCES "public"."text_fields"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "text_fields" ADD CONSTRAINT "text_fields_user_email_users_email_fk" FOREIGN KEY ("user_email") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_handout_requests" ADD CONSTRAINT "course_handout_requests_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_handout_requests" ADD CONSTRAINT "course_handout_requests_course_code_text_fields_id_fk" FOREIGN KEY ("course_code") REFERENCES "public"."text_fields"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_handout_requests" ADD CONSTRAINT "course_handout_requests_course_name_text_fields_id_fk" FOREIGN KEY ("course_name") REFERENCES "public"."text_fields"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_handout_requests" ADD CONSTRAINT "course_handout_requests_course_strength_text_fields_id_fk" FOREIGN KEY ("course_strength") REFERENCES "public"."text_fields"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_handout_requests" ADD CONSTRAINT "course_handout_requests_open_book_text_fields_id_fk" FOREIGN KEY ("open_book") REFERENCES "public"."text_fields"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_handout_requests" ADD CONSTRAINT "course_handout_requests_closed_book_text_fields_id_fk" FOREIGN KEY ("closed_book") REFERENCES "public"."text_fields"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_handout_requests" ADD CONSTRAINT "course_handout_requests_mid_sem_text_fields_id_fk" FOREIGN KEY ("mid_sem") REFERENCES "public"."text_fields"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_handout_requests" ADD CONSTRAINT "course_handout_requests_compre_text_fields_id_fk" FOREIGN KEY ("compre") REFERENCES "public"."text_fields"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_handout_requests" ADD CONSTRAINT "course_handout_requests_num_components_text_fields_id_fk" FOREIGN KEY ("num_components") REFERENCES "public"."text_fields"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_handout_requests" ADD CONSTRAINT "course_handout_requests_frequency_text_fields_id_fk" FOREIGN KEY ("frequency") REFERENCES "public"."text_fields"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_handout_requests" ADD CONSTRAINT "course_handout_requests_handout_file_path_file_fields_id_fk" FOREIGN KEY ("handout_file_path") REFERENCES "public"."file_fields"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "phd_applications" ADD CONSTRAINT "phd_applications_email_phd_email_fk" FOREIGN KEY ("email") REFERENCES "public"."phd"("email") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "phd_courses" ADD CONSTRAINT "phd_courses_student_email_phd_email_fk" FOREIGN KEY ("student_email") REFERENCES "public"."phd"("email") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

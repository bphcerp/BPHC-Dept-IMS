CREATE TYPE "public"."allocation_status" AS ENUM('notStarted', 'ongoing', 'completed', 'inAllocation');--> statement-breakpoint
CREATE TYPE "public"."course_type_enum" AS ENUM('CDC', 'Elective');--> statement-breakpoint
CREATE TYPE "public"."degree_type_enum" AS ENUM('FD', 'HD');--> statement-breakpoint
CREATE TYPE "public"."section_type_enum" AS ENUM('LECTURE', 'TUTORIAL', 'PRACTICAL');--> statement-breakpoint
CREATE TYPE "public"."semester_type_enum" AS ENUM('1', '2', '3');--> statement-breakpoint
CREATE TYPE "public"."allocation_form_template_field_type" AS ENUM('PREFERENCE', 'TEACHING_ALLOCATION');--> statement-breakpoint
CREATE TYPE "public"."allocation_form_template_preference_field_type" AS ENUM('LECTURE', 'TUTORIAL', 'PRACTICAL');--> statement-breakpoint
ALTER TYPE "public"."modules_enum" ADD VALUE 'Course Allocation';--> statement-breakpoint
CREATE TABLE "allocation_section" (
	"id" uuid PRIMARY KEY NOT NULL,
	"section_type" "section_type_enum" NOT NULL,
	"master_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "allocation_section_instructors" (
	"section_id" uuid NOT NULL,
	"instructor_email" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "allocation_section_instructors_section_id_instructor_email_unique" UNIQUE("section_id","instructor_email")
);
--> statement-breakpoint
CREATE TABLE "allocation_course" (
	"code" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"lecture_units" integer NOT NULL,
	"practical_units" integer NOT NULL,
	"total_units" integer,
	"offered_as" "course_type_enum" NOT NULL,
	"offered_to" "degree_type_enum" NOT NULL,
	"offered_also_by" text[],
	"fetched_from_ttd" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "allocation_master_allocation" (
	"id" uuid PRIMARY KEY NOT NULL,
	"semester_id" uuid NOT NULL,
	"instructor_email" text NOT NULL,
	"course_code" text NOT NULL,
	CONSTRAINT "allocation_master_allocation_semester_id_course_code_unique" UNIQUE("semester_id","course_code")
);
--> statement-breakpoint
CREATE TABLE "allocation_semester" (
	"id" uuid PRIMARY KEY NOT NULL,
	"year" integer NOT NULL,
	"semester_type" "semester_type_enum" NOT NULL,
	"form_id" uuid,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"no_of_electives_per_instructor" integer NOT NULL,
	"no_of_discipline_courses_per_instructor" integer NOT NULL,
	"hod_at_start" text,
	"dca_at_start" text,
	"allocation_status" "allocation_status" DEFAULT 'notStarted' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "allocation_semester_year_semester_type_unique" UNIQUE("year","semester_type")
);
--> statement-breakpoint
CREATE TABLE "allocation_form" (
	"id" uuid PRIMARY KEY NOT NULL,
	"template_id" uuid,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" text NOT NULL,
	"published_date" timestamp with time zone,
	"allocation_deadline" timestamp,
	"email_body" text,
	"email_msg_id" text,
	CONSTRAINT "allocation_form_title_unique" UNIQUE("title")
);
--> statement-breakpoint
CREATE TABLE "allocation_form_response" (
	"id" uuid PRIMARY KEY NOT NULL,
	"form_id" uuid,
	"submitted_at" timestamp with time zone DEFAULT now(),
	"submitted_by" text NOT NULL,
	"template_field_id" uuid,
	"teaching_allocation" integer,
	"course_code" text,
	"preference" integer,
	"taken_consecutively" boolean
);
--> statement-breakpoint
CREATE TABLE "allocation_form_template" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "allocation_form_template_field" (
	"id" uuid PRIMARY KEY NOT NULL,
	"template_id" uuid,
	"label" text NOT NULL,
	"preference_count" integer,
	"preference_type" "allocation_form_template_preference_field_type",
	"type" "allocation_form_template_field_type"
);
--> statement-breakpoint
ALTER TABLE "allocation_section" ADD CONSTRAINT "allocation_section_master_id_allocation_master_allocation_id_fk" FOREIGN KEY ("master_id") REFERENCES "public"."allocation_master_allocation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocation_section_instructors" ADD CONSTRAINT "allocation_section_instructors_section_id_allocation_section_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."allocation_section"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocation_section_instructors" ADD CONSTRAINT "allocation_section_instructors_instructor_email_users_email_fk" FOREIGN KEY ("instructor_email") REFERENCES "public"."users"("email") ON DELETE set default ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocation_master_allocation" ADD CONSTRAINT "allocation_master_allocation_semester_id_allocation_semester_id_fk" FOREIGN KEY ("semester_id") REFERENCES "public"."allocation_semester"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocation_master_allocation" ADD CONSTRAINT "allocation_master_allocation_instructor_email_users_email_fk" FOREIGN KEY ("instructor_email") REFERENCES "public"."users"("email") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocation_master_allocation" ADD CONSTRAINT "allocation_master_allocation_course_code_allocation_course_code_fk" FOREIGN KEY ("course_code") REFERENCES "public"."allocation_course"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocation_semester" ADD CONSTRAINT "allocation_semester_form_id_allocation_form_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."allocation_form"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocation_semester" ADD CONSTRAINT "allocation_semester_hod_at_start_users_email_fk" FOREIGN KEY ("hod_at_start") REFERENCES "public"."users"("email") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocation_semester" ADD CONSTRAINT "allocation_semester_dca_at_start_users_email_fk" FOREIGN KEY ("dca_at_start") REFERENCES "public"."users"("email") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocation_form" ADD CONSTRAINT "allocation_form_template_id_allocation_form_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."allocation_form_template"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocation_form" ADD CONSTRAINT "allocation_form_created_by_users_email_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("email") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocation_form_response" ADD CONSTRAINT "allocation_form_response_form_id_allocation_form_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."allocation_form"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocation_form_response" ADD CONSTRAINT "allocation_form_response_submitted_by_users_email_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("email") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocation_form_response" ADD CONSTRAINT "allocation_form_response_template_field_id_allocation_form_template_field_id_fk" FOREIGN KEY ("template_field_id") REFERENCES "public"."allocation_form_template_field"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocation_form_response" ADD CONSTRAINT "allocation_form_response_course_code_allocation_course_code_fk" FOREIGN KEY ("course_code") REFERENCES "public"."allocation_course"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocation_form_template" ADD CONSTRAINT "allocation_form_template_created_by_users_email_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("email") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocation_form_template_field" ADD CONSTRAINT "allocation_form_template_field_template_id_allocation_form_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."allocation_form_template"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "allocation_section_master_id_index" ON "allocation_section" USING btree ("master_id");--> statement-breakpoint
CREATE INDEX "allocation_section_instructors_section_id_index" ON "allocation_section_instructors" USING btree ("section_id");--> statement-breakpoint
CREATE INDEX "allocation_section_instructors_instructor_email_index" ON "allocation_section_instructors" USING btree ("instructor_email");
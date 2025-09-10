CREATE TYPE "public"."allocation_status" AS ENUM('notStarted', 'ongoing', 'completed', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."odd_even_enum" AS ENUM('odd', 'even');--> statement-breakpoint
CREATE TYPE "public"."section_type_enum" AS ENUM('Lecture', 'Tutorial', 'Practical');--> statement-breakpoint
CREATE TYPE "public"."allocation_form_template_field_type" AS ENUM('TEXT', 'EMAIL', 'NUMBER', 'DATE', 'TEXTAREA', 'CHECKBOX', 'RADIO', 'DROPDOWN', 'PREFERENCE');--> statement-breakpoint
CREATE TABLE "allocation_allocation_result" (
	"id" uuid PRIMARY KEY NOT NULL,
	"instructor_email" text NOT NULL,
	"semester_id" uuid NOT NULL,
	"course_code" text NOT NULL,
	"section_type" "section_type_enum" NOT NULL,
	"no_of_sections" integer NOT NULL,
	"allocated_on" timestamp with time zone DEFAULT now(),
	"updated_on" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "allocation_course" (
	"code" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"lecture_sec_count" integer NOT NULL,
	"tut_sec_count" integer NOT NULL,
	"practical_sec_count" integer NOT NULL,
	"units" integer,
	"has_long_practical_sec" boolean DEFAULT false,
	"is_cdc" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "allocation_semester" (
	"id" uuid PRIMARY KEY NOT NULL,
	"year" integer NOT NULL,
	"odd_even" "odd_even_enum" NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"allocation_deadline" timestamp,
	"no_of_electives_per_instructor" integer,
	"no_of_discipline_courses_per_instructor" integer,
	"hod_at_start" text,
	"dca_at_start" text,
	"allocation_status" "allocation_status",
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "allocation_form" (
	"id" uuid PRIMARY KEY NOT NULL,
	"template_id" uuid,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"is_published" boolean
);
--> statement-breakpoint
CREATE TABLE "allocation_form_response" (
	"id" uuid PRIMARY KEY NOT NULL,
	"form_id" uuid,
	"submitted_at" timestamp with time zone DEFAULT now(),
	"submitted_by" uuid
);
--> statement-breakpoint
CREATE TABLE "allocation_form_response_answer" (
	"id" uuid PRIMARY KEY NOT NULL,
	"response_value_id" uuid,
	"option_id" uuid,
	"text_value" text,
	"number_value" integer,
	"date_value" timestamp with time zone,
	"course_code" text,
	"preference" integer
);
--> statement-breakpoint
CREATE TABLE "allocation_form_response_value" (
	"id" uuid PRIMARY KEY NOT NULL,
	"response_id" uuid,
	"template_field_id" uuid
);
--> statement-breakpoint
CREATE TABLE "allocation_form_template" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "allocation_form_template_field" (
	"id" uuid PRIMARY KEY NOT NULL,
	"template_id" uuid,
	"label" text NOT NULL,
	"is_required" boolean,
	"order" integer,
	"preference_count" integer,
	"type" "allocation_form_template_field_type"
);
--> statement-breakpoint
CREATE TABLE "allocation_form_template_field_option" (
	"id" uuid PRIMARY KEY NOT NULL,
	"template_field_id" uuid,
	"label" text NOT NULL,
	"value" text NOT NULL,
	"order" integer
);
--> statement-breakpoint
ALTER TABLE "allocation_allocation_result" ADD CONSTRAINT "allocation_allocation_result_instructor_email_users_email_fk" FOREIGN KEY ("instructor_email") REFERENCES "public"."users"("email") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocation_allocation_result" ADD CONSTRAINT "allocation_allocation_result_semester_id_allocation_semester_id_fk" FOREIGN KEY ("semester_id") REFERENCES "public"."allocation_semester"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocation_allocation_result" ADD CONSTRAINT "allocation_allocation_result_course_code_allocation_course_code_fk" FOREIGN KEY ("course_code") REFERENCES "public"."allocation_course"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocation_semester" ADD CONSTRAINT "allocation_semester_hod_at_start_users_email_fk" FOREIGN KEY ("hod_at_start") REFERENCES "public"."users"("email") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocation_semester" ADD CONSTRAINT "allocation_semester_dca_at_start_users_email_fk" FOREIGN KEY ("dca_at_start") REFERENCES "public"."users"("email") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocation_form" ADD CONSTRAINT "allocation_form_template_id_allocation_form_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."allocation_form_template"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocation_form_response" ADD CONSTRAINT "allocation_form_response_form_id_allocation_form_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."allocation_form"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocation_form_response_answer" ADD CONSTRAINT "allocation_form_response_answer_response_value_id_allocation_form_response_value_id_fk" FOREIGN KEY ("response_value_id") REFERENCES "public"."allocation_form_response_value"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocation_form_response_answer" ADD CONSTRAINT "allocation_form_response_answer_option_id_allocation_form_template_field_option_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."allocation_form_template_field_option"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocation_form_response_value" ADD CONSTRAINT "allocation_form_response_value_response_id_allocation_form_response_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."allocation_form_response"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocation_form_response_value" ADD CONSTRAINT "allocation_form_response_value_template_field_id_allocation_form_template_field_id_fk" FOREIGN KEY ("template_field_id") REFERENCES "public"."allocation_form_template_field"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocation_form_template_field" ADD CONSTRAINT "allocation_form_template_field_template_id_allocation_form_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."allocation_form_template"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocation_form_template_field_option" ADD CONSTRAINT "allocation_form_template_field_option_template_field_id_allocation_form_template_field_id_fk" FOREIGN KEY ("template_field_id") REFERENCES "public"."allocation_form_template_field"("id") ON DELETE cascade ON UPDATE no action;
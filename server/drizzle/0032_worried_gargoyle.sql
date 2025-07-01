CREATE TYPE "public"."funding_agency_nature" AS ENUM('public_sector', 'private_industry');--> statement-breakpoint
CREATE TYPE "public"."project_head" AS ENUM('CAPEX', 'OPEX', 'Manpower');--> statement-breakpoint
CREATE TABLE "funding_agencies" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investigators" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"department" text,
	"campus" text,
	"affiliation" text,
	CONSTRAINT "investigators_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "project_co_pis" (
	"project_id" uuid,
	"investigator_id" uuid,
	CONSTRAINT "project_co_pis_project_id_investigator_id_pk" PRIMARY KEY("project_id","investigator_id")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"pi_id" uuid NOT NULL,
	"funding_agency_id" uuid NOT NULL,
	"funding_agency_nature" "funding_agency_nature" NOT NULL,
	"sanctioned_amount" numeric(15, 2) NOT NULL,
	"capex_amount" numeric(15, 2),
	"opex_amount" numeric(15, 2),
	"manpower_amount" numeric(15, 2),
	"approval_date" date NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"has_extension" boolean DEFAULT false NOT NULL,
	"extension_details" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "faculty" ADD COLUMN "profile_file_id" integer;--> statement-breakpoint
ALTER TABLE "phd" ADD COLUMN "profile_file_id" integer;--> statement-breakpoint
ALTER TABLE "staff" ADD COLUMN "profile_file_id" integer;--> statement-breakpoint
ALTER TABLE "project_co_pis" ADD CONSTRAINT "project_co_pis_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_co_pis" ADD CONSTRAINT "project_co_pis_investigator_id_investigators_id_fk" FOREIGN KEY ("investigator_id") REFERENCES "public"."investigators"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_pi_id_investigators_id_fk" FOREIGN KEY ("pi_id") REFERENCES "public"."investigators"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_funding_agency_id_funding_agencies_id_fk" FOREIGN KEY ("funding_agency_id") REFERENCES "public"."funding_agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faculty" ADD CONSTRAINT "faculty_profile_file_id_files_id_fk" FOREIGN KEY ("profile_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd" ADD CONSTRAINT "phd_profile_file_id_files_id_fk" FOREIGN KEY ("profile_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_profile_file_id_files_id_fk" FOREIGN KEY ("profile_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;
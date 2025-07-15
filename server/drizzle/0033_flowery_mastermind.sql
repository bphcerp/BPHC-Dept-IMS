CREATE TABLE "wilp_project" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"discipline" text NOT NULL,
	"student_name" text NOT NULL,
	"organization" text NOT NULL,
	"degree_program" text NOT NULL,
	"faculty_email" text,
	"research_area" text NOT NULL,
	"dissertation_title" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "wilp_project" ADD CONSTRAINT "wilp_project_faculty_email_faculty_email_fk" FOREIGN KEY ("faculty_email") REFERENCES "public"."faculty"("email") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "extension_details";
CREATE TABLE "wilp_projects_range" (
	"id" serial PRIMARY KEY NOT NULL,
	"min" integer NOT NULL,
	"max" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "course_handout_requests" ADD COLUMN "nc_criteria" boolean;--> statement-breakpoint
ALTER TABLE "wilp_project" ADD COLUMN "reminder" timestamp with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "wilp_project" ADD COLUMN "deadline" timestamp with time zone NOT NULL;
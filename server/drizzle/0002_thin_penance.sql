CREATE TABLE "phd_qualifying_exams" (
	"id" serial PRIMARY KEY NOT NULL,
	"semester_id" integer NOT NULL,
	"exam_name" text NOT NULL,
	"deadline" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "phd_semesters" (
	"id" serial PRIMARY KEY NOT NULL,
	"year" integer NOT NULL,
	"semester_number" integer NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "phdDocuments" ALTER COLUMN "email" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "phdDocuments" ALTER COLUMN "formName" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "phdDocuments" ALTER COLUMN "applicationType" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "phd_qualifying_exams" ADD CONSTRAINT "phd_qualifying_exams_semester_id_phd_semesters_id_fk" FOREIGN KEY ("semester_id") REFERENCES "public"."phd_semesters"("id") ON DELETE cascade ON UPDATE no action;
ALTER TYPE "public"."modules_enum" ADD VALUE 'PhD Qe Application' BEFORE 'Question Paper';--> statement-breakpoint
CREATE TABLE "phd_sub_areas" (
	"id" serial PRIMARY KEY NOT NULL,
	"sub_area" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "phd_applications" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "phd_config" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "phdDocuments" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "phd_applications" CASCADE;--> statement-breakpoint
DROP TABLE "phd_config" CASCADE;--> statement-breakpoint
DROP TABLE "phdDocuments" CASCADE;--> statement-breakpoint
ALTER TABLE "phd_semesters" ALTER COLUMN "year" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "phd" ADD COLUMN "qualifying_exam_1_start_date" timestamp DEFAULT NULL;--> statement-breakpoint
ALTER TABLE "phd" ADD COLUMN "qualifying_exam_1_end_date" timestamp DEFAULT NULL;--> statement-breakpoint
ALTER TABLE "phd" ADD COLUMN "qualifying_exam_2_start_date" timestamp DEFAULT NULL;--> statement-breakpoint
ALTER TABLE "phd" ADD COLUMN "qualifying_exam_2_end_date" timestamp DEFAULT NULL;--> statement-breakpoint
ALTER TABLE "phd_qualifying_exams" ADD COLUMN "exam_start_date" timestamp DEFAULT NULL;--> statement-breakpoint
ALTER TABLE "phd_qualifying_exams" ADD COLUMN "exam_end_date" timestamp DEFAULT NULL;--> statement-breakpoint
ALTER TABLE "phd" DROP COLUMN "qualifying_exam_1_date";--> statement-breakpoint
ALTER TABLE "phd" DROP COLUMN "qualifying_exam_2_date";
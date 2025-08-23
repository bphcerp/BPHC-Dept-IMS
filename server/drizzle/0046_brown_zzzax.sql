ALTER TABLE "phd_qualifying_exams" ADD COLUMN "examiner_count" integer DEFAULT 2 NOT NULL;--> statement-breakpoint
ALTER TABLE "phd_exam_applications" DROP COLUMN "examiner_count";
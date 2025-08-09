DROP TABLE "phd_courses" CASCADE;--> statement-breakpoint
DROP TABLE "phd_examiner" CASCADE;--> statement-breakpoint
DROP TABLE "phd_qualifying_exams" CASCADE;--> statement-breakpoint
DROP TABLE "phd_semesters" CASCADE;--> statement-breakpoint
DROP TABLE "phd_sub_areas" CASCADE;--> statement-breakpoint
ALTER TABLE "phd" DROP COLUMN "nature_of_phd";--> statement-breakpoint
ALTER TABLE "phd" DROP COLUMN "qualifying_exam_1";--> statement-breakpoint
ALTER TABLE "phd" DROP COLUMN "qualifying_exam_2";--> statement-breakpoint
ALTER TABLE "phd" DROP COLUMN "qualifying_exam_1_start_date";--> statement-breakpoint
ALTER TABLE "phd" DROP COLUMN "qualifying_exam_1_end_date";--> statement-breakpoint
ALTER TABLE "phd" DROP COLUMN "qualifying_exam_2_start_date";--> statement-breakpoint
ALTER TABLE "phd" DROP COLUMN "qualifying_exam_2_end_date";--> statement-breakpoint
ALTER TABLE "phd" DROP COLUMN "qualifying_area_1";--> statement-breakpoint
ALTER TABLE "phd" DROP COLUMN "qualifying_area_2";--> statement-breakpoint
ALTER TABLE "phd" DROP COLUMN "number_of_qe_application";--> statement-breakpoint
ALTER TABLE "phd" DROP COLUMN "qualification_date";--> statement-breakpoint
ALTER TABLE "phd" DROP COLUMN "suggested_dac_members";--> statement-breakpoint
ALTER TABLE "phd" DROP COLUMN "qualifying_areas_updated_at";
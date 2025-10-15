ALTER TABLE "allocation_course" DROP COLUMN IF EXISTS "td_course_id";
ALTER TABLE "allocation_course" ADD COLUMN IF NOT EXISTS "td_course_id" integer;
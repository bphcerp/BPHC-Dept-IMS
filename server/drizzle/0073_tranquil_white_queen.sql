ALTER TYPE "public"."degree_type_enum" ADD VALUE 'PhD';--> statement-breakpoint
ALTER TABLE "public"."allocation_course" ALTER COLUMN "offered_as" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."course_type_enum";--> statement-breakpoint
CREATE TYPE "public"."course_type_enum" AS ENUM('CDC', 'DEL', 'HEL');--> statement-breakpoint
ALTER TABLE "public"."allocation_course" ALTER COLUMN "offered_as" SET DATA TYPE "public"."course_type_enum" USING "offered_as"::"public"."course_type_enum";
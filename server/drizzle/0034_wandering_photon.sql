CREATE TYPE "public"."degree_program" AS ENUM('B.Tech. Engineering Technology', 'M.Tech. Design Engineering', 'B.Tech. Power Engineering', 'MBA in Quality Management', 'MBA in Manufacturing Management', 'M.Tech. Quality Management', 'M.Tech. Manufacturing Management');--> statement-breakpoint
ALTER TABLE "wilp_project" DROP COLUMN "degree_program";--> statement-breakpoint
ALTER TABLE "wilp_project" ADD COLUMN "degree_program" degree_program NOT NULL;--> statement-break
ALTER TABLE "phd" ADD COLUMN "emergency_phone_number" text;
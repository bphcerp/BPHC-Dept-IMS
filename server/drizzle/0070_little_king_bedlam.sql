ALTER TABLE "allocation_form" ALTER COLUMN "template_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "allocation_section" ADD COLUMN IF NOT EXISTS "td_room_id" text;--> statement-breakpoint
ALTER TABLE "allocation_course" ADD COLUMN IF NOT EXISTS "td_course_id" text;--> statement-breakpoint
ALTER TABLE "allocation_form" ADD COLUMN IF NOT EXISTS "is_published_to_role_id" integer;--> statement-breakpoint
ALTER TABLE "allocation_form_template_field" ADD COLUMN IF NOT EXISTS "viewable_by_role_id" integer;--> statement-breakpoint
ALTER TABLE "allocation_form" ADD CONSTRAINT "allocation_form_is_published_to_role_id_roles_id_fk" FOREIGN KEY ("is_published_to_role_id") REFERENCES "public"."roles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocation_form_template_field" ADD CONSTRAINT "allocation_form_template_field_viewable_by_role_id_roles_id_fk" FOREIGN KEY ("viewable_by_role_id") REFERENCES "public"."roles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocation_semester" DROP COLUMN IF EXISTS "no_of_electives_per_instructor";--> statement-breakpoint
ALTER TABLE "allocation_semester" DROP COLUMN IF EXISTS "no_of_discipline_courses_per_instructor";
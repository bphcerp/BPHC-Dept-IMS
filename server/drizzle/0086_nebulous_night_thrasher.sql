ALTER TABLE "allocation_form_template_field" DROP CONSTRAINT "allocation_form_template_field_group_id_allocation_course_group_id_fk";
--> statement-breakpoint
ALTER TABLE "allocation_form_template_field" DROP CONSTRAINT "allocation_form_template_field_viewable_by_role_id_roles_id_fk";
--> statement-breakpoint
ALTER TABLE "allocation_semester" ADD COLUMN "active" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "allocation_form_template_field" ADD CONSTRAINT "allocation_form_template_field_group_id_allocation_course_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."allocation_course_group"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocation_form_template_field" ADD CONSTRAINT "allocation_form_template_field_viewable_by_role_id_roles_id_fk" FOREIGN KEY ("viewable_by_role_id") REFERENCES "public"."roles"("id") ON DELETE restrict ON UPDATE no action;
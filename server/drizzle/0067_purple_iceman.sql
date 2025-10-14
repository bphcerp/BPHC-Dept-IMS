CREATE TABLE "allocation_course_group" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "allocation_course_group_mapping" (
	"id" uuid PRIMARY KEY NOT NULL,
	"group_id" uuid,
	"course_code" text
);
--> statement-breakpoint
ALTER TABLE "allocation_form_template_field" ADD COLUMN "group_id" uuid;--> statement-breakpoint
ALTER TABLE "allocation_course_group_mapping" ADD CONSTRAINT "allocation_course_group_mapping_group_id_allocation_course_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."allocation_course_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocation_course_group_mapping" ADD CONSTRAINT "allocation_course_group_mapping_course_code_allocation_course_code_fk" FOREIGN KEY ("course_code") REFERENCES "public"."allocation_course"("code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocation_form_template_field" ADD CONSTRAINT "allocation_form_template_field_group_id_allocation_course_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."allocation_course_group"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocation_form" DROP COLUMN IF EXISTS "email_body";
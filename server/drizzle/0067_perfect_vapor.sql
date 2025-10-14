CREATE TABLE "allocation_course_group" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "allocation_course" ADD COLUMN "group_id" uuid;--> statement-breakpoint
ALTER TABLE "allocation_form_template_field" ADD COLUMN "group_id" uuid;--> statement-breakpoint
ALTER TABLE "allocation_course" ADD CONSTRAINT "allocation_course_group_id_allocation_course_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."allocation_course_group"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocation_form_template_field" ADD CONSTRAINT "allocation_form_template_field_group_id_allocation_course_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."allocation_course_group"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocation_form" DROP COLUMN IF EXISTS "email_body";
CREATE TABLE "allocation_course_group_course_mapping" (
	"course_code" text NOT NULL,
	"group_id" uuid NOT NULL,
	CONSTRAINT "allocation_course_group_course_mapping_course_code_group_id_pk" PRIMARY KEY("course_code","group_id")
);
--> statement-breakpoint
ALTER TABLE "allocation_course" DROP CONSTRAINT "allocation_course_group_id_allocation_course_group_id_fk";
--> statement-breakpoint
ALTER TABLE "allocation_course_group_course_mapping" ADD CONSTRAINT "allocation_course_group_course_mapping_course_code_allocation_course_code_fk" FOREIGN KEY ("course_code") REFERENCES "public"."allocation_course"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocation_course_group_course_mapping" ADD CONSTRAINT "allocation_course_group_course_mapping_group_id_allocation_course_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."allocation_course_group"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocation_course" DROP COLUMN "group_id";

ALTER TABLE "phd" ADD CONSTRAINT "phd_erp_id_unique" UNIQUE("erp_id");--> statement-breakpoint
CREATE TYPE "public"."grade_phase_enum" AS ENUM('draft', 'midsem', 'endsem');--> statement-breakpoint
ALTER TYPE "public"."modules_enum" ADD VALUE 'Grades';--> statement-breakpoint
CREATE TABLE "instructor_supervisor_grades" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_erp_id" text NOT NULL,
	"campus_id" text,
	"student_name" text,
	"instructor_supervisor_email" text NOT NULL,
	"course_name" text NOT NULL,
	"role" text NOT NULL,
	"phase" "grade_phase_enum" DEFAULT 'draft' NOT NULL,
	"midsem_grade" text,
	"compre_grade" text,
	"midsem_marks" integer,
	"endsem_marks" integer,
	"topic" text,
	"midsem_doc_file_id" integer,
	"endsem_doc_file_id" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "instructor_supervisor_grades_student_erp_id_course_name_unique" UNIQUE("student_erp_id","course_name")
);
--> statement-breakpoint
ALTER TABLE "phd_supervisor_grades" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "phd_supervisor_grades" CASCADE;--> statement-breakpoint
ALTER TABLE "instructor_supervisor_grades" ADD CONSTRAINT "instructor_supervisor_grades_student_erp_id_phd_erp_id_fk" FOREIGN KEY ("student_erp_id") REFERENCES "public"."phd"("erp_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instructor_supervisor_grades" ADD CONSTRAINT "instructor_supervisor_grades_instructor_supervisor_email_faculty_email_fk" FOREIGN KEY ("instructor_supervisor_email") REFERENCES "public"."faculty"("email") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instructor_supervisor_grades" ADD CONSTRAINT "instructor_supervisor_grades_midsem_doc_file_id_files_id_fk" FOREIGN KEY ("midsem_doc_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instructor_supervisor_grades" ADD CONSTRAINT "instructor_supervisor_grades_endsem_doc_file_id_files_id_fk" FOREIGN KEY ("endsem_doc_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "instructor_supervisor_grades_student_erp_id_index" ON "instructor_supervisor_grades" USING btree ("student_erp_id");--> statement-breakpoint
CREATE INDEX "instructor_supervisor_grades_instructor_supervisor_email_index" ON "instructor_supervisor_grades" USING btree ("instructor_supervisor_email");--> statement-breakpoint
CREATE INDEX "instructor_supervisor_grades_role_index" ON "instructor_supervisor_grades" USING btree ("role");--> statement-breakpoint
CREATE INDEX "instructor_supervisor_grades_phase_index" ON "instructor_supervisor_grades" USING btree ("phase");

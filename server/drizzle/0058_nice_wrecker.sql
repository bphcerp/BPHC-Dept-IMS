CREATE TABLE "phd_supervisor_grades" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_email" text NOT NULL,
	"supervisor_email" text NOT NULL,
	"course_name" text NOT NULL,
	"midsem_grade" text,
	"compre_grade" text,
	"midsem_marks" integer,
	"endsem_marks" integer,
	"midsem_doc_file_id" integer,
	"endsem_doc_file_id" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "phd_supervisor_grades_student_email_course_name_unique" UNIQUE("student_email","course_name")
);
--> statement-breakpoint
ALTER TABLE "phd_supervisor_grades" ADD CONSTRAINT "phd_supervisor_grades_student_email_phd_email_fk" FOREIGN KEY ("student_email") REFERENCES "public"."phd"("email") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_supervisor_grades" ADD CONSTRAINT "phd_supervisor_grades_supervisor_email_faculty_email_fk" FOREIGN KEY ("supervisor_email") REFERENCES "public"."faculty"("email") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_supervisor_grades" ADD CONSTRAINT "phd_supervisor_grades_midsem_doc_file_id_files_id_fk" FOREIGN KEY ("midsem_doc_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_supervisor_grades" ADD CONSTRAINT "phd_supervisor_grades_endsem_doc_file_id_files_id_fk" FOREIGN KEY ("endsem_doc_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "phd_supervisor_grades_student_email_index" ON "phd_supervisor_grades" USING btree ("student_email");--> statement-breakpoint
CREATE INDEX "phd_supervisor_grades_supervisor_email_index" ON "phd_supervisor_grades" USING btree ("supervisor_email");
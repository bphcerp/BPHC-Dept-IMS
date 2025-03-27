CREATE TABLE "qp_review_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer NOT NULL,
	"dca_member" integer,
	"course_no" integer,
	"course_name" integer,
	"fic" integer,
	"fic_deadline" integer,
	"mid_sem" integer,
	"mid_sem_sol" integer,
	"compre" integer,
	"compre_sol" integer,
	"documents_uploaded" boolean DEFAULT false NOT NULL,
	"faculty_1" integer,
	"faculty_2" integer,
	"review_1" jsonb,
	"review_2" jsonb,
	"review_deadline" integer
);
--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD CONSTRAINT "qp_review_requests_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD CONSTRAINT "qp_review_requests_dca_member_text_fields_id_fk" FOREIGN KEY ("dca_member") REFERENCES "public"."text_fields"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD CONSTRAINT "qp_review_requests_course_no_text_fields_id_fk" FOREIGN KEY ("course_no") REFERENCES "public"."text_fields"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD CONSTRAINT "qp_review_requests_course_name_text_fields_id_fk" FOREIGN KEY ("course_name") REFERENCES "public"."text_fields"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD CONSTRAINT "qp_review_requests_fic_text_fields_id_fk" FOREIGN KEY ("fic") REFERENCES "public"."text_fields"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD CONSTRAINT "qp_review_requests_fic_deadline_date_fields_id_fk" FOREIGN KEY ("fic_deadline") REFERENCES "public"."date_fields"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD CONSTRAINT "qp_review_requests_mid_sem_file_fields_id_fk" FOREIGN KEY ("mid_sem") REFERENCES "public"."file_fields"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD CONSTRAINT "qp_review_requests_mid_sem_sol_file_fields_id_fk" FOREIGN KEY ("mid_sem_sol") REFERENCES "public"."file_fields"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD CONSTRAINT "qp_review_requests_compre_file_fields_id_fk" FOREIGN KEY ("compre") REFERENCES "public"."file_fields"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD CONSTRAINT "qp_review_requests_compre_sol_file_fields_id_fk" FOREIGN KEY ("compre_sol") REFERENCES "public"."file_fields"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD CONSTRAINT "qp_review_requests_faculty_1_text_fields_id_fk" FOREIGN KEY ("faculty_1") REFERENCES "public"."text_fields"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD CONSTRAINT "qp_review_requests_faculty_2_text_fields_id_fk" FOREIGN KEY ("faculty_2") REFERENCES "public"."text_fields"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD CONSTRAINT "qp_review_requests_review_deadline_date_fields_id_fk" FOREIGN KEY ("review_deadline") REFERENCES "public"."date_fields"("id") ON DELETE set null ON UPDATE no action;
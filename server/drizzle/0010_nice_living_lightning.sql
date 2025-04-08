CREATE TABLE "phd_examiner" (
	"id" serial PRIMARY KEY NOT NULL,
	"sub_area_id" integer NOT NULL,
	"suggested_examiner" text[] DEFAULT '{}'::text[],
	"examiner" text
);
--> statement-breakpoint
ALTER TABLE "phd_examiner" ADD CONSTRAINT "phd_examiner_sub_area_id_phd_sub_areas_id_fk" FOREIGN KEY ("sub_area_id") REFERENCES "public"."phd_sub_areas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_examiner" ADD CONSTRAINT "phd_examiner_examiner_users_email_fk" FOREIGN KEY ("examiner") REFERENCES "public"."users"("email") ON DELETE restrict ON UPDATE no action;
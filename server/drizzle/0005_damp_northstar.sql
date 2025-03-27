CREATE TABLE "patent_inventors" (
	"id" serial PRIMARY KEY NOT NULL,
	"patent_id" integer,
	"user_email" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patents" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_number" text NOT NULL,
	"inventors_name" text NOT NULL,
	"department" text,
	"title" text,
	"campus" text,
	"filing_date" text,
	"application_publication_date" text,
	"granted_date" text,
	"filing_fy" text,
	"filing_ay" text,
	"published_ay" text,
	"published_fy" text,
	"granted_fy" text,
	"granted_ay" text,
	"granted_cy" text,
	"status" text
);
--> statement-breakpoint
ALTER TABLE "patent_inventors" ADD CONSTRAINT "patent_inventors_patent_id_patents_id_fk" FOREIGN KEY ("patent_id") REFERENCES "public"."patents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patent_inventors" ADD CONSTRAINT "patent_inventors_user_email_users_email_fk" FOREIGN KEY ("user_email") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE no action;
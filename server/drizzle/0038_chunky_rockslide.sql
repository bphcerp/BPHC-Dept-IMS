CREATE TYPE "public"."patent_status" AS ENUM('Pending', 'Filed', 'Granted', 'Abandoned', 'Rejected');--> statement-breakpoint
CREATE TABLE "patent_inventors" (
	"id" uuid PRIMARY KEY NOT NULL,
	"patent_id" uuid NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"department" text,
	"campus" text,
	"affiliation" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patents" (
	"id" uuid PRIMARY KEY NOT NULL,
	"application_number" text NOT NULL,
	"inventors_name" text NOT NULL,
	"inventors" jsonb,
	"department" text NOT NULL,
	"title" text NOT NULL,
	"campus" text NOT NULL,
	"filing_date" date NOT NULL,
	"application_publication_date" date,
	"granted_date" date,
	"filing_fy" text NOT NULL,
	"filing_ay" text NOT NULL,
	"published_ay" text,
	"published_fy" text,
	"granted_fy" text,
	"granted_ay" text,
	"granted_cy" text,
	"status" "patent_status" NOT NULL,
	"granted_patent_certificate_link" text,
	"application_publication_link" text,
	"form_01_link" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "patent_inventors" ADD CONSTRAINT "patent_inventors_patent_id_patents_id_fk" FOREIGN KEY ("patent_id") REFERENCES "public"."patents"("id") ON DELETE cascade ON UPDATE no action;
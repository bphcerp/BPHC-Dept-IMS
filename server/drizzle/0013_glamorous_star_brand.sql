CREATE TABLE "author_publications" (
	"author_id" text NOT NULL,
	"citation_id" text NOT NULL,
	"author_name" text,
	CONSTRAINT "author_publications_author_id_citation_id_pk" PRIMARY KEY("author_id","citation_id")
);
--> statement-breakpoint
CREATE TABLE "publications" (
	"title" text NOT NULL,
	"type" text,
	"journal" text,
	"volume" text,
	"issue" text,
	"year" text,
	"link" text,
	"citations" text,
	"citation_id" text PRIMARY KEY NOT NULL,
	"author_names" text
);
--> statement-breakpoint
ALTER TABLE "faculty" ADD COLUMN "author_id" text;--> statement-breakpoint
ALTER TABLE "faculty" ADD CONSTRAINT "faculty_author_id_unique" UNIQUE("author_id");
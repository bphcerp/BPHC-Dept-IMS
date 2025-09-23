ALTER TYPE "public"."month" RENAME TO "monthEnum";--> statement-breakpoint
CREATE TABLE "researgence" (
	"pub_id" integer PRIMARY KEY NOT NULL,
	"authors" text NOT NULL,
	"home_authors" text,
	"home_author_department" text,
	"home_author_institute" text,
	"publication_title" text NOT NULL,
	"scs" integer,
	"wos" integer,
	"sci" text,
	"source_publication" text,
	"level" text,
	"article_type" text,
	"year" integer NOT NULL,
	"month" "monthEnum",
	"home_author_location" text,
	"vol_no" text,
	"iss_no" text,
	"b_page" text,
	"e_page" text,
	"snip" numeric,
	"sjr" numeric,
	"if" numeric,
	"cite_score" numeric,
	"q_rank_scs" text,
	"q_rank_wos" text,
	"p_issn" text,
	"e_issn" text,
	"p_isbn" text,
	"e_isbn" text,
	"link" text
);
--> statement-breakpoint
ALTER TABLE "publications" ALTER COLUMN "year" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "publications" ALTER COLUMN "author_names" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "tester" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "title_idx" ON "researgence" USING btree ("publication_title");
CREATE TYPE "public"."statusEnum" AS ENUM('APPROVED', 'REJECTED', 'ARCHIVED');--> statement-breakpoint

ALTER TABLE "author_publications" ADD COLUMN "new_status" "public"."statusEnum";

UPDATE "author_publications" 
SET new_status = CASE
    WHEN status = true THEN 'APPROVED'::"public"."statusEnum"
    WHEN status = false THEN 'REJECTED'::"public"."statusEnum"
    ELSE NULL
END;
ALTER TABLE "author_publications" DROP COLUMN status;
ALTER TABLE "author_publications" RENAME COLUMN new_status TO status;
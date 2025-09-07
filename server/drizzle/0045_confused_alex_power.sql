ALTER TYPE "public"."month" RENAME TO "monthEnum";--> statement-breakpoint
ALTER TABLE "publications" ALTER COLUMN "year" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "publications" ALTER COLUMN "author_names" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "researgence" ALTER COLUMN "authors" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "researgence" ALTER COLUMN "publication_title" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "researgence" ALTER COLUMN "year" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "researgence" ALTER COLUMN "month" SET DATA TYPE "public"."monthEnum" USING "month"::text::"public"."monthEnum";
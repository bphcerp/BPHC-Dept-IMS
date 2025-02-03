ALTER TABLE "faculty" ALTER COLUMN "designation" SET DATA TYPE text[] USING (designation::text[]);--> statement-breakpoint
ALTER TABLE "faculty" ALTER COLUMN "designation" SET DEFAULT '{}'::text[];--> statement-breakpoint
ALTER TABLE "faculty" ALTER COLUMN "designation" SET NOT NULL;--> statement-breakpoint

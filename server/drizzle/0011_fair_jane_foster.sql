ALTER TABLE "faculty" DROP COLUMN "designation";--> statement-breakpoint
ALTER TABLE "faculty" ADD COLUMN "designation" text;--> statement-breakpoint
ALTER TABLE "staff" DROP COLUMN "designation";--> statement-breakpoint
ALTER TABLE "staff" ADD COLUMN "designation" text;
ALTER TABLE "users" RENAME COLUMN "tester" TO "in_testing_mode";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "tester_rollback_roles" integer[] DEFAULT '{}'::integer[] NOT NULL;
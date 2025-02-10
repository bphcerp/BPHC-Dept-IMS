CREATE TABLE IF NOT EXISTS "config_phd" (
	"deadline" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "deadline";
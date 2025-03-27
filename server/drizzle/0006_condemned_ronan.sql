ALTER TABLE "patent_inventors" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "patent_inventors" CASCADE;--> statement-breakpoint
ALTER TABLE "patents" ADD COLUMN "filing_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "patents" ADD COLUMN "user_email" text NOT NULL;--> statement-breakpoint
ALTER TABLE "patents" ADD COLUMN "nationanlity" text;--> statement-breakpoint
ALTER TABLE "patents" ADD CONSTRAINT "patents_user_email_users_email_fk" FOREIGN KEY ("user_email") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE no action;
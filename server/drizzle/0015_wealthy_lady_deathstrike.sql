CREATE TABLE IF NOT EXISTS "phdDocuments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"fileUrl" text NOT NULL,
	"formName" varchar(255) NOT NULL,
	"applicationType" varchar(100) NOT NULL,
	"uploadedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "phd" ALTER COLUMN "qualifying_area_1" SET DEFAULT NULL;--> statement-breakpoint
ALTER TABLE "phd" ADD COLUMN "number_of_qe_application" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "phd" ADD COLUMN "qualification_date" timestamp with time zone DEFAULT NULL;--> statement-breakpoint
ALTER TABLE "phd" ADD COLUMN "suggested_dac_members" text[] DEFAULT '{}'::text[];--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "phd" ADD CONSTRAINT "phd_notional_supervisor_email_users_email_fk" FOREIGN KEY ("notional_supervisor_email") REFERENCES "public"."users"("email") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "phd" ADD CONSTRAINT "phd_supervisor_email_users_email_fk" FOREIGN KEY ("supervisor_email") REFERENCES "public"."users"("email") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "phd" ADD CONSTRAINT "phd_co_supervisor_email_users_email_fk" FOREIGN KEY ("co_supervisor_email") REFERENCES "public"."users"("email") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "phd" ADD CONSTRAINT "phd_co_supervisor_email_2_users_email_fk" FOREIGN KEY ("co_supervisor_email_2") REFERENCES "public"."users"("email") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "phd" ADD CONSTRAINT "phd_dac_1_email_users_email_fk" FOREIGN KEY ("dac_1_email") REFERENCES "public"."users"("email") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "phd" ADD CONSTRAINT "phd_dac_2_email_users_email_fk" FOREIGN KEY ("dac_2_email") REFERENCES "public"."users"("email") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "phd_config" ADD CONSTRAINT "phd_config_key_unique" UNIQUE("key");
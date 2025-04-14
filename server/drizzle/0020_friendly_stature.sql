ALTER TABLE "faculty" DROP CONSTRAINT "faculty_email_users_email_fk";
--> statement-breakpoint
ALTER TABLE "phd" DROP CONSTRAINT "phd_email_users_email_fk";
--> statement-breakpoint
ALTER TABLE "phd" DROP CONSTRAINT "phd_notional_supervisor_email_users_email_fk";
--> statement-breakpoint
ALTER TABLE "phd" DROP CONSTRAINT "phd_supervisor_email_users_email_fk";
--> statement-breakpoint
ALTER TABLE "phd" DROP CONSTRAINT "phd_co_supervisor_email_users_email_fk";
--> statement-breakpoint
ALTER TABLE "phd" DROP CONSTRAINT "phd_co_supervisor_email_2_users_email_fk";
--> statement-breakpoint
ALTER TABLE "phd" DROP CONSTRAINT "phd_dac_1_email_users_email_fk";
--> statement-breakpoint
ALTER TABLE "phd" DROP CONSTRAINT "phd_dac_2_email_users_email_fk";
--> statement-breakpoint
ALTER TABLE "staff" DROP CONSTRAINT "staff_email_users_email_fk";
--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "read" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "faculty" ADD CONSTRAINT "faculty_email_users_email_fk" FOREIGN KEY ("email") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd" ADD CONSTRAINT "phd_email_users_email_fk" FOREIGN KEY ("email") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd" ADD CONSTRAINT "phd_notional_supervisor_email_users_email_fk" FOREIGN KEY ("notional_supervisor_email") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd" ADD CONSTRAINT "phd_supervisor_email_users_email_fk" FOREIGN KEY ("supervisor_email") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd" ADD CONSTRAINT "phd_co_supervisor_email_users_email_fk" FOREIGN KEY ("co_supervisor_email") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd" ADD CONSTRAINT "phd_co_supervisor_email_2_users_email_fk" FOREIGN KEY ("co_supervisor_email_2") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd" ADD CONSTRAINT "phd_dac_1_email_users_email_fk" FOREIGN KEY ("dac_1_email") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd" ADD CONSTRAINT "phd_dac_2_email_users_email_fk" FOREIGN KEY ("dac_2_email") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_email_users_email_fk" FOREIGN KEY ("email") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE no action;
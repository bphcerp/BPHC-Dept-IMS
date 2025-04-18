ALTER TABLE "phd_examiner" DROP CONSTRAINT "phd_examiner_examiner_users_email_fk";
--> statement-breakpoint
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_user_email_users_email_fk";
--> statement-breakpoint
ALTER TABLE "todos" DROP CONSTRAINT "todos_assigned_to_users_email_fk";
--> statement-breakpoint
ALTER TABLE "todos" DROP CONSTRAINT "todos_created_by_users_email_fk";
--> statement-breakpoint
ALTER TABLE "phd_examiner" ADD CONSTRAINT "phd_examiner_examiner_users_email_fk" FOREIGN KEY ("examiner") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_email_users_email_fk" FOREIGN KEY ("user_email") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todos" ADD CONSTRAINT "todos_assigned_to_users_email_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todos" ADD CONSTRAINT "todos_created_by_users_email_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE no action;
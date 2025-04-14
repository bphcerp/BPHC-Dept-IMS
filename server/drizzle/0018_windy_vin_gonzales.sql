CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"module" "modules_enum" NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"user_email" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"link" text,
	"read" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "todos" (
	"id" serial PRIMARY KEY NOT NULL,
	"module" "modules_enum" NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"link" text,
	"assigned_to" text NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deadline" timestamp with time zone,
	"completion_event" text NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_email_users_email_fk" FOREIGN KEY ("user_email") REFERENCES "public"."users"("email") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todos" ADD CONSTRAINT "todos_assigned_to_users_email_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("email") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todos" ADD CONSTRAINT "todos_created_by_users_email_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("email") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "read_idx" ON "notifications" USING btree ("read");--> statement-breakpoint
CREATE INDEX "user_idx" ON "notifications" USING btree ("user_email");--> statement-breakpoint
CREATE INDEX "assigned_to_idx" ON "todos" USING btree ("assigned_to");
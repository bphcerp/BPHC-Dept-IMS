CREATE TABLE "finalized_meeting_slots" (
	"id" serial PRIMARY KEY NOT NULL,
	"meeting_id" integer NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"venue" text,
	"google_meet_link" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "meeting_participants" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "finalized_meeting_slots" ADD CONSTRAINT "finalized_meeting_slots_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetings" DROP COLUMN "finalized_time";--> statement-breakpoint
ALTER TABLE "meetings" DROP COLUMN "venue";--> statement-breakpoint
ALTER TABLE "meetings" DROP COLUMN "google_meet_link";
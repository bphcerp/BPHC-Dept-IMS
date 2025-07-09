ALTER TABLE "todos" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "todos" ADD CONSTRAINT "todos_module_assigned_to_completion_event_pk" PRIMARY KEY("module","assigned_to","completion_event");
ALTER TABLE "phd_courses" ALTER COLUMN "course_names" SET DEFAULT '{}'::text[];--> statement-breakpoint
ALTER TABLE "phd_courses" ALTER COLUMN "course_grades" SET DEFAULT '{}'::text[];--> statement-breakpoint
ALTER TABLE "phd_courses" ALTER COLUMN "course_units" SET DEFAULT '{}'::integer[];--> statement-breakpoint
ALTER TABLE "phd_courses" ALTER COLUMN "course_ids" SET DEFAULT '{}'::text[];
CREATE TYPE "faculty_contribution_status" AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE "faculty_contributions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "faculty_email" varchar(256) NOT NULL,
    "designation" varchar(256) NOT NULL,
    "start_date" date NOT NULL,
    "end_date" date NOT NULL,
    "status" "faculty_contribution_status" DEFAULT 'pending' NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX "faculty_email_idx" ON "faculty_contributions" ("faculty_email");
CREATE INDEX "status_idx" ON "faculty_contributions" ("status");

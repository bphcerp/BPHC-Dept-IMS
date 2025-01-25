CREATE TABLE IF NOT EXISTS "faculty" (
	"email" text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "phd" (
	"email" text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "refresh_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_email" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "roles" (
	"role" text PRIMARY KEY NOT NULL,
	"allowed" text[] DEFAULT '{}'::text[] NOT NULL,
	"disallowed" text[] DEFAULT '{}'::text[] NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"email" text PRIMARY KEY NOT NULL,
	"roles" text[] DEFAULT '{}'::text[] NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "faculty" ADD CONSTRAINT "faculty_email_users_email_fk" FOREIGN KEY ("email") REFERENCES "public"."users"("email") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "phd" ADD CONSTRAINT "phd_email_users_email_fk" FOREIGN KEY ("email") REFERENCES "public"."users"("email") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_email_users_email_fk" FOREIGN KEY ("user_email") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION check_roles() RETURNS TRIGGER AS $$
DECLARE
	valid_roles text[];
BEGIN
	-- Fetch all roles into an array
	SELECT COALESCE(array_agg(role), '{}') INTO valid_roles FROM roles;

	-- Check NEW.roles
	IF NOT (valid_roles @> NEW.roles) THEN
		RAISE EXCEPTION 'Role does not exist in roles table';
	END IF;

	RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE OR REPLACE TRIGGER validate_roles_array
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION check_roles();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION handle_role_deletion() RETURNS trigger AS $$
BEGIN
    UPDATE users
    SET roles = array_remove(roles, OLD.role)
    WHERE OLD.role = ANY(roles);
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE OR REPLACE TRIGGER on_role_delete
AFTER DELETE ON roles
FOR EACH ROW EXECUTE FUNCTION handle_role_deletion();
--> statement-breakpoint

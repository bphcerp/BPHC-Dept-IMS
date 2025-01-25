CREATE TABLE IF NOT EXISTS "permissions" (
	"permission" text PRIMARY KEY NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE OR REPLACE FUNCTION check_permissions() RETURNS TRIGGER AS $$
DECLARE
	valid_permissions text[];
BEGIN
	-- Fetch all permissions into an array
	SELECT COALESCE(array_agg(permission), '{}') INTO valid_permissions FROM permissions;

	-- Check NEW.allowed
	IF NOT (valid_permissions @> NEW.allowed) THEN
		RAISE EXCEPTION 'Allowed permission does not exist in permissions table';
	END IF;

	-- Check NEW.disallowed
	IF NOT (valid_permissions @> NEW.disallowed) THEN
		RAISE EXCEPTION 'Disallowed permission does not exist in permissions table';
	END IF;

	RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE OR REPLACE TRIGGER validate_permissions_array
BEFORE INSERT OR UPDATE ON roles
FOR EACH ROW EXECUTE FUNCTION check_permissions();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION handle_permission_deletion() RETURNS trigger AS $$
BEGIN
    UPDATE roles
    SET allowed = array_remove(allowed, OLD.permission),
		disallowed = array_remove(disallowed, OLD.permission)
	WHERE OLD.permission = ANY(allowed) OR OLD.permission = ANY(disallowed);
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE OR REPLACE TRIGGER on_permission_delete
AFTER DELETE ON permissions
FOR EACH ROW EXECUTE FUNCTION handle_permission_deletion();
--> statement-breakpoint
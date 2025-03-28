-- Custom SQL migration file, put your code below! --
CREATE OR REPLACE FUNCTION check_roles() RETURNS TRIGGER AS $$
DECLARE
	valid_roles integer[];
BEGIN
	-- Fetch all roles into an array
	SELECT COALESCE(array_agg(id), '{}') INTO valid_roles FROM roles;

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
    SET roles = array_remove(roles, OLD.id)
    WHERE OLD.id = ANY(roles);
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE OR REPLACE TRIGGER on_role_delete
AFTER DELETE ON roles
FOR EACH ROW EXECUTE FUNCTION handle_role_deletion();
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
BEFORE DELETE ON permissions
FOR EACH ROW EXECUTE FUNCTION handle_permission_deletion();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION update_role_member_count() RETURNS trigger AS $$
DECLARE
    new_roles integer[];
    old_roles integer[];
    added_roles integer[];
    removed_roles integer[];
    added_role integer;
    removed_role integer;
BEGIN
-- Get the old and new roles
    new_roles := COALESCE(NEW.roles, '{}');
    old_roles := COALESCE(OLD.roles, '{}');
	-- Find the roles that are added
    added_roles := ARRAY(
        SELECT unnest(new_roles)
        EXCEPT
        SELECT unnest(old_roles)
    );
	-- Find the roles that were removed
    removed_roles := ARRAY(
        SELECT unnest(old_roles)
        EXCEPT
        SELECT unnest(new_roles)
    );
	-- Increment member_count for each newly added role
    FOREACH added_role IN ARRAY added_roles LOOP
        UPDATE roles
        SET member_count = member_count + 1
        WHERE id = added_role;
    END LOOP;
	-- Decrement member_count for each removed role
    FOREACH removed_role IN ARRAY removed_roles LOOP
        UPDATE roles
        SET member_count = GREATEST(member_count - 1, 0)  -- Ensure it doesn't go below 0
        WHERE id = removed_role;
    END LOOP;
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE OR REPLACE TRIGGER trigger_update_role_member_count
AFTER UPDATE OR INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION update_role_member_count();
--> statement-breakpoint
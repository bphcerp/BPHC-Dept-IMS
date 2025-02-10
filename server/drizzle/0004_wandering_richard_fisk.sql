ALTER TABLE "roles" ADD COLUMN "member_count" integer DEFAULT 0 NOT NULL;
-- --> statement-breakpoint
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

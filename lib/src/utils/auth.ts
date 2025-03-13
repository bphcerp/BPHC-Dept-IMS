import type { Permissions } from "../types/auth";

/**
 * Checks if a required permission matches a given wildcard pattern.
 *
 * @param requiredPermission - The permission string that needs to be checked.
 * @param pattern - The wildcard pattern to match against. The wildcard character '*' can be used to match any sequence of characters.
 * @returns `true` if the required permission matches the pattern, otherwise `false`.
 */
export const matchWildcard = (
    requiredPermission: string,
    pattern: string
): boolean => {
    const regex = new RegExp(`^${pattern.replace(/\*/g, ".*")}$`);
    return regex.test(requiredPermission);
};

/**
 * Checks if the required permission is allowed based on the provided permissions.
 *
 * @param requiredPermission - The permission that needs to be checked.
 * @param hasPermissions - An object containing allowed and disallowed permissions.
 * @returns `true` if the required permission is allowed, `false` otherwise.
 */
export const checkAccess = (
    requiredPermission: string,
    hasPermissions: Permissions
) => {
    if (
        hasPermissions.disallowed.some((disallowedPermission) =>
            matchWildcard(requiredPermission, disallowedPermission)
        )
    ) {
        return false;
    }
    if (
        hasPermissions.allowed.includes("*") ||
        hasPermissions.allowed.some((allowedPermission) =>
            matchWildcard(requiredPermission, allowedPermission)
        )
    )
        return true;
    return false;
};

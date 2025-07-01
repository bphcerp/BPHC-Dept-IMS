import db from "@/config/db/index.ts";
import type { adminSchemas, allPermissions } from "lib";
import { getAccessMultiple } from "../auth/index.ts";
import fs from "fs/promises";
import logger from "@/config/logger.ts";
import path from "path";
import { faculty, phd, staff } from "@/config/db/schema/admin.ts";

/**
 * Retrieves user details based on the provided email address.
 *
 * This function queries the database to find a user by their email and fetches
 * associated details, including faculty, PhD, and staff information. If no user
 * is found, it returns `null`. Otherwise, it combines the user's base data with
 * the first available associated details (PhD, faculty, or staff).
 *
 * @param userEmail - The email address of the user to retrieve details for.
 * @returns A promise that resolves to an object containing the user's details,
 *          or `null` if no user is found.
 */
export const getUserDetails = async (userEmail: string) => {
    const user = await db.query.users.findFirst({
        where: (cols, { eq }) => eq(cols.email, userEmail),
        with: {
            faculty: true,
            phd: {
                columns: {
                    idNumber: true,
                    erpId: true,
                    name: true,
                    instituteEmail: true,
                    mobile: true,
                    personalEmail: true,
                    notionalSupervisorEmail: true,
                    supervisorEmail: true,
                },
            },
            staff: true,
        },
    });
    if (!user) return null;
    const roles = (await db.query.roles.findMany()).reduce(
        (acc, role) => {
            acc[role.id] = role.roleName;
            return acc;
        },
        {} as Record<number, string>
    );
    const { faculty, phd, staff, ...rest } = user;
    const { roles: userRoles, ...userData } = rest;
    return {
        ...userData,
        ...(faculty ?? {}),
        ...(phd ?? {}),
        ...(staff ?? {}),
        roles: userRoles.map((role) => roles[role]),
    };
};

/**
 * Returns the appropriate database table based on the user type.
 * 
 * @param type - The user type, must be one of the valid user types from adminSchemas
 * @returns The corresponding database table (faculty, phd, or staff)
 * 
 */
export const getUserTableByType = (
    type: typeof adminSchemas.userTypes[number]
) => {
    switch (type) {
        case "faculty":
            return faculty;
        case "phd":
            return phd;
        case "staff":
            return staff;
    }
}

/**
 * Retrieves all users who have a specific permission.
 *
 * @param permission - The permission key to check for, must be a valid key from allPermissions
 * @returns A promise that resolves to an array of users who have the specified permission
 */
export const getUsersWithPermission = async (
    permission: keyof typeof allPermissions
) => {
    const users = await db.query.users.findMany();
    const userPermissions = await getAccessMultiple(
        users.map((user) => {
            return user.roles;
        })
    );
    return users.filter((_, i) => {
        return userPermissions[i].allowed.includes(permission);
    });
};

/**
 * Determines the MIME type for an image file based on its file extension.
 *
 * @param filePath - The file path or filename containing the extension to analyze
 * @returns The corresponding MIME type string for the file extension. Returns "image/png" as default if the extension is not recognized.
 *
 * @example
 * ```typescript
 * getMimeTypeFromExtension("photo.jpg") // Returns "image/jpeg"
 * getMimeTypeFromExtension("icon.svg") // Returns "image/svg+xml"
 * getMimeTypeFromExtension("unknown.xyz") // Returns "image/png" (default)
 * ```
 */
export const getMimeTypeFromExtension = (filePath: string): string => {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".svg": "image/svg+xml",
        ".webp": "image/webp",
        ".bmp": "image/bmp",
        ".ico": "image/x-icon",
    };
    return mimeTypes[ext] || "image/png";
};

/**
 * Encodes an image file to a base64 data URL string.
 *
 * @param fileData - Object containing file information
 * @param fileData.filePath - The path to the image file to encode
 * @param fileData.mimetype - Optional MIME type of the file. If not provided, it will be determined from the file extension
 * @returns A Promise that resolves to a base64 data URL string (e.g., "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...") or undefined if encoding fails
 *
 * @example
 * ```typescript
 * const result = await encodeImageToBase64({
 *   filePath: '/path/to/image.png',
 *   mimetype: 'image/png'
 * });
 * console.log(result); // "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
 * ```
 */
export const encodeImageToBase64 = async (fileData: {
    filePath: string;
    mimetype?: string | null;
}): Promise<string | undefined> => {
    try {
        const imageBuffer = await fs.readFile(fileData.filePath);
        const mimetype =
            fileData.mimetype ?? getMimeTypeFromExtension(fileData.filePath);
        return `data:${mimetype};base64,${imageBuffer.toString("base64")}`;
    } catch (error) {
        logger.debug(`Failed to encode image ${fileData.filePath}:`, error);
        return undefined;
    }
};

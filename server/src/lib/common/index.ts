import db from "@/config/db/index.ts";

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
    const { faculty, phd, staff, ...userData } = user;
    return {
        ...userData,
        ...(phd || faculty || staff),
    };
};

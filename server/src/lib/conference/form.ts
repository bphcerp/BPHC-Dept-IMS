import { getApplicationById } from "./index.ts";
import fs from "fs/promises";
import path from "path";
import {
    encodeImageToBase64,
    getUserDetails,
    getUsersWithPermission,
} from "../common/index.ts";
import { STATIC_DIR } from "@/config/environment.ts";
import { generateTemplateData } from "./templateGenerator.ts";
import Mustache from "mustache";
import db from "@/config/db/index.ts";
import type { allPermissions } from "lib";
import { HttpCode, HttpError } from "@/config/errors.ts";
import pdf from "html-pdf-node";

export const generateApplicationFormPdf = async (
    id: number
): Promise<Buffer> => {
    const html = await generateApplicationFormHtml(id);
    return await (pdf.generatePdf(
        { content: html },
        {
            format: "A4",
            margin: {
                top: "20mm",
                right: "20mm",
                bottom: "20mm",
                left: "20mm",
            },
            printBackground: true,
        }
    ) as unknown as Promise<Buffer>);
};

export const generateApplicationFormHtml = async (
    id: number
): Promise<string> => {
    const applicationData = await getApplicationById(id);
    if (!applicationData)
        throw new HttpError(HttpCode.NOT_FOUND, "Application not found");
    if (!(applicationData.state === "Completed"))
        throw new HttpError(
            HttpCode.BAD_REQUEST,
            "Application is not approved"
        );
    const userData = await getUserDetails(applicationData.userEmail);
    if (!userData)
        throw new HttpError(
            HttpCode.INTERNAL_SERVER_ERROR,
            "User not found",
            "Unable to retrieve user details for the application"
        );
    const drcReviews = (
        await db.query.conferenceMemberReviews.findMany({
            columns: {
                status: true,
            },
            where: (cols, { eq }) => eq(cols.applicationId, applicationData.id),
        })
    ).map((review) => review.status);

    const {
        signatureBase64: drcConvenerSignatureBase64,
        approvalDate: convenerDate,
        name: convenerName,
    } = await getAuthorityDetails(
        applicationData.id,
        "conference:application:review-application-convener"
    );

    const {
        signatureBase64: hodSignatureBase64,
        approvalDate: hodDate,
        name: hodName,
    } = await getAuthorityDetails(
        applicationData.id,
        "conference:application:review-application-hod"
    );

    const logoBase64 = await encodeImageToBase64({
        filePath: path.join(STATIC_DIR, "logo.svg"),
    });

    const templatePath = path.join(
        STATIC_DIR,
        "conferenceApprovalTemplate.html"
    );
    const template = await fs.readFile(templatePath, "utf-8");

    const data = generateTemplateData({
        ...applicationData,
        ...userData,
        drcReviews,
        logoBase64,
        drcConvenerSignatureBase64,
        convenerDate,
        convenerName,
        hodSignatureBase64,
        hodDate,
        hodName,
    });

    return Mustache.render(template, data);
};

const getAuthorityDetails = async (
    applicationId: number,
    permission: keyof typeof allPermissions
): Promise<{
    signatureBase64: string | undefined;
    approvalDate: string | undefined;
    name: string | undefined;
}> => {
    const user = (await getUsersWithPermission(permission))[0];
    if (!user)
        return {
            signatureBase64: undefined,
            approvalDate: undefined,
            name: undefined,
        };
    const faculty = await db.query.faculty.findFirst({
        columns: { name: true },
        with: {
            signatureFile: true,
        },
        where: (cols, { eq }) => eq(cols.email, user.email),
    });
    const signatureBase64 = faculty?.signatureFile
        ? await encodeImageToBase64(faculty.signatureFile)
        : undefined;
    const approvalDate = (
        await db.query.conferenceMemberReviews.findFirst({
            columns: { createdAt: true },
            where: (cols, { eq, and }) =>
                and(
                    eq(cols.applicationId, applicationId),
                    eq(cols.reviewerEmail, user.email)
                ),
            orderBy: (cols, { desc }) => desc(cols.createdAt),
        })
    )?.createdAt.toLocaleDateString();
    const name = faculty?.name ?? undefined;
    return { signatureBase64, approvalDate, name };
};

import { getApplicationById } from "./index.ts";
import { PDFDocument, PDFFont, StandardFonts, rgb } from "pdf-lib";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { getUserDetails } from "../common/index.ts";

interface FieldEntry {
    x: number;
    y: number;
    text: string;
    page: number;
    fontSize?: number;
    font?: PDFFont;
}

export const generateApplicationFormPDF = async (id: number) => {
    // loads application & user data
    const applicationData = await getApplicationById(id);
    if (!applicationData) return null;

    const userData = await getUserDetails(applicationData.userEmail);
    if (!userData) return null;

    // loads PDF file
    const templatePath = path.join(
        path.dirname(fileURLToPath(import.meta.url)),
        "../../../static/conferenceApprovalTemplate.pdf"
    );
    const templateBytes = await fs.readFile(templatePath);
    const templateDoc = await PDFDocument.load(templateBytes);

    const timesNewRoman = await templateDoc.embedFont(StandardFonts.TimesRoman);
    const fontSize = 12;
    templateDoc.setTitle("Conference Appplication");

    // converts application data into fields
    var fields: FieldEntry[] = getformFields(applicationData, userData);

    // populates PDF file with the fields
    for (const field of fields) {
        const page = templateDoc.getPage(field.page);
        page.drawText(field.text, {
            x: field.x,
            y: field.y,
            size: fontSize,
            font: timesNewRoman,
            color: rgb(0, 0, 0),
        });
    }

    const generatedFormBytes = await templateDoc.save();
    return generatedFormBytes;
};

const getformFields = (appData: any, userData: any) => {
    var fields: FieldEntry[] = [];
    fields.push(
        makeFieldEntry(485, 635, new Date().toLocaleDateString("en-GB"), 0, 10),
        makeFieldEntry(438, 569, "-", 0, 1), // PSRN No. missing
        makeFieldEntry(138, 543, "-", 0, 1), // Designation missing
        makeFieldEntry(110, 568, userData.name ?? "", 0, 42),
        makeFieldEntry(320, 543, userData.email ?? "", 0, 15),
        makeFieldEntry(480, 543, userData.mobile ?? "", 0, 12),
        makeFieldEntry(85, 318, appData.contentTitle ?? "", 0, 85),
        makeFieldEntry(85, 259, appData.eventName ?? "", 0, 85),
        makeFieldEntry(110, 231, appData.venue ?? "", 0, 30),
        makeFieldEntry(
            310,
            231,
            appData.dateFrom
                ? new Date(appData.dateFrom).toLocaleDateString("en-GB")
                : "",
            0,
            12
        ),
        makeFieldEntry(448, 231, appData.organizedBy ?? "", 0, 17),
        makeFieldEntry(220, 678, "V", 1, 1)
    );

    // Purpose
    if (appData.purpose) {
        const tickPos = getTickCoordinates(appData.purpose);
        fields.push(makeFieldEntry(tickPos.x, tickPos.y, "V", 0, 1));
    }
    // Description
    if (appData.description) {
        var text = appData.description;
        var n = Math.min(800, text.length);
        const lineLen = 100;

        if (n < text.length) {
            text = text.slice(0, n - 3) + "...";
            n += 3;
        }
        for (var i = 0; i < n; i += lineLen)
            fields.push(
                makeFieldEntry(
                    75,
                    180 - (i / lineLen) * 14,
                    text.slice(i, Math.min(n, i + lineLen)),
                    0,
                    90
                )
            );
    }

    // Reimbursements
    if (appData?.travelReimbursement && appData?.travelReimbursement > 0) {
        const text = "V" + "      " + String(appData.travelReimbursement);
        fields.push(makeFieldEntry(395, 608, text, 1, 25));
    }
    if (
        appData?.registrationFeeReimbursement &&
        appData?.registrationFeeReimbursement > 0
    ) {
        const text =
            "V" + "      " + String(appData.registrationFeeReimbursement);
        fields.push(makeFieldEntry(395, 575, text, 1, 25));
    }
    if (
        appData?.dailyAllowanceReimbursement &&
        appData?.dailyAllowanceReimbursement > 0
    ) {
        const text =
            "V" + "      " + String(appData.dailyAllowanceReimbursement);
        fields.push(makeFieldEntry(395, 543, text, 1, 25));
    }
    // for some reason Accommodation Reimbursement isnt in the PDF so i have added it to other Reimbursement
    if (
        appData?.otherReimbursement &&
        appData?.accommodationReimbursement &&
        appData?.otherReimbursement + appData?.accommodationReimbursement > 0
    ) {
        const text =
            "V" +
            "      " +
            String(
                appData?.otherReimbursement +
                    appData?.accommodationReimbursement
            );
        fields.push(makeFieldEntry(395, 510, text, 1, 25));
    }
    var totalReimbursement =
        (appData.travelReimbursement ?? 0) +
        (appData.registrationFeeReimbursement ?? 0) +
        (appData.dailyAllowanceReimbursement ?? 0) +
        (appData.accommodationReimbursement ?? 0) +
        (appData.otherReimbursement ?? 0);
    fields.push(makeFieldEntry(420, 478, String(totalReimbursement), 1, 18));

    // enclosures
    if (appData.letterOfInvitation)
        fields.push(makeFieldEntry(299, 434, "V", 1, 1));
    if (appData.firstPageOfPaper)
        fields.push(makeFieldEntry(484, 434, "V", 1, 1));
    if (appData.reviewersComments)
        fields.push(makeFieldEntry(194, 419, "V", 1, 1));
    if (appData.detailsOfEvent)
        fields.push(makeFieldEntry(395, 419, "V", 1, 1));
    if (appData.otherDocuments)
        fields.push(makeFieldEntry(255, 405, "V", 1, 1));

    return fields;
};

// determines x and y for the tick in Purpose field
const getTickCoordinates = (purpose: string) => {
    const tickPos = {
        x: 0,
        y: 0,
    };
    switch (purpose) {
        case "Invited Speaker":
            tickPos.x = 175;
            tickPos.y = 490;
            break;
        case "Keynote Lecture":
            tickPos.x = 288;
            tickPos.y = 490;
            break;
        case "Presenting Paper":
            tickPos.x = 398;
            tickPos.y = 490;
            break;
        case "Chairing Session":
            tickPos.x = 532;
            tickPos.y = 490;
            break;
        case "Conference (Attending)":
            tickPos.x = 175;
            tickPos.y = 456;
            break;
        case "Workshop (Attending)":
            tickPos.x = 288;
            tickPos.y = 456;
            break;
        case "Visiting Laboratory (Under International Collaboration)":
            tickPos.x = 398;
            tickPos.y = 456;
            break;
        case "Presenting Poster":
            tickPos.x = 532;
            tickPos.y = 458;
            break;
        case "Journal Page Charges":
            tickPos.x = 288;
            tickPos.y = 398;
            break;
        case "Others (Consumables or Justification)":
            tickPos.x = 532;
            tickPos.y = 398;
            break;

        default:
            break;
    }
    return tickPos;
};

const makeFieldEntry = (
    x: number,
    y: number,
    text: string,
    page: number,
    maxChars: number
): FieldEntry => {
    text = text.slice(0, Math.min(maxChars, text.length));
    return {
        x,
        y,
        text,
        page,
    };
};

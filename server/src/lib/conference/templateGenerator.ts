interface ApplicationData {
    id: number;
    name: string | null;
    psrn: string | null;
    designation: string | null;
    email: string;
    phone: string | null;
    purpose: string;
    contentTitle: string;
    eventName: string;
    venue: string;
    dateFrom: Date;
    dateTo: Date;
    organizedBy: string;
    modeOfEvent: string;
    description: string;
    fundingSplit: Array<{ source: string; amount: string }>;
    reimbursements: Array<{ key: string; amount: string }>;
    letterOfInvitation: object | null;
    firstPageOfPaper: object | null;
    reviewersComments: object | null;
    detailsOfEvent: object | null;
    otherDocuments: object | null;
    drcReviews: Array<boolean>;
    logoBase64?: string;
    drcConvenerSignatureBase64?: string;
    hodSignatureBase64?: string;
    convenerName?: string;
    hodName?: string;
    convenerDate?: string;
    hodDate?: string;
}

export function generateTemplateData(data: ApplicationData) {
    const totalAmount = data.reimbursements.reduce(
        (sum, item) => sum + parseFloat(item.amount || "0"),
        0
    );
    const purposeFlags = mapPurposeToFlags(data.purpose);
    const currentDate = new Date().toLocaleDateString();
    return {
        logoBase64: data.logoBase64,
        submissionDate: currentDate,
        applicationId: data.id,
        applicantName: data.name ?? "-",
        psrnNumber: data.psrn ?? "-",
        designation: data.designation ?? "-",
        emailAddress: data.email,
        phoneNumber: data.phone ?? "-",
        generationDate: currentDate,
        ...purposeFlags,
        contentTitle: data.contentTitle,
        eventName: data.eventName,
        venue: data.venue,
        eventDateRange: `${data.dateFrom.toLocaleDateString()} - ${data.dateTo.toLocaleDateString()}`,
        organizedBy: data.organizedBy,
        modeOfEvent: data.modeOfEvent,
        description: data.description,
        hasFinancialDetails: totalAmount > 0,
        hasFundingSplit: data.fundingSplit.length > 0 && totalAmount > 0,
        totalAmount: totalAmount.toFixed(2),
        reimbursements: data.reimbursements.filter(
            (item) => parseFloat(item.amount || "0") > 0
        ),
        fundingSplit: data.fundingSplit.filter(
            (item) => parseFloat(item.amount || "0") > 0
        ),
        hasLetterOfInvitation: data.letterOfInvitation ? true : false,
        hasFirstPageOfPaper: data.firstPageOfPaper ? true : false,
        hasReviewersComments: data.reviewersComments ? true : false,
        hasDetailsOfEvent: data.detailsOfEvent ? true : false,
        hasOtherDocuments: data.otherDocuments ? true : false,
        drcReviews: data.drcReviews.map((review, index) => ({
            reviewerNumber: index + 1,
            status: review,
        })),
        drcConvenerSignatureBase64: data.drcConvenerSignatureBase64,
        hodSignatureBase64: data.hodSignatureBase64,
        drcConvenerName: data.convenerName ?? "",
        hodName: data.hodName ?? "",
        drcApprovalDate: data.convenerDate ?? "",
        hodApprovalDate: data.hodDate ?? "",
    };
}

/**
 * Maps a purpose string to boolean flags for template checkboxes
 */
function mapPurposeToFlags(purpose: string) {
    const flags = {
        purposeInvitedSpeaker: false,
        purposeKeynoteLecture: false,
        purposePresentingPaper: false,
        purposeChairingSession: false,
        purposeAttendingConference: false,
        purposeAttendingWorkshop: false,
        purposeVisitingLaboratory: false,
        purposePresentingPoster: false,
        purposeJournalPageCharges: false,
        purposeOthers: false,
        otherPurposeDetails: undefined as string | undefined,
    };

    switch (purpose) {
        case "Invited Speaker":
            flags.purposeInvitedSpeaker = true;
            break;
        case "Keynote Lecture":
            flags.purposeKeynoteLecture = true;
            break;
        case "Presenting Paper":
            flags.purposePresentingPaper = true;
            break;
        case "Chairing Session":
            flags.purposeChairingSession = true;
            break;
        case "Conference (Attending)":
        case "Attending Conference":
            flags.purposeAttendingConference = true;
            break;
        case "Workshop (Attending)":
        case "Attending Workshop":
            flags.purposeAttendingWorkshop = true;
            break;
        case "Visiting Laboratory (Under International Collaboration)":
        case "Visiting Laboratory":
            flags.purposeVisitingLaboratory = true;
            break;
        case "Presenting Poster":
            flags.purposePresentingPoster = true;
            break;
        case "Journal Page Charges":
            flags.purposeJournalPageCharges = true;
            break;
        default:
            // Handle "Others" or any custom purpose
            flags.purposeOthers = true;
            flags.otherPurposeDetails = purpose;
            break;
    }

    return flags;
}

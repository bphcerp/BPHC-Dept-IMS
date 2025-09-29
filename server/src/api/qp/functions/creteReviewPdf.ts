import logger from "@/config/logger.ts";
import htmlPdf from "html-pdf-node";
import JSZip from "jszip";

interface ReviewCriteria {
    length?: string;
    remarks?: string;
    language?: string;
    solution?: string;
    coverLearning?: string;
    mixOfQuestions?: string;
}

interface ReviewData {
    Compre?: ReviewCriteria;
    MidSem?: ReviewCriteria;
    Others?: ReviewCriteria;
}

interface ReviewRequest {
    id: number;
    icEmail: string;
    reviewerEmail: string;
    courseName: string;
    courseCode: string;
    review: ReviewData;
    status: string;
    createdAt: string;
    submittedOn: string;
    requestType: string;
    category: string;
    ic: {
        faculty: {
            name: string;
            email: string;
            department?: string;
            designation?: string;
        };
    };
    reviewer: {
        faculty: {
            name: string;
            email: string;
            department?: string;
            designation?: string;
        };
    };
    reviewerName: string;
    professorName: string;
}

// Helper functions
const getScoreColor = (score: string | undefined): string => {
    if (!score || score.trim() === "") return "#6B7280"; // gray

    const numScore = parseInt(score);
    if (isNaN(numScore) || numScore > 10) return "#F59E0B"; // orange for invalid
    if (numScore >= 7) return "#10B981"; // green
    if (numScore >= 4) return "#F59E0B"; // yellow
    return "#EF4444"; // red
};

const formatScore = (score: string | undefined): string => {
    if (!score || score.trim() === "") return "N/A";
    return score;
};

const formatRemarks = (remarks: string | undefined): string => {
    if (!remarks || remarks.trim() === "") return "No remarks provided";
    return remarks.replace(/\n/g, "<br>");
};

const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
};

const generateTableRows = (review: ReviewData): string => {
    const sections = [
        { key: "MidSem", label: "Mid Semester Exam" },
        { key: "Compre", label: "Comprehensive Exam" },
        { key: "Others", label: "Other Evaluations" },
    ];

    return sections
        .filter((section) => review[section.key as keyof ReviewData])
        .map((section) => {
            const sectionData = review[section.key as keyof ReviewData]!;

            return `
        <tr>
          <td class="exam-type">${section.label}</td>
          <td class="score-cell">
            <span class="score-badge" style="background-color: ${getScoreColor(sectionData.length)}20; color: ${getScoreColor(sectionData.length)}; border: 1px solid ${getScoreColor(sectionData.length)}40;">
              ${formatScore(sectionData.length)}
            </span>
          </td>
          <td class="score-cell">
            <span class="score-badge" style="background-color: ${getScoreColor(sectionData.language)}20; color: ${getScoreColor(sectionData.language)}; border: 1px solid ${getScoreColor(sectionData.language)}40;">
              ${formatScore(sectionData.language)}
            </span>
          </td>
          <td class="score-cell">
            <span class="score-badge" style="background-color: ${getScoreColor(sectionData.solution)}20; color: ${getScoreColor(sectionData.solution)}; border: 1px solid ${getScoreColor(sectionData.solution)}40;">
              ${formatScore(sectionData.solution)}
            </span>
          </td>
          <td class="score-cell">
            <span class="score-badge" style="background-color: ${getScoreColor(sectionData.coverLearning)}20; color: ${getScoreColor(sectionData.coverLearning)}; border: 1px solid ${getScoreColor(sectionData.coverLearning)}40;">
              ${formatScore(sectionData.coverLearning)}
            </span>
          </td>
          <td class="score-cell">
            <span class="score-badge" style="background-color: ${getScoreColor(sectionData.mixOfQuestions)}20; color: ${getScoreColor(sectionData.mixOfQuestions)}; border: 1px solid ${getScoreColor(sectionData.mixOfQuestions)}40;">
              ${formatScore(sectionData.mixOfQuestions)}
            </span>
          </td>
          <td class="remarks-cell">${formatRemarks(sectionData.remarks)}</td>
        </tr>
      `;
        })
        .join("");
};

const getCommonStyles = (): string => {
    return `
    <style>
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        margin: 0;
        padding: 20px;
        color: #1F2937;
        background-color: #ffffff;
        line-height: 1.4;
      }
      
      .main-header {
        text-align: center;
        margin-bottom: 40px;
        padding: 20px 0;
        border-bottom: 3px solid #3B82F6;
      }
      
      .main-title {
        font-size: 32px;
        font-weight: bold;
        color: #1E40AF;
        margin-bottom: 10px;
      }
      
      .summary-info {
        font-size: 16px;
        color: #6B7280;
      }
      
      .review-section {
        margin-bottom: 50px;
      }
      
      .review-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        margin-bottom: 20px;
      }
      
      .review-title {
        font-size: 20px;
        font-weight: 600;
        margin: 0;
      }
      
      .course-details-section, .reviewer-details-section, .review-table-section {
        margin-bottom: 30px;
      }
      
      .section-title {
        font-size: 16px;
        font-weight: 600;
        color: #1E40AF;
        margin-bottom: 15px;
        padding-bottom: 8px;
        border-bottom: 2px solid #E5E7EB;
      }
      
      .details-grid {
        background-color: #F8FAFC;
        border: 1px solid #E2E8F0;
        border-radius: 8px;
        padding: 20px;
      }
      
      .detail-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 12px;
        font-size: 14px;
      }
      
      .detail-row:last-child {
        margin-bottom: 0;
      }
      
      .detail-label {
        font-weight: 600;
        color: #374151;
        min-width: 140px;
      }
      
      .detail-value {
        color: #6B7280;
        text-align: right;
        flex: 1;
        word-break: break-word;
      }
      
      .status-reviewed {
        color: #10B981;
        font-weight: 600;
      }
      
      .status-pending {
        color: #F59E0B;
        font-weight: 600;
      }
      
      .rating-info {
        background-color: #EBF8FF;
        border: 1px solid #3B82F6;
        border-radius: 6px;
        padding: 12px;
        margin: 15px 0;
        text-align: center;
      }
      
      .rating-info p {
        margin: 0;
        font-size: 13px;
        color: #1E40AF;
      }
      
      .available-sections {
        background-color: #F9FAFB;
        border: 1px solid #D1D5DB;
        border-radius: 6px;
        padding: 10px 15px;
        margin-bottom: 20px;
        font-size: 12px;
        color: #6B7280;
      }
      
      .table-container {
        margin: 20px 0;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      }
      
      table {
        width: 100%;
        border-collapse: collapse;
        background-color: white;
      }
      
      th {
        background-color: #F3F4F6;
        padding: 12px 8px;
        text-align: left;
        font-weight: 600;
        font-size: 11px;
        color: #374151;
        border-bottom: 2px solid #E5E7EB;
      }
      
      td {
        padding: 12px 8px;
        border-bottom: 1px solid #E5E7EB;
        font-size: 10px;
      }
      
      tr:nth-child(even) {
        background-color: #F9FAFB;
      }
      
      .exam-type {
        font-weight: 600;
        color: #1F2937;
        width: 15%;
      }
      
      .score-cell {
        text-align: center;
        width: 14%;
      }
      
      .score-badge {
        display: inline-block;
        padding: 4px 8px;
        border-radius: 4px;
        font-weight: 600;
        font-size: 10px;
        min-width: 25px;
      }
      
      .remarks-cell {
        font-size: 9px;
        line-height: 1.4;
        max-width: 150px;
        word-wrap: break-word;
      }
      
      .footer {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid #E5E7EB;
        text-align: center;
        font-size: 10px;
        color: #6B7280;
      }
      
      .generated-date {
        margin-top: 10px;
        font-style: italic;
      }
    </style>
  `;
};

const generateReviewSection = (request: ReviewRequest): string => {
    return `
    <div class="review-section">

      <!-- Course Details with FIC -->
      <div class="course-details-section">
        <div class="section-title">Course Information</div>
        <div class="details-grid">
          <div class="detail-row">
            <span class="detail-label">Course Name:</span>
            <span class="detail-value">${request.courseName}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Course Code:</span>
            <span class="detail-value">${request.courseCode}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Request Type:</span>
            <span class="detail-value">${request.requestType}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Category:</span>
            <span class="detail-value">${request.category}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Status:</span>
            <span class="detail-value status-${request.status.toLowerCase()}">${request.status}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Faculty In Charge:</span>
            <span class="detail-value">${request.professorName}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">FIC Email:</span>
            <span class="detail-value">${request.icEmail}</span>
          </div>
        </div>
      </div>

      <!-- Reviewer Details -->
      <div class="reviewer-details-section">
        <div class="section-title">Reviewer Information</div>
        <div class="details-grid">
          <div class="detail-row">
            <span class="detail-label">Reviewer Name:</span>
            <span class="detail-value">${request.reviewerName}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Reviewer Email:</span>
            <span class="detail-value">${request.reviewerEmail}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Review Date:</span>
            <span class="detail-value">${formatDate(request.submittedOn)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Request Created:</span>
            <span class="detail-value">${formatDate(request.createdAt)}</span>
          </div>
        </div>
      </div>

      <!-- Review in Tabular Form -->
      <div class="review-table-section">
        <div class="section-title">Evaluation Scores</div>
        <div class="rating-info">
          <p><strong>Rating Scale:</strong> 0-10 scale where <strong>10 = Best</strong> and <strong>0 = Worst</strong></p>
        </div>
        
        <div class="available-sections">
          <strong>Evaluated Sections:</strong> ${Object.keys(request.review).join(", ")}
        </div>
        
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Exam Type</th>
                <th>Paper Length</th>
                <th>Language & Clarity</th>
                <th>Solution Approach</th>
                <th>Learning Coverage</th>
                <th>Question Mix</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${generateTableRows(request.review)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
};

// Function to calculate average score for a review
// const calculateAverageScore = (review: ReviewData): string => {
//     const allScores: number[] = [];

//     Object.values(review).forEach((section) => {
//         if (section) {
//             Object.entries(section).forEach(([key, value]) => {
//                 if (
//                     key !== "remarks" &&
//                     value &&
//                     (typeof value === "string" ? value.trim() : value) !== ""
//                 ) {
//                     const score = parseInt(value as string);
//                     if (!isNaN(score) && score <= 10) {
//                         allScores.push(score);
//                     }
//                 }
//             });
//         }
//     });

//     if (allScores.length === 0) return "N/A";
//     const average = allScores.reduce((a, b) => a + b, 0) / allScores.length;
//     return average.toFixed(1);
// };

// const getOverallScoreColor = (avgScore: string): string => {
//     if (avgScore === "N/A") return "#6B7280";
//     const score = parseFloat(avgScore);
//     if (score >= 7) return "#10B981";
//     if (score >= 4) return "#F59E0B";
//     return "#EF4444";
// };

// Function to generate summary table with all courses showing detailed ratings
export async function generateSummaryReviewPDF(
    reviewRequests: ReviewRequest[]
): Promise<Buffer> {
    const generateDetailedSummaryTableRows = (
        reviews: ReviewRequest[]
    ): string => {
        return reviews
            .map((request, index) => {
                const evaluatedSections = Object.keys(request.review);

                // Generate rows for each evaluated section
                const sectionRows = evaluatedSections
                    .map((sectionKey, sectionIndex) => {
                        const sectionData =
                            request.review[sectionKey as keyof ReviewData];
                        const sectionLabel =
                            sectionKey === "MidSem"
                                ? "Mid Semester"
                                : sectionKey === "Compre"
                                  ? "Comprehensive"
                                  : "Others";

                        return `
          <tr>
            ${
                sectionIndex === 0
                    ? `
              <td class="index-cell" rowspan="${evaluatedSections.length}">${index + 1}</td>
              <td class="course-info" rowspan="${evaluatedSections.length}">
                <div class="course-code">${request.courseCode}</div>
                <div class="course-name">${request.courseName}</div>
              </td>
              <td class="professor-cell" rowspan="${evaluatedSections.length}">${request.professorName}</td>
              <td class="reviewer-cell" rowspan="${evaluatedSections.length}">${request.reviewerName}</td>
              <td class="status-cell" rowspan="${evaluatedSections.length}">
                <span class="status-badge status-${request.status.toLowerCase()}">${request.status}</span>
              </td>
              <td class="date-cell" rowspan="${evaluatedSections.length}">${formatDate(request.submittedOn)}</td>
            `
                    : ""
            }
            <td class="exam-type-summary">${sectionLabel}</td>
            <td class="score-cell">
              <span class="score-badge" style="background-color: ${getScoreColor(sectionData?.length)}20; color: ${getScoreColor(sectionData?.length)}; border: 1px solid ${getScoreColor(sectionData?.length)}40;">
                ${formatScore(sectionData?.length)}
              </span>
            </td>
            <td class="score-cell">
              <span class="score-badge" style="background-color: ${getScoreColor(sectionData?.language)}20; color: ${getScoreColor(sectionData?.language)}; border: 1px solid ${getScoreColor(sectionData?.language)}40;">
                ${formatScore(sectionData?.language)}
              </span>
            </td>
            <td class="score-cell">
              <span class="score-badge" style="background-color: ${getScoreColor(sectionData?.solution)}20; color: ${getScoreColor(sectionData?.solution)}; border: 1px solid ${getScoreColor(sectionData?.solution)}40;">
                ${formatScore(sectionData?.solution)}
              </span>
            </td>
            <td class="score-cell">
              <span class="score-badge" style="background-color: ${getScoreColor(sectionData?.coverLearning)}20; color: ${getScoreColor(sectionData?.coverLearning)}; border: 1px solid ${getScoreColor(sectionData?.coverLearning)}40;">
                ${formatScore(sectionData?.coverLearning)}
              </span>
            </td>
            <td class="score-cell">
              <span class="score-badge" style="background-color: ${getScoreColor(sectionData?.mixOfQuestions)}20; color: ${getScoreColor(sectionData?.mixOfQuestions)}; border: 1px solid ${getScoreColor(sectionData?.mixOfQuestions)}40;">
                ${formatScore(sectionData?.mixOfQuestions)}
              </span>
            </td>
            <td class="remarks-cell-summary">${formatRemarks(sectionData?.remarks)}</td>
          </tr>
        `;
                    })
                    .join("");

                return sectionRows;
            })
            .join("");
    };

    const getSummaryStyles = (): string => {
        return `
      <style>
        ${getCommonStyles().replace("<style>", "").replace("</style>", "")}
        
        .summary-stats {
          display: flex;
          justify-content: space-around;
          margin: 30px 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
          border-radius: 10px;
          color: white;
        }
        
        .stat-item {
          text-align: center;
        }
        
        .stat-number {
          font-size: 24px;
          font-weight: bold;
          display: block;
        }
        
        .stat-label {
          font-size: 12px;
          opacity: 0.9;
        }
        
        .summary-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          font-size: 9px;
          background: white;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          overflow: hidden;
        }
        
        .summary-table th {
          background-color: #1E40AF;
          color: white;
          padding: 8px 6px;
          text-align: left;
          font-weight: 600;
          font-size: 8px;
          border-right: 1px solid #3B82F6;
        }
        
        .summary-table td {
          padding: 8px 6px;
          border-bottom: 1px solid #E5E7EB;
          border-right: 1px solid #F3F4F6;
          font-size: 8px;
          vertical-align: middle;
        }
        
        .summary-table tr:nth-child(even) {
          background-color: #F8FAFC;
        }
        
        .index-cell {
          text-align: center;
          font-weight: 600;
          color: #6B7280;
          width: 4%;
          background-color: #F9FAFB;
          border-right: 2px solid #E5E7EB;
        }
        
        .course-info {
          width: 18%;
          background-color: #F9FAFB;
          border-right: 2px solid #E5E7EB;
        }
        
        .course-code {
          font-weight: 600;
          color: #1E40AF;
          font-size: 9px;
        }
        
        .course-name {
          color: #6B7280;
          font-size: 7px;
          margin-top: 2px;
        }
        
        .professor-cell, .reviewer-cell {
          width: 12%;
          font-size: 8px;
          background-color: #F9FAFB;
          border-right: 2px solid #E5E7EB;
        }
        
        .status-cell {
          text-align: center;
          width: 8%;
          background-color: #F9FAFB;
          border-right: 2px solid #E5E7EB;
        }
        
        .date-cell {
          width: 8%;
          font-size: 7px;
          color: #6B7280;
          background-color: #F9FAFB;
          border-right: 2px solid #E5E7EB;
        }
        
        .exam-type-summary {
          font-weight: 600;
          color: #1F2937;
          width: 8%;
          font-size: 8px;
          text-align: center;
          background-color: #FEF3C7;
        }
        
        .score-cell {
          text-align: center;
          width: 6%;
        }
        
        .score-badge {
          display: inline-block;
          padding: 2px 4px;
          border-radius: 3px;
          font-weight: 600;
          font-size: 7px;
          min-width: 18px;
        }
        
        .status-badge {
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 7px;
          font-weight: 600;
        }
        
        .status-reviewed {
          background-color: #10B98120;
          color: #10B981;
          border: 1px solid #10B98140;
        }
        
        .status-pending {
          background-color: #F59E0B20;
          color: #F59E0B;
          border: 1px solid #F59E0B40;
        }
        
        .remarks-cell-summary {
          font-size: 7px;
          line-height: 1.3;
          max-width: 100px;
          word-wrap: break-word;
          width: 12%;
        }
        
        .legend {
          margin: 20px 0;
          padding: 15px;
          background-color: #F9FAFB;
          border-radius: 6px;
          border: 1px solid #E5E7EB;
        }
        
        .legend-title {
          font-weight: 600;
          color: #1F2937;
          margin-bottom: 10px;
          font-size: 12px;
        }
        
        .legend-item {
          display: inline-block;
          margin: 5px 15px 5px 0;
          font-size: 10px;
        }
        
        .legend-color {
          display: inline-block;
          width: 12px;
          height: 12px;
          border-radius: 2px;
          margin-right: 5px;
          vertical-align: middle;
        }
        
        .rating-info-summary {
          background-color: #EBF8FF;
          border: 1px solid #3B82F6;
          border-radius: 6px;
          padding: 10px;
          margin: 15px 0;
          text-align: center;
        }
        
        .rating-info-summary p {
          margin: 0;
          font-size: 11px;
          color: #1E40AF;
        }
      </style>
    `;
    };

    const totalReviews = reviewRequests.length;
    const reviewedCount = reviewRequests.filter(
        (r) => r.status.toLowerCase() === "reviewed"
    ).length;
    const pendingCount = totalReviews - reviewedCount;
    // const reviewsWithScores = reviewRequests.filter(
    //     (req) => calculateAverageScore(req.review) !== "N/A"
    // );
    // const avgOverallScore =
    //     reviewsWithScores.length > 0
    //         ? reviewsWithScores.reduce(
    //               (acc, req) =>
    //                   acc + parseFloat(calculateAverageScore(req.review)),
    //               0
    //           ) / reviewsWithScores.length
    //         : 0;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Course Reviews Summary</title>
      ${getSummaryStyles()}
    </head>
    <body>
      <div class="main-header">
        <div class="main-title">Course Reviews Summary Report</div>
        <div class="summary-info">Comprehensive overview of all course evaluations</div>
      </div>
      
      <div class="summary-stats">
        <div class="stat-item">
          <span class="stat-number">${totalReviews}</span>
          <span class="stat-label">Total Courses</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">${reviewedCount}</span>
          <span class="stat-label">Reviewed</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">${pendingCount}</span>
          <span class="stat-label">Pending</span>
        </div>
      </div>
      
      <div class="rating-info-summary">
        <p><strong>Rating Scale:</strong> 0-10 scale where <strong>10 = Best</strong> and <strong>0 = Worst</strong></p>
      </div>
      
      
      <table class="summary-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Course Details</th>
            <th>Faculty In Charge</th>
            <th>Reviewer</th>
            <th>Status</th>
            <th>Review Date</th>
            <th>Exam Type</th>
            <th>Paper Length</th>
            <th>Language & Clarity</th>
            <th>Solution Approach</th>
            <th>Learning Coverage</th>
            <th>Question Mix</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          ${generateDetailedSummaryTableRows(reviewRequests)}
        </tbody>
      </table>
      
      <div class="footer">
        <div class="generated-date">Generated on: ${new Date().toLocaleString()}</div>
      </div>
    </body>
    </html>
  `;

    const options = {
        format: "A4" as const,
        orientation: "landscape" as const,
        border: {
            top: "8mm",
            right: "8mm",
            bottom: "8mm",
            left: "8mm",
        },
    };

    try {
        const file = { content: htmlContent };
        const pdfBuffer = await (htmlPdf.generatePdf(
            file,
            options
        ) as unknown as Promise<Buffer>);
        return pdfBuffer;
    } catch (error) {
        console.error("Error generating summary PDF:", error);
        throw new Error("Failed to generate summary PDF");
    }
}

// Function to generate individual PDF for a single course
export async function generateSingleReviewPDF(
    reviewRequest: ReviewRequest
): Promise<Buffer> {
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Review - ${reviewRequest.courseCode}</title>
      ${getCommonStyles()}
    </head>
    <body>
      <div class="main-header">
        <div class="main-title">Question Paper Review Report</div>
        <div class="summary-info">${reviewRequest.courseName} (${reviewRequest.courseCode})</div>
      </div>
      
      ${generateReviewSection(reviewRequest)}
      
      <div class="footer">
        <div class="generated-date">Generated on: ${new Date().toLocaleString()}</div>
      </div>
    </body>
    </html>
  `;

    const options = {
        format: "A4" as const,
        border: {
            top: "10mm",
            right: "10mm",
            bottom: "10mm",
            left: "10mm",
        },
    };

    try {
        const file = { content: htmlContent };
        const pdfBuffer = await (htmlPdf.generatePdf(
            file,
            options
        ) as unknown as Promise<Buffer>);
        return pdfBuffer;
    } catch (error) {
        console.error(
            `Error generating single PDF for ${reviewRequest.courseCode}:`,
            error
        );
        throw new Error(
            `Failed to generate PDF for ${reviewRequest.courseCode}`
        );
    }
}

// Function to create zip with multiple individual PDFs + summary
export async function generateReviewsZip(
    reviewRequests: ReviewRequest[]
): Promise<Buffer> {
    const zip = new JSZip();

    // Generate summary PDF first
    try {
        const summaryPdfBuffer = await generateSummaryReviewPDF(reviewRequests);
        const timestamp = new Date().toISOString().split("T")[0];
        zip.file(`00-SUMMARY-All-Courses-${timestamp}.pdf`, summaryPdfBuffer);
    } catch (error) {
        console.error("Failed to generate summary PDF:", error);
        const errorContent = `Failed to generate summary PDF\n\nError: ${(error as Error).message}\n\nTimestamp: ${new Date().toISOString()}`;
        zip.file("ERROR-Summary.txt", errorContent);
    }

    // Generate individual PDFs for each course
    const promises = reviewRequests.map(async (request, index) => {
        try {
            const pdfBuffer = await generateSingleReviewPDF(request);
            const cleanCourseName = request.courseName.replace(
                /[^a-zA-Z0-9]/g,
                "_"
            );
            const filename = `${String(index + 1).padStart(2, "0")}-${request.courseCode}-${cleanCourseName}-Review.pdf`;

            zip.file(filename, pdfBuffer);
            return { success: true, courseCode: request.courseCode };
        } catch (error) {
            console.error(
                `Failed to generate PDF for ${request.courseCode}:`,
                error
            );

            // Add error file instead
            const errorContent = `Failed to generate review PDF for ${request.courseCode} - ${request.courseName}\n\nError: ${(error as Error).message}\n\nTimestamp: ${new Date().toISOString()}`;
            zip.file(`ERROR-${request.courseCode}.txt`, errorContent);
            return {
                success: false,
                courseCode: request.courseCode,
                error: (error as Error).message,
            };
        }
    });

    // Wait for all PDFs to be generated
    const results = await Promise.all(promises);

    // Log results
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    logger.debug(
        `QP review: PDF Generation Summary: ${successful} succeeded, ${failed} failed.`
    );

    // Generate the zip file
    try {
        const zipBuffer = await zip.generateAsync({
            type: "nodebuffer",
            compression: "DEFLATE",
            compressionOptions: { level: 6 },
        });

        return zipBuffer;
    } catch (error) {
        console.error("Error creating zip file:", error);
        throw new Error("Failed to create zip archive");
    }
}

// Keep the original function for backward compatibility
export async function generateMultipleReviewsPDF(
    reviewRequests: ReviewRequest[]
): Promise<Buffer> {
    // This generates a single PDF with all reviews
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Question Paper Reviews Report</title>
      ${getCommonStyles()}
    </head>
    <body>
      <div class="main-header">
        <div class="main-title">Question Paper Reviews Report</div>
        <div class="summary-info">Total Reviews: ${reviewRequests.length}</div>
      </div>
      
      ${reviewRequests.map((request) => generateReviewSection(request)).join("")}
      
      <div class="footer">
        <p>This comprehensive review report was generated automatically from the question paper evaluation system.</p>
        <p><strong>Confidential Document</strong> - For internal academic use only</p>
        <div class="generated-date">Generated on: ${new Date().toLocaleString()}</div>
      </div>
    </body>
    </html>
  `;

    const options = {
        format: "A4" as const,
        border: {
            top: "10mm",
            right: "10mm",
            bottom: "10mm",
            left: "10mm",
        },
    };

    try {
        const file = { content: htmlContent };
        const pdfBuffer = await (htmlPdf.generatePdf(
            file,
            options
        ) as unknown as Promise<Buffer>);
        return pdfBuffer;
    } catch (error) {
        console.error("Error generating multiple reviews PDF:", error);
        throw new Error("Failed to generate PDF report");
    }
}

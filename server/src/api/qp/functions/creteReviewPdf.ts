import htmlPdf from 'html-pdf-node';
import JSZip from 'jszip';

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
  if (!score || score.trim() === '') return '#6B7280'; // gray
  
  const numScore = parseInt(score);
  if (isNaN(numScore) || numScore > 10) return '#F59E0B'; // orange for invalid
  if (numScore >= 7) return '#10B981'; // green
  if (numScore >= 4) return '#F59E0B'; // yellow
  return '#EF4444'; // red
};

const formatScore = (score: string | undefined): string => {
  if (!score || score.trim() === '') return 'N/A';
  return score;
};

const formatRemarks = (remarks: string | undefined): string => {
  if (!remarks || remarks.trim() === '') return 'No remarks provided';
  return remarks.replace(/\n/g, '<br>');
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const generateTableRows = (review: ReviewData): string => {
  const sections = [
    { key: 'MidSem', label: 'Mid Semester Exam' },
    { key: 'Compre', label: 'Comprehensive Exam' },
    { key: 'Others', label: 'Other Evaluations' }
  ];

  return sections
    .filter(section => review[section.key as keyof ReviewData])
    .map(section => {
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
    .join('');
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
      <div class="review-header">
        <h2 class="review-title">${request.courseCode} - ${request.courseName}</h2>
      </div>

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
            <span class="detail-value status-${request.status}">${request.status}</span>
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
          <strong>Evaluated Sections:</strong> ${Object.keys(request.review).join(', ')}
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

// Function to generate individual PDF for a single course
export async function generateSingleReviewPDF(reviewRequest: ReviewRequest): Promise<Buffer> {
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
        <p>This review report was generated automatically from the question paper evaluation system.</p>
        <p><strong>Confidential Document</strong> - For internal academic use only</p>
        <div class="generated-date">Generated on: ${new Date().toLocaleString()}</div>
      </div>
    </body>
    </html>
  `;

  const options = {
    format: 'A4' as const,
    border: {
      top: '10mm',
      right: '10mm',
      bottom: '10mm',
      left: '10mm'
    }
  };

  try {
    const file = { content: htmlContent };
    const pdfBuffer = await htmlPdf.generatePdf(file, options);
    return pdfBuffer;
  } catch (error) {
    console.error(`Error generating single PDF for ${reviewRequest.courseCode}:`, error);
    throw new Error(`Failed to generate PDF for ${reviewRequest.courseCode}`);
  }
}

// Function to create zip with multiple individual PDFs
export async function generateReviewsZip(reviewRequests: ReviewRequest[]): Promise<Buffer> {
  const zip = new JSZip();
  
  // Generate individual PDFs for each course
  const promises = reviewRequests.map(async (request) => {
    try {
      console.log(`Generating PDF for ${request.courseCode}...`);
      
      const pdfBuffer = await generateSingleReviewPDF(request);
      const cleanCourseName = request.courseName.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `${request.courseCode}-${cleanCourseName}-Review.pdf`;
      
      zip.file(filename, pdfBuffer);
      return { success: true, courseCode: request.courseCode };
    } catch (error) {
      console.error(`Failed to generate PDF for ${request.courseCode}:`, error);
      
      // Add error file instead
      const errorContent = `Failed to generate review PDF for ${request.courseCode} - ${request.courseName}\n\nError: ${error.message}\n\nTimestamp: ${new Date().toISOString()}`;
      zip.file(`ERROR-${request.courseCode}.txt`, errorContent);
      return { success: false, courseCode: request.courseCode, error: error.message };
    }
  });

  // Wait for all PDFs to be generated
  const results = await Promise.all(promises);
  
  // Log results
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  console.log(`PDF Generation Results: ${successful} successful, ${failed} failed`);
  
  // Generate the zip file
  try {
    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });
    
    console.log(`ZIP file generated successfully. Size: ${zipBuffer.length} bytes`);
    return zipBuffer;
  } catch (error) {
    console.error('Error creating zip file:', error);
    throw new Error('Failed to create zip archive');
  }
}

// Keep the original function for backward compatibility
export async function generateMultipleReviewsPDF(reviewRequests: ReviewRequest[]): Promise<Buffer> {
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
      
      ${reviewRequests.map((request, index) => generateReviewSection(request)).join('')}
      
      <div class="footer">
        <p>This comprehensive review report was generated automatically from the question paper evaluation system.</p>
        <p><strong>Confidential Document</strong> - For internal academic use only</p>
        <div class="generated-date">Generated on: ${new Date().toLocaleString()}</div>
      </div>
    </body>
    </html>
  `;

  const options = {
    format: 'A4' as const,
    border: {
      top: '10mm',
      right: '10mm',
      bottom: '10mm',
      left: '10mm'
    }
  };

  try {
    const file = { content: htmlContent };
    const pdfBuffer = await htmlPdf.generatePdf(file, options);
    return pdfBuffer;
  } catch (error) {
    console.error('Error generating multiple reviews PDF:', error);
    throw new Error('Failed to generate PDF report');
  }
}

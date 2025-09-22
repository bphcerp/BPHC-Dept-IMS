import htmlPdf from 'html-pdf-node';

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

interface ReviewResponse {
  success: boolean;
  data: {
    courseName: string;
    courseCode: string;
    review: ReviewData;
    // Added FIC and reviewer details
    ficName?: string;
    ficEmail?: string;
    reviewerName?: string;
    reviewerEmail?: string;
    reviewDate?: string;
    semester?: string;
    academicYear?: string;
    requestId?: string;
  };
}

export async function generateReviewPDF(reviewData: ReviewResponse): Promise<Buffer> {
  // Helper function to get score color based on value
  const getScoreColor = (score: string | undefined): string => {
    if (!score || score.trim() === '') return '#6B7280'; // gray
    
    const numScore = parseInt(score);
    if (isNaN(numScore) || numScore > 10) return '#F59E0B'; // orange for invalid
    if (numScore >= 7) return '#10B981'; // green
    if (numScore >= 4) return '#F59E0B'; // yellow
    return '#EF4444'; // red
  };

  // Helper function to format score display
  const formatScore = (score: string | undefined): string => {
    if (!score || score.trim() === '') return 'N/A';
    return score;
  };

  // Helper function to format remarks
  const formatRemarks = (remarks: string | undefined): string => {
    if (!remarks || remarks.trim() === '') return 'No remarks provided';
    return remarks.replace(/\n/g, '<br>');
  };

  // Helper function to format date
  const formatDate = (dateString?: string): string => {
    if (!dateString) return new Date().toLocaleDateString();
    return new Date(dateString).toLocaleDateString();
  };

  // Generate table rows for available sections
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

  // HTML template for the PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Question Paper Review - ${reviewData.data.courseCode}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 20px;
          color: #1F2937;
          background-color: #ffffff;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding: 20px 0;
          border-bottom: 3px solid #3B82F6;
        }
        
        .title {
          font-size: 28px;
          font-weight: bold;
          color: #1E40AF;
          margin-bottom: 10px;
        }
        
        .course-info {
          font-size: 18px;
          color: #6B7280;
          margin-bottom: 5px;
        }
        
        .metadata-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin: 20px 0;
        }
        
        .metadata-box {
          background-color: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 15px;
        }
        
        .metadata-title {
          font-size: 14px;
          font-weight: 600;
          color: #1E40AF;
          margin-bottom: 10px;
          border-bottom: 1px solid #E2E8F0;
          padding-bottom: 5px;
        }
        
        .metadata-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 12px;
        }
        
        .metadata-label {
          font-weight: 600;
          color: #374151;
        }
        
        .metadata-value {
          color: #6B7280;
          text-align: right;
          max-width: 200px;
          word-wrap: break-word;
        }
        
        .rating-info {
          background-color: #EBF8FF;
          border: 1px solid #3B82F6;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
          text-align: center;
        }
        
        .rating-info p {
          margin: 0;
          font-size: 14px;
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
          font-size: 12px;
          color: #374151;
          border-bottom: 2px solid #E5E7EB;
        }
        
        td {
          padding: 12px 8px;
          border-bottom: 1px solid #E5E7EB;
          font-size: 11px;
        }
        
        tr:nth-child(even) {
          background-color: #F9FAFB;
        }
        
        tr:hover {
          background-color: #F3F4F6;
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
          font-size: 11px;
          min-width: 25px;
        }
        
        .remarks-cell {
          font-size: 10px;
          line-height: 1.4;
          max-width: 200px;
          word-wrap: break-word;
        }
        
        .signatures-section {
          margin-top: 40px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
        }
        
        .signature-box {
          text-align: center;
          border-top: 1px solid #D1D5DB;
          padding-top: 10px;
        }
        
        .signature-line {
          height: 40px;
          border-bottom: 1px solid #374151;
          margin-bottom: 10px;
        }
        
        .signature-title {
          font-weight: 600;
          font-size: 12px;
          color: #374151;
          margin-bottom: 5px;
        }
        
        .signature-details {
          font-size: 10px;
          color: #6B7280;
        }
        
        .footer {
          margin-top: 30px;
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
        
        .page-break {
          page-break-after: always;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">Question Paper Review Report</div>
        <div class="course-info">Course: ${reviewData.data.courseName} (${reviewData.data.courseCode})</div>
        ${reviewData.data.requestId ? `<div class="course-info">Request ID: ${reviewData.data.requestId}</div>` : ''}
      </div>
      
      <!-- Metadata Section -->
      <div class="metadata-section">
        <div class="metadata-box">
          <div class="metadata-title">Course Information</div>
          <div class="metadata-item">
            <span class="metadata-label">Course Name:</span>
            <span class="metadata-value">${reviewData.data.courseName}</span>
          </div>
          <div class="metadata-item">
            <span class="metadata-label">Course Code:</span>
            <span class="metadata-value">${reviewData.data.courseCode}</span>
          </div>
          ${reviewData.data.semester ? `
          <div class="metadata-item">
            <span class="metadata-label">Semester:</span>
            <span class="metadata-value">${reviewData.data.semester}</span>
          </div>
          ` : ''}
          ${reviewData.data.academicYear ? `
          <div class="metadata-item">
            <span class="metadata-label">Academic Year:</span>
            <span class="metadata-value">${reviewData.data.academicYear}</span>
          </div>
          ` : ''}
          <div class="metadata-item">
            <span class="metadata-label">Review Date:</span>
            <span class="metadata-value">${formatDate(reviewData.data.reviewDate)}</span>
          </div>
        </div>
        
        <div class="metadata-box">
          <div class="metadata-title">Personnel Information</div>
          ${reviewData.data.ficName ? `
          <div class="metadata-item">
            <span class="metadata-label">Faculty In Charge:</span>
            <span class="metadata-value">${reviewData.data.ficName}</span>
          </div>
          ` : ''}
          ${reviewData.data.ficEmail ? `
          <div class="metadata-item">
            <span class="metadata-label">FIC Email:</span>
            <span class="metadata-value">${reviewData.data.ficEmail}</span>
          </div>
          ` : ''}
          ${reviewData.data.reviewerName ? `
          <div class="metadata-item">
            <span class="metadata-label">Reviewer:</span>
            <span class="metadata-value">${reviewData.data.reviewerName}</span>
          </div>
          ` : ''}
          ${reviewData.data.reviewerEmail ? `
          <div class="metadata-item">
            <span class="metadata-label">Reviewer Email:</span>
            <span class="metadata-value">${reviewData.data.reviewerEmail}</span>
          </div>
          ` : ''}
        </div>
      </div>
      
      <div class="rating-info">
        <p><strong>Rating Scale:</strong> All scores are rated on a scale of 0-10, where <strong>10 represents the best</strong> and <strong>0 represents the worst</strong> performance.</p>
      </div>
      
      <div class="available-sections">
        <strong>Available Reviews:</strong> ${Object.keys(reviewData.data.review).join(', ')}
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
            ${generateTableRows(reviewData.data.review)}
          </tbody>
        </table>
      </div>
      
      <!-- Signatures Section -->
      <div class="signatures-section">
        <div class="signature-box">
          <div class="signature-line"></div>
          <div class="signature-title">Faculty In Charge</div>
          <div class="signature-details">
            ${reviewData.data.ficName || 'Name: ____________________'}<br>
            ${reviewData.data.ficEmail || 'Email: ____________________'}<br>
            Date: ____________________
          </div>
        </div>
        
        <div class="signature-box">
          <div class="signature-line"></div>
          <div class="signature-title">Reviewer</div>
          <div class="signature-details">
            ${reviewData.data.reviewerName || 'Name: ____________________'}<br>
            ${reviewData.data.reviewerEmail || 'Email: ____________________'}<br>
            Date: ____________________
          </div>
        </div>
      </div>
      
      <div class="footer">
        <p>This review report was generated automatically from the question paper evaluation system.</p>
        <p><strong>Confidential Document</strong> - For internal academic use only</p>
        <div class="generated-date">Generated on: ${new Date().toLocaleString()}</div>
      </div>
    </body>
    </html>
  `;

  // PDF generation options
  const options = {
    format: 'A4' as const,
    border: {
      top: '10mm',
      right: '10mm',
      bottom: '10mm',
      left: '10mm'
    },
    header: {
      height: '20mm',
    },
    footer: {
      height: '15mm',
    }
  };

  // Generate PDF
  try {
    const file = { content: htmlContent };
    const pdfBuffer = await htmlPdf.generatePdf(file, options);
    return pdfBuffer;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF report');
  }
}

// Updated usage example for Express route with additional metadata
export async function handlePDFGeneration(req: any, res: any) {
  try {
    // Enhanced reviewData with FIC and reviewer details
    const reviewData: ReviewResponse = {
      success: true,
      data: {
        ...req.body.data, // Original review data
        // Additional metadata that you can fetch from your database
        ficName: req.body.ficName || 'Dr. John Smith',
        ficEmail: req.body.ficEmail || 'john.smith@university.edu',
        reviewerName: req.body.reviewerName || 'Prof. Jane Doe',
        reviewerEmail: req.body.reviewerEmail || 'jane.doe@university.edu',
        reviewDate: req.body.reviewDate || new Date().toISOString(),
        semester: req.body.semester || 'Fall 2025',
        academicYear: req.body.academicYear || '2025-26',
        requestId: req.body.requestId || req.params.id
      }
    };
    
    const pdfBuffer = await generateReviewPDF(reviewData);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="review-${reviewData.data.courseCode}-${Date.now()}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF generation failed:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
}

export const allPermissions = {
    "*": "All permissions",
    "admin:member:create": "Create operations on members",
    "admin:member:read": "Read operations on members",
    "admin:member:update": "Update operations on members",
    "admin:member:delete": "Delete operations on members",
    "admin:role:create": "Create operations on roles",
    "admin:role:read": "Read operations on roles",
    "admin:role:update": "Update operations on roles",
    "admin:role:delete": "Delete operations on roles",
    "admin:tester": "Allows user to enter testing mode",

    "conference:application:create": "Create operations on applications",
    "conference:application:submitted": "View submitted applications",
    "conference:application:view-pending": "View pending applications",
    "conference:application:review-application-member":
        "Review application as DRC Member",
    "conference:application:review-application-convener":
        "Review application as DRC convener",
    "conference:application:review-application-hod":
        "Review application as HOD",
    "conference:application:get-flow":
        "Get conference application approval flow",
    "conference:application:set-flow":
        "Set conference application approval flow",

    // PhD

    "phd:staff:manage-semesters": "Manage PhD semesters",
    "phd:staff:manage-qe": "Manage PhD qualifying exams",
    "phd:staff:manage-subareas": "Manage PhD subareas",
    "phd:staff:manage-email-templates":
        "Manage PhD email notification templates",

    "phd:student:qe": "PhD scholar qualifying exams",

    "phd:drc:qe": "DRC Member operations on qualifying exams",
    "phd:supervisor:suggest-examiners":
        "Suggest examiners for qualifying exams",
    "phd:drc:qe-timetable": "Manage PhD qualifying exam timetables",
    "phd:student:proposal": "PhD scholar proposal operations",
    "phd:drc:proposal": "DRC Convener operations on proposals",
    "phd:faculty:proposal": "Faculty operations on proposals",
    "phd:dac:proposal": "DAC Member operations on proposals",
    "phd:proposal": "Common proposal for dac, drc, student, faculty",

    // phd requests
    "phd-request:supervisor:create": "Create a new PhD request for a student",
    "phd-request:supervisor:view": "View PhD requests for their students",
    "phd-request:student:submit-final-thesis":
        "Allow student to submit final thesis documents",
    "phd-request:drc-convener:view": "View all PhD requests for review",
    "phd-request:drc-convener:review": "Review and assign PhD requests",
    "phd-request:drc-member:view": "View assigned PhD requests",
    "phd-request:drc-member:review":
        "Submit review for an assigned PhD request",
    "phd-request:hod:view": "View PhD requests for final approval",
    "phd-request:hod:review": "Submit final approval for a PhD request",
    "phd-request:staff:view": "View all PhD requests",
    "phd-request:common": "View PhD request details",
    //meeting
    "meeting:use": "Access and use the meeting module",

    //handout
    "handout:faculty:submit": "Submit handout for review",
    "handout:dca-convenor:assignreviewer":
        "Assign reviewer to handout as DCA convenor",
    "handout:faculty:get-all-handouts": "View all handouts as faculty member",
    "handout:dca:get-all-handouts": "View all handouts as DCA member",
    "handout:dca:review": "Review handouts as DCA member",
    "handout:get": "View handout details",
    "handout:dca-convenor:get-all": "View all handouts as DCA convenor",
    "handout:dca-convenor:final-decision":
        "Make final decision on handout as DCA convenor",
    "handout:dca-convenor:reminder":
        "Send reminder notifications as DCA convenor",
    "handout:dca-convenor:get-all-dcamember":
        "View all DCA members as DCA convenor",
    "handout:dca-convenor:update-reviewer":
        "Update handout reviewer as DCA convenor",
    "handout:dca-convenor:update-ic":
        "Update in-charge details as DCA convenor",
    "handout:dca-convenor:export-summary":
        "Export handout summary as DCA convenor",
    "handout:dca-convenor:get-all-faculty":
        "View all faculty members as DCA convenor",

    "publications:view": "View author's own publications",
    "publications:all": "View all publications",
    "publications:export": "Export Publications",
    "publications:upload": "Upload Researgence Data",

    "inventory:write": "Admin can edit the data of the inventory module",
    "inventory:read":
        "Non-Admin users can view the data of the inventory module",
    "inventory:export": "Export the data as an Excel file",
    "inventory:stats-lab-year": "Member can view stats per laboratory per year",
    "inventory:stats-lab-category":
        "Member can view stats per laboratory per category",
    "inventory:stats-vendor-year": "Member can view stats per vendor per year",
    // Project module permissions
    "project:create": "Create a new project",
    "project:view": "View list of projects",
    "project:view-all": "View all projects (admin)",
    "project:edit-all": "Edit all projects (admin)",
    "project:bulk-upload": "Bulk upload projects",
    "project:view-details": "View project details",

    // Patent module permissions
    "patent:create": "Create a new patent",
    "patent:view": "View list of patents",
    "patent:view-all": "View all patents (admin)",
    "patent:edit-all": "Edit all patents (admin)",
    "patent:bulk-upload": "Bulk upload patents",
    "patent:view-details": "View patent details",

    // WILP Project module permissions
    "wilp:project:upload": "Upload multiple WILP projects",
    "wilp:project:clear": "Clear all WILP projects",
    "wilp:project:download": "Download all WILP projects data",
    "wilp:project:view-all": "View all WILP projects",
    "wilp:project:view-selected": "View faculty's selected WILP projects",
    "wilp:project:view-details": "View a WILP project details",
    "wilp:project:select": "Select few WILP projects",
    "wilp:project:deselect": "Remove selected WILP projects",
    "wilp:project:mail": "Send mass mails to faculty",
    "wilp:project:stats": "View all WILP project statistics",

    // Grade Management module permissions
    "grades:upload": "Upload Excel files for grade management",
    "grades:manage": "Manage and input student grades",
    "grades:export": "Export graded Excel files",
    "grades:supervisor:view": "Supervisors can view their students and grades",
    "grades:supervisor:save": "Supervisors can save/update student grades",
    "grades:supervisor:upload-doc": "Supervisors can upload midsem documents",
    "phd:examiner:qe": "View and respond to examiner assignments",

    // ANALYTICS
    "analytics:publications": "View publications analytics",

    // qp review module permissions
    "qp:faculty:submit": "Submit paper for review",
    "qp:dca-convenor:assignreviewer":
        "Assign reviewer to handout as DCA convenor",
    "qp:faculty:get-all-handouts": "View all handouts as faculty member",
    "qp:dca:get-all-handouts": "View all handouts as DCA member",
    "qp:faculty:review": "Review handouts as reviewer",
    "qp:get:review": "view review details",
    "qp:fic:get-all": "View question paper requests as FIC member",
    "qp:dca-convenor:reminder": "Send reminder notifications as DCA convenor",
    "qp:dca-convenor:update-reviewer":
        "Update handout reviewer as DCA convenor",
    "qp:dca-convenor:update-ic": "Update in-charge details as DCA convenor",
    "qp:dca-convenor:download-review":
        "Download review of papers as DCA convenor",
    "qp:dca-convenor:get-all-faculty":
        "View all faculty members as DCA convenor",
    "qp:faculty:get-files": "Get files uploaded for a request",
    "qp:dca:create-request": "Create a new question paper review request",
    "qp:dca:get-all-requests": "Get all requests",
    "qp:dca:get-all-courses": "Get all courses",

    // Course Load Allocation module permissions
    "allocation:settings:start": "Start a new course load allocation",
    "allocation:settings:end": "End the current course load allocation",

    "allocation:courses:write": "Create or Modify a new course",
    "allocation:courses:mark": "Mark Courses For Allocation",
    "allocation:courses:view": "View all existing courses",
    "allocation:courses:sync": "Sync all courses of the department from TTD",

    "allocation:write": "Have read and write access to the allocation module",
    "allocation:view": "Have readonly access to the allocation module",

    "allocation:preference:write":
        "Create or Modify a new form for allocation data retrieval",
    "allocation:form:publish": "Publish a form for allocation data retrieval",
    "allocation:form:close": "Close a form for allocation data retrieval",
    "allocation:form:view": "View allocation data retrieval form",

    "allocation:data:export": "Export allocation data",

    "allocation:semesters:view": "View the semester details",
    "allocation:semesters:write": "Create or Modify a semester",

    "allocation:builder:template:write": "Create a form template",
    "allocation:builder:template:view": "View form template details",

    "allocation:builder:form:write": "Create a form instance of a template",
    "allocation:builder:form:view": "View form details",
    "allocation:form:response:submit": "Can submit responses to forms",
    "allocation:form:response:view": "Can view responses to forms",
} as const;

export const permissions: { [key: string]: keyof typeof allPermissions } = {
    // Admin

    "/admin/member/invite": "admin:member:create",
    "/admin/member/search": "admin:member:read",
    "/admin/member/details": "admin:member:read",
    "/admin/member/editdetails": "admin:member:update",
    "/admin/member/profile-image": "admin:member:update",
    "/admin/member/editroles": "admin:member:update",
    "/admin/member/deactivate": "admin:member:update",
    "/admin/member/delete": "admin:member:delete",

    "/admin/role/create": "admin:role:create",
    "/admin/role": "admin:role:read",
    "/admin/role/edit": "admin:role:update",
    "/admin/role/rename": "admin:role:update",
    "/admin/role/delete": "admin:role:delete",

    "/admin/permission/all": "admin:role:read",

    "/admin/testing": "admin:tester",

    "/admin/member/getAllFaculty": "admin:member:read",
    "/admin/member/getAllStaff": "admin:member:read",
    "/admin/member/getAllPhD": "admin:member:read",

    // Conference

    "/conference/createApplication": "conference:application:create",
    "/conference/editApplication": "conference:application:submitted",
    "/conference/applications/pending": "conference:application:view-pending",
    "/conference/applications/my": "conference:application:submitted",
    "/conference/applications/view": "conference:application:submitted",
    "/conference/applications/reviewMember":
        "conference:application:review-application-member",
    "/conference/applications/reviewConvener":
        "conference:application:review-application-convener",
    "/conference/applications/reviewHod":
        "conference:application:review-application-hod",
    "/conference/getFlow": "conference:application:get-flow",
    "/conference/setFlow": "conference:application:set-flow",

    // PhD
    "/phd/staff/getAllSem": "phd:staff:manage-semesters",
    "/phd/staff/updateSem": "phd:staff:manage-semesters",
    "/phd/staff/getLatestSem": "phd:staff:manage-semesters",

    "/phd/staff/qualifyingExams": "phd:staff:manage-qe",
    "/phd/staff/updateQualifyingExam": "phd:staff:manage-qe",
    "/phd/staff/notifyDeadline": "phd:staff:manage-qe",

    "/phd/staff/insertSubArea": "phd:staff:manage-subareas",
    "/phd/staff/deleteSubArea": "phd:staff:manage-subareas",

    "/phd/staff/emailTemplates": "phd:staff:manage-email-templates",
    "/phd/staff/getLatestProposalSem": "phd:staff:manage-email-templates",
    "/phd/staff/proposalDeadlines": "phd:staff:manage-email-templates",
    "/phd/staff/notifyProposalDeadline": "phd:staff:manage-email-templates",
    "/phd/staff/updateProposalDeadline": "phd:staff:manage-email-templates",
    "/phd/proposal/getProposalSemesters": "phd:proposal",
    "/phd/proposal/getFacultyList": "phd:proposal",

    "/phd/student/getQualifyingExams": "phd:student:qe",
    "/phd/student/uploadQeApplicationForm": "phd:student:qe",
    "/phd/student/getQualifyingExamStatus": "phd:student:qe",
    "/phd/student/finalSubmitQeApplication": "phd:student:qe",
    "/phd/student/getProposalEligibility": "phd:student:proposal",
    "/phd/student/getProposalDeadlines": "phd:student:proposal",
    "/phd/student/getProfileDetails": "phd:student:proposal",

    "/phd/drcMember/getAvailableExams": "phd:drc:qe",
    "/phd/drcMember/updateApplicationStatus": "phd:drc:qe",
    "/phd/drcMember/getQualifyingExamApplications": "phd:drc:qe",
    "/phd/drcMember/getVerifiedApplications": "phd:drc:qe",
    "/phd/drcMember/generateForms": "phd:drc:qe",
    "/phd/drcMember/requestExaminerSuggestions": "phd:drc:qe",
    "/phd/drcMember/assignExaminers": "phd:drc:qe",
    "/phd/drcMember/notifyExaminers": "phd:drc:qe",
    "/phd/drcMember/updateExaminerCount": "phd:drc:qe",
    "/phd/drcMember/setQualificationDate": "phd:drc:qe",
    "/phd/drcMember/submitResult": "phd:drc:qe",
    "/phd/drcMember/updateQpSubmissionStatus": "phd:drc:qe",
    "/phd/drcMember/notifyExaminer": "phd:drc:qe",

    "/phd/drcMember/timetable": "phd:drc:qe-timetable",
    "/phd/drcMember/optimizeTimetable": "phd:drc:qe-timetable",
    "/phd/drcMember/generateTimetablePdf": "phd:drc:qe-timetable",

    "/phd/examiner/assignments": "phd:examiner:qe",
    "/phd/examiner/acceptAssignment": "phd:examiner:qe",
    "/phd/examiner/rejectAssignment": "phd:examiner:qe",

    "/phd/proposal/drcConvener/getProposals": "phd:drc:proposal",
    "/phd/proposal/drcConvener/viewProposal": "phd:drc:proposal",
    "/phd/proposal/drcConvener/sendToDac": "phd:drc:proposal",
    "/phd/proposal/drcConvener/finalizeDac": "phd:drc:proposal",
    "/phd/proposal/dacMember/getProposals": "phd:dac:proposal",
    "/phd/proposal/dacMember/viewProposal": "phd:dac:proposal",
    "/phd/proposal/dacMember/submitReview": "phd:dac:proposal",
    "/phd/supervisor/suggestExaminers": "phd:supervisor:suggest-examiners",
    "/phd/supervisor/getApplicationsForSuggestion":
        "phd:supervisor:suggest-examiners",
    "/phd/supervisor/getFacultyList": "phd:supervisor:suggest-examiners",

    "/phd/proposal/student/getProposals": "phd:student:proposal",
    "/phd/proposal/student/resubmit": "phd:student:proposal",
    "/phd/proposal/student/submitProposal": "phd:student:proposal",
    "/phd/proposal/student/view": "phd:student:proposal",

    "/phd/proposal/supervisor/getProposals": "phd:faculty:proposal",
    "/phd/proposal/supervisor/viewProposal": "phd:faculty:proposal",
    "/phd/proposal/supervisor/updateCoSupervisors": "phd:faculty:proposal",
    "/phd/proposal/supervisor/updateDacMembers": "phd:faculty:proposal",
    "/phd/proposal/supervisor/approveAndSign": "phd:faculty:proposal",
    "/phd/proposal/supervisor/reviewProposal": "phd:faculty:proposal",
    "/phd/proposal/supervisor/setSeminarDetails": "phd:faculty:proposal",
    "/phd/proposal/supervisor/getAvailableSlots": "phd:faculty:proposal",

    "/phd/proposal/coSupervisor/getProposals": "phd:faculty:proposal",
    "/phd/proposal/coSupervisor/viewProposal": "phd:faculty:proposal",
    "/phd/proposal/coSupervisor/approve": "phd:faculty:proposal",

    "/phd/proposal/drcConvener/finalizeProposals": "phd:drc:proposal",
    "/phd/proposal/drcConvener/downloadProposalPackage": "phd:drc:proposal",
    "/phd/proposal/drcConvener/reviewProposal": "phd:drc:proposal",
    "/phd/proposal/drcConvener/setSeminarDetails": "phd:drc:proposal",
    "/phd/proposal/drcConvener/downloadProposalNotice": "phd:drc:proposal",
    "/phd/proposal/drcConvener/remindSeminarDetails": "phd:drc:proposal",
    "/phd/proposal/drcConvener/requestSeminarDetails": "phd:drc:proposal",
    "/phd/proposal/drcConvener/seminarSlots": "phd:drc:proposal",

    // PhD Requests
    "/phd-request/supervisor/create": "phd-request:supervisor:create",
    "/phd-request/supervisor/resubmit": "phd-request:supervisor:create",
    "/phd-request/supervisor/my-students": "phd-request:supervisor:view",
    "/phd-request/supervisor/review-final-thesis":
        "phd-request:supervisor:view",

    "/phd-request/student/submit-final-thesis":
        "phd-request:student:submit-final-thesis",

    "/phd-request/drc-convener/requests": "phd-request:drc-convener:view",
    "/phd-request/drc-convener/review": "phd-request:drc-convener:review",

    "/phd-request/drc-member/requests": "phd-request:drc-member:view",
    "/phd-request/drc-member/review": "phd-request:drc-member:review",

    "/phd-request/hod/requests": "phd-request:hod:view",
    "/phd-request/hod/review": "phd-request:hod:review",

    "/phd-request/staff/getAllRequests": "phd-request:staff:view",

    "/phd-request/details": "phd-request:common",
    "/phd-request/history": "phd-request:common",
    "/phd-request/download-packages": "phd-request:common",

    //meeting
    "/meeting/create": "meeting:use",
    "/meeting/all": "meeting:use",
    "/meeting/details": "meeting:use",
    "/meeting/respond": "meeting:use",
    "/meeting/finalize": "meeting:use",
    "/meeting/all-users": "meeting:use",
    "/meeting/add-invitees": "meeting:use",
    "/meeting/remind": "meeting:use",
    "/meeting/delete": "meeting:use",
    "/meeting/update-details": "meeting:use",

    //Handout
    "/handout/faculty/submit": "handout:faculty:submit",
    "/handout/dca/assignReviewer": "handout:dca-convenor:assignreviewer",
    "/handout/faculty/get": "handout:faculty:get-all-handouts",
    "/handout/dca/get": "handout:dca:get-all-handouts",
    "/handout/dca/review": "handout:dca:review",
    "/handout/get": "handout:get",
    "/handout/dcaconvenor/get": "handout:dca-convenor:get-all",
    "/handout/dcaconvenor/finalDecision": "handout:dca-convenor:final-decision",
    "/handout/dcaconvenor/reminder": "handout:dca-convenor:reminder",
    "/handout/dcaconvenor/getAllDCAMember":
        "handout:dca-convenor:get-all-dcamember",
    "/handout/dcaconvenor/updateReviewer":
        "handout:dca-convenor:update-reviewer",
    "/handout/dcaconvenor/updateIC": "handout:dca-convenor:update-ic",
    "/handout/dcaconvenor/exportSummary": "handout:dca-convenor:export-summary",

    "/handout/dcaconvenor/getAllFaculty":
        "handout:dca-convenor:get-all-faculty",

    "/publications/id": "publications:view",
    "/publications/user": "publications:view",
    "/publications/all": "publications:all",
    "/publications/updateStatus": "publications:view",
    "/publications/updatePublications": "publications:all",
    "/publications/edit": "publications:all",
    "/publications/export": "publications:export",
    "/publications/upload": "publications:upload",

    // Inventory
    "/inventory/labs/get": "inventory:read",
    "/inventory/labs/lastItemNumber": "inventory:read",
    "/inventory/labs/create": "inventory:write",
    "/inventory/labs/update": "inventory:write",
    "/inventory/labs/delete": "inventory:write",

    "/inventory/vendors/get": "inventory:read",
    "/inventory/vendors/create": "inventory:write",
    "/inventory/vendors/update": "inventory:write",
    "/inventory/vendors/delete": "inventory:write",

    "/inventory/categories/get": "inventory:read",
    "/inventory/categories/create": "inventory:write",
    "/inventory/categories/update": "inventory:write",
    "/inventory/categories/delete": "inventory:write",

    "/inventory/items/get": "inventory:read",
    "/inventory/items/export": "inventory:export",
    "/inventory/items/create": "inventory:write",
    "/inventory/items/excel": "inventory:write",
    "/inventory/items/update": "inventory:write",
    "/inventory/items/delete": "inventory:write",

    "/inventory/stats/lab-year": "inventory:stats-lab-year",
    "/inventory/stats/lab-category": "inventory:stats-lab-category",
    "/inventory/stats/vendor-year": "inventory:stats-vendor-year",
    "/inventory/stats/important-dates": "inventory:read",

    // Project
    "/project/create": "project:create",
    "/project/bulkUpload": "project:bulk-upload",
    "/project/list": "project:view",
    "/project/list-all": "project:view-all",
    "/project/edit-all": "project:edit-all",
    "/project": "project:view-details",

    // Patent
    "/patent/create": "patent:create",
    "/patent/bulkUpload": "patent:bulk-upload",
    "/patent/list": "patent:view",
    "/patent/list-all": "patent:view-all",
    "/patent/edit-all": "patent:edit-all",
    "/patent": "patent:view-details",

    // WILP Project
    "/wilpProject/upload": "wilp:project:upload",
    "/wilpProject/setRange": "wilp:project:upload",
    "/wilpProject/clear": "wilp:project:clear",
    "/wilpProject/download": "wilp:project:download",
    "/wilpProject/view/all": "wilp:project:view-all",
    "/wilpProject/view/selected": "wilp:project:view-selected",
    "/wilpProject/view": "wilp:project:view-details",
    "/wilpProject/select": "wilp:project:select",
    "/wilpProject/deselect": "wilp:project:deselect",
    "/wilpProject/mail": "wilp:project:mail",
    "/wilpProject/stats": "wilp:project:stats",

    // Grade Management
    "/grades/upload": "grades:upload",
    "/grades/manage": "grades:manage",
    "/grades/export": "grades:export",
    "/grades/supervisor": "grades:supervisor:view",
    "/grades/supervisor/save": "grades:supervisor:save",
    "/grades/supervisor/uploadDoc": "grades:supervisor:upload-doc",

    // Analytics
    "/analytics/publications": "analytics:publications",

    // qp review module
    "/qp/uploadDocuments": "qp:faculty:submit",
    "/qp/getFilesByRequestID": "qp:faculty:get-files",
    "/qp/submitReview": "qp:faculty:review",
    "/qp/saveReview": "qp:faculty:review",
    "/qp/assignFaculty": "qp:dca-convenor:assignreviewer",
    "/qp/createRequest": "qp:dca:create-request",
    "/qp/getAllFICSubmissions": "qp:fic:get-all",
    "/qp/getAllDcaMemberRequests": "qp:fic:get-all",
    "/qp/getReviews": "qp:get:review",
    "/qp/getAllCourses": "qp:dca:get-all-requests",
    "/qp/updateIc": "qp:dca-convenor:update-ic",
    "/qp/updateFaculty": "qp:dca-convenor:update-reviewer",
    "/qp/sendReminders": "qp:dca-convenor:reminder",
    "/qp/downloadReviewPdf": "qp:dca-convenor:download-review",

    // Course Load Allocation
    "/allocation/allocation/delete": "allocation:write",
    "/allocation/allocation/update": "allocation:write",
    "/allocation/allocation/getStatus": "allocation:write",


    "/allocation/course/get": "allocation:courses:view",
    "/allocation/course/getAll": "allocation:courses:view",
    "/allocation/course/create": "allocation:courses:write",
    "/allocation/course/mark": "allocation:courses:mark",
    "/allocation/course/delete": "allocation:courses:write",
    "/allocation/course/sync": "allocation:courses:sync",
    "/allocation/course/update": "allocation:courses:write",

    "/allocation/semester/create": "allocation:semesters:write",
    "/allocation/semester/get": "allocation:semesters:view",
    "/allocation/semester/getLatest": "allocation:semesters:view",
    "/allocation/semester/delete": "allocation:semesters:write",
    "/allocation/semester/update": "allocation:semesters:write",
    "/allocation/semester/linkForm": "allocation:semesters:write",

    "/allocation/allocation/getPrefsCourse": "allocation:write",
    "/allocation/allocation/create": "allocation:write",

    "/allocation/builder/template/create": "allocation:builder:template:write",
    "/allocation/builder/template/get": "allocation:builder:template:view",
    "/allocation/builder/template/getAll": "allocation:builder:template:view",

    "/allocation/builder/form/create": "allocation:builder:form:write",
    "/allocation/builder/form/get": "allocation:builder:form:view",
    "/allocation/builder/form/getAll": "allocation:builder:form:view",

    "/allocation/builder/form/response/register":
        "allocation:form:response:submit",
    "/allocation/builder/form/response/view": "allocation:form:response:view",
    "/allocation/builder/form/response/get": "allocation:form:response:view",
} as const;

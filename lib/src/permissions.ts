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

    "phd:staff:manage-semesters": "Staff can create and update academic semesters",
  "phd:staff:manage-events": "Staff can create and manage all exam events",
  "phd:staff:manage-sub-areas": "Staff can create and manage QE sub-areas",

  "phd:student:view-dashboard": "Student can view their PhD dashboard, profile, and statuses",
  "phd:student:apply-for-qe": "Student can apply for a qualifying exam and view their applications",
  "phd:student:submit-proposal": "Student can submit their thesis proposal",

  "phd:supervisor:view-students": "Supervisor can view their supervised students",
  "phd:supervisor:suggest-dac": "Supervisor can suggest DAC members for their student",
  "phd:supervisor:review-proposal": "Supervisor can review and act on a proposal",
  "phd:supervisor:suggest-examiners": "Supervisor can suggest QE examiners",

  "phd:co-supervisor:view-students": "Co-Supervisor can view their co-supervised students",

  "phd:drc:view-applications": "DRC can view all applications for an exam event",
  "phd:drc:download-applications": "DRC can download all application documents as a ZIP",
  "phd:drc:manage-applications": "DRC can update the status of an application (e.g., reject)",
  "phd:drc:manage-suggestions": "DRC can request and monitor examiner suggestions from supervisors",
  "phd:drc:assign-examiners": "DRC can view suggestions, assign final examiners, and generate timetables",
  "phd:drc:manage-results": "DRC can input and finalize exam results",
  "phd:drc:update-qualification-dates": "DRC can update PhD qualification dates",
  "phd:drc:assign-dac": "DRC can view suggestions and assign final DAC members to students",
  "phd:drc:generate-forms": "DRC can generate official PhD forms (coursework, intimation)",

  "phd:notional-supervisor:manage-courses": "Notional Supervisor can manage coursework and grades",

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

    // --- Staff Routes ---
  "/phd/staff/semesters": "phd:staff:manage-semesters",
  "/phd/staff/exam-events": "phd:staff:manage-events",
  "/phd/staff/sub-areas": "phd:staff:manage-sub-areas",

  // --- Student Routes ---
  "/phd/student/active-qualifying-exam": "phd:student:view-dashboard",
  "/phd/student/applications": "phd:student:apply-for-qe",
  "/phd/student/uploadProposalDocuments": "phd:student:submit-proposal",
  "/phd/student/getProfileDetails": "phd:student:view-dashboard",
  "/phd/student/getQualifyingExamStatus": "phd:student:view-dashboard",
  "/phd/student/getProposalDeadline": "phd:student:view-dashboard",
  "/phd/student/getGradeStatus": "phd:student:view-dashboard",
  "/phd/student/getQualifyingExamPassingDate": "phd:student:view-dashboard",
  "/phd/student/getProposalStatus": "phd:student:view-dashboard",
  "/phd/student/getSubAreas": "phd:student:apply-for-qe",

  // --- Supervisor Routes ---
  "/phd/supervisor/getSupervisedStudents": "phd:supervisor:view-students",
  "/phd/supervisor/suggestDacMembers": "phd:supervisor:suggest-dac",
  "/phd/supervisor/reviewProposalDocument": "phd:supervisor:review-proposal",
  "/phd/supervisor/suggestions": "phd:supervisor:suggest-examiners",
  "/phd/supervisor/pending-suggestions": "phd:supervisor:suggest-examiners",
  "/phd/supervisor/getStudents": "phd:supervisor:view-students",
  "/phd/supervisor/getSubAreas": "phd:supervisor:suggest-examiners",

  // --- Co-Supervisor Routes ---
  "/phd/coSupervisor/getCoSupervisedStudents": "phd:co-supervisor:view-students",

  // --- DRC Member Routes ---
  "/phd/drcMember/exam-events/applications": "phd:drc:view-applications",
  "/phd/drcMember/exam-events/applications/zip": "phd:drc:download-applications",
  "/phd/drcMember/applications/status": "phd:drc:manage-applications",
  "/phd/drcMember/exam-events/suggestion-status": "phd:drc:manage-suggestions",
  "/phd/drcMember/exam-events/request-suggestions": "phd:drc:manage-suggestions",
  "/phd/drcMember/suggestion-requests/remind": "phd:drc:manage-suggestions",
  "/phd/drcMember/exam-events/suggestions": "phd:drc:assign-examiners",
  "/phd/drcMember/exam-events/schedule": "phd:drc:assign-examiners",
  "/phd/drcMember/applications/results": "phd:drc:manage-results",
  "/phd/drcMember/getSuggestedDacMember": "phd:drc:assign-dac",
  "/phd/drcMember/suggestTwoBestDacMember": "phd:drc:assign-dac",
  "/phd/drcMember/updateFinalDac": "phd:drc:assign-dac",
  "/phd/drcMember/updatePassingDatesOfPhd": "phd:drc:update-qualification-dates",
  "/phd/drcMember/generateCourseworkForm": "phd:drc:generate-forms",
  "/phd/drcMember/exam-events/intimation-data": "phd:drc:generate-forms",
  "/phd/drcMember/exam-events/supervisors": "phd:drc:view-applications",
  "/phd/drcMember/notifySupervisor": "phd:drc:manage-suggestions",

  // --- Notional Supervisor Routes ---
  "/phd/notionalSupervisor/getPhd": "phd:notional-supervisor:manage-courses",
  "/phd/notionalSupervisor/updateCourseDetails": "phd:notional-supervisor:manage-courses",
  "/phd/notionalSupervisor/updateCourseGrade": "phd:notional-supervisor:manage-courses",
  "/phd/notionalSupervisor/getPhdCourseDetails": "phd:notional-supervisor:manage-courses",
  "/phd/notionalSupervisor/addCourse": "phd:notional-supervisor:manage-courses",
  "/phd/notionalSupervisor/deleteCourseDetails": "phd:notional-supervisor:manage-courses",

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
} as const;

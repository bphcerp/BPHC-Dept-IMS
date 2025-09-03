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

    "phd:drc-member:generate-coursework-form": "",
    "phd:drc-member:get-phd-to-generate-qualifying-exam-form": "",
    "phd:drc-member:update-passing-dates-of-phd": "",
    "phd:drc-member:get-phd-data-of-who-filled-application-form": "",
    "phd:drc-member:get-suggested-dac-member": "",
    "phd:drc-member:update-final-dac": "",
    "phd:drc-member:suggest-two-best-dac-member": "",
    "phd:drc-member:update-qualifying-exam-results-of-all-students": "",
    "phd:drc-member:get-phd-exam-status": "",
    "phd:drc-member:get-qualification-dates": "",
    "phd:drc-member:get-dates-of-qe-exam": "",
    "phd:drc-member:update-examiner": "",
    "phd:drc-member:notify-supervisor": "",
    "phd:drc-member:get-subarea-and-examiner": "",
    "phd:drc-member:get-supervisor-with-student": "",
    "phd:drc-member:get-qe-time-table": "",
    "phd:drc-member:get-phs-qe-appliaction-forms-as-zip": "",

    "phd:notifs:send": "",

    "phd:notional-supervisor:get-phd": "",
    "phd:notional-supervisor:update-course-details": "",
    "phd:notional-supervisor:update-course-grade": "",
    "phd:notional-supervisor:get-phd-course-details": "",
    "phd:notional-supervisor:add-course": "",
    "phd:notional-supervisor:delete-course-details": "",

    "phd:student:check-exam-status": "",
    "phd:student:get-proposal-deadline": "",
    "phd:student:get-qualifying-exam-deadline": "",
    "phd:student:upload-qe-application-form": "",
    "phd:student:upload-proposal-document": "",
    "phd:student:get-qualifying-exam-status": "",
    "phd:student:get-qualifying-exam-passing-date": "",
    "phd:student:get-proposal-status": "",
    "phd:student:get-qe-application": "",
    "phd:student:get-grade-status": "",
    "phd:student:get-sub-area": "",
    "phd:student:get-profile-details": "",

    "phd:co-supervisor:get-co-supervised-students": "",
    "phd:supervisor:get-supervised-students": "",
    "phd:supervisor:suggest-dac-members": "",
    "phd:supervisor:review-proposal-document": "",
    "phd:supervisor:update-suggested-supervisor": "",
    "phd:supervisor:get-subareas": "",
    "phd:supervisor:get-students": "",

    "phd:staff:get-all-semester": "",
    "phd:staff:update-semester-dates": "",
    "phd:staff:update-proposal-deadline": "",
    "phd:staff:get-all-qualifying-exam-for-the-semester": "",
    "phd:staff:get-current-semester": "",
    "phd:staff:update-qualifying-exam-deadline": "",
    "phd:staff:delete-sub-area": "",
    "phd:staff:get-sub-area": "",
    "phd:staff:update-sub-area": "",
    "phd:staff:notify-all-users": "",

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

    // Course Load Allocation module permissions
    "allocation:settings:start": "Start a new course load allocation",
    "allocation:settings:end": "End the current course load allocation",

    "allocation:courses:write": "Create or Modify a new course",
    "allocation:courses:bulk-add": "Create or Modify a new course",
    "allocation:courses:view": "View all existing courses",

    "allocation:write": "Have read and write access to the allocation module",
    "allocation:view": "Have readonly access to the allocation module",

    "allocation:preference:write": "Create or Modify a new form for allocation data retrieval",
    "allocation:form:publish": "Publish a form for allocation data retrieval",
    "allocation:form:close": "Close a form for allocation data retrieval",
    "allocation:form:view": "View allocation data retrieval form",

    "allocation:data:export": "Export allocation data",
    "allocation:data:archive": "View data of all semesters upto date",

    "allocation:semester:read": "read the semester table",
    "allocation:semester:write": "write to semester table",

    


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

    // PhD

    "/phd/drcMember/generateCourseworkForm":
        "phd:drc-member:generate-coursework-form",
    "/phd/drcMember/getPhdToGenerateQualifyingExamForm":
        "phd:drc-member:get-phd-to-generate-qualifying-exam-form",
    "/phd/drcMember/updatePassingDatesOfPhd":
        "phd:drc-member:update-passing-dates-of-phd",
    "/phd/drcMember/getPhdDataOfWhoFilledApplicationForm":
        "phd:drc-member:get-phd-data-of-who-filled-application-form",
    "/phd/drcMember/getSuggestedDacMember":
        "phd:drc-member:get-suggested-dac-member",
    "/phd/drcMember/updateFinalDac": "phd:drc-member:update-final-dac",
    "/phd/drcMember/suggestTwoBestDacMember":
        "phd:drc-member:suggest-two-best-dac-member",
    "/phd/drcMember/updateQualifyingExamResultsOfAllStudents":
        "phd:drc-member:update-qualifying-exam-results-of-all-students",
    "/phd/drcMember/getPhdExamStatus": "phd:drc-member:get-phd-exam-status",
    "/phd/drcMember/getQualificationDates":
        "phd:drc-member:get-qualification-dates",
    "/phd/drcMember/getDatesOfQeExam": "phd:drc-member:get-dates-of-qe-exam",
    "/phd/drcMember/updateExaminer": "phd:drc-member:update-examiner",
    "/phd/drcMember/notifySupervisor": "phd:drc-member:notify-supervisor",
    "/phd/drcMember/getSubAreasAndExaminer":
        "phd:drc-member:get-subarea-and-examiner",
    "/phd/drcMember/getSupervisorsWithStudents":
        "phd:drc-member:get-supervisor-with-student",
    "/phd/drcMember/getQeTimeTable": "phd:drc-member:get-qe-time-table",
    "/phd/drcMember/getPhdApplicationFormsAsZip":
        "phd:drc-member:get-phs-qe-appliaction-forms-as-zip",

    "/phd/notifs/send": "phd:notifs:send",

    "/phd/notionalSupervisor/getPhd": "phd:notional-supervisor:get-phd",
    "/phd/notionalSupervisor/updateCourseDetails":
        "phd:notional-supervisor:update-course-details",
    "/phd/notionalSupervisor/updateCourseGrade":
        "phd:notional-supervisor:update-course-grade",
    "/phd/notionalSupervisor/getPhdCourseDetails":
        "phd:notional-supervisor:get-phd-course-details",
    "/phd/notionalSupervisor/addCourse": "phd:notional-supervisor:add-course",
    "/phd/notionalSupervisor/deleteCourseDetails":
        "phd:notional-supervisor:delete-course-details",

    "/phd/student/checkExamStatus": "phd:student:check-exam-status",
    "/phd/student/getProposalDeadline": "phd:student:get-proposal-deadline",
    "/phd/student/getQualifyingExamDeadLine":
        "phd:student:get-qualifying-exam-deadline",
    "/phd/student/uploadQeApplicationForm":
        "phd:student:upload-qe-application-form",
    "/phd/student/uploadProposalDocuments":
        "phd:student:upload-proposal-document",
    "/phd/student/getQualifyingExamStatus":
        "phd:student:get-qualifying-exam-status",
    "/phd/student/getQualifyingExamPassingDate":
        "phd:student:get-qualifying-exam-passing-date",
    "/phd/student/getProposalStatus": "phd:student:get-proposal-status",
    "/phd/student/getNoOfQeApplication": "phd:student:get-qe-application",
    "/phd/student/getGradeStatus": "phd:student:get-grade-status",
    "/phd/student/getSubAreas": "phd:student:get-sub-area",
    "/phd/student/getProfileDetails": "phd:student:get-profile-details",

    //Co-Supervisor
    "/phd/coSupervisor/getCoSupervisedStudents":
        "phd:co-supervisor:get-co-supervised-students",

    //Supervisor
    "/phd/supervisor/getSupervisedStudents":
        "phd:supervisor:get-supervised-students",
    "/phd/supervisor/suggestDacMembers": "phd:supervisor:suggest-dac-members",
    "/phd/supervisor/reviewProposalDocument":
        "phd:supervisor:review-proposal-document",
    "/phd/supervisor/updateSuggestedExaminer":
        "phd:supervisor:update-suggested-supervisor",
    "/phd/supervisor/getSubAreas": "phd:supervisor:get-subareas",
    "/phd/supervisor/getStudents": "phd:supervisor:get-students",

    //staff
    "/phd/staff/updateSemesterDates": "phd:staff:update-semester-dates",
    "/phd/staff/getAllSem": "phd:staff:get-all-semester",

    "/phd/staff/updateProposalDeadline": "phd:staff:update-proposal-deadline",
    "/phd/staff/getAllQualifyingExamForTheSem":
        "phd:staff:get-all-qualifying-exam-for-the-semester",
    "/phd/staff/getCurrentSemester": "phd:staff:get-current-semester",
    "/phd/staff/updateQualifyingExamDeadline":
        "phd:staff:update-qualifying-exam-deadline",
    "/phd/staff/deleteSubArea": "phd:staff:delete-sub-area",
    "/phd/staff/getSubAreas": "phd:staff:get-sub-area",
    "/phd/staff/updateSubAreas": "phd:staff:update-sub-area",
    "/phd/staff/notifyAllUsers": "phd:staff:notify-all-users",

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

    // Course Load Allocation 
    "/allocation/allocation/delete": "allocation:write",
    "/allocation/allocation/update": "allocation:write",

    "/allocation/course/create": "allocation:courses:write",
    "/allocation/course/delete": "allocation:courses:write",
    "/allocation/course/update": "allocation:courses:write",

    "/allocation/coursePreferences/delete": "allocation:preference:write",
    "/allocation/coursePreferences/update": "allocation:preference:write",

    "/allocation/semester/create": "allocation:semester:write",
    "/allocation/semester/delete": "allocation:semester:write",
    "/allocation/semester/update": "allocation:semester:write",
} as const;

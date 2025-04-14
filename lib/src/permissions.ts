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

    "handout:faculty:submit": "",
    "handout:dca-convenor:assignreviewer": "",
    "handout:faculty:get-all-handouts": "",
    "handout:dca:get-all-handouts": "",
    "handout:dca:review": "",
    "handout:get": "",
    "handout:dca-convenor:get-all": "",
    "handout:dca-convenor:final-decision": "",
    "handout:dca-convenor:reminder": "",
    "handout:dca-convenor:get-all-dcamember": "",
    "handout:dca-convenor:update-reviewer": "",
    "handout:dca-convenor:update-ic": "",
    "handout:dca-convenor:export-summary": "",
    "handout:dca-convenor:get-all-faculty": "",

    "publications:view": "View author's own publications",
    "publications:all": "View all publications",
} as const;

export const permissions: { [key: string]: keyof typeof allPermissions } = {
    // Admin

    "/admin/member/invite": "admin:member:create",
    "/admin/member/search": "admin:member:read",
    "/admin/member/details": "admin:member:read",
    "/admin/member/editdetails": "admin:member:update",
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
    "/conference/edit": "conference:application:submitted",
    "/conference/applications/pending": "conference:application:view-pending",
    "/conference/applications/my": "conference:application:submitted",
    "/conference/applications/view": "conference:application:submitted",
    "/conference/applications/reviewMember":
        "conference:application:review-application-member",
    "/conference/applications/reviewConvener":
        "conference:application:review-application-convener",
    "/conference/applications/reviewHod":
        "conference:application:review-application-hod",

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
} as const;

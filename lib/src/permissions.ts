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
    "conference:application:submitted": "Read and edit submitted applications",
    "conference:application:all": "Read and view status of all applications",

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

    "phd:co-supervisor:get-co-supervised-students": "",
    "phd:supervisor:get-supervised-students": "",
    "phd:supervisor:suggest-dac-members": "",
    "phd:supervisor:review-proposal-document": "",

    "phd:staff:get-all-semester": "",
    "phd:staff:update-semester-dates": "",
    "phd:staff:update-proposal-deadline": "",
    "phd:staff:get-all-qualifying-exam-for-the-semester": "",
    "phd:staff:get-current-semester": "",
    "phd:staff:update-qualifying-exam-deadline": "",
    "phd:staff:delete-sub-area": "",
    "phd:staff:get-sub-area": "",
    "phd:staff:update-sub-area": "",

    "handout:faculty:submit": "",
    "handout:dca-convenor:assignreviewer": "",
    "handout:faculty:get-all-handouts": "",
    "handout:dca:get-all-handouts": "",
    "handout:dca:review": "",
    "handout:get": "",
    "handout:dca-convenor:get-all": "",
    "handout:dca-convenor:final-decision": "",

} as const;

export const permissions = {
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

    "/conference/getSubmittedApplications": "conference:application:submitted",
    "/conference/viewOwnApplicationDetails": "conference:application:submitted",

    "/conference/viewApplicationDetails": "conference:application:all",

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

    //Co-Supervisor
    "/phd/coSupervisor/getCoSupervisedStudents":
        "phd:co-supervisor:get-co-supervised-students",

    //Supervisor
    "/phd/supervisor/getSupervisedStudents":
        "phd:supervisor:get-supervised-students",
    "/phd/supervisor/suggestDacMembers": "phd:supervisor:suggest-dac-members",
    "/phd/supervisor/reviewProposalDocument":
        "phd:supervisor:review-proposal-document",

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

    //Handout
    "/handout/submit": "handout:faculty:submit",
    "/handout/dca/assignReviewer": "handout:dca-convenor:assignreviewer",
    "/handout/faculty/get": "handout:faculty:get-all-handouts",
    "/handout/dca/get": "handout:dca:get-all-handouts",
    "/handout/dca/review": "handout:dca:review",
    "/handout/get": "handout:get",
    "/handout/dcaconvenor/get": "handout:dca-convenor:get-all",
    "/handout/dcaconvenor/finalDecision": "handout:dca-convenor:final-decision",

    // QP
   
} as const;

const permissionsSet = new Set(Object.values(permissions));
const allPermissionsSet = new Set(Object.keys(allPermissions));

if (
    ![...permissionsSet].every((permission) =>
        allPermissionsSet.has(permission)
    )
) {
    throw new Error("Unknown permission defined in routes");
}

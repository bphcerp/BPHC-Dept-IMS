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

    "phd:drc-member:generate-coursework-form": "",
    "phd:drc-member:get-all-qualifying-exam-for-the-semester": "",
    "phd:drc-member:get-all-semester": "",
    "phd:drc-member:update-exam-dates": "",
    "phd:drc-member:update-qualifying-exam-deadline": "",
    "phd:drc-member:get-phd-to-generate-qualifying-exam-form": "",
    "phd:drc-member:update-passing-dates-of-phd": "",
    "phd:drc-member:get-phd-that-passed-recently": "",
    "phd:drc-member:update-proposal-deadline": "",
    "phd:drc-member:get-phd-data-of-who-filled-application-form": "",
    "phd:drc-member:get-suggested-dac-member": "",
    "phd:drc-member:update-final-dac": "",
    "phd:drc-member:suggest-two-best-dac-member": "",
    "phd:drc-member:update-qualifying-exam-results-of-all-students": "",
    "phd:drc-member:get-current-semester": "",
    "phd:drc-member:update-semester-dates": "",
    "phd:drc-member:get-phd-exam-status": "",
    "phd:drc-member:get-qualification-dates": "",

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

    "phd:co-supervisor:get-co-supervised-students": "",
    "phd:supervisor:get-supervised-students": "",
    "phd:supervisor:suggest-dac-members": "",

    "handout:faculty:submit": "",
    "handout:dca-convenor:assignreviewer": "",
    "handout:faculty:get-all-handouts": "",
    "handout:dca:get-all-handouts": "",
    "handout:dca:review": "",
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

    // PhD

    "/phd/drcMember/generateCourseworkForm":
        "phd:drc-member:generate-coursework-form",
    "/phd/drcMember/getAllQualifyingExamForTheSem":
        "phd:drc-member:get-all-qualifying-exam-for-the-semester",
    "/phd/drcMember/getAllSem": "phd:drc-member:get-all-semester",
    "/phd/drcMember/updateExamDates": "phd:drc-member:update-exam-dates",
    "/phd/drcMember/updateQualifyingExamDeadline":
        "phd:drc-member:update-qualifying-exam-deadline",
    "/phd/drcMember/getPhdToGenerateQualifyingExamForm":
        "phd:drc-member:get-phd-to-generate-qualifying-exam-form",
    "/phd/drcMember/updatePassingDatesOfPhd":
        "phd:drc-member:update-passing-dates-of-phd",
    "/phd/drcMember/getPhdThatPassedRecently":
        "phd:drc-member:get-phd-that-passed-recently",
    "/phd/drcMember/updateProposalDeadline":
        "phd:drc-member:update-proposal-deadline",
    "/phd/drcMember/getPhdDataOfWhoFilledApplicationForm":
        "phd:drc-member:get-phd-data-of-who-filled-application-form",
    "/phd/drcMember/getSuggestedDacMember":
        "phd:drc-member:get-suggested-dac-member",
    "/phd/drcMember/updateFinalDac": "phd:drc-member:update-final-dac",
    "/phd/drcMember/suggestTwoBestDacMember":
        "phd:drc-member:suggest-two-best-dac-member",
    "/phd/drcMember/updateQualifyingExamResultsOfAllStudents":
        "phd:drc-member:update-qualifying-exam-results-of-all-students",
    "/phd/drcMember/getCurrentSemester": "phd:drc-member:get-current-semester",
    "/phd/drcMember/updateSemesterDates":
        "phd:drc-member:update-semester-dates",
    "/phd/drcMember/getPhdExamStatus": "phd:drc-member:get-phd-exam-status",
    "/phd/drcMember/getQualificationDates":
        "phd:drc-member:get-qualification-dates",

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

    //Co-Supervisor
    "/phd/coSupervisor/getCoSupervisedStudents":
        "phd:co-supervisor:get-co-supervised-students",

    //Supervisor
    "/phd/supervisor/getSupervisedStudents":
        "phd:supervisor:get-supervised-students",
    "/phd/supervisor/suggestDacMembers": "phd:supervisor:suggest-dac-members",

    //Handout
    "/handout/submit": "handout:faculty:submit",
    "/handout/dca/assignReviewer": "handout:dca-convenor:assignreviewer",
    "/handout/faculty/get": "handout:faculty:get-all-handouts",
    "/handout/dca/get": "handout:dca:get-all-handouts",
    "/handout/dca/review": "handout:dca:review",
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

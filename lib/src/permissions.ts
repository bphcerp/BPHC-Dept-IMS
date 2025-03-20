export const allPermissions = {
    "*": "All permissions",
    "admin:member:create": "Create operations on members",
    "admin:member:read": "Read operations on members",
    "admin:member:update": "Update operations on members",
    "admin:role:create": "Create operations on roles",
    "admin:role:read": "Read operations on roles",
    "admin:role:update": "Update operations on roles",
    "admin:role:delete": "Delete operations on roles",
    "conference:application:create": "Create operations on applications",
    "phd:drc-member:assign-notional-supervisor": "",
    "phd:drc-member:assign-supervisor": "",
    "phd:drc-member:generate-coursework-form": "",
    "phd:drc-member:get-all-qualifying-exam": "",
    "phd:drc-member:get-all-qualifying-exam-for-the-semester": "",
    "phd:drc-member:get-all-semester": "",
    "phd:drc-member:get-faculty-details": "",
    "phd:drc-member:get-phd": "",
    "phd:drc-member:get-qualifying-exam-form": "",
    "phd:drc-member:update-deadlines": "",
    "phd:drc-member:update-exam": "",
    "phd:drc-member:update-exam-dates": "",
    "phd:drc-member:update-qualifying-exam-deadline": "",
    "phd:drc-member:update-qe-pass-fail-status": "",
    "phd:drc-member:get-phd-to-generate-qualifying-exam-form": "",
    "phd:drc-member:update-passing-dates-of-phd": "",
    "phd:drc-member:get-phd-that-passed-recently": "",
    "phd:drc-member:update-proposal-deadline": "",
    "phd:drc-member:get-phd-data-of-who-filled-application-form": "",
    "phd:drc-member:get-suggested-dac-member": "",
    "phd:drc-member:update-final-dac": "",
    "phd:drc-member:suggest-two-best-dac-member": "",
    "phd:drc-member:update-qualifying-exam-results-of-all-students": "",
    "phd:drc-member:get-current-active-qualifying-exam": "",
    "phd:drc-member:get-specific-sem": "",
    "phd:drc-member:get-current-semester": "",
    "phd:drc-member:update-semester-dates": "",


    "phd:notifs:send": "",


    "phd:notional-supervisor:get-phd": "",
    "phd:notional-supervisor:update-course-details": "",
    "phd:notional-supervisor:update-course-grade": "",
    "phd:notional-supervisor:get-phd-course-details": "",
    "phd:notional-supervisor:add-course": "",
    "phd:notional-supervisor:delete-course-details": "",

    
    "phd:student:check-exam-status": "",
    "phd:co-supervisor:get-students": "",
    "phd:supervisor:get-students": "",
} as const;

export const permissions = {
    // Admin

    "/admin/member/invite": "admin:member:create",
    "/admin/member/search": "admin:member:read",
    "/admin/member/details": "admin:member:read",
    "/admin/member/editdetails": "admin:member:update",
    "/admin/member/editroles": "admin:member:update",
    "/admin/member/deactivate": "admin:member:update",

    "/admin/role/create": "admin:role:create",
    "/admin/role": "admin:role:read",
    "/admin/role/edit": "admin:role:update",
    "/admin/role/rename": "admin:role:update",
    "/admin/role/delete": "admin:role:delete",

    "/admin/permission/all": "admin:role:read",

    // Conference

    "/conference/createApplication": "conference:application:create",

    // PhD

    "/phd/drcMember/assignNotionalSupervisor": "phd:drc-member:assign-notional-supervisor",
    "/phd/drcMember/assignSupervisor": "phd:drc-member:assign-supervisor",
    "/phd/drcMember/generateCourseworkForm": "phd:drc-member:generate-coursework-form",
    "/phd/drcMember/getAllQualifyingExam": "phd:drc-member:get-all-qualifying-exam",
    "/phd/drcMember/getAllQualifyingExamForTheSemester": "phd:drc-member:get-all-qualifying-exam-for-the-semester",
    "/phd/drcMember/getAllSemester": "phd:drc-member:get-all-semester",
    "/phd/drcMember/getFacultyDetails": "phd:drc-member:get-faculty-details",
    "/phd/drcMember/getPhD": "phd:drc-member:get-phd",
    "/phd/drcMember/getQualifyingExamForm": "phd:drc-member:get-qualifying-exam-form",
    "/phd/drcMember/updateDeadlines": "phd:drc-member:update-deadlines",
    "/phd/drcMember/updateExam": "phd:drc-member:update-exam",
    "/phd/drcMember/updateExamDates": "phd:drc-member:update-exam-dates",
    "/phd/drcMember/updateQualifyingExamDeadline": "phd:drc-member:update-qualifying-exam-deadline",
    "/phd/drcMember/updateQePassFailStatus": "phd:drc-member:update-qe-pass-fail-status",
    "/phd/drcMember/getPhdToGenerateQualifyingExamForm": "phd:drc-member:get-phd-to-generate-qualifying-exam-form",
    "/phd/drcMember/updatePassingDatesOfPhd": "phd:drc-member:update-passing-dates-of-phd",
    "/phd/drcMember/getPhdThatPassedRecently": "phd:drc-member:get-phd-that-passed-recently",
    "/phd/drcMember/updateProposalDeadline": "phd:drc-member:update-proposal-deadline",
    "/phd/drcMember/getPhdDataOfWhoFilledApplicationForm": "phd:drc-member:get-phd-data-of-who-filled-application-form",
    "/phd/drcMember/getSuggestedDacMember": "phd:drc-member:get-suggested-dac-member",
    "/phd/drcMember/updateFinalDac": "phd:drc-member:update-final-dac",
    "/phd/drcMember/suggestTwoBestDacMember": "phd:drc-member:suggest-two-best-dac-member",
    "/phd/drcMember/updateQualifyingExamResultsOfAllStudents": "phd:drc-member:update-qualifying-exam-results-of-all-students",
    "/phd/drcMember/getCurrentActiveQualifyingExam": "phd:drc-member:get-current-active-qualifying-exam",
    "/phd/drcMember/getSpecificSem": "phd:drc-member:get-specific-sem",
    "/phd/drcMember/getCurrentSemester": "phd:drc-member:get-current-semester",
    "/phd/drcMember/updateSemesterDates": "phd:drc-member:update-semester-dates",

    "/phd/notifs/send": "phd:notifs:send",

    "/phd/notionalSupervisor/getPhd": "phd:notional-supervisor:get-phd",
    "/phd/notionalSupervisor/updateCourseDetails":"phd:notional-supervisor:update-course-details",
    "/phd/notionalSupervisor/updateCourseGrade":"phd:notional-supervisor:update-course-grade",
    "/phd/notionalSupervisor/getPhdCourseDetails":"phd:notional-supervisor:get-phd-course-details",
    "/phd/notionalSupervisor/addCourse":"phd:notional-supervisor:add-course",
    "/phd/notionalSupervisor/deleteCourseDetails":"phd:notional-supervisor:delete-course-details",

    "/phd/student/checkExamStatus": "phd:student:check-exam-status",

    //Co-Supervisor
    "/phd/coSupervisor/getStudents": "phd:co-supervisor:get-students",

    //Supervisor
    "/phd/supervisor/getStudents": "phd:supervisor:get-students",
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

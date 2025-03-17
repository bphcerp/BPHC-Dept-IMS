export default {
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

    "/phd/drcMember/assignNotionalSupervisor":
        "phd:drc-member:assign-notional-supervisor",
    "/phd/drcMember/assignSupervisor": "phd:drc-member:assign-supervisor",
    "/phd/drcMember/generateCourseworkForm":
        "phd:drc-member:generate-coursework-form",
    "/phd/drcMember/getFacultyDetails": "phd:drc-member:get-faculty-details",
    "/phd/drcMember/getPhD": "phd:drc-member:get-phd",
    "/phd/drcMember/getQualifyingExamForm":
        "phd:drc-member:get-qualifying-exam-form",
    "/phd/drcMember/updateDeadlines": "phd:drc-member:update-deadlines",
    "/phd/drcMember/updateExam": "phd:drc-member:update-exam",
    "/phd/drcMember/updateExamDates": "phd:drc-member:update-exam-dates",

    "/phd/notifs/send": "phd:notifs:send",

    "/phd/notionalSupervisor/getPhD": "phd:notional-supervisor:get-phd",
    "/phd/notionalSupervisor/updateCourseDetails":
        "phd:notional-supervisor:update-course-details",
    "/phd/notionalSupervisor/updateCourseGrade":
        "phd:notional-supervisor:update-course-grade",

    "/phd/student/checkExamStatus": "phd:student:check-exam-status",
};

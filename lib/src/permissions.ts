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
    "phd:drc-member:get-faculty-details": "",
    "phd:drc-member:get-phd": "",
    "phd:drc-member:get-qualifying-exam-form": "",
    "phd:drc-member:update-deadlines": "",
    "phd:drc-member:update-exam": "",
    "phd:drc-member:update-exam-dates": "",
    "phd:notifs:send": "",
    "phd:notional-supervisor:get-phd": "",
    "phd:notional-supervisor:update-course-details": "",
    "phd:notional-supervisor:update-course-grade": "",
    "phd:student:check-exam-status": "",
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

    "/phd/notionalSupervisor/getPhd": "phd:notional-supervisor:get-phd",
    "/phd/notionalSupervisor/updateCourseDetails":
        "phd:notional-supervisor:update-course-details",
    "/phd/notionalSupervisor/updateCourseGrade":
        "phd:notional-supervisor:update-course-grade",

    "/phd/student/checkExamStatus": "phd:student:check-exam-status",
} as const;

const permissionsSet = new Set(Object.values(permissions));
const allPermissionsSet = new Set(Object.keys(allPermissions));

if (!allPermissionsSet.isSupersetOf(permissionsSet)) {
    throw new Error("Unknown permission defined in routes");
}

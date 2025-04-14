import * as adminSchemas from "./schemas/Admin.ts";
import * as formSchemas from "./schemas/Form.ts";
import * as phdSchemas from "./schemas/Phd.ts";
import * as conferenceSchemas from "./schemas/Conference.ts";
import * as handoutSchemas from "./schemas/Handout.ts";
import * as qpSchemas from "./schemas/Qp.ts";
import * as publicationsSchemas from "./schemas/Publications.ts";
import * as todosSchemas from "./schemas/Todos.ts";
import { modules } from "./schemas/Form.ts";
import * as authTypes from "./types/auth.ts";
import * as authUtils from "./utils/auth.ts";
import { allPermissions, permissions } from "./permissions.ts";

export {
    adminSchemas,
    formSchemas,
    conferenceSchemas,
    handoutSchemas,
    qpSchemas,
    publicationsSchemas,
    todosSchemas,
    modules,
    phdSchemas,
    authTypes,
    authUtils,
    permissions,
    allPermissions,
};

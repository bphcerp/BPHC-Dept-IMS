import * as adminSchemas from "./schemas/Admin.ts";
import * as phdSchemas from "./schemas/Phd.ts";
import * as conferenceSchemas from "./schemas/Conference.ts";
import * as handoutSchemas from "./schemas/Handout.ts";
import { modules } from "./schemas/Form.ts";
import * as authTypes from "./types/auth.ts";
import * as authUtils from "./utils/auth.ts";
import { allPermissions, permissions } from "./permissions.ts";

export {
    adminSchemas,
    conferenceSchemas,
    handoutSchemas,
    modules,
    phdSchemas,
    authTypes,
    authUtils,
    permissions,
    allPermissions,
};

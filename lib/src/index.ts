import * as adminSchemas from "./schemas/Admin";
import * as phdSchemas from "./schemas/Phd";
import * as conferenceSchemas from "./schemas/Conference";
import { modules } from "./schemas/Form";
import * as authTypes from "./types/auth";
import * as authUtils from "./utils/auth";
import permissions from "./permissions";

export {
    adminSchemas,
    conferenceSchemas,
    modules,
    phdSchemas,
    authTypes,
    authUtils,
    permissions,
};

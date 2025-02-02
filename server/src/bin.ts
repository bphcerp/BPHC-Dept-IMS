#!/usr/bin/env node

import app from "./app.ts";
import env from "./config/environment.ts";
import logger from "./config/logger.ts";

app.set("port", env.SERVER_PORT);

app.listen(env.SERVER_PORT, () => {
    logger.info(`Server started on port ${env.SERVER_PORT}`);
});

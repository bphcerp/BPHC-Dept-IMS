#!/usr/bin/env node

import app from "./app";
import env from "./config/environment";
import logger from "./config/logger";

app.set("port", env.SERVER_PORT);

app.listen(env.SERVER_PORT, () => {
    logger.info(`Server started on port ${env.SERVER_PORT}`);
});

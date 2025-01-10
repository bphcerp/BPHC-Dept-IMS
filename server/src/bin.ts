#!/usr/bin/env node

import app from "./app";
import http from "http";
import { PORT } from "./config/environment";
import logger from "./config/logger";
import { type Duplex } from "stream";

function normalizePort(val: string) {
    const port = parseInt(val, 10);
    if (isNaN(port)) return val;
    if (port >= 0) return port;
    return false;
}

const port = normalizePort(PORT);
app.set("port", port);

const server = http.createServer(app);

server.listen(port, () => {
    const addr = server.address();
    logger.info(
        "Server started on " +
            (typeof addr === "string" ? "pipe " + addr : "port " + addr?.port)
    );
});
server.on("clientError", onClientError);

function onClientError(err: Error, socket: Duplex) {
    logger.error("HTTP Error: " + err.message);
    socket.end("HTTP/1.1 400 Bad Request\r\n");
}

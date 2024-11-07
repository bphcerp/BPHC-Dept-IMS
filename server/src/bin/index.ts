#!/usr/bin/env node

import app from "../app";
import http from "http";
import { PORT } from "../config/environment";
import logger from "../lib/logger";
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

if (import.meta.hot) {
    function closeServer() {
        process.removeAllListeners();
        server.close();
    }
    import.meta.hot.on("vite:beforeFullReload", () => {
        closeServer();
        logger.info("HMR: FULL RELOAD");
    });
    import.meta.hot.dispose(() => {
        closeServer();
        logger.info("HMR: DISPOSE");
    });
}

function onClientError(err: Error, socket: Duplex) {
    logger.error("HTTP Error: " + err.message);
    socket.end("HTTP/1.1 400 Bad Request\r\n");
}

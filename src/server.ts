import express, { Express } from 'express';
import http from "http";
import { spitHTML } from './loader';
import { logger, debugLog } from './logging';
import { pool, cache } from './main';

export class Server {
    app: Express;
    server: http.Server;
    constructor(port: number) {
        this.app = express();
        this.setupRoutes(this.app);
        this.server = this.app.listen(
            port,
            () => logger.info("server listening on port " + port),
        );
    }
    setupRoutes(app: Express) {
        debugLog.server("setting up server routes");
        app.get('/', async (req, res, _) => {
            logger.info("received HTTP GET: " + req.url);
            const url = req.query["url"];
            if (url === undefined) {
                return res.status(403).send({
                    "error": "url parameter not provided"
                });
            }
            const wait = req.query["wait"];
            try {
                const html = await spitHTML(url, wait, pool, cache);
                return res.status(200).send({
                    "html": html
                });
            } catch (e) {
                logger.error(String(e));
                return res.status(403).send({
                    "error": String(e)
                });
            }
        });
        app.get('/healthcheck', async (req, res, next) => {
            debugLog.server("received GET /healthcheck request: " + req.url);
            const healthy = true; // TODO
            if (healthy) {
                return res.status(200);
            }
            logger.warn("unhealthy");
            return res.status(500).send("unhealthy");
        });
    }
    close(callback?: () => void) {
        this.server.close(callback);
    }
}



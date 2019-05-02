import { Params } from './params';
import { debugLog, initLogger, logger } from './logging';
import { Pool } from './pool';
import { Server } from './server';
import { CacheHTML } from './cache';

export let cache: CacheHTML;
export let pool: Pool;

const main = async () => {
    const params = new Params(process.env);
    if (params.log === "normal") {
        console.log("\n =========================================");
        console.log(" =========================================");
        console.log(" ============== HTMLSpitter ==============");
        console.log(" =========================================");
        console.log(" =========================================");
        console.log(" == by github.com/qdm12 - Quentin McGaw ==\n");
    }
    debugLog.main("Starting");
    initLogger(params.log === "json");
    logger.info(params.toString());
    debugLog.main("Creating pool of browsers");
    pool = new Pool(
        params.maxBrowsers,
        params.maxPages,
        params.maxHits,
        params.maxAgeUnused,
        params.executablePath,
        params.maxQueueSize,
    );
    debugLog.main("Creating cache");
    cache = new CacheHTML(params.maxCacheSize);
    debugLog.main("Launching server");
    const server = new Server(params.port);
    process.on('SIGTERM', () => {
        debugLog.main("Closing server");
        server.close(
            async () => {
                debugLog.main("Closing pool of browsers");
                await pool.close();
                process.exit(0);
            }
        );
    });
}

main();


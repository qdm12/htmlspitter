import { debugLog } from "./logging";

export class Params {
    port: number;
    executablePath: string;
    maxPages: number;
    maxHits: number;
    maxAgeUnused: number;
    maxBrowsers: number;
    maxCacheSize: number;
    maxQueueSize: number;
    log: string;
    constructor(env: NodeJS.ProcessEnv) {
        debugLog.params("reading parameters");
        this.port = Number(env.PORT) || 8000;
        this.executablePath = env.CHROME_BIN || "Puppeteer-bundled";
        this.maxPages = Number(env.MAX_PAGES) || 10;
        this.maxHits = Number(env.MAX_HITS) || 300;
        this.maxAgeUnused = Number(env.MAX_AGE_UNUSED) || 60;
        this.maxBrowsers = Number(env.MAX_BROWSERS) || 10;
        this.maxCacheSize = Number(env.MAX_CACHE_SIZE) || 10000000;
        this.maxQueueSize = Number(env.MAX_QUEUE_SIZE) || 100;
        this.log = env.LOG || "normal";
    }
    toString() {
        return JSON.stringify(this);
    }
}

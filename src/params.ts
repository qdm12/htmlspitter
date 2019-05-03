import { debugLog, logger } from "./logging";
import { existsSync } from "fs";

export class Params {
    port: number;
    executablePath: string;
    maxPages: number;
    maxHits: number;
    maxAgeUnused: number;
    maxBrowsers: number;
    maxCacheSize: number;
    maxQueueSize: number;
    catchRequests: boolean;
    log: string;
    constructor() {
        this.port = 8000;
        this.executablePath = "Puppeteer-bundled";
        this.maxPages = 10;
        this.maxHits = 300;
        this.maxAgeUnused = 60;
        this.maxBrowsers = 10;
        this.maxCacheSize = 10;
        this.maxQueueSize = 100;
        this.log = "normal";
        this.catchRequests = true;
    }
    parse(env: NodeJS.ProcessEnv) {
        debugLog.params("reading parameters");
        let uid: number;
        try {
            uid = process.geteuid();
        } catch (error) {
            uid = -1;
        }
        this.port = Params.getPort(env.PORT, uid) || this.port;
        this.executablePath = Params.getExecutablePath(env.CHROME_BIN) || this.executablePath;
        this.maxPages = Params.getMax(env.MAX_PAGES, "MAX_PAGES") || this.maxPages;
        this.maxHits = Params.getMax(env.MAX_HITS, "MAX_HITS") || this.maxHits;
        this.maxAgeUnused = Params.getMax(env.MAX_AGE_UNUSED, "MAX_AGE_UNUSED") || this.maxAgeUnused;
        this.maxBrowsers = Params.getMax(env.MAX_BROWSERS, "MAX_BROWSERS") || this.maxBrowsers;
        this.maxCacheSize = Params.getMax(env.MAX_CACHE_SIZE, "MAX_CACHE_SIZE") || this.maxCacheSize;
        this.maxQueueSize = Params.getMax(env.MAX_QUEUE_SIZE, "MAX_QUEUE_SIZE") || this.maxQueueSize;
        this.log = Params.getLog(env.LOG) || this.log;
        this.catchRequests = Params.getCatchRequests(env.CATCH_REQUESTS) || this.catchRequests;
    }
    static getPort(s: string | undefined, uid: number): number {
        if (s === undefined || s === "") {
            return 0; // set to default
        }
        const port = Number(s);
        if (Number.isNaN(port)) {
            throw Error(`Environment variable PORT '${s}' is not a number`);
        } else if (!Number.isInteger(port)) {
            throw Error(`Environment variable PORT ${port} is not an integer`);
        } else if (port < 1) {
            throw Error(`Environment variable PORT ${port} must be positive`);
        } else if (port < 1024) {
            if (uid === 0) {
                logger.warn(`Environment variable PORT ${port} is allowed to be in the reserved system ports range as you are running as root`);
            } else if (uid === -1) {
                logger.warn(`Environment variable PORT ${port} is allowed to be in the reserved system ports range as you are running in Windows`);
            } else {
                throw Error(`Environment variable PORT ${port} cannot be in the reserved system ports range (1 to 1023) when running without root`);
            }
        } else if (port > 65535) {
            throw Error(`Environment variable PORT ${port} cannot be higher than 65535`);
        } else if (port > 49151) {
            logger.warn(`Environment variable PORT ${port} is in the dynamic/private ports range (above 49151)`);
        }
        return port;
    }
    static getExecutablePath(s: string | undefined): string {
        if (s === undefined || s === "") {
            return ""; // set to default
        }
        if (!existsSync(s)) {
            throw Error(`${s} does not exist`);
        }
        return s;
    }
    static getMax(s: string | undefined, envName: string): number {
        if (s === undefined || s === "") {
            return 0;  // set to default
        }
        const n = Number(s);
        if (Number.isNaN(n)) {
            throw Error(`Environment variable ${envName} '${s}' is not a number`);
        } else if (!Number.isInteger(n)) {
            throw Error(`Environment variable ${envName} ${n} is not an integer`);
        } else if (n === -1) {
            return Infinity;
        } else if (n < 1) {
            throw Error(`Environment variable ${envName} must be a positive integer or -1 (infinite)`);
        }
        return n;
    }
    static getLog(s: string | undefined): string {
        if (s === undefined || s === "") {
            return "";  // set to default
        } else if (s !== "normal" && s !== "json") {
            throw Error(`Environment variable LOG '${s}' is unrecognized`);
        }
        return s;
    }
    static getCatchRequests(s: string | undefined): boolean | undefined {
        if (s === undefined || s === "") {
            return undefined;
        } else if (s !== "yes" && s !== "no") {
            throw Error(`Environment variable CATCH_REQUESTS '${s}' is unrecognized`);
        }
        return s === "yes";
    }
    toString() {
        return JSON.stringify(this);
    }
}

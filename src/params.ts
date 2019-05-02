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
    log: string;
    constructor(env: NodeJS.ProcessEnv) {
        debugLog.params("reading parameters");
        let uid: number;
        try {
            uid = process.geteuid();
        } catch (error) {
            uid = -1;
        }
        this.port = Params.getPort(env.PORT, uid);
        this.executablePath = Params.getExecutablePath(env.CHROME_BIN);
        this.maxPages = Params.getMax(env.MAX_PAGES, "MAX_PAGES", 10);
        this.maxHits = Params.getMax(env.MAX_HITS, "MAX_HITS", 300);
        this.maxAgeUnused = Params.getMax(env.MAX_AGE_UNUSED, "MAX_AGE_UNUSED", 60);
        this.maxBrowsers = Params.getMax(env.MAX_BROWSERS, "MAX_BROWSERS", 10);
        this.maxCacheSize = Params.getMax(env.MAX_CACHE_SIZE, "MAX_CACHE_SIZE", 10);
        this.maxQueueSize = Params.getMax(env.MAX_QUEUE_SIZE, "MAX_QUEUE_SIZE", 100);
        this.log = Params.getLog(env.LOG);
    }
    static getPort(s: string | undefined, uid: number): number {
        if (s === undefined) {
            return 8000;
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
        if (s === undefined) {
            return "Puppeteer-bundled";
        }
        if (!existsSync(s)) {
            throw Error(`${s} does not exist`);
        }
        return s;
    }
    static getMax(s: string | undefined, envName: string, defaultValue: number): number {
        if (s === undefined) {
            return defaultValue;
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
        if (s === undefined) {
            return "normal";
        } else if (s !== "normal" && s !== "json") {
            throw Error(`Environment variable LOG '${s}' is unrecognized`);
        }
        return s;
    }
    toString() {
        return JSON.stringify(this);
    }
}

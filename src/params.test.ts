import { Params } from "./params";
import { silence } from "./logging";
const fs = require('fs');

jest.mock('fs');

beforeAll(() => silence(true));
afterAll(() => silence(false));

describe("constructor", () => {
    it("creates a params with all to default", () => {
        const env: NodeJS.ProcessEnv = {};
        const params = new Params(env);
        expect(params.port).toBe(8000);
        expect(params.executablePath).toBe("Puppeteer-bundled");
        expect(params.maxPages).toBe(10);
        expect(params.maxHits).toBe(300);
        expect(params.maxAgeUnused).toBe(60);
        expect(params.maxBrowsers).toBe(10);
        expect(params.maxCacheSize).toBe(10);
        expect(params.maxQueueSize).toBe(100);
        expect(params.log).toBe("normal");
    });
    it("creates a params with all from environment", () => {
        jest.resetAllMocks();
        fs.existsSync.mockReturnValue(true);
        const env: NodeJS.ProcessEnv = {
            PORT: "8888",
            CHROME_BIN: "/path",
            MAX_PAGES: "100",
            MAX_HITS: "3000",
            MAX_AGE_UNUSED: "600",
            MAX_BROWSERS: "100",
            MAX_CACHE_SIZE: "100",
            MAX_QUEUE_SIZE: "1000",
            LOG: "json",
        };
        const params = new Params(env);
        expect(params.port).toBe(8888);
        expect(params.executablePath).toBe("/path");
        expect(params.maxPages).toBe(100);
        expect(params.maxHits).toBe(3000);
        expect(params.maxAgeUnused).toBe(600);
        expect(params.maxBrowsers).toBe(100);
        expect(params.maxCacheSize).toBe(100);
        expect(params.maxQueueSize).toBe(1000);
        expect(params.log).toBe("json");
        expect(fs.existsSync).toHaveBeenCalled();
    });
    it("raises an error", () => {
        const env: NodeJS.ProcessEnv = {
            PORT: "troll",
            CHROME_BIN: "/",
            MAX_PAGES: "100",
            MAX_HITS: "3000",
            MAX_AGE_UNUSED: "600",
            MAX_BROWSERS: "100",
            MAX_CACHE_SIZE: "100",
            MAX_QUEUE_SIZE: "1000",
            LOG: "json",
        };
        const f = () => new Params(env);
        expect(f).toThrowError("Environment variable PORT 'troll' is not a number");
    });
});

describe("getPort", () => {
    it("returns default", () => {
        const port = Params.getPort(undefined, 0);
        expect(port).toBe(8000);
    });
    it("throws an error when it's not a number", () => {
        const f = () => Params.getPort("troll", 0)
        expect(f).toThrowError("Environment variable PORT 'troll' is not a number");
    });
    it("throws an error when it's not an integer", () => {
        const f = () => Params.getPort("1.2", 0)
        expect(f).toThrowError("Environment variable PORT 1.2 is not an integer");
    });
    it("throws an error when it's not a positive integer", () => {
        const f = () => Params.getPort("-5", 0)
        expect(f).toThrowError("Environment variable PORT -5 must be positive");
    });
    it("returns reserved port when running as root", () => {
        const port = Params.getPort("500", 0);
        expect(port).toBe(500);
    });
    it("returns reserved port when running on Windows", () => {
        const port = Params.getPort("500", -1);
        expect(port).toBe(500);
    });
    it("throws an error when it's a reserved port and not running as root or on Windows", () => {
        const f = () => Params.getPort("500", 1)
        expect(f).toThrowError("Environment variable PORT 500 cannot be in the reserved system ports range (1 to 1023) when running without root");
    });
    it("throws an error when it's above 65535", () => {
        const f = () => Params.getPort("65536", 0)
        expect(f).toThrowError("Environment variable PORT 65536 cannot be higher than 65535");
    });
    it("returns port", () => {
        const port = Params.getPort("8888", 0);
        expect(port).toBe(8888);
    });
});

describe("getExecutablePath", () => {
    it("returns default", () => {
        const path = Params.getExecutablePath(undefined);
        expect(path).toBe("Puppeteer-bundled");
    });
    it("throws an error when the file does not exist", () => {
        jest.resetAllMocks();
        fs.existsSync.mockReturnValue(false);
        const f = () => Params.getExecutablePath("/path")
        expect(f).toThrowError("/path does not exist");
        expect(fs.existsSync).toHaveBeenCalled();
    });
    it("returns the executable path", () => {
        jest.resetAllMocks();
        fs.existsSync.mockReturnValue(true);
        const path = Params.getExecutablePath("/path")
        expect(path).toBe("/path");
        expect(fs.existsSync).toHaveBeenCalled();
    });
});

describe("getMax", () => {
    it("returns default", () => {
        const n = Params.getMax(undefined, "X", 1);
        expect(n).toBe(1);
    });
    it("throws an error when it's not a number", () => {
        const f = () => Params.getMax("troll", "X", 1)
        expect(f).toThrowError("Environment variable X 'troll' is not a number");
    });
    it("throws an error when it's not an integer", () => {
        const f = () => Params.getMax("1.2", "X", 1)
        expect(f).toThrowError("Environment variable X 1.2 is not an integer");
    });
    it("returns Infinity on -1", () => {
        const n = Params.getMax("-1", "X", 1);
        expect(n).toBe(Infinity);
    });
    it("throws an error when it's zero", () => {
        const f = () => Params.getMax("0", "X", 1)
        expect(f).toThrowError("Environment variable X must be a positive integer or -1 (infinite)");
    });
    it("throws an error when it's negative and not -1", () => {
        const f = () => Params.getMax("-2", "X", 1)
        expect(f).toThrowError("Environment variable X must be a positive integer or -1 (infinite)");
    });
    it("returns the number", () => {
        const n = Params.getMax("15", "X", 1);
        expect(n).toBe(15);
    });
});

describe("getLog", () => {
    it("returns default", () => {
        const log = Params.getLog(undefined);
        expect(log).toBe("normal");
    });
    it("throws an error when it's not valid", () => {
        const f = () => Params.getLog("troll")
        expect(f).toThrowError("Environment variable LOG 'troll' is unrecognized");
    });
    it("returns the log", () => {
        const log = Params.getLog("json");
        expect(log).toBe("json");
    });
});

describe("toString", () => {
    it("returns stringified params", () => {
        const p = new Params({});
        const s = p.toString();
        expect(s).toBe("{\"port\":8000,\"executablePath\":\"Puppeteer-bundled\",\"maxPages\":10,\"maxHits\":300,\"maxAgeUnused\":60,\"maxBrowsers\":10,\"maxCacheSize\":10,\"maxQueueSize\":100,\"log\":\"normal\"}");
    });
});

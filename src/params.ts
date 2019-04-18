export class Params {
    port:number;
    executablePath: string;
    maxPages:number;
    maxHits:number;
    maxAgeUnused:number;
    maxBrowsers:number;
    maxCacheSize:number;
    constructor(env:NodeJS.ProcessEnv) {
        this.port = Number(env.PORT) || 8000;
        this.executablePath = env.CHROME_BIN || "Puppeteer-bundled";
        this.maxPages = Number(env.MAXPAGES) || 10;
        this.maxHits = Number(env.MAXHITS) || 300;
        this.maxAgeUnused = Number(env.MAXAGEUNUSED) || 60;
        this.maxBrowsers = Number(env.MAXBROWSERS) || 10;
        this.maxCacheSize = Number(env.MAXCACHESIZE) || 10000;
    }
    toString() {
        return JSON.stringify(this);
    }
}

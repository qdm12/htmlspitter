import { Queue } from "./queue";
import puppeteer from 'puppeteer';
import {debugLog} from "./logging";

interface paramsType {
    maxPages:number,
    maxHits:number, // max number of pages over lifetime
    maxAgeUnused:number, // seconds since last page opened
}

interface statsType {
    pages:number, // curent number of pages
    hits:number, // current count of pages opened over lifetime
    lastUsedAt:Date,
}

export class Browser {
    browser:puppeteer.Browser|null;
    launched:Promise<void>;
    queue:Queue; // queue of pages to create
    params:paramsType;
    stats:statsType;
    constructor(
        executablePath:string,
        maxPages:number,
        maxHits:number,
        maxAgeUnused:number,
        maxQueueSize:number,
    ) {
        debugLog.browser("creating");
        this.browser = null;
        // need to await browser.launched
        this.launched = this.launch(executablePath);
        this.queue = new Queue(maxQueueSize);
        this.params = {
            maxPages,
            maxHits,
            maxAgeUnused,
        }
        this.stats = {
            pages: 0,
            hits: 0,
            lastUsedAt: new Date(),
        }
    }
    async launch(executablePathStr:string) {
        let executablePath:string|undefined = undefined;
        if (executablePathStr !== "Puppeteer-bundled") {
            executablePath = executablePathStr;
        }
        this.browser = await puppeteer.launch({
            headless:true,
            executablePath,
            args: [
                "--disable-dev-shm-usage",
                "--disable-background-networking",
                "--disable-default-apps",
                "--disable-extensions",
                "--disable-gpu",
                "--disable-sync",
                "--disable-translate",
                "--hide-scrollbars",
                "--metrics-recording-only",
                "--mute-audio",
                "--no-first-run",
                "--safebrowsing-disable-auto-update"
            ]
        });
        debugLog.browser("created");
    }
    isOverHitLimit() {
        const result = this.stats.hits > this.params.maxHits;
        if (result) {
            debugLog.browser("over hit limit");
        }
        return result;
    }
    isUnused() {
        const t = new Date().valueOf()*1000;
        const lastUsed = this.stats.lastUsedAt.valueOf()*1000;
        const result = t - lastUsed > this.params.maxAgeUnused;
        if (result) {
            debugLog.browser("browser is unused");
        }
        return result;
    }
    // Set a periodic function to check on renewMe()
    renewMe() {
        const result = this.isOverHitLimit() && this.stats.pages === 0;
        if (result) {
            debugLog.browser("renew me");
        }
        return result;
    }
    pageAvailable() {
        return this.stats.pages < this.params.maxPages;
    }
    async createPage() {
        debugLog.browser("creating page");
        if (this.browser === null) {
            throw Error("cannot create page for null browser");
        }
        if (this.isOverHitLimit()) {
            throw Error("browser has reached its hit limit of pages: "+this.params.maxHits+" pages");
        }
        // Browser local queue to create new pages (FIFO)
        await this.queue.wait(this.pageAvailable, 100); // TODO PB HERE
        this.stats.lastUsedAt = new Date();
        const page = await this.browser.newPage();
        this.stats.pages++;
        debugLog.browser("created page");
        return page;
    }
    async closePage(page:puppeteer.Page) {
        debugLog.browser("closing page");
        await page.close();
        debugLog.browser("closed page");
        this.stats.pages--;
    }
    async close() {
        debugLog.browser("closing browser");
        if (this.browser === null) {
            debugLog.browser("browser is already null");
            return;
        }
        await this.browser.close();
        debugLog.browser("closed browser");
    }
}
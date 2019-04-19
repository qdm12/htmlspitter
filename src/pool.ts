import { Browser } from './browser';
import { debugLog } from './logging';

interface paramsType {
    maxBrowsers:number,
    maxPages:number,
    maxHits:number,
    maxAgeUnused:number,
    executablePath:string,
    maxQueueSize:number,
}

// Pool of browsers
export class Pool {
    // id, browser
    pool:Map<number,Browser>;
    params:paramsType;
    periodicTimer:NodeJS.Timeout;
    constructor(
        maxBrowsers:number,
        maxPages:number,
        maxHits:number,
        maxAgeUnused:number,
        executablePath:string,
        maxQueueSize:number,
        ) {
        this.pool = new Map<number,Browser>();
        this.params = {
            maxBrowsers,
            maxPages,
            maxHits,
            maxAgeUnused,
            executablePath,
            maxQueueSize,
        };
        this.periodicTimer = this.periodicChecks();
    }
    periodicChecks() {
        return setInterval(
            () => {
                debugLog.pool("periodic checks");
                this.pool.forEach((b, id) => {
                    if (b.isUnused()) {
                        this.closeBrowser(id);
                    } else if (b.renewMe()) {
                        this.renewBrowser(id);
                    }
                });
            }, 10000
        );
    }
    canAddBrowser() {
        return this.pool.size < this.params.maxBrowsers;
    }
    newBrowserID() {
        if (!this.canAddBrowser()) {
            throw Error("cannot add a browser");
        }
        let nextID = 0;
        while(nextID < Math.max(this.pool.size, 1)) {
            if (!this.pool.has(nextID)) {
                return nextID;
            }
            nextID++
        }
        nextID++; // equals to size of set
        return nextID;
    }
    async addBrowser() {
        debugLog.pool("adding browser");
        if (!this.canAddBrowser()) {
            throw Error("reached maximum number of browsers: "+this.params.maxBrowsers);
        }
        const id = this.newBrowserID();
        const browser = new Browser(
            this.params.executablePath,
            this.params.maxPages,
            this.params.maxHits,
            this.params.maxAgeUnused,
            this.params.maxQueueSize,
        );
        await browser.launched;
        this.pool.set(id, browser);
        debugLog.pool("added browser with ID "+id);
        const test = this.pool.get(id);
        return browser;
    }
    async closeBrowser(id:number) {
        debugLog.pool("closing browser with ID "+id);
        const browser = this.pool.get(id);
        if (browser === undefined) {
            throw Error("browser for id "+id+" does not exist");
        }
        await browser.close();
        this.pool.delete(id);
    }
    async close() {
        debugLog.pool("closing pool");
        clearTimeout(this.periodicTimer);
        for(const id of this.pool.keys()) {
            await this.closeBrowser(id);
        }
    }
    getBrowserLeastPages() {
        let minID = 0, minPages = this.params.maxPages + 1;
        this.pool.forEach((b, id) => {
            if (b.stats.pages < minPages) {
                minPages = b.stats.pages;
                minID = id;
            }
        });
        const browser = this.pool.get(minID);
        if (browser === undefined) {
            throw Error("browser for id "+minID+" does not exist");
        }
        debugLog.pool("got browser with least pages, ID "+minID+", pages: "+browser.stats.pages);
        return browser;
    }
    // Gets the first browser which has not reached the 
    // maximum number of pages yet.
    async getBrowser() {
        debugLog.pool("getting a browser");
        for (const browser of this.pool.values()) {
            if (browser.stats.pages < this.params.maxPages) {
                return browser;
            }
        }
        // No browser or 
        // all browsers reached their maximum capacity of pages
        if (this.canAddBrowser()) {
            return await this.addBrowser();
        }
        // Max number of browsers so enqueue to the least busy browser
        return this.getBrowserLeastPages();
    }
    async renewBrowser(id:number) {
        debugLog.pool("renewing browser with ID "+id);
        await this.closeBrowser(id);
        await this.addBrowser();
    }
}
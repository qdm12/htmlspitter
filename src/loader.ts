import puppeteer from 'puppeteer';
import { CacheHTML } from './cache';
import { Pool } from './pool';
import { debugLog } from './logging';

export class Loader {
    badURLs: Set<string>;
    badURLsConfirmed: Set<string>;
    pool: Pool;
    cache: CacheHTML;
    timeout: number;
    constructor(pool: Pool, cache: CacheHTML, timeout: number) {
        this.badURLs = new Set<string>();
        this.badURLsConfirmed = new Set<string>();
        this.pool = pool;
        this.cache = cache;
        this.timeout = timeout;
    }
    spitHTML = async (url: string, wait: string | undefined) => {
        if (this.badURLsConfirmed.has(url)) {
            throw Error(url + " is a confirmed bad URL");
        }
        if (this.cache.hasValue(url)) {
            debugLog.loader("cache has HTML for URL " + url)
            return this.cache.getValueHTML(url);
        }
        const waitUntil = this.buildWaitUntil(wait);
        const browser = await this.pool.getBrowser();
        const page = await browser.createPage();
        await page.setRequestInterception(true);
        // Avoid all unecessary HTTP requests
        page.on('request', req => {
            if (this.requestIsAllowed(req)) {
                req.continue();
            } else {
                req.abort();
            }
        });
        // Load and wait for the page
        debugLog.loader("going to page " + url);
        try {
            await page.goto(url, {
                waitUntil,
                timeout: this.timeout,
            });
        } catch (e) {
            this.recordBadURL(url);
            throw e;
        }
        const t0 = this.cache.reduceSize();
        const t1 = this.cache.cleanOld();
        debugLog.loader("awaiting for HTML content");
        let html: string;
        try {
            html = await page.content();
        } catch (e) {
            this.recordBadURL(url);
            throw e;
        }
        page.close(); // async but no need to wait
        await t0, t1;
        this.cache.setValue(url, html); // async but no need to wait
        debugLog.loader("spitting HTML of URL " + url);
        return html;
    }
    recordBadURL = (url: string) => {
        if (this.badURLsConfirmed.has(url)) {
            return;
        } else if (this.badURLs.has(url)) {
            this.badURLs.delete(url);
            this.badURLsConfirmed.add(url);
        } else {
            this.badURLs.add(url);
        }
    }
    buildWaitUntil = (wait: string | undefined) => {
        let waitUntil: puppeteer.LoadEvent;
        switch (wait) {
            case "load":
                waitUntil = "load";
                break
            case "domcontentloaded":
                waitUntil = "domcontentloaded";
                break;
            case "2":
                waitUntil = "networkidle0";
                break;
            case "3":
                waitUntil = "networkidle2";
                break;
            case undefined:
                waitUntil = "networkidle0";
                break;
            default:
                throw Error(`wait parameter ${wait} is invalid`);
        }
        return waitUntil;
    }
    requestIsAllowed = (req: puppeteer.Request) => {
        const whitelist = [
            "document",
            "script",
            "xhr",
            "fetch"
        ];
        const url = req.url();
        if (!whitelist.includes(req.resourceType())) {
            debugLog.loader("unallowed resource type for resource URL: " + url);
            return false;
        }
        const blacklist = [
            "www.google-analytics.com",
            "/gtag/js",
            "gs.js",
            "analytics.js"
        ];
        for (const blacklisted of blacklist) {
            const arr = url.match(blacklisted);
            if (arr != null && arr.length > 0) {
                debugLog.loader("blacklisted resource URL: " + url);
                return false;
            }
        }
        return true;
    }
}
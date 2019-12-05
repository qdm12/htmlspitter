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
        // Check if it's in bad URLs
        if (this.badURLsConfirmed.has(url)) {
            throw Error(url + " is a confirmed bad URL");
        }
        // Check if it's in our cache
        if (this.cache.hasValue(url)) {
            debugLog.loader("cache has HTML for URL " + url)
            return this.cache.getValueHTML(url);
        }
        // Get a browser instance and create a page
        const browser = await this.pool.getBrowser();
        const page = await browser.createPage();
        const tasks = [];
        tasks.push(page.setCacheEnabled(false));
        // Avoid all unecessary HTTP requests
        tasks.push(page.setRequestInterception(true));
        page.on('request', req => {
            if (Loader.requestIsAllowed(req)) {
                req.continue();
            } else {
                req.abort();
            }
        });
        // Load and wait for the page
        debugLog.loader("going to page " + url);
        let html: string;
        try {
            await Promise.all(tasks);
            await page.goto(url, {
                waitUntil: Loader.buildWaitUntil(wait),
                timeout: this.timeout,
            });
            html = await page.content();
        } catch (e) {
            this.recordBadURL(url);
            throw e;
        }
        // Cleaning up
        page.close(); // async but no need to wait
        this.cache.reduceSize(); // async but no need to wait
        this.cache.cleanOld(); // async but no need to wait
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
    static buildWaitUntil = (wait: string | undefined) => {
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
    static requestIsAllowed = (req: puppeteer.Request) => {
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
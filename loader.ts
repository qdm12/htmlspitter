import puppeteer from 'puppeteer';
import { cacheHasValue, getCacheHTML, setCacheValue, cleanOldCache, cleanOlderCache } from './cache';

let browserWSEndpoint:string = "";

/**
 * Launch an instance of headless Chrome if no 
 * websocket endpoint is present (at start for example)
 */
export const initEndpointIfNeeded = async () => {
    if (browserWSEndpoint.length === 0) {
        const browser = await puppeteer.launch({headless:true});
        browserWSEndpoint = await browser.wsEndpoint();
    }
}


/**
 * 
 * @param url URL to prerender
 * @param wait Load event option for prerendering
 */
export const spitHTML = async (url:string, wait:string|undefined) => {
    if (cacheHasValue(url)) {
        return getCacheHTML(url);
    }
    // TODO check url format
    const urlObj = new URL(url);
    let waitUntil:puppeteer.LoadEvent;
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
            throw Error("wait parameter ${wait} is invalid");
    }
    const connOptions:puppeteer.ConnectOptions = {
        browserWSEndpoint
    };
    const browser = await puppeteer.connect(connOptions);
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    // Avoid all unecessary HTTP requests
    page.on('request', req => {
        const whitelist = [
            "document",
            "script",
            "xhr",
            "fetch"
        ];
        const url = req.url();
        if (!whitelist.includes(req.resourceType())) {
            return req.abort();
        }
        const blacklist = [
            "www.google-analytics.com",
            "/gtag/js",
            "gs.js",
            "analytics.js"
        ];
        let blacklisted = false;
        blacklist.forEach(s => {
            const arr = url.match(s);
            if (arr != null && arr.length > 0) {
                blacklisted = true
            }
        });
        if (blacklisted) {
            return req.abort();
        }
        req.continue();
    });
    // Load and wait for the page
    await page.goto(url, {
        waitUntil
    });
    const t0 = cleanOldCache();
    const t1 = cleanOlderCache();
    const html = await page.content();
    page.close(); // async but no need to wait
    await t0, t1;
    setCacheValue(url, html); // async but no need to wait
    return html;
}

async function onExit(browser:puppeteer.Browser) {
    await browser.close();
}
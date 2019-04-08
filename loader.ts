import puppeteer from 'puppeteer';
import { cacheHasValue, getCacheHTML, setCacheValue, cleanOldCache, cleanOlderCache } from './cache';

let browser:puppeteer.Browser;
const connOptions:puppeteer.ConnectOptions = {};

/**
 * Set up a web socket endpoint to a Chromium browser.
 * It launches a Chromium instance if none is found.
 */
export const initEndpointIfNeeded = async () => {
    if (browser === null) {
        await initBrowser();
        const newBrowser:puppeteer.Browser = browser;
        if (newBrowser === null) {
            throw Error("browser was initiated but is still null");
        } else {
            browser = newBrowser;
            connOptions.browserWSEndpoint = await browser.wsEndpoint();
        }
    } else if (connOptions.browserWSEndpoint === undefined) {
        try {
            connOptions.browserWSEndpoint = await browser.wsEndpoint();
        } catch(e) {
            console.warn(e);
            await initBrowser();
            connOptions.browserWSEndpoint = await browser.wsEndpoint();
        }
    }
}

/**
 * Launch an instance of headless Chrome
 * @returns puppeteer launched browser
 */
export const initBrowser = async () => {
    let executablePath:string|undefined = undefined;
    if (process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD === "1") {
        console.log("Using OS chromium");
        executablePath = "/usr/bin/chromium-browser";
    } else {
        console.log("Using Puppeteer bundled chromium")
    }
    browser = await puppeteer.launch({
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
}

/**
 * 
 * @param url URL to prerender
 * @param wait Load event option for prerendering
 * @returns string of loaded html
 */
export const spitHTML = async (url:string, wait:string|undefined) => {
    if (cacheHasValue(url)) {
        return getCacheHTML(url);
    }
    // TODO check url format
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
import puppeteer from 'puppeteer';
import { cacheHasValue, getCacheHTML, setCacheValue, cleanOldCache, cleanOlderCache } from './cache';

type chromiumPathType = "/usr/bin/chromium-browser" | undefined

let browser:puppeteer.Browser;
let executablePath:chromiumPathType;
const connOptions:puppeteer.ConnectOptions = {};

export const init = async () => {
    if (process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD === "1") {
        console.log("Using OS chromium");
        executablePath = "/usr/bin/chromium-browser";
    } else {
        console.log("Using Puppeteer bundled chromium")
        executablePath = undefined;
    }
    browser = await createBrowser(executablePath);
}

/**
 * Set up a web socket endpoint to a Chromium browser.
 * It launches a Chromium instance if none is found.
 */
export const initEndpointIfNeeded = async () => {
    if (browser === null) {
        browser = await createBrowser(executablePath);
        if (browser === null) {
            throw Error("browser was initiated but is still null");
        }
        connOptions.browserWSEndpoint = await browser.wsEndpoint();
    } else if (connOptions.browserWSEndpoint === undefined) {
        try {
            connOptions.browserWSEndpoint = await browser.wsEndpoint();
        } catch(e) {
            console.warn(e);
            browser = await createBrowser(executablePath);
            connOptions.browserWSEndpoint = await browser.wsEndpoint();
        }
    }
}

/**
 * Launch and return an instance of headless Chrome
 * @returns puppeteer launched browser
 */
export const createBrowser = async (executablePath:chromiumPathType) => {
    return await puppeteer.launch({
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
    const waitUntil = buildWaitUntil(wait);
    const browser = await puppeteer.connect(connOptions);
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    // Avoid all unecessary HTTP requests
    page.on('request', req => {
        if (requestIsAllowed(req)) {
            req.continue();
        } else {
            req.abort();
        }
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

const buildWaitUntil = (wait:string|undefined) => {
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
            throw Error("waitS parameter ${wait} is invalid");
    }
    return waitUntil;
}

const requestIsAllowed = (req:puppeteer.Request) => {
    const whitelist = [
        "document",
        "script",
        "xhr",
        "fetch"
    ];
    const url = req.url();
    if (!whitelist.includes(req.resourceType())) {
        return false;
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
        return false;
    }
    return true;
}
import puppeteer from 'puppeteer';
import { CacheHTML } from './cache';
import { Pool } from './pool';

/**
 * 
 * @param url URL to prerender
 * @param wait Load event option for prerendering
 * @returns string of loaded html
 */
export const spitHTML = async (
    url:string,
    wait:string|undefined,
    pool:Pool,
    cache:CacheHTML) => {
    if (cache.hasValue(url)) {
        return cache.getValueHTML(url);
    }
    // TODO check url format
    const waitUntil = buildWaitUntil(wait);
    const browser = await pool.getBrowser();
    const page = await browser.createPage();
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
    const t0 = cache.reduceSize();
    const t1 = cache.cleanOld();
    const html = await page.content();
    page.close(); // async but no need to wait
    await t0, t1;
    cache.setValue(url, html); // async but no need to wait
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
interface cacheValue {
    createdAt:Date
    html:string
}

const CACHE = new Map<string, cacheValue>();
const CACHE_SIZE_LIMIT = 1000;
let CACHE_SIZE:number = 0;

const newCacheValue = (html:string) => ({
        createdAt: new Date(),
        html,
    });

export const getCacheHTML = (url:string) => {
    const value = CACHE.get(url);
    if (value === undefined) {
        throw Error("value of cache for URL ${url} is undefined");
    }
    return value.html;
};

const getCacheUnixTimestamp = (url:string) => {
    const value = CACHE.get(url);
    if (value === undefined) {
        throw Error("value of cache for URL ${url} is undefined");
    }
    return value.createdAt.valueOf() * 1000;
};

const getCacheValueSize = (url:string) => {
    const value = CACHE.get(url);
    if (value === undefined) {
        return 0;
    }
    return value.html.length;
}

const getCacheAgeSeconds = (url:string) => 
getCacheUnixTimestamp(url) - new Date().valueOf()*1000;

export const setCacheValue = async (url:string, html:string) => {
    CACHE_SIZE -= getCacheValueSize(url); // if we replace existing value
    CACHE.set(url, newCacheValue(html));
    CACHE_SIZE += getCacheValueSize(url);
}

export const cacheHasValue = (url:string) => CACHE.has(url);

// Return the keys of the cache sorted by age
const getCacheSortedKeys = () => {
    let sortedKeys = Array.from(CACHE.keys());
    sortedKeys.sort((k1, k2) => 
        getCacheUnixTimestamp(k1) - getCacheUnixTimestamp(k2));
    return sortedKeys;
}

export const cleanOldCache = async () => {
    // remove elements older than 1 hour
    let expiredKeys:string[] = [];
    CACHE.forEach(
        (v, k) => {
            if (getCacheAgeSeconds(k) > 3600) {
                CACHE_SIZE -= v.html.length;
                expiredKeys.push(k);
            }
        }
    );
    expiredKeys.forEach((v, i) => CACHE.delete(v));
}

// remove oldest elements to reduce cache size
export const cleanOlderCache = async () => {
    if (CACHE_SIZE < CACHE_SIZE_LIMIT) {
        return;
    }
    const sortedKeys = getCacheSortedKeys();
    let i = 0;
    while (CACHE_SIZE > CACHE_SIZE_LIMIT) {
        const key = sortedKeys[i];
        CACHE_SIZE -= getCacheValueSize(key);
        CACHE.delete(key);
        i++;
    }
}

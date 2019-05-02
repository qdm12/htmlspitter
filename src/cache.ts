import { debugLog } from "./logging";

class Value {
    url: string;
    html: string;
    size: number; // bytes
    created: Date;
    constructor(url: string, html: string) {
        this.url = url;
        this.html = html;
        this.size = 2 * (url.length + html.length);
        this.created = new Date();
    }
}

export class CacheHTML {
    map: Map<string, Value>;
    maxSize: number;
    size: number; // bytes
    constructor(maxSize: number) {
        this.map = new Map<string, Value>();
        this.maxSize = maxSize;
        this.size = 0;
    }
    getValue(url: string) {
        const value = this.map.get(url);
        if (value === undefined) {
            throw Error("value of cache for URL ${url} is undefined");
        }
        return value;
    }
    getValueHTML(url: string) {
        return this.getValue(url).html;
    }
    getValueTimestamp(url: string) {
        return this.getValue(url).created.valueOf() / 1000;
    }
    getValueSize(url: string) {
        return this.getValue(url).size;
    }
    getValueAge(url: string) { // seconds
        return this.getValueTimestamp(url) - new Date().valueOf() / 1000;
    }
    setValue(url: string, html: string) {
        const value = new Value(url, html);
        this.size += value.size;
        this.map.set(url, value);
    }
    hasValue(url: string) {
        return this.map.has(url);
    }
    deleteValue(url: string) {
        this.size -= this.getValueSize(url);
        this.map.delete(url);
    }
    getKeysSortedByAge() {
        const sortedKeys = Array.from(this.map.keys());
        sortedKeys.sort((k1, k2) =>
            this.getValueTimestamp(k1) - this.getValueTimestamp(k2));
        return sortedKeys;
    }
    cleanOld() {
        // remove elements older than 1 hour
        const expiredKeys: Set<string> = new Set<string>();
        this.map.forEach(
            (v, url) => {
                if (this.getValueAge(url) > 3600) {
                    expiredKeys.add(url);
                }
            }
        );
        for (const url of expiredKeys.values()) {
            debugLog.cache("cleaning old URL " + url);
            this.deleteValue(url);
        }
    }
    reduceSize() {
        if (this.size < this.maxSize) {
            return;
        }
        const sortedKeys = this.getKeysSortedByAge();
        let i = 0;
        while (this.size > this.maxSize) {
            const url = sortedKeys[i];
            debugLog.cache("reducing size removing URL " + url);
            this.deleteValue(url);
            i++;
            if (i > sortedKeys.length) {
                break;
            }
        }
    }
}
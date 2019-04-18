import {createLogger, format, transports, Logger} from "winston";
import { TransformFunction, TransformableInfo } from "logform";

const MESSAGE = Symbol.for('message');

const jsonFormatter:TransformFunction = (logEntry:any) => {
    const base = { timestamp: new Date() };
    const obj = Object.assign(base, logEntry)
    logEntry[MESSAGE] = JSON.stringify(obj);
    return logEntry;
}

export let logger:Logger;

export const initLogger = (json:boolean) => {
    const _format:any = json ? format(jsonFormatter)() : undefined;
    logger = createLogger({
        level: "info",
        format: _format,
        transports: new transports.Console(),
    });
}

export const debugLog = {
    main: require('debug')('htmlspitter:main'),
    browser: require('debug')('htmlspitter:browser'),
    server: require('debug')('htmlspitter:server'),
    pool: require('debug')('htmlspitter:pool'),
    params: require('debug')('htmlspitter:params'),
    cache: require('debug')('htmlspitter:cache'),
    loader: require('debug')('htmlspitter:loader'),
}
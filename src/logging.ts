import {createLogger, format, transports, Logger} from "winston";
import { Format } from "logform";

export let logger:Logger;

export const initLogger = (json:boolean) => {
    const f:Format|undefined = json ? format.combine(
        format.timestamp(),
        format.json()
    ) : format.combine(
        format.colorize(),
        format.cli()
    );
    logger = createLogger({
        level: "info",
        format: f,
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
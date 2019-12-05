import { createLogger, format, transports, Logger } from "winston";

export let logger: Logger = createLogger({
    level: "info",
    format: format.combine(format.colorize(), format.cli()),
    transports: new transports.Console(),
});

export const setLoggerFormat = (s: string) => {
    switch (s) {
        case "json":
            logger.format = format.combine(format.json(), format.timestamp());
            break;
        case "normal":
            logger.format = format.combine(format.cli(), format.colorize());
            break;
        default:
            throw Error(`Logger format '${s}' is unrecognized`);
    }
}

export const silence = (silent: boolean) => logger.silent = silent;

export const debugLog = {
    main: require('debug')('htmlspitter:main'),
    browser: require('debug')('htmlspitter:browser'),
    server: require('debug')('htmlspitter:server'),
    pool: require('debug')('htmlspitter:pool'),
    params: require('debug')('htmlspitter:params'),
    cache: require('debug')('htmlspitter:cache'),
    loader: require('debug')('htmlspitter:loader'),
}
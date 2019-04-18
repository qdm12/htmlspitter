import {createLogger, format, transports} from "winston";
import { TransformFunction, TransformableInfo } from "logform";

const MESSAGE = Symbol.for('message');

const jsonFormatter:TransformFunction = (logEntry:any) => {
  const base = { timestamp: new Date() };
  const obj = Object.assign(base, logEntry)
  logEntry[MESSAGE] = JSON.stringify(obj);
  return logEntry;
}

export const logger = createLogger({
  level: "info",
  format: format(jsonFormatter)(),
  transports: new transports.Console(),
});

export const debugLog = {
  main: require('debug')('htmlspitter:main'),
  browser: require('debug')('htmlspitter:browser'),
  server: require('debug')('htmlspitter:server'),
  pool: require('debug')('htmlspitter:pool'),
}
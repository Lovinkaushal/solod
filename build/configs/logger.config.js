"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const enumerateErrorFormat = winston_1.default.format((info) => {
    if (info instanceof Error) {
        Object.assign(info, { message: info.stack });
    }
    return info;
});
const logger = winston_1.default.createLogger({
    format: winston_1.default.format.combine(enumerateErrorFormat(), winston_1.default.format.colorize(), winston_1.default.format.splat(), winston_1.default.format.printf(({ level, message }) => `${new Date().toISOString()} ${level}: ${message}`)),
    transports: [
        new winston_1.default.transports.Console({
            stderrLevels: ["error"],
        }),
        new winston_1.default.transports.File({
            level: 'error',
            filename: 'logs/error.log'
        })
    ],
});
exports.default = logger;

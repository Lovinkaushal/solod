"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PAYMENT_STATUS = exports.jwtSecret = exports.USER_STATUS = void 0;
const jwtSecret = process.env.SECRET || 'secret';
exports.jwtSecret = jwtSecret;
const USER_STATUS = {
    APPROVED: 'APPROVED',
    PENDING: 'PENDING',
    DECLINED: 'DECLINED'
};
exports.USER_STATUS = USER_STATUS;
const PAYMENT_STATUS = {
    PENDING: 'PENDING',
    PAID: 'PAID',
};
exports.PAYMENT_STATUS = PAYMENT_STATUS;

"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const config = () => {
    return {
        host: process.env.EMAIL_HOST || '',
        port: process.env.EMAIL_PORT || '',
        secure: true,
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_EMAIL || '',
            pass: process.env.GMAIL_PASSWORD || '',
        }
    };
};
const sendEmail = (from, subject, to, template) => __awaiter(void 0, void 0, void 0, function* () {
    // @ts-ignore
    let transporter = nodemailer_1.default.createTransport(config());
    const response = yield transporter.sendMail({
        from,
        to,
        subject,
        html: template, // html body
    });
    return response;
});
exports.sendEmail = sendEmail;

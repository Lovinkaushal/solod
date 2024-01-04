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
exports.authenticateClient = exports.authenticateBoth = exports.authenticateAdmin = void 0;
const common_util_1 = require("../utils/common.util");
const response_util_1 = require("../utils/response.util");
const db_helpers_1 = require("../helpers/db.helpers");
const token_model_1 = __importDefault(require("../models/token.model"));
// Authentication for admin
const authenticateAdmin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const decoded = (0, common_util_1.verifyToken)(authHeader);
        // @ts-ignore
        if (decoded && (decoded === null || decoded === void 0 ? void 0 : decoded.access) == 'admin') {
            const token = yield (0, db_helpers_1.findOne)(token_model_1.default, { token: authHeader });
            if (token) {
                return (0, response_util_1.responseWithStatus)(res, 400, {
                    data: null,
                    error: 'Unauthorized',
                    message: '',
                    status: 401
                });
            }
            req.body.user = decoded;
            next();
        }
        else {
            return (0, response_util_1.responseWithStatus)(res, 400, {
                data: null,
                error: 'Unauthorized',
                message: '',
                status: 401
            });
        }
    }
    else {
        return (0, response_util_1.responseWithStatus)(res, 400, {
            data: null,
            error: 'Unauthorized',
            message: '',
            status: 401
        });
    }
});
exports.authenticateAdmin = authenticateAdmin;
// Authentication for admin and client
const authenticateBoth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const decoded = (0, common_util_1.verifyToken)(authHeader);
        // @ts-ignore
        if (decoded) {
            const token = yield (0, db_helpers_1.findOne)(token_model_1.default, { token: authHeader });
            if (token) {
                return (0, response_util_1.responseWithStatus)(res, 400, {
                    data: null,
                    error: 'Unauthorized',
                    message: '',
                    status: 401
                });
            }
            req.body.user = decoded;
            next();
        }
        else {
            return (0, response_util_1.responseWithStatus)(res, 400, {
                data: null,
                error: 'Unauthorized',
                message: '',
                status: 401
            });
        }
    }
    else {
        return (0, response_util_1.responseWithStatus)(res, 400, {
            data: null,
            error: 'Unauthorized',
            message: '',
            status: 401
        });
    }
});
exports.authenticateBoth = authenticateBoth;
// Authentication for client
const authenticateClient = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const decoded = (0, common_util_1.verifyToken)(authHeader);
        // @ts-ignore
        if (decoded && (decoded === null || decoded === void 0 ? void 0 : decoded.access) == 'client') {
            const token = yield (0, db_helpers_1.findOne)(token_model_1.default, { token: authHeader });
            if (token) {
                return (0, response_util_1.responseWithStatus)(res, 400, {
                    data: null,
                    error: 'Unauthorized',
                    message: '',
                    status: 401
                });
            }
            req.body.user = decoded;
            next();
        }
        else {
            return (0, response_util_1.responseWithStatus)(res, 400, {
                data: null,
                error: 'Unauthorized',
                message: '',
                status: 401
            });
        }
    }
    else {
        return (0, response_util_1.responseWithStatus)(res, 400, {
            data: null,
            error: 'Unauthorized',
            message: '',
            status: 401
        });
    }
});
exports.authenticateClient = authenticateClient;

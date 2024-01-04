import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/common.util'
import { responseWithStatus } from '../utils/response.util';
import { findOne } from '../helpers/db.helpers';
import tokenModel from '../models/token.model';

// Authentication for admin
export const authenticateAdmin = async(req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const decoded = verifyToken(authHeader);
        // @ts-ignore
        if (decoded && decoded?.access=='admin') {
            const token = await findOne(tokenModel, { token: authHeader });
            if(token){
                return responseWithStatus(res, 400, {
                    data: null,
                    error: 'Unauthorized',
                    message: '',
                    status: 401
                })
            }
            req.body.user = decoded;
            next();
        } else {
            return responseWithStatus(res, 400, {
                data: null,
                error: 'Unauthorized',
                message: '',
                status: 401
            })
        }
    } else {
        return responseWithStatus(res, 400, {
            data: null,
            error: 'Unauthorized',
            message: '',
            status: 401
        })
    }
}

// Authentication for admin and client
export const authenticateBoth = async(req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const decoded = verifyToken(authHeader);
        // @ts-ignore
        if (decoded) {
            const token = await findOne(tokenModel, { token: authHeader });
            if(token){
                return responseWithStatus(res, 400, {
                    data: null,
                    error: 'Unauthorized',
                    message: '',
                    status: 401
                })
            }
            req.body.user = decoded;
            next();
        } else {
            return responseWithStatus(res, 400, {
                data: null,
                error: 'Unauthorized',
                message: '',
                status: 401
            })
        }
    } else {
        return responseWithStatus(res, 400, {
            data: null,
            error: 'Unauthorized',
            message: '',
            status: 401
        })
    }
}

// Authentication for client
export const authenticateClient = async(req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const decoded = verifyToken(authHeader);
        // @ts-ignore
        if (decoded && decoded?.access=='client') {
            const token = await findOne(tokenModel, { token: authHeader });
            if(token){
                return responseWithStatus(res, 400, {
                    data: null,
                    error: 'Unauthorized',
                    message: '',
                    status: 401
                })
            }
            req.body.user = decoded;
            next();
        } else {
            return responseWithStatus(res, 400, {
                data: null,
                error: 'Unauthorized',
                message: '',
                status: 401
            })
        }
    } else {
        return responseWithStatus(res, 400, {
            data: null,
            error: 'Unauthorized',
            message: '',
            status: 401
        })
    }
}



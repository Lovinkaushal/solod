import { Route, Controller, Tags, Post, Body, Security, Query, UploadedFile, Get, Put, FormField, Path } from 'tsoa'
import { Request, Response, response } from 'express';
import { IResponse } from '../utils/interfaces.util';
import { findOne, getById, upsert, getAll, getAggregation, getAllBySort, findAll, getFilterMonthDateYear, deleteById, getAllWithoutPaging, deleteMany, update } from '../helpers/db.helpers';
import clientModel from '../models/client.model';
import logger from '../configs/logger.config';
import redTokenTransactionModel from '../models/redTokenTransaction.model';
import { validateFutureRedTransaction, validatePropertyTrasaction, validateTransactionToBuyProperty } from '../validations/transaction.validator';
import adminModel from '../models/admin.model';
import agreementModel from '../models/agreement.model';
import mongoose from 'mongoose';

@Tags('Transaction')
@Route('api/transaction')
export default class ClientController extends Controller {
    req: Request;
    res: Response;
    userId: string
    constructor(req: Request, res: Response) {
        super();
        this.req = req;
        this.res = res;
        this.userId = req.body.user ? req.body.user.id : ''
    }
    /**
        * Transaction of buy future red from Admin
        */
    @Security('Bearer')
    @Post("/transactionOfBuyFutureRed")
    public async transactionOfBuyFutureRed(@Body() request: { redToken: string }): Promise<IResponse> {
        try {
            const { redToken } = request;
            const validatedTransaction = validateFutureRedTransaction({ redToken });
            if (validatedTransaction.error) {
                throw new Error(validatedTransaction.error.message)
            }
            const data = await getById(clientModel, this.userId);
            const clientRedTokenData = data.redToken;

            const data2 = await findOne(adminModel, {});
            const adminRedTokenData = data2.totalRedToken;

            if (clientRedTokenData < redToken) {
                throw new Error("User doesn't have enough tokens");
            }
            if (data2.futureRed < redToken) {
                throw new Error("Admin doesn't have enough Future Red");
            }

            const clientRedToken = clientRedTokenData - Number(redToken);
            const clientFutureRed = +(data.futureRed) + +redToken;


            const adminRedToken = +adminRedTokenData + +redToken;
            const adminFutureRed = data2.futureRed - Number(redToken);

            const getResponse = await upsert(clientModel, { redToken: clientRedToken, futureRed: clientFutureRed }, this.userId);
            const getResponse2 = await upsert(adminModel, { futureRed: adminFutureRed, totalRedToken: adminRedToken }, data2._id);

            return {
                data: { getResponse, getResponse2 },
                error: '',
                message: 'Future Red Purchase Successfully',
                status: 200
            }
        }
        catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`)
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            }
        }
    }
    /**
     * Transaction to lease a property
     */
    @Security('Bearer')
    @Post("/transactionToLeaseProperty")
    public async transactionToLeaseProperty(@Body() request: { amount: string, propertyId: string, accountType: string, agreementId: string }): Promise<IResponse> {
        try {
            const { amount, propertyId, accountType, agreementId } = request;
            const validatedTransaction = validateTransactionToBuyProperty({ amount, propertyId });

            if (validatedTransaction.error) {
                throw new Error(validatedTransaction.error.message);
            }
            const exists = await agreementModel.findOne({ _id: agreementId });
            const userData = await getById(clientModel, this.userId);
            const isAdmin = (accountType === 'Primary') ? false : true;
            const adminField = isAdmin ? 'businessRedToken' : 'redToken';
            const data2 = await findOne(adminModel, {});

            if (Number(userData[adminField]) < Number(amount)) {
                throw new Error("User doesn't have enough tokens");
            }

            // Calculate new token balances
            const clientRedToken = userData[adminField] - Number(amount);
            const adminRedToken = data2.totalRedToken + Number(amount);

            // Update user's token balance
            const updateUserResponse = await upsert(clientModel, { [adminField]: clientRedToken }, this.userId);

            // Update admin's total token balance
            const updateAdminResponse = await upsert(adminModel, { totalRedToken: adminRedToken }, data2._id);
            const saveResponse = await upsert(agreementModel, { status: 'APPROVED' }, exists._id);

            // Save the transaction details
            const user = await findOne(clientModel, { _id: this.userId });
            const transactionResponse = await upsert(redTokenTransactionModel, {
                senderId: this.userId,
                accountType: user.accountType,
                receiverId: data2._id,
                totalRedToken: amount,
                propertyId: propertyId,
                status: "APPROVED",
            });

            return {
                data: { transactionResponse },
                error: '',
                message: 'Booking Amount Paid Successfully',
                status: 200
            };
        } catch (error: any) {
            logger.error(`${this.req.ip} ${error.message}`);
            return {
                data: null,
                error: error.message ? error.message : 'An error occurred',
                message: '',
                status: 400
            };
        }
    }

    /**
  * Get transaction Booking/Lease payments of property
  */
    @Security('Bearer')
    @Get("/getLeaseTransactionsDetails")
    public async getLeaseTransactionsDetails(
        @Query('pageNumber') pageNumber: number,
        @Query('pageSize') pageSize: number): Promise<IResponse> {
        try {
            const query = {
                $or: [
                    { senderId: this.userId },
                    { receiverId: this.userId }
                ]
            };
            const sendData = await getAll(redTokenTransactionModel, query, +pageNumber, +pageSize);
            const items = sendData.items.map(item => {
                if (item.transactionType !== "Buy RED") {
                    const transactionType = item.senderId.toString() === this.userId.toString() ? 'Paid' : 'Receive RED';
                    return {
                        ...item,
                        transactionType
                    };
                }
                return {
                    ...item,
                };
            });

            return {
                data: { items, pageNumber: sendData.pageNumber, pageSize: sendData.pageSize, totalItems: sendData.totalItems },
                error: '',
                message: 'Lease Property Transaction Details fetched Successfully',
                status: 200
            };
        } catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`);
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            };
        }
    }
    /*
*Get All admin redtoken and solos reward transactions 
*/
    @Security('Bearer')
    @Get("/getRedAndSolosTransactionByUser")
    public async getRedAndSolosTransactionByUser(
        @Query('pageNumber') pageNumber: number,
        @Query('pageSize') pageSize: number
    ): Promise<IResponse> {
        try {
            const skip = (pageNumber - 1) * pageSize;
            const totalCount = await redTokenTransactionModel.countDocuments({});
            const transactionData = await redTokenTransactionModel.aggregate([
                {
                    $match: {
                        senderId: mongoose.Types.ObjectId(this.userId),
                        transactionType: { $in: ['Red Token', 'Solos Reward'] }
                    }
                },
                {
                    $lookup: {
                        from: "clients",
                        localField: "receiverId",
                        foreignField: "_id",
                        as: "clientDetails"
                    }
                },
                {
                    $sort: { createdAt: -1 } // Sort by createdAt in descending order
                },
                {
                    $skip: Number(pageNumber - 1) * Number(pageSize)
                },
                {
                    $limit: Number(pageSize)
                },
                {
                    $project: {
                        transactionType: 1,
                        totalRedToken: 1,
                        solosReward: 1,
                        createdAt: 1,
                        clientDetails: { $arrayElemAt: ["$clientDetails.userName", 0] }
                    }
                }
            ]);
            return {
                data: { transactionData, totalCount },
                error: '',
                message: 'All Red token and Solos Reward Transactions Data fetched Successfully',
                status: 200
            };
        } catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`);
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            };
        }
    }
    /*
*Get All admin solos reward transactions 
*/
    @Security('Bearer')
    @Get("/getSolosTransactionByUser")
    public async getSolosTransactionByUser(
        @Query('pageNumber') pageNumber: number,
        @Query('pageSize') pageSize: number
    ): Promise<IResponse> {
        try {
            const skip = (pageNumber - 1) * pageSize;
            const totalCount = await redTokenTransactionModel.countDocuments({});
            const transactionData = await redTokenTransactionModel.aggregate([
                {
                    $match: {
                        senderId: mongoose.Types.ObjectId(this.userId),
                        transactionType: 'Solos Reward'
                    }
                },
                {
                    $lookup: {
                        from: "clients",
                        localField: "receiverId",
                        foreignField: "_id",
                        as: "clientDetails"
                    }
                },
                {
                    $sort: { createdAt: -1 } // Sort by createdAt in descending order
                },
                {
                    $skip: Number(pageNumber - 1) * Number(pageSize)
                },
                {
                    $limit: Number(pageSize)
                },
                {
                    $project: {
                        transactionType: 1,
                        totalRedToken: 1,
                        solosReward: 1,
                        createdAt: 1,
                        clientDetails: { $arrayElemAt: ["$clientDetails.userName", 0] }
                    }
                }
            ]);
            return {
                data: { transactionData, totalCount },
                error: '',
                message: 'All Solos Reward Transactions Data fetched Successfully',
                status: 200
            };
        } catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`);
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            };
        }
    }
    /**
       * Save transaction of Red and solos reward token
       */
    @Security('Bearer')
    @Post("/saveTransactionOfRedAndSoloReward")
    public async saveTransactionOfRedAndSoloReward(@Body() request: { userName: string, token: string, transactionType: string, walletAddress: string, hashId: string }): Promise<IResponse> {
        try {
            const { userName, token, transactionType, walletAddress, hashId } = request;
            const senderData = await getById(clientModel, this.userId);


            const upperCaseUserName = userName.toUpperCase();
            const upperCaseSenderUserName = senderData.userName.toUpperCase();

            if (upperCaseUserName === upperCaseSenderUserName || userName === senderData.businessUserName) {
                throw new Error("You can't send red token to yourself");
            }

            const receiverData = await clientModel.findOne({
                $or: [{ userName: upperCaseUserName }, { businessUserName: upperCaseUserName }]
            });
            let solosToken;
            let redToken;
            if (transactionType === 'Solos Reward') {
                solosToken = token;
            } else {
                redToken = token;
            }
            // Save transaction details
            const sender = await findOne(clientModel, { _id: this.userId });
            const transactionResponse = await upsert(redTokenTransactionModel, {
                senderId: this.userId,
                receiverId: receiverData._id,
                senderUsername: sender.userName,
                receiverUsername: upperCaseUserName,
                totalRedToken: redToken,
                solosReward: solosToken,
                walletAddress: walletAddress,
                hashId: hashId,
                transactionType: transactionType,
                status: "APPROVED",
            });

            return {
                data: { transactionResponse },
                error: '',
                message: 'Transaction Save Successfully',
                status: 200
            };
        } catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`);
            return {
                data: null,
                error: err.message ? err.message : 'An error occurred',
                message: '',
                status: 400
            };
        }
    }


}
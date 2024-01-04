import { Route, Controller, Tags, Post, Body, Get, Security, Query, Put, FormField, UploadedFile, UploadedFiles, Delete } from 'tsoa'
import { IResponse } from '../utils/interfaces.util';
import { Request, Response } from 'express'
import { findOne, getById, upsert, getAll, getAggregation, deleteById } from '../helpers/db.helpers';
import clientModel from '../models/client.model';
import axios from 'axios';
import mongoose from 'mongoose';
import transactionModel from '../models/transaction.model';
import fredNftModel from '../models/fredNft.model';
import userNftModel from '../models/userNft.model';

@Tags('Booq')
@Route('api/booq')
export default class BooqController extends Controller {
    req: Request;
    res: Response;
    userId: string;
    constructor(req: Request, res: Response) {
        super();
        this.req = req;
        this.res = res;
        this.userId = req.body.user ? req.body.user.id : ''
    }

    /**
     * User login in the booq
     */
    @Post("/userLoginBooq")
    public async userLoginBooq(@Body() request: { user_name: string, password: string }): Promise<IResponse> {
        try {

            let { user_name, password } = request;
            let tenantid = process.env.TENANT_ID;
            let grantType: any = process.env.GRANT_TYPE;
            let clientID: any = process.env.CLIENT_ID;
            let clientSecret: any = process.env.CLIENT_SECRET;

            const appDomain = `${process.env.BOOQ_URL}/oauth/token`;
            const headers: any = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'tenantid': tenantid
            };

            const data = new URLSearchParams();
            data.append('username', user_name);
            data.append('password', password);
            data.append('grant_type', grantType);
            data.append('client_id', clientID);
            data.append('client_secret', clientSecret);

            let response = await axios.post(appDomain, data, { headers });
            if (response.status == 200) {
                const result = response.data;

                return {
                    data: result,
                    error: '',
                    message: 'Login Success',
                    status: 200
                }

            } else {

                return {
                    data: null,
                    error: '',
                    message: "Invalid credentials!",
                    status: 401
                }
            }

        }
        catch (err: any) {
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            }
        }
    }


    /**
     * User search in the booq platform
     */
    @Post("/searchUserInBooq")
    public async searchUserInBooq(@Body() request: { phone_number: string, access_token: string }): Promise<IResponse> {
        try {

            let { phone_number, access_token } = request;
            let tenantid = process.env.TENANT_ID;

            let sendingResult: any = {};

            const appDomain = `${process.env.BOOQ_URL}/v1/clients?mobileNo=${phone_number}`;
            const headers: any = {
                'tenantid': tenantid,
                'authorization': `Bearer ${access_token}`
            };
            let response = await axios.get(appDomain, { headers });
            if (response.status == 200) {
                const result = response.data.pageItems[0];

                sendingResult.userId = result?.id;
                sendingResult.accountNo = result?.accountNo;
                sendingResult.active = result?.active;
                sendingResult.firstname = result?.firstname;
                sendingResult.lastname = result?.lastname;
                sendingResult.displayName = result?.displayName;
                sendingResult.mobileNo = result?.mobileNo;
                sendingResult.emailAddress = result?.emailAddress;
                sendingResult.clientTypes = result?.clientTypes;
                sendingResult.savingsAccountId = result?.savingsAccountId;
            } else {
                throw new Error("User not valid!");
            }

            const appDomainAccount = `${process.env.BOOQ_URL}/v1/savingsaccounts/${sendingResult?.accountNo}`;
            let response_account = await axios.get(appDomainAccount, { headers });
            if (response_account.status == 200) {
                const result = response_account.data;

                sendingResult.currencyCcode = result?.summary?.currency?.code;
                sendingResult.displaySymbol = result?.summary?.currency?.displaySymbol;
                sendingResult.totalDeposits = result?.summary?.totalDeposits;
                sendingResult.totalInterestPosted = result?.summary?.totalInterestPosted;
                sendingResult.accountBalance = result?.summary?.accountBalance;
                sendingResult.availableBalance = result?.summary?.availableBalance;
                sendingResult.interestNotPosted = result?.summary?.interestNotPosted;
                sendingResult.totalOverdraftInterestDerived = result?.summary?.totalOverdraftInterestDerived;
                sendingResult.bankDetails = result?.bankDetails ?? null;
            } else {
                throw new Error("Account not found!");
            }

            return {
                data: sendingResult,
                error: '',
                message: 'Login Success',
                status: 200
            }

        }
        catch (err: any) {
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            }
        }
    }

    /**
     * Amount Transfer to SOLO
     */
    @Security('Bearer')
    @Post("/transferAmount")
    public async transferAmount(@Body() request: { userId: string, amount: string, redToken: string, access_token: string }): Promise<IResponse> {
        try {

            let { userId, amount, redToken, access_token } = request;
            let tenantid = process.env.TENANT_ID;


            const appDomain = `${process.env.BOOQ_URL}/v1/clients/${userId}`;
            const headers: any = {
                'authorization': `Bearer ${access_token}`,
                'content-type': 'application/json',
                'tenantid': tenantid,
            };

            let responseAccountInfo = await axios.get(appDomain, { headers });
            if (responseAccountInfo.status == 200) {

                const result = responseAccountInfo.data;

                const appDomainAccount = `${process.env.BOOQ_URL}/v1/savingsaccounts/${result?.accountNo}`;
                let response_account = await axios.get(appDomainAccount, { headers });
                if (response_account.status == 200) {
                    const result = response_account.data;

                    if (result?.summary?.availableBalance < amount) {
                        throw new Error(`Balance insufficient, only $${result?.summary?.availableBalance} available in the account.`);
                    }

                } else {
                    throw new Error("Account not found!");
                }

            } else {
                throw new Error("User not valid!");
            }


            // Define the request data and headers
            const requestData = {
                type: 'CREDIT',
                paymentType: 'INTERNAL',
                amount: amount,
                debtor: {
                    identifier: `id:${userId}`,
                    accountType: 'SAVINGS',
                },
                creditor: {
                    identifier: `id:${process.env.SOLO_ID}`,
                    name: `${process.env.SOLO_NAME}`,
                    accountType: 'SAVINGS',
                },
                reference: ['internal tran'],
            };
            // Make the Axios request
            let response = await axios.post(`${process.env.BOOQ_URL}/v1/transfers`, requestData, { headers });

            let result: any = {};
            if (response.status == 200) {
                result.transaction_response = response.data;

                let userInfo = await clientModel.updateOne({ _id: mongoose.Types.ObjectId(this.userId) }, { $inc: { redToken: redToken } });
                if (userInfo) {
                    result.userInfo = userInfo;
                } else {
                    result.userInfo = null;
                }
            } else {
                throw new Error("Transferring amount failed, please try again!");

            }

            let tranasctionRepsonse = await upsert(transactionModel, {
                senderId: this.userId,
                uesrBooqId: userId,
                redToken: redToken,
                transactionType: "booqTransfer",
                amount: amount,
                accountType: "Booq",
                status: "APPROVED",
                sendToken: "USDC",
                receiveToken: "RED",
            });
            return {
                data: result,
                error: '',
                message: 'Amount Transferred Success!!',
                status: 200
            }
        }
        catch (err: any) {
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            }
        }
    }


    /*
   * Get listing of booq transactions
   */
    @Security('Bearer')
    @Get("/getTransferAmount")
    public async getTransferAmount(
        @Query('pageNumber') pageNumber: number,
        @Query('pageSize') pageSize: number
    ): Promise<IResponse> {
        try {

            const booqQuery = {
                $or: [
                    { senderId: this.userId },
                    { receiverId: this.userId }
                ],
                $and: [
                    { transactionType: { $in: ["booqLoan", "booqTransfer"] } }
                ],
            };
            let redTokenTransactionData = await getAll(transactionModel, booqQuery, +pageNumber, +pageSize);
            return {
                data: redTokenTransactionData,
                error: '',
                message: 'Booq Transactions Data fetched Successfully',
                status: 200
            };
        } catch (err: any) {
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            };
        }
    }


    /**
     * Get loan from Booq
     */
    @Security('Bearer')
    @Post("/getLoanAmount")
    public async getLoanAmount(@Body() request: { userId: string, amount: string, redToken: string, access_token: string }): Promise<IResponse> {
        try {

            let { userId, amount, redToken, access_token } = request;
            let tenantid = process.env.TENANT_ID;
            let userInfo = await clientModel.findOne({});

            const appDomain = `${process.env.BOOQ_URL}/v1/clients/${process.env.SOLO_ID}`;
            const headers: any = {
                'authorization': `Bearer ${access_token}`,
                'content-type': 'application/json',
                'tenantid': tenantid,
            };

            let responseAccountInfo = await axios.get(appDomain, { headers });
            if (responseAccountInfo.status == 200) {

                const result = responseAccountInfo.data;

                const appDomainAccount = `${process.env.BOOQ_URL}/v1/savingsaccounts/${result?.accountNo}`;
                let response_account = await axios.get(appDomainAccount, { headers });
                if (response_account.status == 200) {
                    const result = response_account.data;

                    if (result?.summary?.availableBalance < amount) {
                        throw new Error(`You are eligible for a $${result?.summary?.availableBalance} loan offer`);
                    }

                } else {
                    throw new Error("Account not found!");
                }

            } else {
                throw new Error("User not valid!");
            }

            // Define the request data and headers
            const requestData = {
                type: 'CREDIT',
                paymentType: 'INTERNAL',
                amount: amount,
                debtor: {
                    identifier: `id:${process.env.SOLO_ID}`,
                    accountType: 'SAVINGS',
                },
                creditor: {
                    identifier: `id:${userId}`,
                    name: `${userInfo?.name ? userInfo?.name : userInfo?.userName}`,
                    accountType: 'SAVINGS',
                },
                reference: ['internal tran'],
            };

            // Make the Axios request
            let response = await axios.post(`${process.env.BOOQ_URL}/v1/transfers`, requestData, { headers });

            let result: any = {};
            if (response.status == 200) {
                result.transaction_response = response.data;

                let userInfo = await clientModel.updateOne({ _id: mongoose.Types.ObjectId(this.userId) }, { $inc: { redToken: -Number(redToken), lockRedToken: Number(redToken), loanAmount: Number(amount) } });
                if (userInfo) {
                    result.userInfo = userInfo;
                } else {
                    result.userInfo = null;
                }

                let tranasctionRepsonse = await upsert(transactionModel, {
                    senderId: this.userId,
                    uesrBooqId: userId,
                    redToken: redToken,
                    transactionType: "booqLoan",
                    amount: amount,
                    accountType: "Booq",
                    status: "APPROVED",
                    sendToken: "RED",
                    receiveToken: "USDC",
                });

            } else {
                throw new Error("Transferring amount failed, please try again!");

            }

            return {
                data: result,
                error: '',
                message: 'Amount Transferred Success!!',
                status: 200
            }
        }
        catch (err: any) {
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            }
        }
    }


    /**
     * normal loan amount return to booq
     */
    @Security('Bearer')
    @Post("/redTokenLoanReturn")
    public async redTokenLoanReturn(@Body() request: { userId: string, amount: string, redToken: string, access_token: string }): Promise<IResponse> {
        try {

            let { userId, amount, redToken, access_token } = request;
            let tenantid = process.env.TENANT_ID;
            let userInfo = await clientModel.findOne({});

            const appDomain = `${process.env.BOOQ_URL}/v1/clients/${userId}`;
            const headers: any = {
                'authorization': `Bearer ${access_token}`,
                'content-type': 'application/json',
                'tenantid': tenantid,
            };

            let responseAccountInfo = await axios.get(appDomain, { headers });
            if (responseAccountInfo.status == 200) {

                const result = responseAccountInfo.data;

                const appDomainAccount = `${process.env.BOOQ_URL}/v1/savingsaccounts/${result?.accountNo}`;
                let response_account = await axios.get(appDomainAccount, { headers });
                if (response_account.status == 200) {
                    const result = response_account.data;

                    if (result?.summary?.availableBalance < amount) {
                        throw new Error(`Payment failed, insufficient funds in your account.`);
                    }

                } else {
                    throw new Error("Account not found!");
                }

            } else {
                throw new Error("User not valid!");
            }

            // Define the request data and headers
            const requestData = {
                type: 'CREDIT',
                paymentType: 'INTERNAL',
                amount: amount,
                debtor: {
                    identifier: `id:${userId}`,
                    name: `${userInfo?.name ? userInfo?.name : userInfo?.userName}`,
                    accountType: 'SAVINGS',
                },
                creditor: {
                    identifier: `id:${process.env.SOLO_ID}`,
                    accountType: 'SAVINGS',
                },
                reference: ['internal tran'],
            };

            // Make the Axios request
            let response = await axios.post(`${process.env.BOOQ_URL}/v1/transfers`, requestData, { headers });

            let result: any = {};
            if (response.status == 200) {
                result.transaction_response = response.data;

                let userInfo = await clientModel.updateOne({ _id: mongoose.Types.ObjectId(this.userId) }, { $inc: { redToken: Number(redToken), lockRedToken: -Number(redToken) } });
                if (userInfo) {
                    result.userInfo = userInfo;
                } else {
                    result.userInfo = null;
                }

                let tranasctionRepsonse = await upsert(transactionModel, {
                    receiverId: this.userId,
                    uesrBooqId: userId,
                    redToken: redToken,
                    transactionType: "booqLoanReturn",
                    amount: amount,
                    accountType: "Booq",
                    status: "APPROVED",
                    sendToken: "USDC",
                    receiveToken: "RED",
                });

            } else {
                throw new Error("Transferring amount failed, please try again!");
            }
            return {
                data: result,
                error: '',
                message: 'Amount Transferred Success!!',
                status: 200
            }
        }
        catch (err: any) {
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            }
        }
    }



    /**
     * Get loan from Booq against fred
     */
    @Security('Bearer')
    @Post("/loanAgainstFred")
    public async loanAgainstFred(@Body() request: { userId: string, amount: string, token_id: string, nft_address: string, access_token: string, sender_wallet: string, receiver_wallet: string }): Promise<IResponse> {
        try {

            let { userId, amount, token_id, nft_address, access_token, sender_wallet, receiver_wallet } = request;
            let tenantid = process.env.TENANT_ID;
            let userInfo = await clientModel.findOne({});
            let fredNftDetail = await fredNftModel.findOne({ tokenId: token_id, contractAddress: nft_address });
            if (!fredNftDetail) {
                throw new Error("Fred NFT not valid!");
            }

            const appDomain = `${process.env.BOOQ_URL}/v1/clients/${process.env.SOLO_ID}`;
            const headers: any = {
                'authorization': `Bearer ${access_token}`,
                'content-type': 'application/json',
                'tenantid': tenantid,
            };

            let responseAccountInfo = await axios.get(appDomain, { headers });
            if (responseAccountInfo.status == 200) {

                const result = responseAccountInfo.data;

                const appDomainAccount = `${process.env.BOOQ_URL}/v1/savingsaccounts/${result?.accountNo}`;
                let response_account = await axios.get(appDomainAccount, { headers });
                if (response_account.status == 200) {
                    const result = response_account.data;

                    if (result?.summary?.availableBalance < amount) {
                        throw new Error(`You are eligible for a $${result?.summary?.availableBalance} loan offer`);
                    }

                } else {
                    throw new Error("Account not found!");
                }

            } else {
                throw new Error("User not valid!");
            }

            // Define the request data and headers
            const requestData = {
                type: 'CREDIT',
                paymentType: 'INTERNAL',
                amount: amount,
                debtor: {
                    identifier: `id:${process.env.SOLO_ID}`,
                    accountType: 'SAVINGS',
                },
                creditor: {
                    identifier: `id:${userId}`,
                    name: `${userInfo?.name ? userInfo?.name : userInfo?.userName}`,
                    accountType: 'SAVINGS',
                },
                reference: ['internal tran'],
            };

            // Make the Axios request
            let response = await axios.post(`${process.env.BOOQ_URL}/v1/transfers`, requestData, { headers });

            let result: any = {};
            if (response.status == 200) {
                result.transaction_response = response.data;

                let nftUpdate = await userNftModel.updateOne({ fredNftId: mongoose.Types.ObjectId(fredNftDetail?._id), userId: mongoose.Types.ObjectId(this.userId) }, { $set: { isLocked: true } })
                let tranasctionRepsonse = await upsert(transactionModel, {
                    senderId: this.userId,
                    uesrBooqId: userId,
                    // redToken: redToken,
                    transactionType: "booqFredLoan",
                    amount: amount,
                    accountType: "Booq",
                    status: "APPROVED",
                    sendToken: "NFT",
                    receiveToken: "USDC",
                    senderWalletAddress: sender_wallet,
                    receiverWalletAddress: receiver_wallet
                });

            } else {
                throw new Error("Transferring amount failed, please try again!");
            }

            return {
                data: result,
                error: '',
                message: 'Amount Transferred Success!!',
                status: 200
            }
        }
        catch (err: any) {
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            }
        }
    }


    /**
     * Get locked fred nft
     */
    @Security('Bearer')
    @Get("/lockedFredNft")
    public async lockedFredNft(): Promise<IResponse> {
        try {

            let nftListing = await userNftModel.aggregate([
                {
                    $match: {
                        userId: mongoose.Types.ObjectId(this.userId),
                        isLocked: true
                    }
                },
                {
                    $lookup: {
                        from: "frednft",
                        localField: "_id",
                        foreignField: "fredNftId",
                        as: "fredNftDetail"
                    }
                }
            ])

            return {
                data: nftListing,
                error: '',
                message: 'Fred NFT Listing!!',
                status: 200
            }
        }
        catch (err: any) {
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            }
        }
    }


    /**
     * fred loan return to booq
     */
    @Security('Bearer')
    @Post("/fredNftLoanReturn")
    public async fredNftLoanReturn(@Body() request: { userId: string, amount: string, token_id: string, nft_address: string, access_token: string, sender_wallet: string, receiver_wallet: string }): Promise<IResponse> {
        try {

            let { userId, amount, token_id, nft_address, access_token, sender_wallet, receiver_wallet } = request;
            let tenantid = process.env.TENANT_ID;
            let userInfo = await clientModel.findOne({});
            let fredNftDetail = await fredNftModel.findOne({ tokenId: token_id, contractAddress: nft_address });
            if (!fredNftDetail) {
                throw new Error("Fred NFT not valid!");
            }

            const appDomain = `${process.env.BOOQ_URL}/v1/clients/${userId}`;
            const headers: any = {
                'authorization': `Bearer ${access_token}`,
                'content-type': 'application/json',
                'tenantid': tenantid,
            };

            let responseAccountInfo = await axios.get(appDomain, { headers });
            if (responseAccountInfo.status == 200) {

                const result = responseAccountInfo.data;

                const appDomainAccount = `${process.env.BOOQ_URL}/v1/savingsaccounts/${result?.accountNo}`;
                let response_account = await axios.get(appDomainAccount, { headers });
                if (response_account.status == 200) {
                    const result = response_account.data;

                    if (result?.summary?.availableBalance < amount) {
                        throw new Error(`Payment failed, insufficient funds in your account.`);
                    }

                } else {
                    throw new Error("Account not found!");
                }

            } else {
                throw new Error("User not valid!");
            }

            // Define the request data and headers
            const requestData = {
                type: 'CREDIT',
                paymentType: 'INTERNAL',
                amount: amount,
                debtor: {
                    identifier: `id:${userId}`,
                    name: `${userInfo?.name ? userInfo?.name : userInfo?.userName}`,
                    accountType: 'SAVINGS',
                },
                creditor: {
                    identifier: `id:${process.env.SOLO_ID}`,
                    accountType: 'SAVINGS',
                },
                reference: ['internal tran'],
            };

            // Make the Axios request
            let response = await axios.post(`${process.env.BOOQ_URL}/v1/transfers`, requestData, { headers });

            let result: any = {};
            if (response.status == 200) {
                result.transaction_response = response.data;

                let nftUpdate = await userNftModel.updateOne({ fredNftId: mongoose.Types.ObjectId(fredNftDetail?._id), userId: mongoose.Types.ObjectId(this.userId) }, { $set: { isLocked: false } })
                let tranasctionRepsonse = await upsert(transactionModel, {
                    receiverId: this.userId,
                    uesrBooqId: userId,
                    transactionType: "booqNftLoanReturn",
                    amount: amount,
                    accountType: "Booq",
                    status: "APPROVED",
                    sendToken: "USDC",
                    receiveToken: "NFT",
                    senderWalletAddress: sender_wallet,
                    receiverWalletAddress: receiver_wallet
                });

            } else {
                throw new Error("Transferring amount failed, please try again!");
            }

            return {
                data: result,
                error: '',
                message: 'Amount Transferred Success!!',
                status: 200
            }
        }
        catch (err: any) {
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            }
        }
    }


}


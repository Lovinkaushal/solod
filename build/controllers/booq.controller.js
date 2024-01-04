"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
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
const tsoa_1 = require("tsoa");
const db_helpers_1 = require("../helpers/db.helpers");
const client_model_1 = __importDefault(require("../models/client.model"));
const axios_1 = __importDefault(require("axios"));
const mongoose_1 = __importDefault(require("mongoose"));
const transaction_model_1 = __importDefault(require("../models/transaction.model"));
const fredNft_model_1 = __importDefault(require("../models/fredNft.model"));
const userNft_model_1 = __importDefault(require("../models/userNft.model"));
let BooqController = class BooqController extends tsoa_1.Controller {
    constructor(req, res) {
        super();
        this.req = req;
        this.res = res;
        this.userId = req.body.user ? req.body.user.id : '';
    }
    /**
     * User login in the booq
     */
    userLoginBooq(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let { user_name, password } = request;
                let tenantid = process.env.TENANT_ID;
                let grantType = process.env.GRANT_TYPE;
                let clientID = process.env.CLIENT_ID;
                let clientSecret = process.env.CLIENT_SECRET;
                const appDomain = `${process.env.BOOQ_URL}/oauth/token`;
                const headers = {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'tenantid': tenantid
                };
                const data = new URLSearchParams();
                data.append('username', user_name);
                data.append('password', password);
                data.append('grant_type', grantType);
                data.append('client_id', clientID);
                data.append('client_secret', clientSecret);
                let response = yield axios_1.default.post(appDomain, data, { headers });
                if (response.status == 200) {
                    const result = response.data;
                    return {
                        data: result,
                        error: '',
                        message: 'Login Success',
                        status: 200
                    };
                }
                else {
                    return {
                        data: null,
                        error: '',
                        message: "Invalid credentials!",
                        status: 401
                    };
                }
            }
            catch (err) {
                return {
                    data: null,
                    error: err.message ? err.message : err,
                    message: '',
                    status: 400
                };
            }
        });
    }
    /**
     * User search in the booq platform
     */
    searchUserInBooq(request) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let { phone_number, access_token } = request;
                let tenantid = process.env.TENANT_ID;
                let sendingResult = {};
                const appDomain = `${process.env.BOOQ_URL}/v1/clients?mobileNo=${phone_number}`;
                const headers = {
                    'tenantid': tenantid,
                    'authorization': `Bearer ${access_token}`
                };
                let response = yield axios_1.default.get(appDomain, { headers });
                if (response.status == 200) {
                    const result = response.data.pageItems[0];
                    sendingResult.userId = result === null || result === void 0 ? void 0 : result.id;
                    sendingResult.accountNo = result === null || result === void 0 ? void 0 : result.accountNo;
                    sendingResult.active = result === null || result === void 0 ? void 0 : result.active;
                    sendingResult.firstname = result === null || result === void 0 ? void 0 : result.firstname;
                    sendingResult.lastname = result === null || result === void 0 ? void 0 : result.lastname;
                    sendingResult.displayName = result === null || result === void 0 ? void 0 : result.displayName;
                    sendingResult.mobileNo = result === null || result === void 0 ? void 0 : result.mobileNo;
                    sendingResult.emailAddress = result === null || result === void 0 ? void 0 : result.emailAddress;
                    sendingResult.clientTypes = result === null || result === void 0 ? void 0 : result.clientTypes;
                    sendingResult.savingsAccountId = result === null || result === void 0 ? void 0 : result.savingsAccountId;
                }
                else {
                    throw new Error("User not valid!");
                }
                const appDomainAccount = `${process.env.BOOQ_URL}/v1/savingsaccounts/${sendingResult === null || sendingResult === void 0 ? void 0 : sendingResult.accountNo}`;
                let response_account = yield axios_1.default.get(appDomainAccount, { headers });
                if (response_account.status == 200) {
                    const result = response_account.data;
                    sendingResult.currencyCcode = (_b = (_a = result === null || result === void 0 ? void 0 : result.summary) === null || _a === void 0 ? void 0 : _a.currency) === null || _b === void 0 ? void 0 : _b.code;
                    sendingResult.displaySymbol = (_d = (_c = result === null || result === void 0 ? void 0 : result.summary) === null || _c === void 0 ? void 0 : _c.currency) === null || _d === void 0 ? void 0 : _d.displaySymbol;
                    sendingResult.totalDeposits = (_e = result === null || result === void 0 ? void 0 : result.summary) === null || _e === void 0 ? void 0 : _e.totalDeposits;
                    sendingResult.totalInterestPosted = (_f = result === null || result === void 0 ? void 0 : result.summary) === null || _f === void 0 ? void 0 : _f.totalInterestPosted;
                    sendingResult.accountBalance = (_g = result === null || result === void 0 ? void 0 : result.summary) === null || _g === void 0 ? void 0 : _g.accountBalance;
                    sendingResult.availableBalance = (_h = result === null || result === void 0 ? void 0 : result.summary) === null || _h === void 0 ? void 0 : _h.availableBalance;
                    sendingResult.interestNotPosted = (_j = result === null || result === void 0 ? void 0 : result.summary) === null || _j === void 0 ? void 0 : _j.interestNotPosted;
                    sendingResult.totalOverdraftInterestDerived = (_k = result === null || result === void 0 ? void 0 : result.summary) === null || _k === void 0 ? void 0 : _k.totalOverdraftInterestDerived;
                    sendingResult.bankDetails = (_l = result === null || result === void 0 ? void 0 : result.bankDetails) !== null && _l !== void 0 ? _l : null;
                }
                else {
                    throw new Error("Account not found!");
                }
                return {
                    data: sendingResult,
                    error: '',
                    message: 'Login Success',
                    status: 200
                };
            }
            catch (err) {
                return {
                    data: null,
                    error: err.message ? err.message : err,
                    message: '',
                    status: 400
                };
            }
        });
    }
    /**
     * Amount Transfer to SOLO
     */
    transferAmount(request) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let { userId, amount, redToken, access_token } = request;
                let tenantid = process.env.TENANT_ID;
                const appDomain = `${process.env.BOOQ_URL}/v1/clients/${userId}`;
                const headers = {
                    'authorization': `Bearer ${access_token}`,
                    'content-type': 'application/json',
                    'tenantid': tenantid,
                };
                let responseAccountInfo = yield axios_1.default.get(appDomain, { headers });
                if (responseAccountInfo.status == 200) {
                    const result = responseAccountInfo.data;
                    const appDomainAccount = `${process.env.BOOQ_URL}/v1/savingsaccounts/${result === null || result === void 0 ? void 0 : result.accountNo}`;
                    let response_account = yield axios_1.default.get(appDomainAccount, { headers });
                    if (response_account.status == 200) {
                        const result = response_account.data;
                        if (((_a = result === null || result === void 0 ? void 0 : result.summary) === null || _a === void 0 ? void 0 : _a.availableBalance) < amount) {
                            throw new Error(`Balance insufficient, only $${(_b = result === null || result === void 0 ? void 0 : result.summary) === null || _b === void 0 ? void 0 : _b.availableBalance} available in the account.`);
                        }
                    }
                    else {
                        throw new Error("Account not found!");
                    }
                }
                else {
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
                let response = yield axios_1.default.post(`${process.env.BOOQ_URL}/v1/transfers`, requestData, { headers });
                let result = {};
                if (response.status == 200) {
                    result.transaction_response = response.data;
                    let userInfo = yield client_model_1.default.updateOne({ _id: mongoose_1.default.Types.ObjectId(this.userId) }, { $inc: { redToken: redToken } });
                    if (userInfo) {
                        result.userInfo = userInfo;
                    }
                    else {
                        result.userInfo = null;
                    }
                }
                else {
                    throw new Error("Transferring amount failed, please try again!");
                }
                let tranasctionRepsonse = yield (0, db_helpers_1.upsert)(transaction_model_1.default, {
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
                };
            }
            catch (err) {
                return {
                    data: null,
                    error: err.message ? err.message : err,
                    message: '',
                    status: 400
                };
            }
        });
    }
    /*
   * Get listing of booq transactions
   */
    getTransferAmount(pageNumber, pageSize) {
        return __awaiter(this, void 0, void 0, function* () {
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
                let redTokenTransactionData = yield (0, db_helpers_1.getAll)(transaction_model_1.default, booqQuery, +pageNumber, +pageSize);
                return {
                    data: redTokenTransactionData,
                    error: '',
                    message: 'Booq Transactions Data fetched Successfully',
                    status: 200
                };
            }
            catch (err) {
                return {
                    data: null,
                    error: err.message ? err.message : err,
                    message: '',
                    status: 400
                };
            }
        });
    }
    /**
     * Get loan from Booq
     */
    getLoanAmount(request) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let { userId, amount, redToken, access_token } = request;
                let tenantid = process.env.TENANT_ID;
                let userInfo = yield client_model_1.default.findOne({});
                const appDomain = `${process.env.BOOQ_URL}/v1/clients/${process.env.SOLO_ID}`;
                const headers = {
                    'authorization': `Bearer ${access_token}`,
                    'content-type': 'application/json',
                    'tenantid': tenantid,
                };
                let responseAccountInfo = yield axios_1.default.get(appDomain, { headers });
                if (responseAccountInfo.status == 200) {
                    const result = responseAccountInfo.data;
                    const appDomainAccount = `${process.env.BOOQ_URL}/v1/savingsaccounts/${result === null || result === void 0 ? void 0 : result.accountNo}`;
                    let response_account = yield axios_1.default.get(appDomainAccount, { headers });
                    if (response_account.status == 200) {
                        const result = response_account.data;
                        if (((_a = result === null || result === void 0 ? void 0 : result.summary) === null || _a === void 0 ? void 0 : _a.availableBalance) < amount) {
                            throw new Error(`You are eligible for a $${(_b = result === null || result === void 0 ? void 0 : result.summary) === null || _b === void 0 ? void 0 : _b.availableBalance} loan offer`);
                        }
                    }
                    else {
                        throw new Error("Account not found!");
                    }
                }
                else {
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
                        name: `${(userInfo === null || userInfo === void 0 ? void 0 : userInfo.name) ? userInfo === null || userInfo === void 0 ? void 0 : userInfo.name : userInfo === null || userInfo === void 0 ? void 0 : userInfo.userName}`,
                        accountType: 'SAVINGS',
                    },
                    reference: ['internal tran'],
                };
                // Make the Axios request
                let response = yield axios_1.default.post(`${process.env.BOOQ_URL}/v1/transfers`, requestData, { headers });
                let result = {};
                if (response.status == 200) {
                    result.transaction_response = response.data;
                    let userInfo = yield client_model_1.default.updateOne({ _id: mongoose_1.default.Types.ObjectId(this.userId) }, { $inc: { redToken: -Number(redToken), lockRedToken: Number(redToken), loanAmount: Number(amount) } });
                    if (userInfo) {
                        result.userInfo = userInfo;
                    }
                    else {
                        result.userInfo = null;
                    }
                    let tranasctionRepsonse = yield (0, db_helpers_1.upsert)(transaction_model_1.default, {
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
                }
                else {
                    throw new Error("Transferring amount failed, please try again!");
                }
                return {
                    data: result,
                    error: '',
                    message: 'Amount Transferred Success!!',
                    status: 200
                };
            }
            catch (err) {
                return {
                    data: null,
                    error: err.message ? err.message : err,
                    message: '',
                    status: 400
                };
            }
        });
    }
    /**
     * normal loan amount return to booq
     */
    redTokenLoanReturn(request) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let { userId, amount, redToken, access_token } = request;
                let tenantid = process.env.TENANT_ID;
                let userInfo = yield client_model_1.default.findOne({});
                const appDomain = `${process.env.BOOQ_URL}/v1/clients/${userId}`;
                const headers = {
                    'authorization': `Bearer ${access_token}`,
                    'content-type': 'application/json',
                    'tenantid': tenantid,
                };
                let responseAccountInfo = yield axios_1.default.get(appDomain, { headers });
                if (responseAccountInfo.status == 200) {
                    const result = responseAccountInfo.data;
                    const appDomainAccount = `${process.env.BOOQ_URL}/v1/savingsaccounts/${result === null || result === void 0 ? void 0 : result.accountNo}`;
                    let response_account = yield axios_1.default.get(appDomainAccount, { headers });
                    if (response_account.status == 200) {
                        const result = response_account.data;
                        if (((_a = result === null || result === void 0 ? void 0 : result.summary) === null || _a === void 0 ? void 0 : _a.availableBalance) < amount) {
                            throw new Error(`Payment failed, insufficient funds in your account.`);
                        }
                    }
                    else {
                        throw new Error("Account not found!");
                    }
                }
                else {
                    throw new Error("User not valid!");
                }
                // Define the request data and headers
                const requestData = {
                    type: 'CREDIT',
                    paymentType: 'INTERNAL',
                    amount: amount,
                    debtor: {
                        identifier: `id:${userId}`,
                        name: `${(userInfo === null || userInfo === void 0 ? void 0 : userInfo.name) ? userInfo === null || userInfo === void 0 ? void 0 : userInfo.name : userInfo === null || userInfo === void 0 ? void 0 : userInfo.userName}`,
                        accountType: 'SAVINGS',
                    },
                    creditor: {
                        identifier: `id:${process.env.SOLO_ID}`,
                        accountType: 'SAVINGS',
                    },
                    reference: ['internal tran'],
                };
                // Make the Axios request
                let response = yield axios_1.default.post(`${process.env.BOOQ_URL}/v1/transfers`, requestData, { headers });
                let result = {};
                if (response.status == 200) {
                    result.transaction_response = response.data;
                    let userInfo = yield client_model_1.default.updateOne({ _id: mongoose_1.default.Types.ObjectId(this.userId) }, { $inc: { redToken: Number(redToken), lockRedToken: -Number(redToken) } });
                    if (userInfo) {
                        result.userInfo = userInfo;
                    }
                    else {
                        result.userInfo = null;
                    }
                    let tranasctionRepsonse = yield (0, db_helpers_1.upsert)(transaction_model_1.default, {
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
                }
                else {
                    throw new Error("Transferring amount failed, please try again!");
                }
                return {
                    data: result,
                    error: '',
                    message: 'Amount Transferred Success!!',
                    status: 200
                };
            }
            catch (err) {
                return {
                    data: null,
                    error: err.message ? err.message : err,
                    message: '',
                    status: 400
                };
            }
        });
    }
    /**
     * Get loan from Booq against fred
     */
    loanAgainstFred(request) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let { userId, amount, token_id, nft_address, access_token, sender_wallet, receiver_wallet } = request;
                let tenantid = process.env.TENANT_ID;
                let userInfo = yield client_model_1.default.findOne({});
                let fredNftDetail = yield fredNft_model_1.default.findOne({ tokenId: token_id, contractAddress: nft_address });
                if (!fredNftDetail) {
                    throw new Error("Fred NFT not valid!");
                }
                const appDomain = `${process.env.BOOQ_URL}/v1/clients/${process.env.SOLO_ID}`;
                const headers = {
                    'authorization': `Bearer ${access_token}`,
                    'content-type': 'application/json',
                    'tenantid': tenantid,
                };
                let responseAccountInfo = yield axios_1.default.get(appDomain, { headers });
                if (responseAccountInfo.status == 200) {
                    const result = responseAccountInfo.data;
                    const appDomainAccount = `${process.env.BOOQ_URL}/v1/savingsaccounts/${result === null || result === void 0 ? void 0 : result.accountNo}`;
                    let response_account = yield axios_1.default.get(appDomainAccount, { headers });
                    if (response_account.status == 200) {
                        const result = response_account.data;
                        if (((_a = result === null || result === void 0 ? void 0 : result.summary) === null || _a === void 0 ? void 0 : _a.availableBalance) < amount) {
                            throw new Error(`You are eligible for a $${(_b = result === null || result === void 0 ? void 0 : result.summary) === null || _b === void 0 ? void 0 : _b.availableBalance} loan offer`);
                        }
                    }
                    else {
                        throw new Error("Account not found!");
                    }
                }
                else {
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
                        name: `${(userInfo === null || userInfo === void 0 ? void 0 : userInfo.name) ? userInfo === null || userInfo === void 0 ? void 0 : userInfo.name : userInfo === null || userInfo === void 0 ? void 0 : userInfo.userName}`,
                        accountType: 'SAVINGS',
                    },
                    reference: ['internal tran'],
                };
                // Make the Axios request
                let response = yield axios_1.default.post(`${process.env.BOOQ_URL}/v1/transfers`, requestData, { headers });
                let result = {};
                if (response.status == 200) {
                    result.transaction_response = response.data;
                    let nftUpdate = yield userNft_model_1.default.updateOne({ fredNftId: mongoose_1.default.Types.ObjectId(fredNftDetail === null || fredNftDetail === void 0 ? void 0 : fredNftDetail._id), userId: mongoose_1.default.Types.ObjectId(this.userId) }, { $set: { isLocked: true } });
                    let tranasctionRepsonse = yield (0, db_helpers_1.upsert)(transaction_model_1.default, {
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
                }
                else {
                    throw new Error("Transferring amount failed, please try again!");
                }
                return {
                    data: result,
                    error: '',
                    message: 'Amount Transferred Success!!',
                    status: 200
                };
            }
            catch (err) {
                return {
                    data: null,
                    error: err.message ? err.message : err,
                    message: '',
                    status: 400
                };
            }
        });
    }
    /**
     * Get locked fred nft
     */
    lockedFredNft() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let nftListing = yield userNft_model_1.default.aggregate([
                    {
                        $match: {
                            userId: mongoose_1.default.Types.ObjectId(this.userId),
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
                ]);
                return {
                    data: nftListing,
                    error: '',
                    message: 'Fred NFT Listing!!',
                    status: 200
                };
            }
            catch (err) {
                return {
                    data: null,
                    error: err.message ? err.message : err,
                    message: '',
                    status: 400
                };
            }
        });
    }
    /**
     * fred loan return to booq
     */
    fredNftLoanReturn(request) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let { userId, amount, token_id, nft_address, access_token, sender_wallet, receiver_wallet } = request;
                let tenantid = process.env.TENANT_ID;
                let userInfo = yield client_model_1.default.findOne({});
                let fredNftDetail = yield fredNft_model_1.default.findOne({ tokenId: token_id, contractAddress: nft_address });
                if (!fredNftDetail) {
                    throw new Error("Fred NFT not valid!");
                }
                const appDomain = `${process.env.BOOQ_URL}/v1/clients/${userId}`;
                const headers = {
                    'authorization': `Bearer ${access_token}`,
                    'content-type': 'application/json',
                    'tenantid': tenantid,
                };
                let responseAccountInfo = yield axios_1.default.get(appDomain, { headers });
                if (responseAccountInfo.status == 200) {
                    const result = responseAccountInfo.data;
                    const appDomainAccount = `${process.env.BOOQ_URL}/v1/savingsaccounts/${result === null || result === void 0 ? void 0 : result.accountNo}`;
                    let response_account = yield axios_1.default.get(appDomainAccount, { headers });
                    if (response_account.status == 200) {
                        const result = response_account.data;
                        if (((_a = result === null || result === void 0 ? void 0 : result.summary) === null || _a === void 0 ? void 0 : _a.availableBalance) < amount) {
                            throw new Error(`Payment failed, insufficient funds in your account.`);
                        }
                    }
                    else {
                        throw new Error("Account not found!");
                    }
                }
                else {
                    throw new Error("User not valid!");
                }
                // Define the request data and headers
                const requestData = {
                    type: 'CREDIT',
                    paymentType: 'INTERNAL',
                    amount: amount,
                    debtor: {
                        identifier: `id:${userId}`,
                        name: `${(userInfo === null || userInfo === void 0 ? void 0 : userInfo.name) ? userInfo === null || userInfo === void 0 ? void 0 : userInfo.name : userInfo === null || userInfo === void 0 ? void 0 : userInfo.userName}`,
                        accountType: 'SAVINGS',
                    },
                    creditor: {
                        identifier: `id:${process.env.SOLO_ID}`,
                        accountType: 'SAVINGS',
                    },
                    reference: ['internal tran'],
                };
                // Make the Axios request
                let response = yield axios_1.default.post(`${process.env.BOOQ_URL}/v1/transfers`, requestData, { headers });
                let result = {};
                if (response.status == 200) {
                    result.transaction_response = response.data;
                    let nftUpdate = yield userNft_model_1.default.updateOne({ fredNftId: mongoose_1.default.Types.ObjectId(fredNftDetail === null || fredNftDetail === void 0 ? void 0 : fredNftDetail._id), userId: mongoose_1.default.Types.ObjectId(this.userId) }, { $set: { isLocked: false } });
                    let tranasctionRepsonse = yield (0, db_helpers_1.upsert)(transaction_model_1.default, {
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
                }
                else {
                    throw new Error("Transferring amount failed, please try again!");
                }
                return {
                    data: result,
                    error: '',
                    message: 'Amount Transferred Success!!',
                    status: 200
                };
            }
            catch (err) {
                return {
                    data: null,
                    error: err.message ? err.message : err,
                    message: '',
                    status: 400
                };
            }
        });
    }
};
__decorate([
    (0, tsoa_1.Post)("/userLoginBooq"),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BooqController.prototype, "userLoginBooq", null);
__decorate([
    (0, tsoa_1.Post)("/searchUserInBooq"),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BooqController.prototype, "searchUserInBooq", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Post)("/transferAmount"),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BooqController.prototype, "transferAmount", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Get)("/getTransferAmount"),
    __param(0, (0, tsoa_1.Query)('pageNumber')),
    __param(1, (0, tsoa_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], BooqController.prototype, "getTransferAmount", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Post)("/getLoanAmount"),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BooqController.prototype, "getLoanAmount", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Post)("/redTokenLoanReturn"),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BooqController.prototype, "redTokenLoanReturn", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Post)("/loanAgainstFred"),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BooqController.prototype, "loanAgainstFred", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Get)("/lockedFredNft"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BooqController.prototype, "lockedFredNft", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Post)("/fredNftLoanReturn"),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BooqController.prototype, "fredNftLoanReturn", null);
BooqController = __decorate([
    (0, tsoa_1.Tags)('Booq'),
    (0, tsoa_1.Route)('api/booq'),
    __metadata("design:paramtypes", [Object, Object])
], BooqController);
exports.default = BooqController;

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
const logger_config_1 = __importDefault(require("../configs/logger.config"));
const redTokenTransaction_model_1 = __importDefault(require("../models/redTokenTransaction.model"));
const transaction_validator_1 = require("../validations/transaction.validator");
const admin_model_1 = __importDefault(require("../models/admin.model"));
const agreement_model_1 = __importDefault(require("../models/agreement.model"));
const mongoose_1 = __importDefault(require("mongoose"));
let ClientController = class ClientController extends tsoa_1.Controller {
    constructor(req, res) {
        super();
        this.req = req;
        this.res = res;
        this.userId = req.body.user ? req.body.user.id : '';
    }
    /**
        * Transaction of buy future red from Admin
        */
    transactionOfBuyFutureRed(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { redToken } = request;
                const validatedTransaction = (0, transaction_validator_1.validateFutureRedTransaction)({ redToken });
                if (validatedTransaction.error) {
                    throw new Error(validatedTransaction.error.message);
                }
                const data = yield (0, db_helpers_1.getById)(client_model_1.default, this.userId);
                const clientRedTokenData = data.redToken;
                const data2 = yield (0, db_helpers_1.findOne)(admin_model_1.default, {});
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
                const getResponse = yield (0, db_helpers_1.upsert)(client_model_1.default, { redToken: clientRedToken, futureRed: clientFutureRed }, this.userId);
                const getResponse2 = yield (0, db_helpers_1.upsert)(admin_model_1.default, { futureRed: adminFutureRed, totalRedToken: adminRedToken }, data2._id);
                return {
                    data: { getResponse, getResponse2 },
                    error: '',
                    message: 'Future Red Purchase Successfully',
                    status: 200
                };
            }
            catch (err) {
                logger_config_1.default.error(`${this.req.ip} ${err.message}`);
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
     * Transaction to lease a property
     */
    transactionToLeaseProperty(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { amount, propertyId, accountType, agreementId } = request;
                const validatedTransaction = (0, transaction_validator_1.validateTransactionToBuyProperty)({ amount, propertyId });
                if (validatedTransaction.error) {
                    throw new Error(validatedTransaction.error.message);
                }
                const exists = yield agreement_model_1.default.findOne({ _id: agreementId });
                const userData = yield (0, db_helpers_1.getById)(client_model_1.default, this.userId);
                const isAdmin = (accountType === 'Primary') ? false : true;
                const adminField = isAdmin ? 'businessRedToken' : 'redToken';
                const data2 = yield (0, db_helpers_1.findOne)(admin_model_1.default, {});
                if (Number(userData[adminField]) < Number(amount)) {
                    throw new Error("User doesn't have enough tokens");
                }
                // Calculate new token balances
                const clientRedToken = userData[adminField] - Number(amount);
                const adminRedToken = data2.totalRedToken + Number(amount);
                // Update user's token balance
                const updateUserResponse = yield (0, db_helpers_1.upsert)(client_model_1.default, { [adminField]: clientRedToken }, this.userId);
                // Update admin's total token balance
                const updateAdminResponse = yield (0, db_helpers_1.upsert)(admin_model_1.default, { totalRedToken: adminRedToken }, data2._id);
                const saveResponse = yield (0, db_helpers_1.upsert)(agreement_model_1.default, { status: 'APPROVED' }, exists._id);
                // Save the transaction details
                const user = yield (0, db_helpers_1.findOne)(client_model_1.default, { _id: this.userId });
                const transactionResponse = yield (0, db_helpers_1.upsert)(redTokenTransaction_model_1.default, {
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
            }
            catch (error) {
                logger_config_1.default.error(`${this.req.ip} ${error.message}`);
                return {
                    data: null,
                    error: error.message ? error.message : 'An error occurred',
                    message: '',
                    status: 400
                };
            }
        });
    }
    /**
  * Get transaction Booking/Lease payments of property
  */
    getLeaseTransactionsDetails(pageNumber, pageSize) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const query = {
                    $or: [
                        { senderId: this.userId },
                        { receiverId: this.userId }
                    ]
                };
                const sendData = yield (0, db_helpers_1.getAll)(redTokenTransaction_model_1.default, query, +pageNumber, +pageSize);
                const items = sendData.items.map(item => {
                    if (item.transactionType !== "Buy RED") {
                        const transactionType = item.senderId.toString() === this.userId.toString() ? 'Paid' : 'Receive RED';
                        return Object.assign(Object.assign({}, item), { transactionType });
                    }
                    return Object.assign({}, item);
                });
                return {
                    data: { items, pageNumber: sendData.pageNumber, pageSize: sendData.pageSize, totalItems: sendData.totalItems },
                    error: '',
                    message: 'Lease Property Transaction Details fetched Successfully',
                    status: 200
                };
            }
            catch (err) {
                logger_config_1.default.error(`${this.req.ip} ${err.message}`);
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
*Get All admin redtoken and solos reward transactions
*/
    getRedAndSolosTransactionByUser(pageNumber, pageSize) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const skip = (pageNumber - 1) * pageSize;
                const totalCount = yield redTokenTransaction_model_1.default.countDocuments({});
                const transactionData = yield redTokenTransaction_model_1.default.aggregate([
                    {
                        $match: {
                            senderId: mongoose_1.default.Types.ObjectId(this.userId),
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
            }
            catch (err) {
                logger_config_1.default.error(`${this.req.ip} ${err.message}`);
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
*Get All admin solos reward transactions
*/
    getSolosTransactionByUser(pageNumber, pageSize) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const skip = (pageNumber - 1) * pageSize;
                const totalCount = yield redTokenTransaction_model_1.default.countDocuments({});
                const transactionData = yield redTokenTransaction_model_1.default.aggregate([
                    {
                        $match: {
                            senderId: mongoose_1.default.Types.ObjectId(this.userId),
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
            }
            catch (err) {
                logger_config_1.default.error(`${this.req.ip} ${err.message}`);
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
       * Save transaction of Red and solos reward token
       */
    saveTransactionOfRedAndSoloReward(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userName, token, transactionType, walletAddress, hashId } = request;
                const senderData = yield (0, db_helpers_1.getById)(client_model_1.default, this.userId);
                const upperCaseUserName = userName.toUpperCase();
                const upperCaseSenderUserName = senderData.userName.toUpperCase();
                if (upperCaseUserName === upperCaseSenderUserName || userName === senderData.businessUserName) {
                    throw new Error("You can't send red token to yourself");
                }
                const receiverData = yield client_model_1.default.findOne({
                    $or: [{ userName: upperCaseUserName }, { businessUserName: upperCaseUserName }]
                });
                let solosToken;
                let redToken;
                if (transactionType === 'Solos Reward') {
                    solosToken = token;
                }
                else {
                    redToken = token;
                }
                // Save transaction details
                const sender = yield (0, db_helpers_1.findOne)(client_model_1.default, { _id: this.userId });
                const transactionResponse = yield (0, db_helpers_1.upsert)(redTokenTransaction_model_1.default, {
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
            }
            catch (err) {
                logger_config_1.default.error(`${this.req.ip} ${err.message}`);
                return {
                    data: null,
                    error: err.message ? err.message : 'An error occurred',
                    message: '',
                    status: 400
                };
            }
        });
    }
};
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Post)("/transactionOfBuyFutureRed"),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "transactionOfBuyFutureRed", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Post)("/transactionToLeaseProperty"),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "transactionToLeaseProperty", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Get)("/getLeaseTransactionsDetails"),
    __param(0, (0, tsoa_1.Query)('pageNumber')),
    __param(1, (0, tsoa_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "getLeaseTransactionsDetails", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Get)("/getRedAndSolosTransactionByUser"),
    __param(0, (0, tsoa_1.Query)('pageNumber')),
    __param(1, (0, tsoa_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "getRedAndSolosTransactionByUser", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Get)("/getSolosTransactionByUser"),
    __param(0, (0, tsoa_1.Query)('pageNumber')),
    __param(1, (0, tsoa_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "getSolosTransactionByUser", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Post)("/saveTransactionOfRedAndSoloReward"),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "saveTransactionOfRedAndSoloReward", null);
ClientController = __decorate([
    (0, tsoa_1.Tags)('Transaction'),
    (0, tsoa_1.Route)('api/transaction'),
    __metadata("design:paramtypes", [Object, Object])
], ClientController);
exports.default = ClientController;

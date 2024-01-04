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
// @ts-ignore
const tsoa_1 = require("tsoa");
const handlebars_1 = __importDefault(require("handlebars"));
const path_1 = __importDefault(require("path"));
const express_1 = require("express");
const db_helpers_1 = require("../helpers/db.helpers");
const common_util_1 = require("../utils/common.util");
const client_model_1 = __importDefault(require("../models/client.model"));
const otp_model_1 = __importDefault(require("../models/otp.model"));
const logger_config_1 = __importDefault(require("../configs/logger.config"));
const nodemailer_1 = require("../configs/nodemailer");
const utils_1 = require("../services/utils");
const mongoose_1 = __importDefault(require("mongoose"));
const client_validator_1 = require("../validations/client.validator");
const propertyDetailsModel_1 = __importDefault(require("../models/propertyDetailsModel"));
const leasePropertyDetail_Model_1 = __importDefault(require("../models/leasePropertyDetail.Model"));
const redTokenTransaction_model_1 = __importDefault(require("../models/redTokenTransaction.model"));
const dummy_model_1 = __importDefault(require("../models/dummy.model"));
const admin_model_1 = __importDefault(require("../models/admin.model"));
const token_model_1 = __importDefault(require("../models/token.model"));
const agreement_model_1 = __importDefault(require("../models/agreement.model"));
const nftDetail_model_1 = __importDefault(require("../models/nftDetail.model"));
const aws_s3_utils_1 = __importDefault(require("../utils/aws.s3.utils"));
const fredNft_model_1 = __importDefault(require("../models/fredNft.model"));
//import { sendNotificationToAdmin } from '../configs/notification.config';
let ClientController = class ClientController extends tsoa_1.Controller {
    constructor(req, res) {
        super();
        this.req = req;
        this.res = res;
        this.userId = req.body.user ? req.body.user.id : '';
    }
    /**
    * Register a client
    */
    register(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { name, email, userName, contact, countryCode, password, confirmPassword, referralCode, isKYCConfirmed, device_type, device_token } = request;
                const userNameUpperCase = userName.toUpperCase();
                const validatedProfile = (0, client_validator_1.validateClientData)({ name, email, userName: userNameUpperCase, countryCode, contact, password, confirmPassword, referralCode, isKYCConfirmed });
                if (validatedProfile.error) {
                    throw new Error(validatedProfile.error.message);
                }
                const userEmail = yield (0, db_helpers_1.findOne)(client_model_1.default, { email });
                if (userEmail) {
                    throw new Error(`Email ${email} is already exists`);
                }
                const userNumber = yield (0, db_helpers_1.findOne)(client_model_1.default, { contact });
                if (userNumber) {
                    throw new Error(`Number ${contact} is already exists`);
                }
                const userNames = yield (0, db_helpers_1.findOne)(client_model_1.default, { userName });
                if (userNames) {
                    throw new Error(`UserName ${userName} is already exists`);
                }
                if (password !== confirmPassword) {
                    throw new Error(`Passwords do not match!`);
                }
                let hashed = yield (0, common_util_1.genHash)(password);
                const otp = (0, utils_1.generateRandomOtp)();
                //send a mail with otp 
                const html = yield (0, utils_1.readHTMLFile)(path_1.default.join(__dirname, '../', '../', 'src', 'template', 'otp_email.html'));
                const template = handlebars_1.default.compile(html);
                const [otp1, otp2, otp3, otp4] = otp.split('');
                const tempData = template({ otp1, otp2, otp3, otp4, email: email, firstName: name });
                yield (0, nodemailer_1.sendEmail)(process.env.EMAIL_NOTIFICATION_ADDRESS, 'OTP for Reset Password', email, tempData);
                const saveResponse = yield (0, db_helpers_1.upsert)(dummy_model_1.default, { name, email, userName: userNameUpperCase, countryCode, contact, password: hashed, referralCode, otp, status: "PENDING", isKYCConfirmed, device_type, device_token });
                delete saveResponse.password;
                delete saveResponse.otp;
                return {
                    data: Object.assign({}, saveResponse.toObject()),
                    error: '',
                    message: 'OTP send successfully',
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
     * Verify Otp during registration
     */
    verifyotp(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { otp, email } = request;
                const exists = yield dummy_model_1.default.findOne({ email: email }).sort({ createdAt: -1 }).limit(1);
                if (exists.otp != otp) {
                    throw new Error("OTP does not match");
                }
                var data = yield (0, db_helpers_1.upsert)(client_model_1.default, {
                    name: exists.name,
                    email: exists.email,
                    userName: exists.userName,
                    countryCode: exists.countryCode,
                    contact: exists.contact,
                    password: exists.password,
                    referralCode: exists.referralCode,
                    status: "APPROVED",
                    isKYCConfirmed: exists.isKYCConfirmed,
                    device_type: exists.device_type,
                    device_token: exists.device_token
                });
                delete data.password;
                const token = yield (0, common_util_1.signToken)(data._id, { access: 'client', purpose: 'reset' });
                return {
                    data: Object.assign(Object.assign({}, data.toObject()), { token }),
                    error: "",
                    message: "OTP verify Successfully",
                    status: 200,
                };
            }
            catch (err) {
                logger_config_1.default.error(`${this.req.ip} ${err.message}`);
                return {
                    data: null,
                    error: err.message ? err.message : err,
                    message: "",
                    status: 400,
                };
            }
        });
    }
    /**
     * Verify KYC
     */
    verifyKyc(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { kycCode } = request;
                let exists = yield (0, db_helpers_1.upsert)(client_model_1.default, { isKYCConfirmed: kycCode }, this.userId);
                return {
                    data: Object.assign({}, exists.toObject()),
                    error: "",
                    message: "Kyc completed successfully",
                    status: 200,
                };
            }
            catch (err) {
                logger_config_1.default.error(`${this.req.ip} ${err.message}`);
                return {
                    data: null,
                    error: err.message ? err.message : err,
                    message: "",
                    status: 400,
                };
            }
        });
    }
    /**
    * Get user login
    */
    login(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, password, device_type, device_token } = request;
                const validatedUser = (0, client_validator_1.validateClient)({ email, password });
                if (validatedUser.error) {
                    throw new Error(validatedUser.error.message);
                }
                const exists = yield (0, db_helpers_1.findOne)(client_model_1.default, { email });
                if (!exists) {
                    throw new Error('User doesn\'t exists!');
                }
                // check if blocked
                if (exists.isBlocked) {
                    throw new Error('User is blocked');
                }
                const isValid = yield (0, common_util_1.verifyHash)(password, exists.password);
                if (!isValid) {
                    throw new Error('Password seems to be incorrect');
                }
                let response = yield (0, db_helpers_1.upsert)(client_model_1.default, { device_type: device_type, device_token: device_token }, exists._id);
                const token = yield (0, common_util_1.signToken)(exists._id, { access: 'client', purpose: 'reset' });
                delete exists.password;
                return {
                    data: Object.assign(Object.assign({}, response === null || response === void 0 ? void 0 : response.toObject()), { token }),
                    error: '',
                    message: 'Login successfully',
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
    * Forgot password api endpoint
    */
    forgotPassword(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email } = request;
                // Convert email to lowercase
                const lowerCaseEmail = email.toLowerCase();
                const validatedForgotPassword = (0, client_validator_1.validateForgotPasswordClient)({ email: lowerCaseEmail });
                if (validatedForgotPassword.error) {
                    throw new Error(validatedForgotPassword.error.message);
                }
                // Check if the user exists using the lowercase email
                const exists = yield (0, db_helpers_1.findOne)(client_model_1.default, { email: lowerCaseEmail });
                if (!exists) {
                    throw new Error('Invalid Email');
                }
                const otp = (0, utils_1.generateRandomOtp)();
                const existOtp = yield (0, db_helpers_1.findOne)(otp_model_1.default, { email: exists.email });
                if (existOtp) {
                    yield (0, db_helpers_1.upsert)(otp_model_1.default, { otp, email: exists.email }, existOtp._id);
                }
                else {
                    yield (0, db_helpers_1.upsert)(otp_model_1.default, { otp, email: exists.email });
                }
                // Send a mail with otp 
                const html = yield (0, utils_1.readHTMLFile)(path_1.default.join(__dirname, '../', '../', 'src', 'template', 'otp_email.html'));
                const template = handlebars_1.default.compile(html);
                const [otp1, otp2, otp3, otp4] = otp.split('');
                const tempData = template({ otp1, otp2, otp3, otp4, email: exists.email, firstName: exists.name });
                yield (0, nodemailer_1.sendEmail)(process.env.EMAIL_NOTIFICATION_ADDRESS, 'OTP for Reset Password', exists.email, tempData);
                return {
                    data: {},
                    error: '',
                    message: 'Password reset OTP successfully sent to ' + exists.email,
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
    * Verify otp for user
    */
    verifyOtp(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, otp } = request;
                const lowerCaseEmail = email.toLowerCase();
                // Check User Found or Not
                const existsOtp = yield (0, db_helpers_1.findOne)(otp_model_1.default, { email: lowerCaseEmail });
                if (!existsOtp) {
                    throw new Error('OTP not generated!!');
                }
                // check Otp
                if (otp != existsOtp.otp) {
                    throw new Error('Wrong OTP Entered, please check your OTP!!');
                }
                else {
                    yield (0, db_helpers_1.upsert)(otp_model_1.default, { isActive: true }, existsOtp._id);
                }
                const exists = yield (0, db_helpers_1.findOne)(client_model_1.default, { email: lowerCaseEmail });
                const token = yield (0, common_util_1.signToken)(exists._id, { access: 'client', purpose: 'reset' });
                return {
                    data: { token },
                    error: '',
                    message: 'Otp verify successfully!!',
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
    * Forgot password api endpoint
    */
    resetPassword(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { new_password } = request;
                const validatedResetPassword = (0, client_validator_1.validateClientResetPassword)({ new_password });
                if (validatedResetPassword.error) {
                    throw new Error(validatedResetPassword.error.message);
                }
                const hashed = yield (0, common_util_1.genHash)(new_password);
                const updated = yield (0, db_helpers_1.upsert)(client_model_1.default, { password: hashed }, this.userId);
                return {
                    data: {},
                    error: '',
                    message: 'Password reset successfully!',
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
    * Get user info
    */
    me() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                //   check for a valid id
                const getResponse = yield (0, db_helpers_1.getById)(client_model_1.default, this.userId);
                return {
                    data: getResponse || {},
                    error: '',
                    message: 'Client info fetched Successfully',
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
     * update the user profile
     */
    updateProfile(name, email, userName, contact, referralCode, file) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validatedProfile = (0, client_validator_1.validateUpdateData)({ name, email, userName, contact, referralCode });
                if (validatedProfile.error) {
                    throw new Error(validatedProfile.error.message);
                }
                const userData = yield (0, db_helpers_1.getById)(client_model_1.default, this.userId);
                if (!userData) {
                    throw new Error(`User does not exist`);
                }
                const userNameUpperCase = userName ? userName.toUpperCase() : userName;
                let payload = {};
                if (name) {
                    payload.name = name;
                }
                if (email) {
                    payload.email = email;
                }
                if (userName) {
                    payload.userName = userNameUpperCase;
                }
                if (contact) {
                    payload.contact = contact;
                }
                if (referralCode) {
                    payload.referralCode = referralCode;
                }
                let propertyDocument;
                if (file) {
                    propertyDocument = yield (0, aws_s3_utils_1.default)(file === null || file === void 0 ? void 0 : file.originalname, file === null || file === void 0 ? void 0 : file.buffer, (file === null || file === void 0 ? void 0 : file.mimetype.includes('image/png')) ? "image/png" : "image/jpeg");
                }
                if (file) {
                    payload.profileImage = propertyDocument;
                }
                let saveResponse = yield (0, db_helpers_1.upsert)(client_model_1.default, payload, userData._id);
                return {
                    data: Object.assign({}, saveResponse.toObject()),
                    error: '',
                    message: 'Update profile successfully',
                    status: 200,
                };
            }
            catch (err) {
                logger_config_1.default.error(`${this.req.ip} ${err.message}`);
                return {
                    data: null,
                    error: err.message ? err.message : err,
                    message: '',
                    status: 400,
                };
            }
        });
    }
    /**
    * Request for lease
    */
    leaseRequest(propertyName, propertyDescription, addressLine1, addressLine2, state, country, pincode, file) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const ValidateLeaseProperty = (0, client_validator_1.validateLeaseProperty)({ propertyName, propertyDescription, addressLine1, addressLine2, state, country, pincode });
                if (ValidateLeaseProperty.error) {
                    throw new Error(ValidateLeaseProperty.error.message);
                }
                // check if client exists
                const propertyData = yield (0, db_helpers_1.findOne)(leasePropertyDetail_Model_1.default, { propertyName });
                if (propertyData) {
                    throw new Error(`Name ${propertyName} is already exists`);
                }
                let propertyDocument;
                if (file) {
                    propertyDocument = yield (0, aws_s3_utils_1.default)(file === null || file === void 0 ? void 0 : file.originalname, file === null || file === void 0 ? void 0 : file.buffer, (file === null || file === void 0 ? void 0 : file.mimetype.includes('application/pdf')) ? "application/pdf" : "application/pdf");
                }
                let saveResponse = yield (0, db_helpers_1.upsert)(leasePropertyDetail_Model_1.default, { userId: this.userId, propertyName, propertyDescription, addressLine1, addressLine2, state, country, pincode, propertyDocument });
                // const leaseRequestId = saveResponse._id;
                // await sendNotificationToAdmin(leaseRequestId, "Lease Request Send Successfully", "Hello you get Lease Request From User");
                // const notifictions = await upsert(notificationsModels, {
                //     notifications: "Lease Request Send Successfully",
                //     view: true,
                //     type: "User",
                //     leaseRequestId: saveResponse._id,
                //     message: "Lease Request Send Successfully"
                // });
                return {
                    data: Object.assign({}, saveResponse.toObject()),
                    error: '',
                    message: 'User registered successfully',
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
 * Get User lease property request data
 */
    leasePropertyRequestData(pageNumber, pageSize) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const totalCount = yield leasePropertyDetail_Model_1.default.countDocuments({});
                const data = yield leasePropertyDetail_Model_1.default.aggregate([
                    {
                        $match: {
                            userId: mongoose_1.default.Types.ObjectId(this.userId)
                        }
                    },
                    {
                        $lookup: {
                            from: "agreementdetails",
                            localField: "_id",
                            foreignField: "leaseRequestId",
                            as: "agreementDetails"
                        }
                    },
                    {
                        $lookup: {
                            from: "propertydetails",
                            localField: "agreementDetails.propertyId",
                            foreignField: "_id",
                            as: "propertyDetails"
                        }
                    },
                    {
                        $sort: { createdAt: -1 }
                    },
                    {
                        $skip: Number(pageNumber - 1) * Number(pageSize)
                    },
                    {
                        $limit: Number(pageSize)
                    },
                    {
                        $project: {
                            _id: 1,
                            userId: 1,
                            propertyName: 1,
                            propertyDescription: 1,
                            addressLine1: 1,
                            addressLine2: 1,
                            state: 1,
                            country: 1,
                            pincode: 1,
                            isBlocked: 1,
                            propertyDocument: 1,
                            status: 1,
                            createdAt: 1,
                            agreementDetails: {
                                $first: "$agreementDetails"
                            },
                            propertyData: {
                                $first: "$propertyDetails"
                            },
                        }
                    }
                ]);
                return {
                    data: { data, totalCount },
                    error: '',
                    message: 'Lease Property Request Data Fetached successfully!',
                    status: 200
                };
            }
            catch (error) {
                return {
                    data: null,
                    error: 'Error occurred',
                    message: 'Failed to Search',
                    status: 404
                };
            }
        });
    }
    /**
   * Get agreement Data
   */
    getAgreementData(pageNumber, pageSize) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // const agreementId = this.userId;
                const agreementDetails = yield agreement_model_1.default.aggregate([
                    {
                        $match: { userId: mongoose_1.default.Types.ObjectId(this.userId) },
                    },
                    {
                        $lookup: {
                            from: 'propertydetails',
                            localField: 'propertyId',
                            foreignField: '_id',
                            as: 'propertyDetails',
                        },
                    },
                    {
                        $lookup: {
                            from: 'leaseproperties',
                            localField: 'leaseRequestId',
                            foreignField: '_id',
                            as: 'leaseProperties',
                        },
                    },
                ]);
                if (!agreementDetails || agreementDetails.length === 0) {
                    throw new Error(`Agreement not found`);
                }
                return {
                    data: agreementDetails,
                    error: '',
                    message: 'Agreement Details Fetch Succesfully',
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
    * Buy Red Token
    */
    buyRedToken() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const adminData = yield (0, db_helpers_1.findOne)(admin_model_1.default, {});
                const conversionrate = adminData.conversionRate;
                const adminWalletAddress = adminData.walletAddress;
                return {
                    data: { conversionrate, adminWalletAddress },
                    error: '',
                    message: 'Admin wallet address fetch successfully!',
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
    *Get Booq conversion rate api
    */
    getBooqConversionRate() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const adminData = yield (0, db_helpers_1.findOne)(admin_model_1.default, {});
                const conversionrate = adminData.conversionRateForLoan;
                return {
                    data: { conversionrate },
                    error: '',
                    message: 'Booq conversion rate fetch successfully!',
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
   * Request for Buying Red Token
   */
    requestRedToken(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { totalRedToken, hashId, usdc, transactionType, accountType, walletAddress } = request;
                const validateRedToken = (0, client_validator_1.validateRedTokenRequest)({ totalRedToken, hashId, usdc, transactionType, accountType });
                if (validateRedToken.error) {
                    throw new Error(validateRedToken.error.message);
                }
                // check if client exists
                const propertyData = yield (0, db_helpers_1.findOne)(redTokenTransaction_model_1.default, { hashId });
                if (propertyData) {
                    throw new Error(`Name ${hashId} is already exists`);
                }
                const clientData = yield (0, db_helpers_1.findOne)(client_model_1.default, { _id: this.userId });
                let saveResponse = yield (0, db_helpers_1.upsert)(redTokenTransaction_model_1.default, { senderId: clientData._id, senderUserName: clientData.userName, totalRedToken, hashId, usdc, transactionType, accountType, walletAddress });
                return {
                    data: Object.assign({}, saveResponse.toObject()),
                    error: '',
                    message: 'Red token request send successfully',
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
  * Request for Buying Red Token
  */
    redTokenTransactionsDetails(pageNumber, pageSize) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const query = {
                    $or: [
                        { senderId: this.userId },
                        { receiverId: this.userId }
                    ],
                    transactionType: {
                        $nin: ['Solos Reward']
                    }
                };
                const sendData = yield (0, db_helpers_1.getAll)(redTokenTransaction_model_1.default, query, +pageNumber, +pageSize);
                const items = sendData.items.map(item => {
                    if (item.transactionType !== "Buy RED" && item.transactionType !== "Sell RED") {
                        const transactionType = item.receiverId.toString() === this.userId.toString() ? 'Receive RED' : 'Send RED';
                        return Object.assign(Object.assign({}, item), { transactionType });
                    }
                    return Object.assign({}, item);
                });
                return {
                    data: { items, pageNumber: sendData.pageNumber, pageSize: sendData.pageSize, totalItems: sendData.totalItems },
                    error: '',
                    message: 'Transactions details fetched Successfully',
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
 * Request for sell red token
 */
    usdcTransactionsDetails(pageNumber, pageSize) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const aggregate = [
                    {
                        $lookup: {
                            from: "clients",
                            localField: "senderId",
                            foreignField: "_id",
                            as: "client"
                        }
                    },
                    {
                        $unwind: "$client"
                    },
                    {
                        $match: {
                            transactionType: {
                                $nin: ['Solos Reward', null, 'Red Token']
                            }
                        }
                    },
                    {
                        $project: {
                            status: 1,
                            senderId: 1,
                            totalRedToken: 1,
                            hashId: 1,
                            usdc: 1,
                            transactionType: 1,
                            accountType: 1,
                            walletAddress: 1,
                            userName: "$client.userName",
                            name: "$client.name",
                            createdAt: 1,
                            updatedAt: 1
                        }
                    }
                ];
                const getRedTokenData = yield (0, db_helpers_1.getAggregation)(redTokenTransaction_model_1.default, aggregate, +pageNumber, +pageSize);
                return {
                    data: getRedTokenData,
                    error: '',
                    message: 'Transactions details fetched Successfully',
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
     * Request for usdc
     */
    sellRed(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { totalRedToken, hashId, usdc, transactionType, accountType, walletAddress, hashId2 } = request;
                const validateRedToken = (0, client_validator_1.validateRedTokenRequest)({ totalRedToken, hashId, usdc, transactionType, accountType });
                if (validateRedToken.error) {
                    throw new Error(validateRedToken.error.message);
                }
                const clientData = yield (0, db_helpers_1.findOne)(client_model_1.default, { _id: this.userId });
                console.log(clientData);
                let saveResponse = yield (0, db_helpers_1.upsert)(redTokenTransaction_model_1.default, { senderId: clientData._id, senderUsername: clientData.userName, totalRedToken, hashId, usdc, transactionType, accountType, walletAddress, hashId2 });
                return {
                    data: Object.assign({}, saveResponse.toObject()),
                    error: '',
                    message: 'Red Sell Successfully',
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
        * Get Wallet Data
        */
    walletData(accountType) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield (0, db_helpers_1.findOne)(client_model_1.default, { _id: this.userId });
                let redToken;
                if (accountType == 'Primary') {
                    redToken = +response.redToken;
                }
                else {
                    redToken = +response.businessRedToken;
                }
                let soloReward;
                if (accountType == 'Primary') {
                    soloReward = +response.solosReward;
                }
                else {
                    soloReward = +response.businessSoloReward;
                }
                const adminData = yield (0, db_helpers_1.findOne)(admin_model_1.default, {});
                const conversionrate = +adminData.conversionRate;
                const usd = +redToken / +conversionrate;
                const conversionRateForSolo = +adminData.conversionRateForSoloReward;
                const soloUsd = +soloReward / +conversionRateForSolo;
                return {
                    data: { redToken, usd, userInfo: response, soloUsd },
                    error: '',
                    message: 'Wallet Data Fetched Successfully',
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
    * Get Booking Amount
    */
    getBookingAmount(totalPropertyValue) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const adminData = yield (0, db_helpers_1.findOne)(admin_model_1.default, {});
                const bookingPercentage = +adminData.bookingPercentage;
                const bookingPercentage2 = bookingPercentage / 100;
                const bookingAmount = +totalPropertyValue * +bookingPercentage2;
                return {
                    data: { bookingAmount },
                    error: '',
                    message: 'Booking Amount Fetched Successfully',
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
     * Switch Account Api
     */
    switchAccount(accountType) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield (0, db_helpers_1.findOne)(client_model_1.default, { _id: this.userId });
                if (!user) {
                    return {
                        data: null,
                        error: 'User not found',
                        message: '',
                        status: 404
                    };
                }
                let responseFields = {};
                if (accountType == 'personal') {
                    responseFields = {
                        name: user.name,
                        email: user.email,
                        userName: user.userName,
                        countryCode: user.countryCode,
                        contact: user.contact,
                        password: user.password,
                        referralCode: user.referralCode,
                        isBlocked: user.isBlocked,
                        profileImage: user.profileImage,
                        status: user.status,
                        isKYCConfirmed: user.isKYCConfirmed,
                        isMpinActive: user.isMpinActive,
                        mpin: user.mpin,
                        isMpinUsedForTransactions: user.isMpinUsedForTransactions,
                        walletAddress: user.walletAddress,
                        redToken: user.redToken,
                        device_type: user.device_type,
                        device_token: user.device_token,
                    };
                }
                else if (accountType == 'business') {
                    responseFields = {
                        businessEmail: user.businessEmail,
                        businessUserName: user.businessUserName,
                        businessContact: user.businessContact,
                        businessCountryCode: user.businessCountryCode,
                        isKYCConfirmed: user.isKYCConfirmed,
                        isMpinActive: user.isMpinActive,
                        mpin: user.mpin,
                        isMpinUsedForTransactions: user.isMpinUsedForTransactions,
                        walletAddress: user.walletAddress,
                        redToken: user.redToken,
                        device_type: user.device_type,
                        device_token: user.device_token,
                    };
                }
                return {
                    data: responseFields,
                    error: '',
                    message: 'Account Switched Successfully',
                    status: 200
                };
            }
            catch (err) {
                logger_config_1.default.error(`${this.req.ip} ${err.message}`);
                return {
                    data: null,
                    error: err.message ? err.message : err,
                    message: '',
                    status: 404
                };
            }
        });
    }
    /**
    * Get User Possesion Data
    */
    possesionListing(pageNumber, pageSize) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const totalCount = yield agreement_model_1.default.countDocuments({
                    userId: mongoose_1.default.Types.ObjectId(this.userId),
                    status: { $in: ['APPROVED', 'DECLINED'] }
                });
                const data = yield agreement_model_1.default.aggregate([
                    {
                        $match: {
                            userId: mongoose_1.default.Types.ObjectId(this.userId),
                            status: { $in: ['APPROVED', 'DECLINED'] }
                        }
                    },
                    {
                        $lookup: {
                            from: "propertydetails",
                            localField: "propertyId",
                            foreignField: "_id",
                            as: "propertyDetails"
                        }
                    },
                    {
                        $lookup: {
                            from: "redtokentransactions",
                            localField: "propertyId",
                            foreignField: "propertyId",
                            as: "transactionDetails"
                        }
                    },
                    {
                        $unwind: "$propertyDetails"
                    },
                    {
                        $sort: { createdAt: -1 }
                    },
                    {
                        $skip: Number(pageNumber - 1) * Number(pageSize)
                    },
                    {
                        $limit: Number(pageSize)
                    },
                    {
                        $project: {
                            _id: 0,
                            propertyId: 1,
                            userId: 1,
                            leaseRequestId: 1,
                            propertyName: 1,
                            propertyType: 1,
                            streetAddress: 1,
                            city: 1,
                            state: 1,
                            country: 1,
                            apn: 1,
                            typeOfPropertyOwnership: 1,
                            tract: 1,
                            landValue: 1,
                            improvements: 1,
                            totalValue: 1,
                            monthlyLeaseFee: 1,
                            leaseTerm: 1,
                            leaseStartDate: 1,
                            leaseExpirationDate: 1,
                            unit: 1,
                            legalAttachments: 1,
                            displayAttachments: 1,
                            floorPlans: 1,
                            propertyDetails: "$propertyDetails",
                            transactionDetails: {
                                $first: "$transactionDetails"
                            },
                        }
                    }
                ]);
                return {
                    data: { data, totalCount },
                    error: '',
                    message: 'Possession Data Listed Successfully',
                    status: 200
                };
            }
            catch (error) {
                return {
                    data: null,
                    error: 'Error occurred',
                    message: 'Failed to Search',
                    status: 404
                };
            }
        });
    }
    /**
  * Get agreement Data
  */
    possesionPropertyYouWant(propertyId, pageNumber, pageSize) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // const agreementId = this.userId;
                const agreementDetails = yield agreement_model_1.default.aggregate([
                    {
                        $match: {
                            propertyId: mongoose_1.default.Types.ObjectId(propertyId),
                            userId: mongoose_1.default.Types.ObjectId(this.userId)
                        },
                    },
                    {
                        $lookup: {
                            from: 'propertydetails',
                            localField: 'propertyId',
                            foreignField: '_id',
                            as: 'propertyDetails',
                        },
                    },
                    {
                        $sort: { createdAt: -1 }
                    },
                    {
                        $skip: Number(pageNumber - 1) * Number(pageSize)
                    },
                    {
                        $limit: Number(pageSize)
                    },
                ]);
                if (!agreementDetails || agreementDetails.length === 0) {
                    throw new Error(`Agreement not found`);
                }
                return {
                    data: agreementDetails,
                    error: '',
                    message: 'Agreement Details Fetch Succesfully',
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
  * GET Property and Agreement Details
  */
    leasePropertyYouWant(propertyId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield propertyDetailsModel_1.default.aggregate([
                    {
                        $match: {
                            _id: mongoose_1.default.Types.ObjectId(propertyId)
                        }
                    },
                    {
                        $lookup: {
                            from: "agreementdetails",
                            localField: "_id",
                            foreignField: "propertyId",
                            as: "agreementDetails"
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            propertyDocument: 1,
                            imageURL: 1,
                            aminities: 1,
                            propertyName: 1,
                            description: 1,
                            propertyDetails: 1,
                            agreementDetails: { $arrayElemAt: ["$agreementDetails", 0] }
                        }
                    }
                ]);
                // Check if data is empty or not found
                if (!data || data.length === 0) {
                    return {
                        data: null,
                        error: 'Property not found',
                        message: '',
                        status: 404
                    };
                }
                return {
                    data: data[0],
                    error: '',
                    message: 'Property Details fetched Successfully',
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
    * Add Account
    */
    addAccount(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { accountType, businessEmail, businessUserName, businessContact, businessCountryCode } = request;
                const _id = this.userId;
                const validatedUser = (0, client_validator_1.validateAddAc)({ accountType, businessEmail, businessUserName, businessContact, businessCountryCode });
                if (validatedUser.error) {
                    throw new Error(validatedUser.error.message);
                }
                const account = yield client_model_1.default.findById(_id);
                if (!account) {
                    throw new Error("Account Not Found");
                }
                if (account && account.isSecondaryAccountActive) {
                    throw new Error("You Can't Add Third Account");
                }
                //check for already existing email for other user
                const checkEmail = yield (0, db_helpers_1.findOne)(client_model_1.default, {
                    $or: [{ email: businessEmail }, { businessEmail: businessEmail }]
                });
                if (checkEmail && checkEmail._id.toString() !== _id.toString()) {
                    throw new Error(`Email ${businessEmail} already exists`);
                }
                //check for already existing number for other user
                const checkContact = yield (0, db_helpers_1.findOne)(client_model_1.default, {
                    $or: [{ contact: businessContact }, { businessContact: businessContact }]
                });
                if (checkContact && checkContact._id.toString() !== _id.toString()) {
                    throw new Error(`Contact ${businessContact} already exists`);
                }
                //check for already existing username for other user
                const checkUserName = yield (0, db_helpers_1.findOne)(client_model_1.default, {
                    $or: [{ userName: businessUserName }, { businessUserName: businessUserName }]
                });
                if (checkUserName && checkUserName._id.toString() !== _id.toString()) {
                    throw new Error(`Username ${businessUserName} already exists`);
                }
                let saveResponse = yield (0, db_helpers_1.upsert)(client_model_1.default, { accountType, businessEmail, businessUserName, businessContact, businessCountryCode, isSecondaryAccountActive: true }, _id);
                return {
                    data: Object.assign({}, saveResponse.toObject()),
                    error: '',
                    message: 'Add Account successfully',
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
    * post contacts
    */
    postContacts(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { contacts } = request;
                let postData = contacts.map(item => item.replace(/ /g, ""));
                const response = yield (0, db_helpers_1.findAll)(client_model_1.default, {}, { _id: 0, name: 1, userName: 1, contact: 1, email: 1, profileImage: 1 });
                let responseData = [];
                //check if the user's data is present in the postData
                const user = yield (0, db_helpers_1.findOne)(client_model_1.default, { _id: this.userId });
                if (postData.includes(user.contact)) {
                    const indexToRemove = postData.indexOf(user.contact);
                    if (indexToRemove !== -1) {
                        postData.splice(indexToRemove, 1);
                    }
                }
                for (let contact of response) {
                    let number = contact.contact;
                    if (postData.includes(number)) {
                        responseData.push(contact);
                    }
                }
                return {
                    data: { responseData },
                    error: '',
                    message: 'Contacts Recieved',
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
    * Search user is exist or not
    */
    SearchUser(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userName } = request;
                const upperCaseUserName = userName.toLocaleUpperCase();
                // Check User Found or Not
                const existsUser = yield (0, db_helpers_1.findOne)(client_model_1.default, { userName: upperCaseUserName });
                if (!existsUser) {
                    throw new Error('User not exist!!');
                }
                return {
                    data: { existsUser },
                    error: '',
                    message: 'User exist!!',
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
    * Red token send to user in the app
    */
    sendRedToken(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userName, redToken, accountType } = request;
                const senderData = yield (0, db_helpers_1.getById)(client_model_1.default, this.userId);
                const requestRedTokenValue = parseFloat(redToken);
                if (requestRedTokenValue === 0) {
                    throw new Error('Invalid input: Input should not be zero.');
                }
                const upperCaseUserName = userName.toUpperCase();
                const upperCaseSenderUserName = senderData.userName.toUpperCase();
                if (upperCaseUserName === upperCaseSenderUserName || userName === senderData.businessUserName) {
                    throw new Error("You can't send red token to yourself");
                }
                const clientField = accountType === 'Primary' ? 'redToken' : 'businessRedToken';
                const userRedToken = parseFloat(senderData[clientField]);
                if (isNaN(userRedToken) || isNaN(requestRedTokenValue)) {
                    throw new Error('Invalid redToken values');
                }
                if (userRedToken < requestRedTokenValue) {
                    throw new Error("User doesn't have enough tokens");
                }
                const receiverData = yield client_model_1.default.findOne({
                    $or: [{ userName: upperCaseUserName }, { businessUserName: upperCaseUserName }]
                });
                if (!receiverData) {
                    throw new Error('Receiver user doesn\'t exist!');
                }
                const receiverField = (receiverData.userName === upperCaseUserName) ? 'redToken' : 'businessRedToken';
                const senderUpdatedRedToken = userRedToken - requestRedTokenValue;
                const receiverUpdatedRedToken = parseFloat(receiverData[receiverField]) + requestRedTokenValue;
                const saveResponse1 = yield (0, db_helpers_1.upsert)(client_model_1.default, { [clientField]: senderUpdatedRedToken }, this.userId);
                const saveResponse2 = yield (0, db_helpers_1.upsert)(client_model_1.default, { [receiverField]: receiverUpdatedRedToken }, receiverData._id);
                // Save transaction details
                const sender = yield (0, db_helpers_1.findOne)(client_model_1.default, { _id: this.userId });
                const transactionResponse = yield (0, db_helpers_1.upsert)(redTokenTransaction_model_1.default, {
                    senderId: this.userId,
                    receiverId: receiverData._id,
                    senderUsername: sender.userName,
                    receiverUsername: upperCaseUserName,
                    totalRedToken: redToken,
                    transactionType: 'Red Token',
                    token: 'RED',
                    status: "APPROVED",
                });
                return {
                    data: { transactionResponse },
                    error: '',
                    message: 'RedToken sent successfully',
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
    /**
    Logout
    */
    logout() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const authHeader = this.req.headers.authorization;
                yield (0, db_helpers_1.upsert)(token_model_1.default, { token: authHeader });
                return {
                    data: {},
                    error: '',
                    message: 'Logged Out Successfully',
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
    * Send email otp for Mpin
    */
    sendMpinOtp(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const _id = this.userId;
                const exists = yield (0, db_helpers_1.findOne)(client_model_1.default, { _id });
                if (!exists) {
                    throw new Error('User not found !');
                }
                const { emailOtp } = request;
                if (emailOtp) {
                    const mpinEmailOtp = (0, utils_1.generateRandomOtp)();
                    const existOtp = yield (0, db_helpers_1.findOne)(otp_model_1.default, { email: exists.email });
                    if (existOtp) {
                        yield (0, db_helpers_1.upsert)(otp_model_1.default, { mpinEmailOtp, email: exists.email }, existOtp._id);
                    }
                    else {
                        yield (0, db_helpers_1.upsert)(otp_model_1.default, { mpinEmailOtp, email: exists.email });
                    }
                    //send a mail with otp 
                    const html = yield (0, utils_1.readHTMLFile)(path_1.default.join(__dirname, '../', '../', 'src', 'template', 'mpin_email.html'));
                    const template = handlebars_1.default.compile(html);
                    const [otp1, otp2, otp3, otp4] = mpinEmailOtp.split('');
                    const tempData = template({ otp1, otp2, otp3, otp4, email: exists.email, firstName: exists.name });
                    yield (0, nodemailer_1.sendEmail)(process.env.EMAIL_NOTIFICATION_ADDRESS, 'OTP for Mpin setup', exists.email, tempData);
                }
                const exist = yield (0, db_helpers_1.findOne)(otp_model_1.default, { email: exists.email });
                const data = { emailOtp: exist.mpinEmailOtp };
                return {
                    data: data,
                    error: '',
                    message: 'Otp Sent successfully',
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
    * send registration token for notifications
    */
    registrationTokens(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { registrationToken } = request;
                const user = yield (0, db_helpers_1.findOne)(client_model_1.default, { _id: this.userId });
                let tokens = user.registrationTokens;
                tokens.push(registrationToken);
                yield (0, db_helpers_1.upsert)(client_model_1.default, { registrationTokens: tokens }, {
                    _id: this.userId
                });
                return {
                    data: {},
                    error: '',
                    message: 'Registration Token saved successfully',
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
    * Create Mpin Api
    */
    createMpin(request) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const _id = this.userId;
                const exists = yield (0, db_helpers_1.findOne)(client_model_1.default, { _id });
                if (!exists) {
                    throw new Error('User not found !');
                }
                const { password, mpin, isMpinUsedForTransactions } = request;
                const isValid = yield (0, common_util_1.verifyHash)(password !== null && password !== void 0 ? password : '', (_a = exists.password) !== null && _a !== void 0 ? _a : '');
                if (!isValid) {
                    throw new Error('Password seems to be incorrect');
                }
                else {
                    let hashed = yield (0, common_util_1.genHash)(mpin);
                    yield (0, db_helpers_1.upsert)(client_model_1.default, { mpin: hashed, isMpinCreated: true, isMpinUsedForTransactions }, _id);
                }
                return {
                    data: { "Mpin Created": "Success" },
                    error: '',
                    message: 'Mpin Created successfully',
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
  * Mpin, Email, FaceScan status update API
  */
    enableDisableSecurity(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { value, type } = request;
                const _id = this.userId;
                let updateField = {};
                let updateField2 = {};
                let updateField3 = {};
                let message = '';
                const toggledValue = !value;
                if (type === 'isMpinActive') {
                    updateField = { isMpinActive: value };
                    updateField2 = { isEmailOtpActive: toggledValue };
                    updateField3 = { isFaceScanActive: toggledValue };
                    message = 'Mpin status updated successfully';
                }
                else if (type === 'isEmailOtpActive') {
                    updateField = { isEmailOtpActive: value };
                    updateField2 = { isMpinActive: toggledValue };
                    updateField3 = { isFaceScanActive: toggledValue };
                    message = 'Email OTP status updated successfully';
                }
                else if (type === 'isFaceScanActive') {
                    updateField = { isFaceScanActive: value };
                    updateField2 = { isEmailOtpActive: toggledValue };
                    updateField3 = { isMpinActive: toggledValue };
                    message = 'Face scan status updated successfully';
                }
                yield (0, db_helpers_1.upsert)(client_model_1.default, updateField, _id);
                yield (0, db_helpers_1.upsert)(client_model_1.default, updateField2, _id);
                yield (0, db_helpers_1.upsert)(client_model_1.default, updateField3, _id);
                return {
                    data: {},
                    error: '',
                    message,
                    status: 200
                };
            }
            catch (err) {
                logger_config_1.default.error(`${this.req.ip} ${err.message}`);
                return {
                    data: null,
                    error: err.message ? err.message : err,
                    message: 'Failed to update Mpin status',
                    status: 400
                };
            }
        });
    }
    /**
        * Create Mpin Api
        */
    verifyPassword(request) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const _id = this.userId;
                const exists = yield (0, db_helpers_1.findOne)(client_model_1.default, { _id });
                const { password } = request;
                const isValid = yield (0, common_util_1.verifyHash)(password !== null && password !== void 0 ? password : '', (_a = exists.password) !== null && _a !== void 0 ? _a : '');
                if (!isValid) {
                    throw new Error('Password seems to be incorrect');
                }
                return {
                    data: "Success",
                    error: '',
                    message: 'Password Match Successfully',
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
   * Verification of mpin over usage
   */
    verifyMpin(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { mpin } = request;
                const _id = this.userId;
                const exists = yield (0, db_helpers_1.findOne)(client_model_1.default, { _id });
                if (!exists) {
                    throw new Error('User not found');
                }
                const isValid = yield (0, common_util_1.verifyHash)(mpin, exists.mpin);
                if (!isValid) {
                    throw new Error('Incorrect Mpin');
                }
                if (!exists.mpin) {
                    throw new Error("Mpin not Generated");
                }
                return {
                    data: { "Mpin": "Verified" },
                    error: '',
                    message: 'Mpin verified successfully',
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
    * Add/Update wallet address
    */
    updateWalletAddress(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const _id = this.userId;
                const exists = yield (0, db_helpers_1.findOne)(client_model_1.default, { _id });
                if (!exists) {
                    throw new Error("User doesnot exist");
                }
                const { walletAddress } = request;
                let saveResponse = yield (0, db_helpers_1.upsert)(client_model_1.default, { walletAddress: walletAddress }, _id);
                const data = saveResponse.walletAddress;
                return {
                    data: { data },
                    error: '',
                    message: 'Wallet Address Updated Successfully',
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
     * Get wallet address
     */
    getWalletAddress() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const _id = this.userId;
                const exists = yield (0, db_helpers_1.findOne)(client_model_1.default, { _id });
                let walletAddress;
                if (exists) {
                    walletAddress = exists.walletAddress;
                }
                else {
                    throw new Error("User doesnot exist");
                }
                return {
                    data: { walletAddress },
                    error: '',
                    message: 'Wallet Address fetched Successfully',
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
    getNftDataByUser(pageNumber, pageSize, filter) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let query = { isPaid: { $ne: true } };
                if (filter) {
                    query.$or = [
                        { name: { $regex: filter, $options: 'i' } }
                    ];
                }
                const data = yield (0, db_helpers_1.getAll)(nftDetail_model_1.default, query, +pageNumber, +pageSize);
                return {
                    data: data || {},
                    error: '',
                    message: 'All NFT Data fetched Successfully',
                    status: 200
                };
            }
            catch (err) {
                logger_config_1.default.error(`${this.req.ip} ${err.stack}`);
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
     * This API terminates the lease agreement.
     */
    terminateLease(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { agreementId, status } = request;
                const exists = yield agreement_model_1.default.findOne({ _id: agreementId });
                if (!exists) {
                    throw new Error("Agreement does not exist");
                }
                const saveResponse = yield (0, db_helpers_1.upsert)(agreement_model_1.default, { status: status }, exists._id);
                const user = yield (0, db_helpers_1.findOne)(client_model_1.default, { _id: this.userId });
                const data2 = yield (0, db_helpers_1.findOne)(admin_model_1.default, {});
                const transactionResponse = yield (0, db_helpers_1.upsert)(redTokenTransaction_model_1.default, {
                    senderId: this.userId,
                    accountType: user.accountType,
                    receiverId: data2._id,
                    propertyId: saveResponse.propertyId,
                    agreementId: agreementId,
                    totalRedToken: '0',
                    status: status,
                });
                return {
                    data: { transactionResponse },
                    error: '',
                    message: 'Lease Agreement Terminated Successfully',
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
    updateAllUsernamesToUppercase() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Retrieve all clients as an array
                const clientsResponse = yield (0, db_helpers_1.getAlls)(client_model_1.default, {});
                const clients = clientsResponse.items;
                if (Array.isArray(clients)) {
                    for (const client of clients) {
                        if (client.userName) {
                            const uppercaseUserName = client.userName.toUpperCase();
                            const response = yield (0, db_helpers_1.upsert)(client_model_1.default, { userName: uppercaseUserName }, client._id);
                        }
                    }
                    return {
                        data: express_1.response,
                        error: '',
                        message: 'All usernames updated to uppercase successfully',
                        status: 200
                    };
                }
                else {
                    return {
                        data: null,
                        error: 'No clients found',
                        message: '',
                        status: 404
                    };
                }
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
  *solos reward send to user in the app
  */
    sendSolosRewardByUser(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userName, solosReward, accountType } = request;
                const senderData = yield (0, db_helpers_1.getById)(client_model_1.default, this.userId);
                if (userName === senderData.userName || userName === senderData.businessUserName) {
                    throw new Error("You can't send solos reward to yourself");
                }
                const clientField = accountType === 'Primary' ? 'solosReward' : 'businessSolosReward';
                const userSolosReward = parseFloat(senderData[clientField]);
                const requestSolosRewardValue = parseFloat(solosReward);
                if (isNaN(userSolosReward) || isNaN(requestSolosRewardValue)) {
                    throw new Error('Invalid solos reward value');
                }
                if (userSolosReward < requestSolosRewardValue) {
                    throw new Error("User doesn't have enough solos reward");
                }
                const receiverData = yield client_model_1.default.findOne({
                    $or: [{ userName: userName }, { businessUserName: userName }]
                });
                if (!receiverData) {
                    throw new Error('Receiver user doesn\'t exist!');
                }
                const receiverField = (receiverData.userName === userName) ? 'solosReward' : 'businessSolosReward';
                const senderUpdatedSolosReward = userSolosReward - requestSolosRewardValue;
                const receiverUpdatedSolosReward = parseFloat(receiverData[receiverField]) + requestSolosRewardValue;
                const saveResponse1 = yield (0, db_helpers_1.upsert)(client_model_1.default, { [clientField]: senderUpdatedSolosReward }, this.userId);
                const saveResponse2 = yield (0, db_helpers_1.upsert)(client_model_1.default, { [receiverField]: receiverUpdatedSolosReward }, receiverData._id);
                // Save transaction details
                const sender = yield (0, db_helpers_1.findOne)(client_model_1.default, { _id: this.userId });
                const transactionResponse = yield (0, db_helpers_1.upsert)(redTokenTransaction_model_1.default, {
                    senderId: this.userId,
                    receiverId: receiverData._id,
                    senderUsername: sender.userName,
                    receiverUsername: userName,
                    solosReward: solosReward,
                    transactionType: 'Solos Reward',
                    token: 'SOLOS',
                    status: "APPROVED",
                });
                return {
                    data: { transactionResponse },
                    error: '',
                    message: 'Solos Reward sent successfully',
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
    /**
* Get Solos Reward Transactions
*/
    getSolosRewardTransaction(pageNumber, pageSize) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const query = {
                    $or: [
                        { senderId: this.userId },
                        { receiverId: this.userId }
                    ],
                    transactionType: 'Solos Reward'
                };
                const sendData = yield (0, db_helpers_1.getAll)(redTokenTransaction_model_1.default, query, +pageNumber, +pageSize);
                const items = sendData.items.map(item => {
                    if (item.transactionType2 !== "null") {
                        const transactionType2 = item.receiverId.toString() === this.userId.toString() ? 'Receive Solos' : 'Send Solos';
                        return Object.assign(Object.assign({}, item), { transactionType2 });
                    }
                    return Object.assign({}, item);
                });
                return {
                    data: { items, pageNumber: sendData.pageNumber, pageSize: sendData.pageSize, totalItems: sendData.totalItems },
                    error: '',
                    message: 'All Solos Reward Transaction Data Successfully',
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
* Get User Nft Data
*/
    getNftDetailsOfUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const query = {
                    userId: mongoose_1.default.Types.ObjectId(this.userId),
                    status: { $in: ['APPROVED', 'DECLINED'] }
                };
                const data = yield (0, db_helpers_1.getAll)(nftDetail_model_1.default, query);
                return {
                    data: data || {},
                    error: '',
                    message: 'User NFT Data fetched Successfully',
                    status: 200
                };
            }
            catch (err) {
                logger_config_1.default.error(`${this.req.ip} ${err.stack}`);
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
    * Get User Fred Nft Data
    */
    getFredNftDetailsOfUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let query = { userId: mongoose_1.default.Types.ObjectId(this.userId) };
                const data = yield (0, db_helpers_1.getAll)(fredNft_model_1.default, query);
                return {
                    data: data || {},
                    error: '',
                    message: 'User NFT Data fetched Successfully',
                    status: 200
                };
            }
            catch (err) {
                logger_config_1.default.error(`${this.req.ip} ${err.stack}`);
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
     * Update status of user possesion property
     */
    sellInMarketplace(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { agreementId } = request;
                const transferProperty = yield (0, db_helpers_1.upsert)(agreement_model_1.default, { status: 'DECLINED' }, agreementId);
                return {
                    data: transferProperty,
                    error: '',
                    message: 'Property transfer to marketplace',
                    status: 200
                };
            }
            catch (err) {
                return {
                    data: null,
                    error: err.message ? err.message : err,
                    message: 'Error',
                    status: 400
                };
            }
        });
    }
    /**
    * Get User For sell in marketplace
    */
    sellPropertyFromUsers(pageNumber, pageSize) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const totalCount = yield agreement_model_1.default.countDocuments({});
                const data = yield agreement_model_1.default.aggregate([
                    {
                        $match: {
                            status: 'DECLINED'
                        }
                    },
                    {
                        $lookup: {
                            from: "propertydetails",
                            localField: "propertyId",
                            foreignField: "_id",
                            as: "propertyDetails"
                        }
                    },
                    {
                        $unwind: "$propertyDetails"
                    },
                    {
                        $skip: Number(pageNumber - 1) * Number(pageSize)
                    },
                    {
                        $limit: Number(pageSize)
                    },
                    {
                        $project: {
                            _id: 0,
                            propertyId: 1,
                            userId: 1,
                            leaseRequestId: 1,
                            propertyName: 1,
                            propertyType: 1,
                            streetAddress: 1,
                            city: 1,
                            state: 1,
                            country: 1,
                            apn: 1,
                            typeOfPropertyOwnership: 1,
                            tract: 1,
                            landValue: 1,
                            improvements: 1,
                            totalValue: 1,
                            monthlyLeaseFee: 1,
                            leaseTerm: 1,
                            leaseStartDate: 1,
                            leaseExpirationDate: 1,
                            unit: 1,
                            legalAttachments: 1,
                            displayAttachments: 1,
                            floorPlans: 1,
                            status: 1,
                            propertyDetails: "$propertyDetails",
                        }
                    }
                ]);
                return {
                    data: { data, totalCount },
                    error: '',
                    message: 'MarketPlace Data Listed Successfully',
                    status: 200
                };
            }
            catch (error) {
                return {
                    data: null,
                    error: 'Error occurred',
                    message: 'Failed to Search',
                    status: 404
                };
            }
        });
    }
    /**
        * Update status of user Nft
        */
    sellNftInMarketplace(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { nftId, price, type } = request;
                if (type === "nft") {
                    const transferNft = yield (0, db_helpers_1.upsert)(nftDetail_model_1.default, { status: 'DECLINED', price }, nftId);
                    return {
                        data: transferNft,
                        error: '',
                        message: 'Nft transfer to marketplace',
                        status: 200
                    };
                }
                else {
                    const transferfred = yield (0, db_helpers_1.upsert)(fredNft_model_1.default, { status: 'DECLINED', amount: price }, nftId);
                    return {
                        data: transferfred,
                        error: '',
                        message: 'Nft transfer to marketplace',
                        status: 200
                    };
                }
            }
            catch (err) {
                return {
                    data: null,
                    error: err.message ? err.message : err,
                    message: 'Error',
                    status: 400
                };
            }
        });
    }
    /**
        * Get Nft Signer Address
        */
    getNftSignerAddress(contractAddress, tokenId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield (0, db_helpers_1.findOne)(nftDetail_model_1.default, { contractAddress, tokenId });
                return {
                    data: data.signerAddress,
                    error: "",
                    message: "Signer address Fetch Successfully",
                    status: 200,
                };
            }
            catch (err) {
                logger_config_1.default.error(`${this.req.ip} ${err.stack}`);
                return {
                    data: null,
                    error: err.message ? err.message : err,
                    message: "",
                    status: 400,
                };
            }
        });
    }
    getNftDetailSellInMarketplace(pageNumber, pageSize, filter, sort) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let query = { status: 'DECLINED' };
                // Add filter based on name
                if (filter) {
                    query.$or = [
                        { name: { $regex: filter, $options: 'i' } }
                    ];
                }
                // Your existing logic for fetching data
                const data = yield (0, db_helpers_1.getAll)(nftDetail_model_1.default, query, +pageNumber, +pageSize);
                if (sort === '0' || sort === '1') {
                    const sortOrder = sort === '0' ? 1 : -1;
                    if (data.sort) {
                        data.sort = sortOrder * data.sort;
                    }
                }
                return {
                    data: data,
                    error: "",
                    message: "NFT data of marketpalce fetched Successfully",
                    status: 200,
                };
            }
            catch (err) {
                logger_config_1.default.error(`${this.req.ip} ${err.stack}`);
                return {
                    data: null,
                    error: err.message ? err.message : err,
                    message: "",
                    status: 400,
                };
            }
        });
    }
    /**
* Get  fredNft Data which sell in marketplace in user
*/
    getFredNftDetailSellInMarketplace(pageNumber, pageSize, filter) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let query = { status: 'DECLINED', };
                if (filter) {
                    query.$or = [
                        { fred_name: { $regex: filter, $options: 'i' } }
                    ];
                }
                const data = yield (0, db_helpers_1.getAll)(fredNft_model_1.default, query, +pageNumber, +pageSize);
                return {
                    data: data,
                    error: '',
                    message: 'FredNFT data of marketpalce fetched Successfully',
                    status: 200
                };
            }
            catch (err) {
                logger_config_1.default.error(`${this.req.ip} ${err.stack}`);
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
   * Send OTP api for Verification
   */
    sendOtp() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Check if the user exists using the lowercase email
                const exists = yield (0, db_helpers_1.findOne)(client_model_1.default, { _id: this.userId });
                const otp = (0, utils_1.generateRandomOtp)();
                const existOtp = yield (0, db_helpers_1.findOne)(otp_model_1.default, { email: exists.email });
                if (existOtp) {
                    yield (0, db_helpers_1.upsert)(otp_model_1.default, { otp, email: exists.email }, existOtp._id);
                }
                else {
                    yield (0, db_helpers_1.upsert)(otp_model_1.default, { otp, email: exists.email });
                }
                // Send a mail with otp 
                const html = yield (0, utils_1.readHTMLFile)(path_1.default.join(__dirname, '../', '../', 'src', 'template', 'otp_email.html'));
                const template = handlebars_1.default.compile(html);
                const [otp1, otp2, otp3, otp4] = otp.split('');
                const tempData = template({ otp1, otp2, otp3, otp4, email: exists.email, firstName: exists.name });
                yield (0, nodemailer_1.sendEmail)(process.env.EMAIL_NOTIFICATION_ADDRESS, 'OTP for Reset Password', exists.email, tempData);
                return {
                    data: {},
                    error: '',
                    message: 'OTP successfully sent to ' + exists.email,
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
};
__decorate([
    (0, tsoa_1.Post)("/register"),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "register", null);
__decorate([
    (0, tsoa_1.Post)("/verifyotp"),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "verifyotp", null);
__decorate([
    (0, tsoa_1.Security)("Bearer"),
    (0, tsoa_1.Post)("/verifyKyc"),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "verifyKyc", null);
__decorate([
    (0, tsoa_1.Post)("/login"),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "login", null);
__decorate([
    (0, tsoa_1.Post)("/forgotPassword"),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "forgotPassword", null);
__decorate([
    (0, tsoa_1.Put)("/verifyOtp"),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "verifyOtp", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Post)("/resetPassword"),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "resetPassword", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Get)("/me"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "me", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Put)('/updateProfile'),
    __param(0, (0, tsoa_1.FormField)()),
    __param(1, (0, tsoa_1.FormField)()),
    __param(2, (0, tsoa_1.FormField)()),
    __param(3, (0, tsoa_1.FormField)()),
    __param(4, (0, tsoa_1.FormField)()),
    __param(5, (0, tsoa_1.UploadedFile)('profileImage')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "updateProfile", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Post)("/leaseRequest"),
    __param(0, (0, tsoa_1.FormField)()),
    __param(1, (0, tsoa_1.FormField)()),
    __param(2, (0, tsoa_1.FormField)()),
    __param(3, (0, tsoa_1.FormField)()),
    __param(4, (0, tsoa_1.FormField)()),
    __param(5, (0, tsoa_1.FormField)()),
    __param(6, (0, tsoa_1.FormField)()),
    __param(7, (0, tsoa_1.UploadedFile)('propertyDocument')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "leaseRequest", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Get)("/leasePropertyRequestData"),
    __param(0, (0, tsoa_1.Query)('pageNumber')),
    __param(1, (0, tsoa_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "leasePropertyRequestData", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Get)("/getAgreementData"),
    __param(0, (0, tsoa_1.Query)('pageNumber')),
    __param(1, (0, tsoa_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "getAgreementData", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Get)("/buyRedToken"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "buyRedToken", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Get)("/getBooqConversionRate"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "getBooqConversionRate", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Post)("/requestRedToken"),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "requestRedToken", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Get)("/redTokenTransactionsDetails"),
    __param(0, (0, tsoa_1.Query)('pageNumber')),
    __param(1, (0, tsoa_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "redTokenTransactionsDetails", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Get)("/usdcTransactionsDetails"),
    __param(0, (0, tsoa_1.Query)('pageNumber')),
    __param(1, (0, tsoa_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "usdcTransactionsDetails", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Post)("/sellRed"),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "sellRed", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Get)("/walletData"),
    __param(0, (0, tsoa_1.Query)('accountType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "walletData", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Get)("/getBookingAmount"),
    __param(0, (0, tsoa_1.Query)('totalPropertyValue')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "getBookingAmount", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Get)("/switchAccount"),
    __param(0, (0, tsoa_1.Query)('accountType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "switchAccount", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Get)("/possesionListing"),
    __param(0, (0, tsoa_1.Query)('pageNumber')),
    __param(1, (0, tsoa_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "possesionListing", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Get)("/possesionPropertyYouWant"),
    __param(0, (0, tsoa_1.Query)('propertyId')),
    __param(1, (0, tsoa_1.Query)('pageNumber')),
    __param(2, (0, tsoa_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "possesionPropertyYouWant", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Get)("/leasePropertyYouWant"),
    __param(0, (0, tsoa_1.Query)('propertyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "leasePropertyYouWant", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Post)("/addAccount"),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "addAccount", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Post)('/postContacts'),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "postContacts", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Put)("/SearchUser"),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "SearchUser", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Post)("/sendRedToken"),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "sendRedToken", null);
__decorate([
    (0, tsoa_1.Security)("Bearer"),
    (0, tsoa_1.Get)("/logout"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "logout", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Post)('/sendMpinOtp'),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "sendMpinOtp", null);
__decorate([
    (0, tsoa_1.Security)("Bearer"),
    (0, tsoa_1.Post)("/registrationToken"),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "registrationTokens", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Post)('/createMpin'),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "createMpin", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Post)('/enableDisableSecurity'),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "enableDisableSecurity", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Post)('/verifyPassword'),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "verifyPassword", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Post)('/verifyMpin'),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "verifyMpin", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Put)('/updateWalletAddress'),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "updateWalletAddress", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Get)('/getWalletAddress'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "getWalletAddress", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Get)("/getNftDataByUser"),
    __param(0, (0, tsoa_1.Query)('pageNumber')),
    __param(1, (0, tsoa_1.Query)('pageSize')),
    __param(2, (0, tsoa_1.Query)('filter')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String]),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "getNftDataByUser", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Put)('/terminateLease'),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "terminateLease", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Put)("/updateAllUsernamesToUppercase"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "updateAllUsernamesToUppercase", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Post)("/sendSolosRewardByUser"),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "sendSolosRewardByUser", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Get)("/getSolosRewardTransaction"),
    __param(0, (0, tsoa_1.Query)('pageNumber')),
    __param(1, (0, tsoa_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "getSolosRewardTransaction", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Get)("/getNftDetailsOfUsers"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "getNftDetailsOfUsers", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Get)("/getFredNftDetailsOfUsers"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "getFredNftDetailsOfUsers", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Put)("/sellInMarketplace"),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "sellInMarketplace", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Get)("/sellPropertyFromUsers"),
    __param(0, (0, tsoa_1.Query)('pageNumber')),
    __param(1, (0, tsoa_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "sellPropertyFromUsers", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Put)("/sellNftInMarketplace"),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "sellNftInMarketplace", null);
__decorate([
    (0, tsoa_1.Security)("Bearer"),
    (0, tsoa_1.Get)("/getNftSignerAddress"),
    __param(0, (0, tsoa_1.Query)("contractAddress")),
    __param(1, (0, tsoa_1.Query)("tokenId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "getNftSignerAddress", null);
__decorate([
    (0, tsoa_1.Security)("Bearer"),
    (0, tsoa_1.Get)("/getNftDetailSellInMarketplace"),
    __param(0, (0, tsoa_1.Query)("pageNumber")),
    __param(1, (0, tsoa_1.Query)("pageSize")),
    __param(2, (0, tsoa_1.Query)("filter")),
    __param(3, (0, tsoa_1.Query)("sort")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String]),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "getNftDetailSellInMarketplace", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Get)("/getFredNftDetailSellInMarketplace"),
    __param(0, (0, tsoa_1.Query)('pageNumber')),
    __param(1, (0, tsoa_1.Query)('pageSize')),
    __param(2, (0, tsoa_1.Query)('filter')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String]),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "getFredNftDetailSellInMarketplace", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Get)("/sendOtp"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "sendOtp", null);
ClientController = __decorate([
    (0, tsoa_1.Tags)('Client'),
    (0, tsoa_1.Route)('api/client'),
    __metadata("design:paramtypes", [Object, Object])
], ClientController);
exports.default = ClientController;

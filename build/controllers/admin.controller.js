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
const common_util_1 = require("../utils/common.util");
const admin_validator_1 = require("../validations/admin.validator");
const admin_model_1 = __importDefault(require("../models/admin.model"));
const user_validator_1 = require("../validations/user.validator");
const logger_config_1 = __importDefault(require("../configs/logger.config"));
const nodemailer_1 = require("../configs/nodemailer");
const utils_1 = require("../services/utils");
const path_1 = __importDefault(require("path"));
const handlebars_1 = __importDefault(require("handlebars"));
const propertyDetailsModel_1 = __importDefault(require("../models/propertyDetailsModel"));
const notifications_model_1 = require("../models/notifications.model");
const leasePropertyDetail_Model_1 = __importDefault(require("../models/leasePropertyDetail.Model"));
const redTokenTransaction_model_1 = __importDefault(require("../models/redTokenTransaction.model"));
const client_model_1 = __importDefault(require("../models/client.model"));
const token_model_1 = __importDefault(require("../models/token.model"));
const aminities_model_1 = __importDefault(require("../models/aminities.model"));
const agreement_model_1 = __importDefault(require("../models/agreement.model"));
const notification_config_1 = require("../configs/notification.config");
const nftDetail_model_1 = __importDefault(require("../models/nftDetail.model"));
const nftcategories_model_1 = __importDefault(require("../models/nftcategories.model"));
const sfredcatefories_model_1 = __importDefault(require("../models/sfredcatefories.model"));
const fred_model_1 = __importDefault(require("../models/fred.model"));
const mongoose_1 = __importDefault(require("mongoose"));
const aws_s3_utils_1 = __importDefault(require("../utils/aws.s3.utils"));
const fredNft_model_1 = __importDefault(require("../models/fredNft.model"));
let AdminController = class AdminController extends tsoa_1.Controller {
    constructor(req, res) {
        super();
        this.req = req;
        this.res = res;
        this.userId = req.body.user ? req.body.user.id : '';
    }
    /**
     * Get user login
     */
    login(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, password } = request;
                const validatedUser = (0, admin_validator_1.validateAdmin)({ email, password });
                if (validatedUser.error) {
                    throw new Error(validatedUser.error.message);
                }
                const exists = yield (0, db_helpers_1.findOne)(admin_model_1.default, { email });
                if (!exists) {
                    throw new Error('Admin doesn\'t exists!');
                }
                // check if blocked
                if (exists.isBlocked) {
                    throw new Error('Admin is not approved yet!');
                }
                const isValid = yield (0, common_util_1.verifyHash)(password, exists.password);
                if (!isValid) {
                    throw new Error('Password seems to be incorrect');
                }
                const token = yield (0, common_util_1.signToken)(exists._id, { access: 'admin' });
                delete exists.password;
                return {
                    data: Object.assign(Object.assign({}, exists), { token }),
                    error: '',
                    message: 'Login Success',
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
                const { email, url } = request;
                const validatedForgotPassword = (0, user_validator_1.validateForgotPassword)({ email });
                if (validatedForgotPassword.error) {
                    throw new Error(validatedForgotPassword.error.message);
                }
                // check if user exists
                const exists = yield (0, db_helpers_1.findOne)(admin_model_1.default, { email });
                if (!exists) {
                    throw new Error('Invalid User');
                }
                const token = yield (0, common_util_1.signToken)(exists._id, { access: 'admin', purpose: 'reset' }, '1h');
                //send a mail with otp 
                const html = yield (0, utils_1.readHTMLFile)(path_1.default.join(__dirname, '../', '../', 'src', 'template', 'reset-password.html'));
                const template = handlebars_1.default.compile(html);
                yield (0, nodemailer_1.sendEmail)(process.env.EMAIL_NOTIFICATION_ADDRESS, 'Reset Your Password', email, template({ link: `${url}/reset-password?resetId=${token}` }));
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
    * Forgot password api endpoint
    */
    resetPassword(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { password } = request;
                const validatedResetPassword = (0, admin_validator_1.validateChangePassword)({ password });
                if (validatedResetPassword.error) {
                    throw new Error(validatedResetPassword.error.message);
                }
                const hashed = yield (0, common_util_1.genHash)(password);
                const updated = yield (0, db_helpers_1.upsert)(admin_model_1.default, { password: hashed }, this.userId);
                //token invalidated
                let authHeader = this.req.headers.authorization;
                yield (0, db_helpers_1.upsert)(token_model_1.default, { token: authHeader });
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
     * Create Aminities
     */
    createAminities(iconName, iconImage) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let fileImage;
                if (iconImage) {
                    fileImage = yield (0, aws_s3_utils_1.default)(iconImage === null || iconImage === void 0 ? void 0 : iconImage.originalname, iconImage === null || iconImage === void 0 ? void 0 : iconImage.buffer, (iconImage === null || iconImage === void 0 ? void 0 : iconImage.mimetype.includes('image/png')) ? "image/png" : "image/jpeg");
                }
                let response = yield (0, db_helpers_1.upsert)(aminities_model_1.default, {
                    iconName: iconName,
                    iconImage: fileImage
                });
                return {
                    data: { response },
                    error: '',
                    message: 'Aminity Created',
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
     * Delete aminities detail API
     */
    deleteAminitiesDetail(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Find the property detail by ID and remove it
                const response = yield (0, db_helpers_1.deleteById)(aminities_model_1.default, id);
                if (!response) {
                    return {
                        data: null,
                        error: 'Aminities detail not found',
                        message: 'Aminities detail not found',
                        status: 404,
                    };
                }
                return {
                    data: null,
                    error: '',
                    message: 'Aminitie details deleted successfully',
                    status: 200,
                };
            }
            catch (err) {
                logger_config_1.default.error(`${this.req.ip} ${err.message}`);
                return {
                    data: null,
                    error: err.message ? err.message : err,
                    message: 'Error deleting Aminitie details',
                    status: 400,
                };
            }
        });
    }
    /**
   * Get Aminities
   */
    GetAminities(pageNumber, pageSize, filter) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let payload = {};
                if (filter) {
                    payload = {
                        $or: [
                            {
                                iconName: {
                                    $regex: filter,
                                    $options: 'i'
                                }
                            }
                        ]
                    };
                }
                const data = yield (0, db_helpers_1.getAll)(aminities_model_1.default, payload, +pageNumber, +pageSize);
                return {
                    data: data || {},
                    error: '',
                    message: 'Aminity Fetched Succesfully',
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
* create property
*/
    createProperty(propertyId, propertyName, location, description, area, propertyType, interestPerAnnum, price, dueDate, MonthlyFees, aminities, imageFile, propertyDocumentFile) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let aminity = [];
                if (aminities && typeof aminities === 'string') {
                    aminity = JSON.parse(aminities);
                }
                const validatedProperty = (0, admin_validator_1.validatePropertyDetails)({
                    propertyName,
                    location,
                    description,
                    area,
                    propertyType,
                    interestPerAnnum,
                    price,
                    dueDate,
                    MonthlyFees,
                    aminities: aminity,
                    imageURL: imageFile === null || imageFile === void 0 ? void 0 : imageFile.filename,
                    propertyDocument: propertyDocumentFile === null || propertyDocumentFile === void 0 ? void 0 : propertyDocumentFile.filename
                });
                if (validatedProperty.error) {
                    throw new Error(validatedProperty.error.message);
                }
                const adminData = yield (0, db_helpers_1.findOne)(admin_model_1.default, { _id: this.userId });
                const conversionrate = adminData.conversionRate;
                const redToken = price !== undefined ? price * conversionrate : 0;
                const payload = {
                    propertyName: propertyName !== null && propertyName !== void 0 ? propertyName : "",
                    location: location !== null && location !== void 0 ? location : "",
                    description: description !== null && description !== void 0 ? description : "",
                    propertyDetails: {
                        area: area !== null && area !== void 0 ? area : 0,
                        propertyType: propertyType !== null && propertyType !== void 0 ? propertyType : "",
                        interestPerAnnum: interestPerAnnum !== null && interestPerAnnum !== void 0 ? interestPerAnnum : 0,
                        price: price !== null && price !== void 0 ? price : 0,
                        dueDate: dueDate !== null && dueDate !== void 0 ? dueDate : "",
                        MonthlyFees: MonthlyFees !== null && MonthlyFees !== void 0 ? MonthlyFees : 0,
                    },
                    aminities: aminity !== null && aminity !== void 0 ? aminity : "",
                };
                const fileImage = imageFile
                    ? yield (0, aws_s3_utils_1.default)(imageFile.originalname, imageFile.buffer, imageFile.mimetype.includes('image/png') ? "image/png" : "image/jpeg")
                    : undefined;
                const documentFile = propertyDocumentFile
                    ? yield (0, aws_s3_utils_1.default)(propertyDocumentFile.originalname, propertyDocumentFile.buffer, propertyDocumentFile.mimetype.includes('application/pdf') ? "application/pdf" : "application/pdf")
                    : undefined;
                if (fileImage) {
                    payload.imageURL = fileImage;
                }
                if (documentFile) {
                    payload.propertyDocument = documentFile;
                }
                const saveResponse = propertyId
                    ? yield (0, db_helpers_1.upsert)(propertyDetailsModel_1.default, payload, propertyId)
                    : yield (0, db_helpers_1.upsert)(propertyDetailsModel_1.default, payload);
                const response = yield (0, db_helpers_1.findOne)(admin_model_1.default, { _id: this.userId });
                const currentRedTokens = +response.totalRedToken;
                const totalRedTokens = redToken + currentRedTokens;
                yield (0, db_helpers_1.upsert)(admin_model_1.default, { totalRedToken: totalRedTokens }, this.userId);
                const notifictions = yield (0, db_helpers_1.upsert)(notifications_model_1.notificationsModels, {
                    notifications: "Property created....",
                    view: true,
                    type: "admin",
                    propertyCreateId: saveResponse._id,
                    message: "Property created..."
                });
                if (!saveResponse || !notifictions) {
                    throw new Error("Error");
                }
                return {
                    data: Object.assign(Object.assign({}, saveResponse.toObject()), notifictions.toObject()),
                    error: "",
                    message: "Property created successfully",
                    status: 200
                };
            }
            catch (err) {
                logger_config_1.default.error(`${this.req.ip} ${err.message}`);
                return {
                    data: null,
                    error: err.message || err,
                    message: "",
                    status: 400
                };
            }
        });
    }
    /**
   * create Agreement
   */
    createAgreement(propertyId, userId, leaseRequestId, propertyName, propertyType, streetAddress, city, state, country, apn, typeOfPropertyOwnership, tract, landValue, improvements, totalValue, monthlyLeaseFee, leaseTerm, leaseStartDate, leaseExpirationDate, unit, trustDeed, appraisalReports, titlePolicy, anyEncumbrances, pictures, videos, images_3d, floorPlans) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validatedProperty = (0, admin_validator_1.validateAgreementDetails)({
                    propertyId,
                    userId,
                    leaseRequestId,
                    propertyName,
                    propertyType,
                    streetAddress,
                    city,
                    state,
                    country,
                    apn,
                    typeOfPropertyOwnership,
                    tract,
                    landValue,
                    improvements,
                    totalValue,
                    monthlyLeaseFee,
                    leaseTerm,
                    leaseStartDate,
                    leaseExpirationDate,
                    unit,
                });
                if (validatedProperty.error) {
                    throw new Error(validatedProperty.error.message);
                }
                const trustDeedDocs = trustDeed
                    ? yield (0, aws_s3_utils_1.default)(trustDeed.originalname, trustDeed.buffer, trustDeed.mimetype.includes('application/pdf') ? "application/pdf" : "application/pdf")
                    : undefined;
                const appraisalDocs = appraisalReports
                    ? yield (0, aws_s3_utils_1.default)(appraisalReports.originalname, appraisalReports.buffer, appraisalReports.mimetype.includes('application/pdf') ? "application/pdf" : "application/pdf")
                    : undefined;
                const titlePolicyDocs = titlePolicy
                    ? yield (0, aws_s3_utils_1.default)(titlePolicy.originalname, titlePolicy.buffer, titlePolicy.mimetype.includes('application/pdf') ? "application/pdf" : "application/pdf")
                    : undefined;
                const anyEncumbrancesDocs = anyEncumbrances
                    ? yield (0, aws_s3_utils_1.default)(anyEncumbrances.originalname, anyEncumbrances.buffer, anyEncumbrances.mimetype.includes('application/pdf') ? "application/pdf" : "application/pdf")
                    : undefined;
                const pictureUrls = pictures
                    ? yield Promise.all(pictures.map((file) => __awaiter(this, void 0, void 0, function* () {
                        const filename = file.originalname;
                        const buffer = file.buffer;
                        const mimeType = file.mimetype;
                        return yield (0, aws_s3_utils_1.default)(filename, buffer, mimeType.includes('image/png') ? 'image/png' : 'image/jpeg');
                    })))
                    : [];
                const videoUrls = videos
                    ? yield Promise.all(videos.map((file) => __awaiter(this, void 0, void 0, function* () {
                        const filename = file.originalname;
                        const buffer = file.buffer;
                        const mimeType = file.mimetype;
                        return yield (0, aws_s3_utils_1.default)(filename, buffer, mimeType.includes('video/mp4') ? 'video/mp4' : 'video/mp4');
                    })))
                    : [];
                const images3dUrls = images_3d
                    ? yield Promise.all(images_3d.map((file) => __awaiter(this, void 0, void 0, function* () {
                        const filename = file.originalname;
                        const buffer = file.buffer;
                        const mimeType = file.mimetype;
                        return yield (0, aws_s3_utils_1.default)(filename, buffer, mimeType.includes('image/png') ? 'image/png' : 'image/jpeg');
                    })))
                    : [];
                const floorPlanUrls = floorPlans
                    ? yield Promise.all(floorPlans.map((file) => __awaiter(this, void 0, void 0, function* () {
                        const filename = file.originalname;
                        const buffer = file.buffer;
                        const mimeType = file.mimetype;
                        return yield (0, aws_s3_utils_1.default)(filename, buffer, mimeType.includes('image/png') ? 'image/png' : 'image/jpeg');
                    })))
                    : [];
                let saveResponse = yield (0, db_helpers_1.upsert)(agreement_model_1.default, {
                    propertyId,
                    userId,
                    leaseRequestId,
                    propertyName,
                    propertyType,
                    streetAddress,
                    city,
                    state,
                    country,
                    apn,
                    typeOfPropertyOwnership,
                    tract,
                    landValue,
                    improvements,
                    totalValue,
                    monthlyLeaseFee,
                    leaseTerm,
                    leaseStartDate,
                    leaseExpirationDate,
                    unit,
                    legalAttachments: {
                        trustDeed: trustDeedDocs,
                        appraisalReports: appraisalDocs,
                        titlePolicy: titlePolicyDocs,
                        anyEncumbrances: anyEncumbrancesDocs
                    },
                    displayAttachments: {
                        pictures: pictureUrls,
                        videos: videoUrls,
                        images_3d: images3dUrls
                    },
                    floorPlans: floorPlanUrls
                });
                //send notification
                yield (0, notification_config_1.sendNotificationToUser)(userId, propertyId, "Property Registered", "Hello your property is registered");
                return {
                    data: Object.assign({}, saveResponse.toObject()),
                    error: '',
                    message: 'property created successfully ',
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
    * Get Lease Property Data
    */
    getLeasePropertyData(pageNumber, pageSize, filter) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                //   check for a valid id
                let payload = {};
                if (filter) {
                    payload = {
                        $or: [
                            {
                                propertyName: {
                                    $regex: filter,
                                    $options: 'i'
                                }
                            }
                        ]
                    };
                }
                const getLeasePropertyData = yield (0, db_helpers_1.getAll)(leasePropertyDetail_Model_1.default, payload, +pageNumber, +pageSize);
                return {
                    data: getLeasePropertyData,
                    error: '',
                    message: 'Property Lease Request info fetched Successfully',
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
*Get All Property Details
*/
    allProperties(pageNumber, pageSize, filter) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let payload = {};
                if (filter) {
                    payload = {
                        $or: [
                            { propertyName: { $regex: filter, $options: 'i' } },
                        ]
                    };
                }
                const data = yield (0, db_helpers_1.getAll)(propertyDetailsModel_1.default, payload, +pageNumber, +pageSize);
                return {
                    data: data || {},
                    error: '',
                    message: 'All Property Details fetched Successfully',
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
 * Get users with optional search functionality
 */
    getAllUsers(pageNumber, pageSize, filter) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const fieldsToExclude = ['password', 'mpin'];
                let payload = {};
                if (filter) {
                    payload = {
                        $or: [
                            { username: { $regex: filter, $options: 'i' } },
                            { email: { $regex: filter, $options: 'i' } },
                            { name: { $regex: filter, $options: 'i' } }
                        ]
                    };
                }
                const getAllUsersData = yield (0, db_helpers_1.getAll)(client_model_1.default, payload, +pageNumber, +pageSize, fieldsToExclude);
                return {
                    data: getAllUsersData || {},
                    error: '',
                    message: 'All users info fetched Successfully',
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
    * Update status of lease request
    */
    updateLeasePropertyStatus(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id, status } = request;
                // Check for a valid id
                // Update the status of leasePropertyModel with the newStatus
                const updatedLeaseProperty = yield (0, db_helpers_1.upsert)(leasePropertyDetail_Model_1.default, { status }, id);
                return {
                    data: updatedLeaseProperty,
                    error: '',
                    message: 'Lease property status updated successfully',
                    status: 200
                };
            }
            catch (err) {
                return {
                    data: null,
                    error: err.message ? err.message : err,
                    message: 'Error updating lease property status',
                    status: 400
                };
            }
        });
    }
    /**
  * Get red token Data with search filter
  */
    getRedTokenRequestData(pageNumber, pageSize) {
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
                            transactionType: { $ne: 'Sell RED' }
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
                    message: 'Red Token Request info fetched Successfully',
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
  * Update status of Red Token Request
  */
    updateRedTokenRequest(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { status, hashId, accountType } = request;
                // Check for a valid id
                // Update the status of the red token request with the newStatus
                const transaction = yield (0, db_helpers_1.findOne)(redTokenTransaction_model_1.default, { hashId: hashId });
                if (transaction && transaction.status === "PENDING") {
                    const changeStatusRequest = yield (0, db_helpers_1.upsert)(redTokenTransaction_model_1.default, { status }, transaction._id);
                    const clientId = changeStatusRequest.senderId;
                    let response = yield (0, db_helpers_1.findOne)(client_model_1.default, { _id: clientId });
                    const totalRedToken = +changeStatusRequest.totalRedToken;
                    if (accountType === 'Primary') {
                        let currentRedTokens = +response.redToken;
                        let totalRedTokens = +totalRedToken + +currentRedTokens;
                        const addRedToken = yield (0, db_helpers_1.upsert)(client_model_1.default, { redToken: totalRedTokens }, clientId);
                        return {
                            data: { addRedToken, changeStatusRequest },
                            error: '',
                            message: 'Red token added successfully',
                            status: 200
                        };
                    }
                    else {
                        let currentRedTokens = +response.businessRedToken;
                        let totalRedTokens = +totalRedToken + +currentRedTokens;
                        const addRedToken = yield (0, db_helpers_1.upsert)(client_model_1.default, { businessRedToken: totalRedTokens }, clientId);
                        return {
                            data: { addRedToken, changeStatusRequest },
                            error: '',
                            message: 'Red token added successfully',
                            status: 200
                        };
                    }
                }
                else {
                    return {
                        data: { transaction },
                        error: '',
                        message: 'Red token request already approved or declined',
                        status: 200
                    };
                }
            }
            catch (err) {
                return {
                    data: null,
                    error: err.message ? err.message : err,
                    message: 'Error updating Red Tokens',
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
                const exists = yield (0, db_helpers_1.findOne)(admin_model_1.default, { _id });
                if (!exists) {
                    throw new Error("User doesnot exist");
                }
                const { walletAddress } = request;
                let saveResponse = yield (0, db_helpers_1.upsert)(admin_model_1.default, { walletAddress: walletAddress }, _id);
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
   * Get Admin Data
   */
    adminData() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const adminData = yield (0, db_helpers_1.findOne)(admin_model_1.default, {});
                return {
                    data: { adminData },
                    error: '',
                    message: 'Admin Data Fetch Successfully!',
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
    * Add/Update Conversion rate
    */
    updateConversionRate(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const _id = this.userId;
                const exists = yield (0, db_helpers_1.findOne)(admin_model_1.default, { _id });
                if (!exists) {
                    throw new Error("User doesnot exist");
                }
                const { conversionRate } = request;
                const validatedConversionRate = (0, admin_validator_1.validateConversionRate)({ conversionRate });
                if (validatedConversionRate.error) {
                    throw new Error(validatedConversionRate.error.message);
                }
                let saveResponse = yield (0, db_helpers_1.upsert)(admin_model_1.default, { conversionRate: conversionRate }, _id);
                const data = saveResponse.conversionRate;
                return {
                    data: { data },
                    error: '',
                    message: 'Conversion rate Updated Successfully',
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
    * Add/Update Conversion Rate For Loan
    */
    updateConversionRateForLoan(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const _id = this.userId;
                const exists = yield (0, db_helpers_1.findOne)(admin_model_1.default, { _id });
                if (!exists) {
                    throw new Error("Admin doesnot exist");
                }
                const { conversionRateForLoan } = request;
                const validatedConversionRate = (0, admin_validator_1.validateadminConversionRateForLoan)({ conversionRateForLoan });
                if (validatedConversionRate.error) {
                    throw new Error(validatedConversionRate.error.message);
                }
                let saveResponse = yield (0, db_helpers_1.upsert)(admin_model_1.default, { conversionRateForLoan: conversionRateForLoan }, _id);
                const data = saveResponse.conversionRateForLoan;
                return {
                    data: { data },
                    error: '',
                    message: 'Conversion rate Updated Successfully',
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
   * Add/Update Booking Percentage
   */
    updateBookingPercentage(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const _id = this.userId;
                const exists = yield (0, db_helpers_1.findOne)(admin_model_1.default, { _id });
                if (!exists) {
                    throw new Error("User doesnot exist");
                }
                const { bookingPercentage } = request;
                const validatedConversionRate = (0, admin_validator_1.validateBookingPercentage)({ bookingPercentage });
                if (validatedConversionRate.error) {
                    throw new Error(validatedConversionRate.error.message);
                }
                let saveResponse = yield (0, db_helpers_1.upsert)(admin_model_1.default, { bookingPercentage: bookingPercentage }, _id);
                const data = saveResponse.bookingPercentage;
                return {
                    data: { data },
                    error: '',
                    message: 'Booking Percentage Rate Updated Successfully',
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
   * Add/Update Conversion rate
   */
    updateConversionRateForSoloReward(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const _id = this.userId;
                const exists = yield (0, db_helpers_1.findOne)(admin_model_1.default, { _id });
                if (!exists) {
                    throw new Error("User doesnot exist");
                }
                const { conversionRateForSoloReward } = request;
                const validatedConversionRate = (0, admin_validator_1.validateConversionRateForSoloReward)({ conversionRateForSoloReward });
                if (validatedConversionRate.error) {
                    throw new Error(validatedConversionRate.error.message);
                }
                let saveResponse = yield (0, db_helpers_1.upsert)(admin_model_1.default, { conversionRateForSoloReward: conversionRateForSoloReward }, _id);
                const data = saveResponse.conversionRateForSoloReward;
                return {
                    data: { data },
                    error: '',
                    message: 'Conversion rate for solo reward  Updated Successfully',
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
    * Get conversion rate for solo reward
    */
    getConversionRateForSoloReward() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const adminData = yield (0, db_helpers_1.findOne)(admin_model_1.default, {});
                const conversionrate = adminData.conversionRateForSoloReward;
                return {
                    data: { conversionrate },
                    error: '',
                    message: 'Conversion rate for solo reward fetch successfully!',
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
        * Save Nft Details
        */
    addNftData(name, symbol, description, price, categoryId, type, tokenId, contractAddress, Image) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validatedProperty = (0, admin_validator_1.validateNftDetails)({
                    name,
                    symbol,
                    description,
                    price,
                    categoryId,
                    type,
                    contractAddress,
                });
                if (validatedProperty.error) {
                    throw new Error(validatedProperty.error.message);
                }
                let fileImage;
                if (Image) {
                    fileImage = yield (0, aws_s3_utils_1.default)(Image === null || Image === void 0 ? void 0 : Image.originalname, Image === null || Image === void 0 ? void 0 : Image.buffer, (Image === null || Image === void 0 ? void 0 : Image.mimetype.includes('image/png')) ? "image/png" : "image/jpeg");
                }
                let saveResponse = yield (0, db_helpers_1.upsert)(nftDetail_model_1.default, {
                    userId: this.userId,
                    name,
                    symbol,
                    description,
                    price,
                    categoryId,
                    type,
                    publishedBy: 'Solos',
                    tokenId,
                    contractAddress,
                    Image: fileImage
                });
                return {
                    data: { saveResponse },
                    error: '',
                    message: 'NFT Data Saved Successfully',
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
    * Get All NFT Data
    */
    getNftData(pageNumber, pageSize, filter) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const totalCount = yield nftDetail_model_1.default.countDocuments({});
                let payload = {};
                if (filter) {
                    payload = {
                        $or: [
                            { name: { $regex: filter, $options: 'i' } }
                        ]
                    };
                }
                const data = yield nftDetail_model_1.default.aggregate([
                    {
                        $lookup: {
                            from: "nftcategories",
                            localField: "categoryId",
                            foreignField: "_id",
                            as: "nftCategorieDetails"
                        }
                    },
                    {
                        $match: {
                            $or: [
                                { name: { $regex: filter, $options: 'i' } }
                            ]
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
                ]);
                return {
                    data: { data, totalCount },
                    error: '',
                    message: 'All Nft Data fetched Successfully',
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
   * User blocked or unblocked api
   */
    blockUser(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { isBlocked, id } = request;
                // Find the client by ID and update the isBlocked status
                let saveResponse = yield (0, db_helpers_1.upsert)(client_model_1.default, { isBlocked: isBlocked }, id);
                if (!saveResponse) {
                    return {
                        data: null,
                        error: 'Client not found',
                        message: 'Client not found',
                        status: 404,
                    };
                }
                let message = '';
                if (isBlocked) {
                    message = 'User Blocked Successfully';
                }
                else {
                    message = 'User Unblocked Successfully';
                }
                return {
                    data: { saveResponse },
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
                    message: '',
                    status: 400
                };
            }
        });
    }
    /**
     * Delete property detail API
     */
    deletePropertyDetail(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Find the property detail by ID and remove it
                const deletedPropertyDetail = yield (0, db_helpers_1.deleteById)(propertyDetailsModel_1.default, id);
                if (!deletedPropertyDetail) {
                    return {
                        data: null,
                        error: 'Property detail not found',
                        message: 'Property detail not found',
                        status: 404,
                    };
                }
                return {
                    data: null,
                    error: '',
                    message: 'Property detail deleted successfully',
                    status: 200,
                };
            }
            catch (err) {
                logger_config_1.default.error(`${this.req.ip} ${err.message}`);
                return {
                    data: null,
                    error: err.message ? err.message : err,
                    message: 'Error deleting property detail',
                    status: 400,
                };
            }
        });
    }
    /**
  * Create NFT Category API
  */
    createCategory(categoryName, iconImage) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const MAX_FILE_SIZE = 5 * 1024 * 1024;
                if (iconImage.size > MAX_FILE_SIZE) {
                    throw new Error('Uploaded file is too large. Please upload a smaller file.');
                }
                const validatedCategory = (0, admin_validator_1.validateNftCategory)({ categoryName });
                if (validatedCategory.error) {
                    throw new Error(validatedCategory.error.message);
                }
                let fileImage;
                if (iconImage) {
                    fileImage = yield (0, aws_s3_utils_1.default)(iconImage === null || iconImage === void 0 ? void 0 : iconImage.originalname, iconImage === null || iconImage === void 0 ? void 0 : iconImage.buffer, (iconImage === null || iconImage === void 0 ? void 0 : iconImage.mimetype.includes('image/png')) ? "image/png" : "image/jpeg");
                }
                const saveResponse = yield (0, db_helpers_1.upsert)(nftcategories_model_1.default, {
                    categoryName: categoryName,
                    iconImage: fileImage
                });
                return {
                    data: saveResponse,
                    error: '',
                    message: 'NFT Category Created successfully!',
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
    * Delete Category api
    */
    deleteCategory(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield (0, db_helpers_1.findOne)(nftDetail_model_1.default, { categoryId: id });
                if (response.categoryId === id) {
                    throw new Error("This category is already in use you can't delete this category");
                }
                // Find the property detail by ID and remove it
                const deletedCategory = yield (0, db_helpers_1.deleteById)(nftcategories_model_1.default, id);
                if (!deletedCategory) {
                    return {
                        data: null,
                        error: 'Category detail not found',
                        message: 'Category detail not found',
                        status: 404,
                    };
                }
                return {
                    data: null,
                    error: '',
                    message: 'Category deleted successfully',
                    status: 200,
                };
            }
            catch (err) {
                logger_config_1.default.error(`${this.req.ip} ${err.message}`);
                return {
                    data: null,
                    error: err.message ? err.message : err,
                    message: 'Error deleting category details',
                    status: 400,
                };
            }
        });
    }
    /*
    *Get All NFT Category
    */
    getCategory(pageNumber, pageSize, filter) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const totalCount = yield nftcategories_model_1.default.countDocuments({});
                let payload = {};
                if (filter) {
                    payload = {
                        $or: [
                            { categoryName: { $regex: filter, $options: 'i' } }
                        ]
                    };
                }
                const data = yield nftcategories_model_1.default.aggregate([
                    {
                        $lookup: {
                            from: "nftdetails",
                            localField: "_id",
                            foreignField: "categoryId",
                            as: "nftDetails"
                        }
                    },
                    {
                        $match: {
                            $or: [
                                { categoryName: { $regex: filter, $options: 'i' } }
                            ]
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
                            iconImage: 1,
                            categoryName: 1,
                            nftDetailsCount: { $size: "$nftDetails" }
                        }
                    }
                ]);
                return {
                    data: { data, totalCount },
                    error: '',
                    message: 'All Nft Category fetched Successfully',
                    status: 200
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
    saveFred(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { amount, expiryDate, numberOfUsers } = request;
                const validateFred = (0, admin_validator_1.validateFredCategory)({ amount, expiryDate, numberOfUsers });
                if (validateFred.error) {
                    throw new Error(validateFred.error.message);
                }
                const updated = yield (0, db_helpers_1.upsert)(fred_model_1.default, { amount, expiryDate, numberOfUsers });
                return {
                    data: { updated },
                    error: '',
                    message: 'Fred Save Successfully ',
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
      * Send Red Admin to User
      */
    sendRedTokenByAdmin(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userName, redToken } = request;
                const upperCaseUserName = userName.toLocaleUpperCase();
                const _id = this.userId;
                const exists = yield (0, db_helpers_1.findOne)(admin_model_1.default, { _id });
                if (!exists) {
                    throw new Error("User doesnot exist");
                }
                const adminRedToken = parseFloat(exists.totalRedToken);
                const sendRedTokenValue = parseFloat(redToken);
                if (isNaN(adminRedToken) || isNaN(sendRedTokenValue)) {
                    throw new Error('Invalid redToken values');
                }
                if (adminRedToken < sendRedTokenValue) {
                    throw new Error("Admin doesn't have enough tokens");
                }
                const receiverData = yield client_model_1.default.findOne({ userName: upperCaseUserName });
                if (!receiverData) {
                    throw new Error('User doesn\'t exist!');
                }
                //sender
                const updatedRedToken = adminRedToken - sendRedTokenValue;
                let saveResponse = yield (0, db_helpers_1.upsert)(admin_model_1.default, { totalRedToken: updatedRedToken }, this.userId);
                //reciever
                const receiverUpdatedRedToken = +(receiverData.redToken) + +sendRedTokenValue;
                let saveResponse2 = yield (0, db_helpers_1.upsert)(client_model_1.default, { redToken: receiverUpdatedRedToken }, { _id: receiverData._id });
                let tranasctionRepsonse = yield (0, db_helpers_1.upsert)(redTokenTransaction_model_1.default, {
                    senderId: this.userId,
                    receiverId: receiverData._id,
                    totalRedToken: redToken,
                    transactionType: 'Red Token',
                    status: "APPROVED",
                });
                delete tranasctionRepsonse.accountType;
                return {
                    data: { tranasctionRepsonse },
                    error: '',
                    message: 'RedToken sent successfully',
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
          * Send Solos Reward Admin to User
          */
    sendSolosReward(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userName, solosReward } = request;
                const upperCaseUserName = userName.toLocaleUpperCase();
                const _id = this.userId;
                const exists = yield (0, db_helpers_1.findOne)(admin_model_1.default, { _id: mongoose_1.default.Types.ObjectId(this.userId) });
                if (!exists) {
                    throw new Error("User doesnot exist");
                }
                const adminSolosReward = parseFloat(exists.solosReward);
                const sendSolosRewardValue = parseFloat(solosReward);
                if (isNaN(adminSolosReward) || isNaN(sendSolosRewardValue)) {
                    throw new Error('Invalid Solos Reward Value');
                }
                if (adminSolosReward < sendSolosRewardValue) {
                    throw new Error("Admin doesn't have enough solos reward");
                }
                const receiverData = yield client_model_1.default.findOne({ userName: upperCaseUserName });
                if (!receiverData) {
                    throw new Error('User doesn\'t exist!');
                }
                //sender
                const updatedSolosReward = adminSolosReward - sendSolosRewardValue;
                let saveResponse = yield (0, db_helpers_1.upsert)(admin_model_1.default, { solosReward: updatedSolosReward }, this.userId);
                //reciever
                const receiverUpdatedSolosReward = +(receiverData.solosReward) + +sendSolosRewardValue;
                let saveResponse2 = yield (0, db_helpers_1.upsert)(client_model_1.default, { solosReward: receiverUpdatedSolosReward }, { _id: receiverData._id });
                let tranasctionRepsonse = yield (0, db_helpers_1.upsert)(redTokenTransaction_model_1.default, {
                    senderId: this.userId,
                    receiverId: receiverData._id,
                    solosReward: solosReward,
                    transactionType: 'Solos Reward',
                    status: "APPROVED",
                });
                delete tranasctionRepsonse.accountType;
                return {
                    data: { tranasctionRepsonse },
                    error: '',
                    message: 'Solos Reward sent successfully',
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
    * Get All admin redtoken and solos reward transactions
    */
    getRedAndSolosTransaction(pageNumber, pageSize, filter) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const skip = (pageNumber - 1) * pageSize;
                const totalCount = yield redTokenTransaction_model_1.default.countDocuments({});
                let payload = {};
                if (filter) {
                    payload = {
                        $or: [
                            { transactionType: { $regex: filter, $options: 'i' } },
                            { 'clientDetails.userName': { $regex: filter, $options: 'i' } }
                        ]
                    };
                }
                const query = Object.assign({ senderId: mongoose_1.default.Types.ObjectId(this.userId), transactionType: { $in: ['Red Token', 'Solos Reward'] } }, payload);
                const transactionData = yield redTokenTransaction_model_1.default.aggregate([
                    {
                        $match: query,
                    },
                    {
                        $lookup: {
                            from: 'clients',
                            localField: 'receiverId',
                            foreignField: '_id',
                            as: 'clientDetails',
                        },
                    },
                    {
                        $sort: { createdAt: -1 },
                    },
                    {
                        $skip: Number(skip),
                    },
                    {
                        $limit: Number(pageSize),
                    },
                    {
                        $project: {
                            transactionType: 1,
                            totalRedToken: 1,
                            solosReward: 1,
                            createdAt: 1,
                            clientDetails: { $arrayElemAt: ['$clientDetails.userName', 0] },
                        },
                    },
                ]);
                return {
                    data: { transactionData, totalCount },
                    error: '',
                    message: 'All Red token and Solos Reward Transactions Data fetched Successfully',
                    status: 200,
                };
            }
            catch (err) {
                logger_config_1.default.error(`${this.req.ip} ${err.message || err}`);
                return {
                    data: null,
                    error: err.message || err,
                    message: '',
                    status: 400,
                };
            }
        });
    }
    /**
      * Add/Update fred exchange percentage
      */
    FredExchangeRedToken(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const _id = this.userId;
                const exists = yield (0, db_helpers_1.findOne)(admin_model_1.default, { _id });
                if (!exists) {
                    throw new Error("Admin doesnot exist");
                }
                const { FredExchangeRedTokenPercentage } = request;
                const validatedConversionRate = (0, admin_validator_1.validateFredExchangeRedTokenPercentage)({ FredExchangeRedTokenPercentage });
                if (validatedConversionRate.error) {
                    throw new Error(validatedConversionRate.error.message);
                }
                let saveResponse = yield (0, db_helpers_1.upsert)(admin_model_1.default, { FredExchangeRedTokenPercentage: FredExchangeRedTokenPercentage }, _id);
                const data = saveResponse.FredExchangeRedTokenPercentage;
                return {
                    data: { data },
                    error: '',
                    message: 'Fred Exchange Percentage Updated Successfully',
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
  * Get Red Token Exchange Percentage
  */
    getFredExchangeRedTokenPercentage() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const adminData = yield (0, db_helpers_1.findOne)(admin_model_1.default, {});
                const FredExchangePercentage = adminData.FredExchangeRedTokenPercentage;
                return {
                    data: { FredExchangePercentage },
                    error: '',
                    message: 'Fred Exchange Percentage fetch successfully!',
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
       * Get all model total data count for dashboard
       */
    getAllModelTotalDataCount() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const [totalusers, noofproperty, totalfred, totalnft, totalleasecount] = yield Promise.all([
                    client_model_1.default.countDocuments(),
                    propertyDetailsModel_1.default.countDocuments(),
                    fredNft_model_1.default.countDocuments(),
                    nftDetail_model_1.default.countDocuments(),
                    leasePropertyDetail_Model_1.default.countDocuments()
                ]);
                return {
                    data: { totalusers, noofproperty, totalfred, totalnft, totalleasecount },
                    error: '',
                    message: 'Total Data Count fetch successfully!',
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
    createSFredTypes(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { categoryId, categoryName, type } = request;
                const validatedCategory = (0, admin_validator_1.validateSfredCategory)({ categoryName });
                if (validatedCategory.error) {
                    throw new Error(validatedCategory.error.message);
                }
                let saveResponse;
                if (categoryId) {
                    // Update existing document
                    saveResponse = yield sfredcatefories_model_1.default.findByIdAndUpdate(categoryId, { categoryName: categoryName, type: type }, { new: true });
                }
                else {
                    // Create new document
                    saveResponse = yield sfredcatefories_model_1.default.create({
                        categoryName: categoryName,
                        type: type
                    });
                }
                return {
                    data: saveResponse,
                    error: '',
                    message: categoryId ? 'SFred Category Updated successfully!' : 'SFred Category Created successfully!',
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
    getSFredTypes(pageNumber, pageSize, filter) {
        return __awaiter(this, void 0, void 0, function* () {
            function getAll(model, pageNumber, pageSize, filter) {
                return __awaiter(this, void 0, void 0, function* () {
                    let query = {};
                    if (filter) {
                        query = {
                            $or: [
                                { categoryName: { $regex: filter, $options: 'i' } },
                                { type: { $regex: filter, $options: 'i' } }
                            ]
                        };
                    }
                    if (pageNumber && pageSize) {
                        const skip = (pageNumber - 1) * pageSize;
                        return model.find(query).skip(skip).limit(pageSize);
                    }
                    else {
                        return model.find(query);
                    }
                });
            }
            try {
                const data = yield getAll(sfredcatefories_model_1.default, +pageNumber, +pageSize, filter);
                const totalCount = yield sfredcatefories_model_1.default.countDocuments({});
                return {
                    data: { data, totalCount },
                    error: '',
                    message: 'SFred Category Fetched successfully!',
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
    deleteSfredCategory(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield (0, db_helpers_1.findOne)(sfredcatefories_model_1.default, { _id: id });
                if (response.categoryId === id) {
                    throw new Error("This category is already in use you can't delete this category");
                }
                // Find the property detail by ID and remove it
                const deletedCategory = yield (0, db_helpers_1.deleteById)(sfredcatefories_model_1.default, id);
                if (!deletedCategory) {
                    return {
                        data: null,
                        error: 'SFredCategory detail not found',
                        message: 'SfredCategory detail not found',
                        status: 404,
                    };
                }
                return {
                    data: null,
                    error: '',
                    message: 'SfredCategory deleted successfully',
                    status: 200,
                };
            }
            catch (err) {
                logger_config_1.default.error(`${this.req.ip} ${err.message}`);
                return {
                    data: null,
                    error: err.message ? err.message : err,
                    message: 'Error deleting category details',
                    status: 400,
                };
            }
        });
    }
    /**
     * Update status of Usdc Request
     */
    updateUsdcRequest(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { status, hashId, hashId2 } = request;
                // Check for a valid id
                // Update the status of the red token request with the newStatus
                const transaction = yield (0, db_helpers_1.findOne)(redTokenTransaction_model_1.default, { hashId: hashId });
                if (transaction && transaction.status === "PENDING") {
                    const changeStatusRequest = yield (0, db_helpers_1.upsert)(redTokenTransaction_model_1.default, { status, hashId2 }, transaction._id);
                    const clientId = changeStatusRequest.senderId;
                    const Usdc = +changeStatusRequest.usdc;
                    return {
                        data: { Usdc, changeStatusRequest },
                        error: '',
                        message: 'Usdc added successfully',
                        status: 200
                    };
                }
                else {
                    return {
                        data: { transaction },
                        error: '',
                        message: 'Usdc request already approved or declined',
                        status: 200
                    };
                }
            }
            catch (err) {
                return {
                    data: null,
                    error: err.message ? err.message : err,
                    message: 'Error updating Red Tokens',
                    status: 400
                };
            }
        });
    }
};
__decorate([
    (0, tsoa_1.Post)("/login"),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "login", null);
__decorate([
    (0, tsoa_1.Post)("/forgotPassword"),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "forgotPassword", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Post)("/resetPassword"),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "resetPassword", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Post)("/createAminities"),
    __param(0, (0, tsoa_1.FormField)()),
    __param(1, (0, tsoa_1.UploadedFile)('iconImage')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createAminities", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Delete)('/deleteAminitiesDetail'),
    __param(0, (0, tsoa_1.Query)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteAminitiesDetail", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Get)("/GetAminities"),
    __param(0, (0, tsoa_1.Query)('pageNumber')),
    __param(1, (0, tsoa_1.Query)('pageSize')),
    __param(2, (0, tsoa_1.Query)('filter')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "GetAminities", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Post)("/createProperty"),
    __param(0, (0, tsoa_1.FormField)('propertyId')),
    __param(1, (0, tsoa_1.FormField)('propertyName')),
    __param(2, (0, tsoa_1.FormField)('location')),
    __param(3, (0, tsoa_1.FormField)('description')),
    __param(4, (0, tsoa_1.FormField)('area')),
    __param(5, (0, tsoa_1.FormField)('propertyType')),
    __param(6, (0, tsoa_1.FormField)('interestPerAnnum')),
    __param(7, (0, tsoa_1.FormField)('price')),
    __param(8, (0, tsoa_1.FormField)('dueDate')),
    __param(9, (0, tsoa_1.FormField)('MonthlyFees')),
    __param(10, (0, tsoa_1.FormField)()),
    __param(11, (0, tsoa_1.UploadedFile)('imageURL')),
    __param(12, (0, tsoa_1.UploadedFile)('propertyDocument')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Number, String, Number, Number, String, Number, Array, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createProperty", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Post)("/createAgreement"),
    __param(0, (0, tsoa_1.FormField)()),
    __param(1, (0, tsoa_1.FormField)()),
    __param(2, (0, tsoa_1.FormField)()),
    __param(3, (0, tsoa_1.FormField)()),
    __param(4, (0, tsoa_1.FormField)()),
    __param(5, (0, tsoa_1.FormField)()),
    __param(6, (0, tsoa_1.FormField)()),
    __param(7, (0, tsoa_1.FormField)()),
    __param(8, (0, tsoa_1.FormField)()),
    __param(9, (0, tsoa_1.FormField)()),
    __param(10, (0, tsoa_1.FormField)()),
    __param(11, (0, tsoa_1.FormField)()),
    __param(12, (0, tsoa_1.FormField)()),
    __param(13, (0, tsoa_1.FormField)()),
    __param(14, (0, tsoa_1.FormField)()),
    __param(15, (0, tsoa_1.FormField)()),
    __param(16, (0, tsoa_1.FormField)()),
    __param(17, (0, tsoa_1.FormField)()),
    __param(18, (0, tsoa_1.FormField)()),
    __param(19, (0, tsoa_1.FormField)()),
    __param(20, (0, tsoa_1.UploadedFile)('trustDeed')),
    __param(21, (0, tsoa_1.UploadedFile)('appraisalReports')),
    __param(22, (0, tsoa_1.UploadedFile)('titlePolicy')),
    __param(23, (0, tsoa_1.UploadedFile)('anyEncumbrances')),
    __param(24, (0, tsoa_1.UploadedFiles)('pictures')),
    __param(25, (0, tsoa_1.UploadedFiles)('videos')),
    __param(26, (0, tsoa_1.UploadedFiles)('images_3d')),
    __param(27, (0, tsoa_1.UploadedFiles)('floorPlans')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, String, String, String, String, String, String, String, String, String, String, String, String, String, Object, Object, Object, Object, Array, Array, Array, Array]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createAgreement", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Get)("/getLeasePropertyData"),
    __param(0, (0, tsoa_1.Query)('pageNumber')),
    __param(1, (0, tsoa_1.Query)('pageSize')),
    __param(2, (0, tsoa_1.Query)('filter')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getLeasePropertyData", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Get)("/allProperties"),
    __param(0, (0, tsoa_1.Query)('pageNumber')),
    __param(1, (0, tsoa_1.Query)('pageSize')),
    __param(2, (0, tsoa_1.Query)('filter')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "allProperties", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Get)("/getAllUsers"),
    __param(0, (0, tsoa_1.Query)('pageNumber')),
    __param(1, (0, tsoa_1.Query)('pageSize')),
    __param(2, (0, tsoa_1.Query)('filter')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllUsers", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Put)("/updateLeasePropertyStatus"),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateLeasePropertyStatus", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Get)("/getRedTokenRequestData"),
    __param(0, (0, tsoa_1.Query)('pageNumber')),
    __param(1, (0, tsoa_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getRedTokenRequestData", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Put)("/updateRedTokenRequest"),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateRedTokenRequest", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Put)('/updateWalletAddress'),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateWalletAddress", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Get)("/adminData"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "adminData", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Put)('/updateConversionRate'),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateConversionRate", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Put)('/updateConversionRateForLoan'),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateConversionRateForLoan", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Put)('/updateBookingPercentage'),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateBookingPercentage", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Put)('/updateConversionRateForSoloReward'),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateConversionRateForSoloReward", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Get)("/getConversionRateForSoloReward"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getConversionRateForSoloReward", null);
__decorate([
    (0, tsoa_1.Security)("Bearer"),
    (0, tsoa_1.Get)("/logout"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "logout", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Post)("/addNftData"),
    __param(0, (0, tsoa_1.FormField)()),
    __param(1, (0, tsoa_1.FormField)()),
    __param(2, (0, tsoa_1.FormField)()),
    __param(3, (0, tsoa_1.FormField)()),
    __param(4, (0, tsoa_1.FormField)()),
    __param(5, (0, tsoa_1.FormField)()),
    __param(6, (0, tsoa_1.FormField)()),
    __param(7, (0, tsoa_1.FormField)()),
    __param(8, (0, tsoa_1.UploadedFile)('Image')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "addNftData", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Get)("/getNftData"),
    __param(0, (0, tsoa_1.Query)('pageNumber')),
    __param(1, (0, tsoa_1.Query)('pageSize')),
    __param(2, (0, tsoa_1.Query)('filter')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getNftData", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Put)('/blockUser'),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "blockUser", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Delete)('deletePropertyDetail'),
    __param(0, (0, tsoa_1.Query)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deletePropertyDetail", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Post)("/createCategory"),
    __param(0, (0, tsoa_1.FormField)()),
    __param(1, (0, tsoa_1.UploadedFile)('iconImage')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createCategory", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Delete)('/deleteCategory'),
    __param(0, (0, tsoa_1.Query)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteCategory", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Get)("/getCategory"),
    __param(0, (0, tsoa_1.Query)('pageNumber')),
    __param(1, (0, tsoa_1.Query)('pageSize')),
    __param(2, (0, tsoa_1.Query)('filter')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getCategory", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Post)('/saveFred'),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "saveFred", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Post)('/sendRedTokenByAdmin'),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "sendRedTokenByAdmin", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Post)('/sendSolosReward'),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "sendSolosReward", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Get)('/getRedAndSolosTransaction'),
    __param(0, (0, tsoa_1.Query)('pageNumber')),
    __param(1, (0, tsoa_1.Query)('pageSize')),
    __param(2, (0, tsoa_1.Query)('filter')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getRedAndSolosTransaction", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Put)('/FredExchangeRedToken'),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "FredExchangeRedToken", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Get)("/getFredExchangeRedTokenPercentage"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getFredExchangeRedTokenPercentage", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Get)("/getAllModelTotalDataCount"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllModelTotalDataCount", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Post)("/createSFredTypes"),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createSFredTypes", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Get)("/getSFredTypes"),
    __param(0, (0, tsoa_1.Query)('pageNumber')),
    __param(1, (0, tsoa_1.Query)('pageSize')),
    __param(2, (0, tsoa_1.Query)('filter')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getSFredTypes", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Delete)('/deleteSfredCategory'),
    __param(0, (0, tsoa_1.Query)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteSfredCategory", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Put)("/updateUsdcRequest"),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateUsdcRequest", null);
AdminController = __decorate([
    (0, tsoa_1.Tags)('Admin'),
    (0, tsoa_1.Route)('api/admin'),
    __metadata("design:paramtypes", [Object, Object])
], AdminController);
exports.default = AdminController;

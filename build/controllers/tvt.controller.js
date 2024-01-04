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
const aws_s3_utils_1 = __importDefault(require("../utils/aws.s3.utils"));
const logger_config_1 = __importDefault(require("../configs/logger.config"));
const tvt_model_1 = __importDefault(require("../models/tvt.model"));
let tvtController = class tvtController extends tsoa_1.Controller {
    constructor(req, res) {
        super();
        this.req = req;
        this.res = res;
        this.userId = req.body.user ? req.body.user.id : '';
    }
    /**
     * Create TVT Nft
     */
    createTvt(categories, series, description, quantity, price, hashId, file) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let payload = {};
                if (categories) {
                    payload.categories = categories;
                }
                if (series) {
                    payload.series = series;
                }
                if (description) {
                    payload.description = description;
                }
                if (quantity) {
                    payload.quantity = quantity;
                }
                if (price) {
                    payload.price = price;
                }
                if (price) {
                    payload.tradePrice = price;
                }
                if (hashId) {
                    payload.hashId = hashId;
                }
                if (file) {
                    payload.image = yield (0, aws_s3_utils_1.default)(file.originalname, file.buffer, file.mimetype.includes('image/png') ? 'image/png' : 'image/jpeg');
                }
                const result = yield (0, db_helpers_1.upsert)(tvt_model_1.default, payload);
                return {
                    data: result,
                    error: '',
                    message: 'Tvt Nft Is Created',
                    status: 200,
                };
            }
            catch (err) {
                return {
                    data: null,
                    error: err.message ? err.message : err,
                    message: '',
                    status: 400,
                };
            }
        });
    }
    /*
    *Get TVT Details
    */
    tvtData(pageNumber, pageSize) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield (0, db_helpers_1.getAll)(tvt_model_1.default, {}, +pageNumber, +pageSize);
                return {
                    data: data || {},
                    error: '',
                    message: 'Tvt Details Fetched Successfully',
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
    * Tvts Sell in MarketPlace
    */
    totalTvtSellInMarketPlace(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id, quantity } = request;
                const getResponse = yield (0, db_helpers_1.getById)(tvt_model_1.default, id);
                const updatedQuantityForSellInSoloMarketPlace = getResponse.quantityForSellInSoloMarketPlace + parseInt(quantity);
                const getResponse2 = yield (0, db_helpers_1.upsert)(tvt_model_1.default, {
                    quantity: getResponse.quantity - parseInt(quantity),
                    quantityForSellInSoloMarketPlace: updatedQuantityForSellInSoloMarketPlace
                }, id);
                return {
                    data: getResponse2,
                    error: '',
                    message: 'Tvt Transfer Successfully',
                    status: 200
                };
            }
            catch (err) {
                return {
                    data: null,
                    error: err.message ? err.message : err,
                    message: 'Error Transfering Tvt',
                    status: 400
                };
            }
        });
    }
    /*
 * Get TVT Details
 */
    tvtDataOfSoloMarketPlace(pageNumber, pageSize) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield (0, db_helpers_1.getAll)(tvt_model_1.default, {}, +pageNumber, +pageSize);
                const data = result.items;
                const filteredData = data.filter((item) => item.quantityForSellInSoloMarketPlace !== null && item.quantityForSellInSoloMarketPlace !== 0);
                const totalCount = filteredData.length;
                return {
                    data: { filteredData, totalCount },
                    error: '',
                    message: 'Tvt Details Fetched Successfully',
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
    * Buy Tvt
    */
    /**
    * Buy Tvt
    */
    buyTvt(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let { id, categories, series, description, quantity, price, hashId, image } = request;
                console.log(id);
                if (id === undefined || quantity === undefined || price === undefined) {
                    throw new Error('Missing required parameters.');
                }
                let payload = {
                    userId: this.userId,
                    status: 'APPROVED',
                };
                if (categories) {
                    payload.categories = categories;
                }
                if (series) {
                    payload.series = series;
                }
                if (description) {
                    payload.description = description;
                }
                if (quantity) {
                    payload.quantity = quantity;
                }
                if (price) {
                    payload.price = price;
                    payload.tradePrice = price;
                }
                if (hashId) {
                    payload.hashId = hashId;
                }
                if (image) {
                    payload.image = image;
                }
                let result;
                const data = yield (0, db_helpers_1.findOne)(tvt_model_1.default, { userId: this.userId, categories: categories });
                if (data) {
                    const getResponse = yield (0, db_helpers_1.getById)(tvt_model_1.default, id);
                    const updatedQuantity = getResponse.quantityForSellInSoloMarketPlace - +parseInt(quantity);
                    if (updatedQuantity < 0) {
                        throw new Error('Invalid quantity calculation.');
                    }
                    const getResponse2 = yield (0, db_helpers_1.upsert)(tvt_model_1.default, { tradePrice: price, quantityForSellInSoloMarketPlace: updatedQuantity }, id);
                    const updatedQuantity2 = data.quantity + +quantity;
                    result = yield (0, db_helpers_1.upsert)(tvt_model_1.default, { quantity: updatedQuantity2 }, data._id);
                }
                else {
                    const getResponse = yield (0, db_helpers_1.getById)(tvt_model_1.default, id);
                    const updatedQuantity = getResponse.quantityForSellInSoloMarketPlace - +parseInt(quantity);
                    if (updatedQuantity < 0) {
                        throw new Error('Invalid quantity calculation.');
                    }
                    const getResponse2 = yield (0, db_helpers_1.upsert)(tvt_model_1.default, { tradePrice: price, quantityForSellInSoloMarketPlace: updatedQuantity }, id);
                    result = yield (0, db_helpers_1.upsert)(tvt_model_1.default, payload);
                }
                return {
                    data: result,
                    error: '',
                    message: 'Tvt Purchase Successfully',
                    status: 200,
                };
            }
            catch (err) {
                return {
                    data: null,
                    error: err.message ? err.message : err,
                    message: '',
                    status: 400,
                };
            }
        });
    }
    getUserTvt(pageNumber, pageSize) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const query = { userId: this.userId };
                const getResponse = yield (0, db_helpers_1.getAll)(tvt_model_1.default, query, +pageNumber, +pageSize);
                return {
                    data: getResponse,
                    error: '',
                    message: 'Tvt Details Fetched Successfully',
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
    (0, tsoa_1.Security)("Bearer"),
    (0, tsoa_1.Post)("/createTvt"),
    __param(0, (0, tsoa_1.FormField)()),
    __param(1, (0, tsoa_1.FormField)()),
    __param(2, (0, tsoa_1.FormField)()),
    __param(3, (0, tsoa_1.FormField)()),
    __param(4, (0, tsoa_1.FormField)()),
    __param(5, (0, tsoa_1.FormField)()),
    __param(6, (0, tsoa_1.UploadedFile)('image')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], tvtController.prototype, "createTvt", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Get)("/tvtData"),
    __param(0, (0, tsoa_1.Query)('pageNumber')),
    __param(1, (0, tsoa_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], tvtController.prototype, "tvtData", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Put)("/totalTvtSellInMarketPlace"),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], tvtController.prototype, "totalTvtSellInMarketPlace", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Get)("/tvtDataOfSoloMarketPlace"),
    __param(0, (0, tsoa_1.Query)('pageNumber')),
    __param(1, (0, tsoa_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], tvtController.prototype, "tvtDataOfSoloMarketPlace", null);
__decorate([
    (0, tsoa_1.Security)("Bearer"),
    (0, tsoa_1.Post)("/buyTvt"),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], tvtController.prototype, "buyTvt", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Get)("/getUserTvt"),
    __param(0, (0, tsoa_1.Query)('pageNumber')),
    __param(1, (0, tsoa_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], tvtController.prototype, "getUserTvt", null);
tvtController = __decorate([
    (0, tsoa_1.Tags)('Tvt'),
    (0, tsoa_1.Route)('api/tvt'),
    __metadata("design:paramtypes", [Object, Object])
], tvtController);
exports.default = tvtController;

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
const superFred_model_1 = __importDefault(require("../models/superFred.model"));
const logger_config_1 = __importDefault(require("../configs/logger.config"));
const contratAbi = require("../Abi/superFred.json");
const { object } = require("../bytecode/superFREDByteCode.json");
const ethers_1 = require("ethers");
let superFredController = class superFredController extends tsoa_1.Controller {
    constructor(req, res) {
        super();
        this.req = req;
        this.res = res;
        this.userId = req.body.user ? req.body.user.id : '';
    }
    /**
     * Create Super Fred Nft
     */
    createSuperFred(type, series, description, price, limit, quantity, rewardDistribution, rewardSR, dateOfMaturity, maturityAmount, file) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let payload = {};
                if (description) {
                    payload.description = description;
                }
                if (type) {
                    payload.type = type;
                }
                if (series) {
                    payload.series = series;
                }
                if (description) {
                    payload.description = description;
                }
                if (price) {
                    payload.price = price;
                }
                if (limit) {
                    payload.limit = limit;
                }
                if (quantity) {
                    payload.quantity = quantity;
                }
                if (rewardDistribution) {
                    payload.rewardDistribution = rewardDistribution;
                }
                if (rewardSR) {
                    payload.rewardSR = rewardSR;
                }
                if (dateOfMaturity) {
                    payload.dateOfMaturity = dateOfMaturity;
                }
                if (maturityAmount) {
                    payload.maturityAmount = maturityAmount;
                }
                if (file) {
                    payload.image = yield (0, aws_s3_utils_1.default)(file.originalname, file.buffer, file.mimetype.includes('image/png') ? 'image/png' : 'image/jpeg');
                }
                const result = yield (0, db_helpers_1.upsert)(superFred_model_1.default, payload);
                const result2 = yield (0, db_helpers_1.upsert)(superFred_model_1.default, { nftId: result._id }, result._id);
                return {
                    data: result2,
                    error: '',
                    message: 'Super Fred is created',
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
    superFredData(pageNumber, pageSize) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield (0, db_helpers_1.getAll)(superFred_model_1.default, {}, +pageNumber, +pageSize);
                return {
                    data: data || {},
                    error: '',
                    message: 'Super Fred Details Fetched Successfully',
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
* Get Super Fred Details
*/
    superFredDataOfSoloMarketPlace(pageNumber, pageSize) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield (0, db_helpers_1.getAll)(superFred_model_1.default, {}, +pageNumber, +pageSize);
                const data = result.items;
                const filteredData = data.filter((item) => item.userId === null);
                return {
                    data: filteredData,
                    error: '',
                    message: 'Super Fred Details Fetched Successfully',
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
* Buy Super Red
*/
    buySuperRed(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id, type, series, description, price, limit, quantity, rewardDistribution, rewardSR, dateOfMaturity, maturityAmount, walletAddress, image } = request;
                if (!id || !quantity || !price) {
                    throw new Error('Missing required parameters: id, quantity, price');
                }
                const nftDetails = yield (0, db_helpers_1.getById)(superFred_model_1.default, id);
                console.log(nftDetails);
                const userNFT = yield (0, db_helpers_1.findOne)(superFred_model_1.default, { userId: this.userId, type: type });
                console.log(userNFT);
                if (userNFT) {
                    if (userNFT.quantity >= nftDetails.limit) {
                        throw new Error("You have already reached the maximum limit for purchasing this NFT");
                    }
                }
                if (userNFT) {
                    if (userNFT.quantity < quantity) {
                        throw new Error("Please decrease your NFT purchase quantity");
                    }
                }
                const payload = {
                    userId: this.userId,
                    status: 'APPROVED',
                    type,
                    series,
                    description,
                    price,
                    limit,
                    quantity,
                    rewardDistribution,
                    rewardSR,
                    dateOfMaturity,
                    maturityAmount,
                    walletAddress,
                    image,
                    nftId: id
                };
                let response;
                const updatedQuantity = nftDetails.quantity - parseInt(quantity, 10);
                const dateObject = new Date(dateOfMaturity);
                const year = dateObject.getFullYear();
                const month = dateObject.getMonth() + 1;
                if (userNFT) {
                    const updatedUserQuantity = userNFT.quantity + parseInt(quantity, 10);
                    const privateKey = '30e860ca9f250083356e649d98bc65c7918037234f1c03a911582a92cc4c64fd';
                    const provider = new ethers_1.ethers.JsonRpcProvider('https://polygon-mumbai.g.alchemy.com/v2/rs8xNqu1taW0yiUL4sCgqJwSyrtpywGt');
                    const wallet = new ethers_1.ethers.Wallet(privateKey, provider);
                    const signer = wallet.connect(provider);
                    const factory = new ethers_1.ContractFactory(contratAbi, object, signer);
                    const contract = yield factory.deploy("superFred", "SFRED", "https://ipfs.io/ipfs/QmPTd69QK8srkncPkE2db8Z495iUqQ4KyBP7TNLv7KHF6F", updatedUserQuantity, month, year, price, walletAddress);
                    const finalDeploy = yield contract.deploymentTransaction();
                    console.log("finalDeploy", finalDeploy);
                    // User already has a record for this NFT type
                    yield (0, db_helpers_1.upsert)(superFred_model_1.default, { quantity: updatedQuantity }, id);
                    const result = yield (0, db_helpers_1.upsert)(superFred_model_1.default, { quantity: updatedUserQuantity }, userNFT._id);
                    response = yield (0, db_helpers_1.upsert)(superFred_model_1.default, { hashId: finalDeploy.hash }, userNFT._id);
                }
                else {
                    const privateKey = '30e860ca9f250083356e649d98bc65c7918037234f1c03a911582a92cc4c64fd';
                    const provider = new ethers_1.ethers.JsonRpcProvider('https://polygon-mumbai.g.alchemy.com/v2/rs8xNqu1taW0yiUL4sCgqJwSyrtpywGt');
                    const wallet = new ethers_1.ethers.Wallet(privateKey, provider);
                    const signer = wallet.connect(provider);
                    const factory = new ethers_1.ContractFactory(contratAbi, object, signer);
                    const contract = yield factory.deploy("superFred", "SFRED", "https://ipfs.io/ipfs/QmPTd69QK8srkncPkE2db8Z495iUqQ4KyBP7TNLv7KHF6F", updatedQuantity, month, year, price, walletAddress);
                    const finalDeploy = yield contract.deploymentTransaction();
                    console.log("finalDeploy", finalDeploy);
                    // User does not have a record for this NFT type
                    yield (0, db_helpers_1.upsert)(superFred_model_1.default, { quantity: updatedQuantity }, id);
                    const result = yield (0, db_helpers_1.upsert)(superFred_model_1.default, payload);
                    response = yield (0, db_helpers_1.upsert)(superFred_model_1.default, { hashId: finalDeploy.hash }, result._id);
                }
                return {
                    data: response,
                    error: '',
                    message: 'Super Fred Purchase Successfully',
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
    getUserSuperRed(pageNumber, pageSize) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const query = { userId: this.userId };
                const getResponse = yield (0, db_helpers_1.getAll)(superFred_model_1.default, query, +pageNumber, +pageSize);
                return {
                    data: getResponse,
                    error: '',
                    message: 'Super Fred Details Fetched Successfully',
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
    (0, tsoa_1.Post)("/createSuperFred"),
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
    __param(10, (0, tsoa_1.UploadedFile)('image')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], superFredController.prototype, "createSuperFred", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Get)("/superFredData"),
    __param(0, (0, tsoa_1.Query)('pageNumber')),
    __param(1, (0, tsoa_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], superFredController.prototype, "superFredData", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Get)("/superFredDataOfSoloMarketPlace"),
    __param(0, (0, tsoa_1.Query)('pageNumber')),
    __param(1, (0, tsoa_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], superFredController.prototype, "superFredDataOfSoloMarketPlace", null);
__decorate([
    (0, tsoa_1.Security)("Bearer"),
    (0, tsoa_1.Post)("/buySuperRed"),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], superFredController.prototype, "buySuperRed", null);
__decorate([
    (0, tsoa_1.Security)('Bearer'),
    (0, tsoa_1.Get)("/getUserSuperRed"),
    __param(0, (0, tsoa_1.Query)('pageNumber')),
    __param(1, (0, tsoa_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], superFredController.prototype, "getUserSuperRed", null);
superFredController = __decorate([
    (0, tsoa_1.Tags)('superFreds'),
    (0, tsoa_1.Route)('api/superFred'),
    __metadata("design:paramtypes", [Object, Object])
], superFredController);
exports.default = superFredController;

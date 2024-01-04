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
const fredNft_model_1 = __importDefault(require("../models/fredNft.model"));
const transaction_model_1 = __importDefault(require("../models/transaction.model"));
const nftDetail_model_1 = __importDefault(require("../models/nftDetail.model"));
const userNft_model_1 = __importDefault(require("../models/userNft.model"));
const aws_s3_utils_1 = __importDefault(require("../utils/aws.s3.utils"));
const mongoose_1 = __importDefault(require("mongoose"));
let FredController = class FredController extends tsoa_1.Controller {
    constructor(req, res) {
        super();
        this.req = req;
        this.res = res;
        this.userId = req.body.user ? req.body.user.id : '';
    }
    /**
     * Create / Update Fred NFT, and Type = " flexible / fixed "
     */
    createUpdateFredNFT(description, fred_name, benefit_month, years, amount, benefit_amount, purchase_limit, start_month, end_year, type, fred_nft_id, tokenId, contractAddress, maturityDate, file) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let payload = {};
                if (fred_name) {
                    payload.fred_name = fred_name !== null && fred_name !== void 0 ? fred_name : "";
                }
                if (description) {
                    payload.description = description !== null && description !== void 0 ? description : "";
                }
                if (benefit_month) {
                    payload.benefitMonth = benefit_month !== null && benefit_month !== void 0 ? benefit_month : "";
                }
                if (years) {
                    payload.years = years !== null && years !== void 0 ? years : "";
                }
                if (amount) {
                    payload.amount = amount !== null && amount !== void 0 ? amount : "";
                }
                if (benefit_amount) {
                    payload.benefitAmount = benefit_amount !== null && benefit_amount !== void 0 ? benefit_amount : "";
                }
                if (purchase_limit) {
                    payload.purchaseLimit = purchase_limit !== null && purchase_limit !== void 0 ? purchase_limit : "";
                }
                if (start_month) {
                    payload.startMonth = start_month !== null && start_month !== void 0 ? start_month : "";
                }
                if (end_year) {
                    payload.endYear = end_year !== null && end_year !== void 0 ? end_year : "";
                }
                if (tokenId) {
                    payload.tokenId = tokenId !== null && tokenId !== void 0 ? tokenId : "";
                }
                if (contractAddress) {
                    payload.contractAddress = contractAddress !== null && contractAddress !== void 0 ? contractAddress : "";
                }
                if (maturityDate) {
                    payload.maturityDate = maturityDate !== null && maturityDate !== void 0 ? maturityDate : "";
                }
                if (type) {
                    payload.type = type !== null && type !== void 0 ? type : "";
                }
                if (file) {
                    payload.nftImage = yield (0, aws_s3_utils_1.default)(file === null || file === void 0 ? void 0 : file.originalname, file === null || file === void 0 ? void 0 : file.buffer, (file === null || file === void 0 ? void 0 : file.mimetype.includes('image/png')) ? "image/png" : "image/jpeg");
                }
                let result;
                if (fred_nft_id) {
                    result = yield (0, db_helpers_1.upsert)(fredNft_model_1.default, payload, fred_nft_id);
                }
                else {
                    result = yield (0, db_helpers_1.upsert)(fredNft_model_1.default, payload);
                }
                return {
                    data: result,
                    error: '',
                    message: fred_nft_id ? "Fred NFT Updated!!" : "Fred NFT Created!!",
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
     * Normal NFT transfer to user
     */
    nftTransfer(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { receiverId, hashId, nftDetailId, amount, type, signerAddress } = request;
                if (type === "fred") {
                    yield (0, db_helpers_1.upsert)(fredNft_model_1.default, { isPaid: true, userId: this.userId, status: 'APPROVED', signerAddress }, nftDetailId);
                }
                else {
                    yield (0, db_helpers_1.upsert)(nftDetail_model_1.default, { isPaid: true, userId: this.userId, price: amount, status: 'APPROVED', signerAddress }, nftDetailId);
                }
                let result = yield (0, db_helpers_1.upsert)(transaction_model_1.default, {
                    // senderId: nftdetail?.userId || null,
                    receiverId: this.userId || null,
                    hashId,
                    amount,
                    nftDetailId,
                    transactionType: "nftTransfer",
                    status: "APPROVED"
                });
                let userNft = yield (0, db_helpers_1.upsert)(userNft_model_1.default, {
                    userId: this.userId,
                    nftDetailId: type != "fred" ? nftDetailId : null,
                    fredNftId: type == "fred" ? nftDetailId : null,
                    amount: amount,
                    hashId: hashId,
                    type: 'fred',
                    isLocked: false,
                });
                return {
                    data: result,
                    error: '',
                    message: "",
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
  * List with Pagination Fred NFT
  */
    listFredNFT(page_number, page_limit, filter) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Ensure that page_limit is parsed as a number
                page_limit = Number(page_limit);
                let query = { status: 'PENDING' };
                if (filter) {
                    query.$or = [
                        { fred_name: { $regex: filter, $options: 'i' } },
                        { type: { $regex: filter, $options: 'i' } }
                    ];
                }
                let result = yield (0, db_helpers_1.getAll)(fredNft_model_1.default, query, page_number, page_limit, [], [], false, true);
                return {
                    data: result,
                    error: '',
                    message: "Fred NFTs",
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
     * Delete Fred NFT
     */
    deleteFredNFT(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const deleted = yield (0, db_helpers_1.deleteById)(fredNft_model_1.default, id);
                return {
                    data: deleted,
                    error: '',
                    message: "Fred NFT Deleted",
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
        * Purchase nft and fred from user
        */
    purchaseNftAndFredFromUser(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { receiverId, hashId, nftDetailId, amount, type } = request;
                let nftdetail;
                if (type === "fred") {
                    nftdetail = yield fredNft_model_1.default.findOne({ _id: mongoose_1.default.Types.ObjectId(nftDetailId) });
                    yield (0, db_helpers_1.upsert)(fredNft_model_1.default, { isPaid: true, userId: this.userId, status: 'APPROVED' }, nftDetailId);
                }
                else {
                    nftdetail = yield nftDetail_model_1.default.findOne({ _id: mongoose_1.default.Types.ObjectId(nftDetailId) });
                    yield (0, db_helpers_1.upsert)(nftDetail_model_1.default, { isPaid: true, userId: this.userId, price: amount, status: 'APPROVED' }, nftDetailId);
                }
                let result = yield (0, db_helpers_1.upsert)(transaction_model_1.default, {
                    senderId: (nftdetail === null || nftdetail === void 0 ? void 0 : nftdetail.userId) || null,
                    receiverId: this.userId || null,
                    hashId,
                    amount,
                    nftDetailId,
                    transactionType: "nftTransfer",
                    status: "APPROVED"
                });
                let userNft = yield (0, db_helpers_1.upsert)(userNft_model_1.default, {
                    userId: this.userId,
                    nftDetailId: type != "fred" ? nftDetailId : null,
                    fredNftId: type == "fred" ? nftDetailId : null,
                    amount: amount,
                    hashId: hashId,
                    type: 'fred',
                    isLocked: false,
                });
                return {
                    data: result,
                    error: '',
                    message: "",
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
    (0, tsoa_1.Security)("Bearer"),
    (0, tsoa_1.Post)("/createUpdateFredNFT"),
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
    __param(14, (0, tsoa_1.UploadedFile)('nft_image')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, String, String, String, String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], FredController.prototype, "createUpdateFredNFT", null);
__decorate([
    (0, tsoa_1.Security)("Bearer"),
    (0, tsoa_1.Post)("/nftTransfer"),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FredController.prototype, "nftTransfer", null);
__decorate([
    (0, tsoa_1.Security)("Bearer"),
    (0, tsoa_1.Get)("/listFredNFT"),
    __param(0, (0, tsoa_1.Query)('page_number')),
    __param(1, (0, tsoa_1.Query)('page_limit')),
    __param(2, (0, tsoa_1.Query)('filter')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String]),
    __metadata("design:returntype", Promise)
], FredController.prototype, "listFredNFT", null);
__decorate([
    (0, tsoa_1.Security)("Bearer"),
    (0, tsoa_1.Delete)("/deleteFredNFT"),
    __param(0, (0, tsoa_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FredController.prototype, "deleteFredNFT", null);
__decorate([
    (0, tsoa_1.Security)("Bearer"),
    (0, tsoa_1.Post)("/purchaseNftAndFredFromUser"),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FredController.prototype, "purchaseNftAndFredFromUser", null);
FredController = __decorate([
    (0, tsoa_1.Tags)('Fred'),
    (0, tsoa_1.Route)('api/fred'),
    __metadata("design:paramtypes", [Object, Object])
], FredController);
exports.default = FredController;

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
const client_model_1 = __importDefault(require("../models/client.model"));
const reward_model_1 = __importDefault(require("../models/reward.model"));
const crone = require('node-cron');
let rewardController = class rewardController extends tsoa_1.Controller {
    constructor(req, res) {
        super();
        this.req = req;
        this.res = res;
        this.userId = req.body.user ? req.body.user.id : '';
    }
    sendreward(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { sender_id, receiver_id, amount } = request;
                console.log(sender_id);
                if (!sender_id || !receiver_id || !amount) {
                    return {
                        data: null,
                        error: "Required Parameters are missing",
                        message: '',
                        status: 400
                    };
                }
                const senderClient = yield client_model_1.default.findOne({ _id: sender_id });
                const receiverClient = yield client_model_1.default.findOne({ _id: receiver_id });
                if (senderClient.redToken < amount) {
                    return {
                        data: null,
                        error: "Insufficient Red tokens for the transaction",
                        message: '',
                        status: 400
                    };
                }
                console.log(senderClient.redToken);
                const cronejob = crone.schedule("* * * * *", () => __awaiter(this, void 0, void 0, function* () {
                    const reward = new reward_model_1.default({
                        sender_id: senderClient._id.toString(),
                        receiver_id: receiverClient._id.toString(),
                        amount,
                    });
                    console.log("yes save");
                    yield reward.save();
                    let updatedRedTokenForSender = senderClient.redToken - amount;
                    let updatedRedTokenForReceiver = receiverClient.redToken + amount;
                    console.log(updatedRedTokenForSender);
                    yield client_model_1.default.updateOne({ _id: senderClient._id }, { redToken: updatedRedTokenForSender });
                    yield client_model_1.default.updateOne({ _id: receiverClient._id }, { redToken: updatedRedTokenForReceiver });
                }));
                console.log(cronejob);
                const cronejobInfo = {
                    status: "Red Token Sent in Every 10 minute from sender's account",
                };
                return {
                    data: cronejobInfo,
                    error: "Reward Sent Successfully",
                    message: '',
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
    (0, tsoa_1.Post)("/sendreward"),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], rewardController.prototype, "sendreward", null);
rewardController = __decorate([
    (0, tsoa_1.Tags)('Reward'),
    (0, tsoa_1.Route)('api/reward'),
    __metadata("design:paramtypes", [Object, Object])
], rewardController);
exports.default = rewardController;

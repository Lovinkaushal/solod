"use strict";
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
exports.deleteClientDataBase = exports.createClientDataBase = exports.createSubscription = exports.createPaymentIntent = exports.createCustomer = exports.createPlan = exports.createStripePlan = void 0;
const stripe_1 = __importDefault(require("stripe"));
const axios_1 = __importDefault(require("axios"));
const app_constants_1 = require("../constants/app.constants");
const common_util_1 = require("../utils/common.util");
const createStripeObject = () => {
    return new stripe_1.default(process.env.STRIPE_SECRET_KEY || "", {
        apiVersion: '2020-08-27',
    });
};
const createStripePlan = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const res = yield createPlan(payload);
    return res;
});
exports.createStripePlan = createStripePlan;
const createPlan = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const stripe = createStripeObject();
    return stripe.plans.create({
        amount: parseFloat(payload.price) * 100,
        interval: payload.type.toLowerCase(),
        interval_count: payload.interval,
        product: {
            name: payload.name
        },
        currency: "USD"
    });
});
exports.createPlan = createPlan;
const createCustomer = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const stripe = createStripeObject();
    return stripe.customers.create({
        source: payload.stripeToken,
        name: payload.name,
        email: payload.email
    });
});
exports.createCustomer = createCustomer;
const createPaymentIntent = (amount, stripeCustomerId, currency, stripeToken) => __awaiter(void 0, void 0, void 0, function* () {
    const stripe = createStripeObject();
    const sourceResponse = yield stripe.customers.createSource(stripeCustomerId, { source: 'tok_visa' });
    const token = yield stripe.tokens.retrieve(stripeToken);
    return stripe.charges.create({
        amount: amount * 10,
        currency,
        source: token.id,
    });
});
exports.createPaymentIntent = createPaymentIntent;
const createSubscription = (stripeCustomerId, planId) => __awaiter(void 0, void 0, void 0, function* () {
    const stripe = createStripeObject();
    return stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [
            { plan: planId },
        ],
    });
});
exports.createSubscription = createSubscription;
// const createClientDataBase = async (body: any, dbName: string, secretdbkey: any, templateData: any, networkData: any, keyValue: any, paymentData: any) => {
const createClientDataBase = (body, dbName, secretdbkey, templateData, networkData, keyValue, paymentData, emailTempData) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        var MongoClient = require('mongodb').MongoClient;
        var url = process.env.MONGODB_URI || "mongodb://solo-node-user:wlnbciuy87dg32ebo329y@127.0.0.1:27017";
        MongoClient.connect(url, function (err, db) {
            return __awaiter(this, void 0, void 0, function* () {
                if (err) {
                    db.close();
                    reject(err.MongoError);
                }
                try {
                    var dbo = db.db(dbName);
                    var clientConstantDb = db.db('ico-client');
                    // adding collection
                    const userCollection = yield dbo.createCollection("users");
                    const hashed = yield (0, common_util_1.genHash)(body.password);
                    yield userCollection.insert({
                        email: body.email,
                        firstName: body.firstName,
                        lastName: body.lastName,
                        phoneNumber: body.phoneNumber,
                        userName: "admin",
                        password: hashed,
                        role: 1,
                        status: app_constants_1.USER_STATUS.APPROVED,
                        isDeleted: false,
                        isVerrified: false,
                        isBlocked: false,
                        kycVerrified: false,
                        databaseName: dbName,
                        admin_Domain: false,
                        lp_Domain: false,
                        temp_admin_domain: body.admindomain,
                        temp_lp_domain: body.webDomain,
                        otp: 0,
                        godClientId: body.saveResponse._id
                    });
                    const copyCollections = [
                        'homeabouts',
                        'homeintros',
                        'homefaqs',
                        'homeroadmaps',
                        'homeroadmapcontents',
                        'homesubscribes',
                        'hometeamcontents',
                        'hometeams',
                        'homeusecasechilds',
                        'homeusecases',
                        'homeusecasescontents',
                        'companydetails',
                        'files',
                        'smtps',
                        'generalsettings',
                        'tokenomics',
                        'blogs',
                        'teams',
                        'teamcontents',
                        'companypolicys'
                    ];
                    for (const item of copyCollections) {
                        const dataList = yield clientConstantDb.collection(item).find({}).toArray();
                        if (dataList.length) {
                            const collection = yield dbo.createCollection(item);
                            collection.insert(dataList);
                        }
                    }
                    if (templateData) {
                        let save = {
                            templateName: templateData.templateName,
                            templateImage: templateData.templateImage,
                            uniqueId: templateData.uniqueId,
                            templateSections: templateData.templateSections,
                        };
                        const templateCollection = yield dbo.createCollection("templates");
                        yield templateCollection.insert(save);
                    }
                    if (networkData) {
                        let save = {
                            networkName: networkData.networkName,
                            networkKey: networkData.networkKey,
                            networkImage: networkData.networkImage,
                            tagName: networkData.tagName,
                            chainId: networkData.chainId,
                            blockExplorerUrl: networkData.blockExplorerUrl,
                            rpcUrl: networkData.rpcUrl,
                            currency: networkData.currency,
                            category: networkData.category,
                        };
                        const networkCollection = yield dbo.createCollection("networks");
                        yield networkCollection.insert(save);
                    }
                    if (keyValue.length > 0) {
                        const packageSettingsCollection = yield dbo.createCollection("packagesettings");
                        yield packageSettingsCollection.insert(keyValue);
                    }
                    if (paymentData.length > 0) {
                        const paymentCollection = yield dbo.createCollection("payments");
                        yield paymentCollection.insert(paymentData);
                    }
                    if (emailTempData) {
                        const emailTemplateCollection = yield dbo.createCollection("emailtemplates");
                        yield emailTemplateCollection.insert(emailTempData);
                    }
                    yield axios_1.default.get(`${process.env.CLIENT_HOST}/api/user/createFolder`, {
                        params: { dbName },
                        headers: {
                            'Content-Type': 'application/json',
                            'secretdbkey': secretdbkey
                        }
                    });
                    db.close();
                    resolve({ message: "Database created!" });
                }
                catch (err) {
                    db.close();
                    reject(err);
                }
            });
        });
    });
});
exports.createClientDataBase = createClientDataBase;
const deleteClientDataBase = (dbName, secretdbkey) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const MongoClient = require('mongodb').MongoClient;
            const url = process.env.MONGODB_URI || "mongodb://solo-node-user:wlnbciuy87dg32ebo329y@127.0.0.1:27017";
            MongoClient.connect(url, function (err, db) {
                if (err)
                    throw err;
                var dbo = db.db(dbName);
                dbo.dropDatabase(function (err, delOK) {
                    if (err)
                        throw err;
                    if (delOK)
                        console.log("DataBase deleted");
                    db.close();
                });
            });
            yield axios_1.default.get(`${process.env.CLIENT_HOST}/api/user/deleteFolder`, {
                params: { dbName },
                headers: {
                    'Content-Type': 'application/json',
                    'secretdbkey': secretdbkey
                }
            });
            resolve({ message: "User Data Deleted!" });
        }
        catch (error) {
            reject(error);
        }
    }));
});
exports.deleteClientDataBase = deleteClientDataBase;

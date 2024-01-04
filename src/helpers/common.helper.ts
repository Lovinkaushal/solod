import Stripe from 'stripe';
import axios from 'axios';

import { USER_STATUS } from '../constants/app.constants';
import { genHash } from '../utils/common.util';
import { createFolder } from '../helpers/db.helpers';

const createStripeObject = () => {
    return new Stripe(process.env.STRIPE_SECRET_KEY || "", {
        apiVersion: '2020-08-27',
    });
};

export const createStripePlan = async (payload: any) => {
    const res = await createPlan(payload);
    return res;
}

const createPlan = async (payload: any) => {
    const stripe = createStripeObject();

    return stripe.plans.create({
        amount: parseFloat(payload.price) * 100,
        interval: payload.type.toLowerCase(),
        interval_count: payload.interval,
        product: {
            name: payload.name
        },
        currency: "USD"
    })
}

const createCustomer = async (payload: any) => {
    const stripe = createStripeObject();

    return stripe.customers.create({
        source: payload.stripeToken,
        name: payload.name,
        email: payload.email
    });
};


const createPaymentIntent = async (amount: number, stripeCustomerId: string, currency: string, stripeToken: any) => {
    const stripe = createStripeObject();

    const sourceResponse = await stripe.customers.createSource(
        stripeCustomerId,
        { source: 'tok_visa' }
    );
    const token = await stripe.tokens.retrieve(
        stripeToken
    );

    return stripe.charges.create({
        amount: amount * 10,
        currency,
        source: token.id,
    });
};


const createSubscription = async (stripeCustomerId: string, planId: string) => {
    const stripe = createStripeObject();

    return stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [
            { plan: planId },
        ],
    });
};

// const createClientDataBase = async (body: any, dbName: string, secretdbkey: any, templateData: any, networkData: any, keyValue: any, paymentData: any) => {
const createClientDataBase = async (body: any, dbName: string, secretdbkey: any, templateData: any, networkData: any, keyValue: any, paymentData: any, emailTempData: any) => {
    return new Promise((resolve, reject) => {

        var MongoClient = require('mongodb').MongoClient;
        var url = process.env.MONGODB_URI || "mongodb://solo-node-user:wlnbciuy87dg32ebo329y@127.0.0.1:27017";

        MongoClient.connect(url, async function (err: any, db: any) {

            if (err) {
                db.close();
                reject(err.MongoError);
            }
            try {
                var dbo = db.db(dbName);
                var clientConstantDb = db.db('ico-client');
                // adding collection
                const userCollection = await dbo.createCollection("users");
                const hashed = await genHash(body.password);

                await userCollection.insert({
                    email: body.email,
                    firstName: body.firstName,
                    lastName: body.lastName,
                    phoneNumber: body.phoneNumber,
                    userName: "admin",
                    password: hashed,
                    role: 1,
                    status: USER_STATUS.APPROVED,
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

                    const dataList = await clientConstantDb.collection(item).find({}).toArray();

                    if (dataList.length) {
                        const collection = await dbo.createCollection(item);
                        collection.insert(dataList);
                    }
                }

                if (templateData) {
                    let save = {
                        templateName: templateData.templateName,
                        templateImage: templateData.templateImage,
                        uniqueId: templateData.uniqueId,
                        templateSections: templateData.templateSections,
                    }
                    const templateCollection = await dbo.createCollection("templates");
                    await templateCollection.insert(save);
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
                    }
                    const networkCollection = await dbo.createCollection("networks");
                    await networkCollection.insert(save);
                }
                if (keyValue.length > 0) {
                    const packageSettingsCollection = await dbo.createCollection("packagesettings");
                    await packageSettingsCollection.insert(keyValue);
                }

                if (paymentData.length>0) {
                    const paymentCollection = await dbo.createCollection("payments");
                    await paymentCollection.insert(paymentData);

                }

                if (emailTempData) {
                    const emailTemplateCollection = await dbo.createCollection("emailtemplates");
                    await emailTemplateCollection.insert(emailTempData);
                }

                await axios.get(`${process.env.CLIENT_HOST}/api/user/createFolder`, {
                    params: { dbName },
                    headers: {
                        'Content-Type': 'application/json',
                        'secretdbkey': secretdbkey
                    }
                })
                db.close();
                resolve({ message: "Database created!" });
            } catch (err) {
                db.close();
                reject(err);
            }
        });
    })
}

const deleteClientDataBase = async (dbName: string, secretdbkey: string) => {
    return new Promise(async (resolve, reject) => {
        try {
            const MongoClient = require('mongodb').MongoClient;
            const url = process.env.MONGODB_URI || "mongodb://solo-node-user:wlnbciuy87dg32ebo329y@127.0.0.1:27017";
            MongoClient.connect(url, function (err: any, db: any) {
                if (err) throw err;
                var dbo = db.db(dbName);
                dbo.dropDatabase(function (err: any, delOK: any) {
                    if (err) throw err;
                    if (delOK) console.log("DataBase deleted");
                    db.close();
                });
            });
            await axios.get(`${process.env.CLIENT_HOST}/api/user/deleteFolder`, {
                params: { dbName },
                headers: {
                    'Content-Type': 'application/json',
                    'secretdbkey': secretdbkey
                }
            })
            resolve({ message: "User Data Deleted!" });
        } catch (error) {
            reject(error);
        }
    })
}

export {
    createPlan,
    createCustomer,
    createPaymentIntent,
    createSubscription,
    createClientDataBase,
    deleteClientDataBase
};
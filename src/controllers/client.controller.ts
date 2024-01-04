// @ts-ignore
import { Route, Controller, Tags, Post, Body, Security, Query, UploadedFile, Get, Put, FormField, Path } from 'tsoa'
import handlebar, { log } from 'handlebars';
import path from 'path';
import { Request, Response, response } from 'express';
import { IResponse } from '../utils/interfaces.util';
import { findOne, getById, upsert, getAll, findAll, getAlls, getAggregation } from '../helpers/db.helpers';
import { genHash, encrypt, camelize, verifyHash, signToken, getTokenBalance } from '../utils/common.util';
import clientModel from '../models/client.model';
import otpModel from '../models/otp.model';
import logger from '../configs/logger.config';
import { sendEmail } from '../configs/nodemailer';
import { readHTMLFile, getCSVFromJSON, generateRandomOtp } from '../services/utils';
import mongoose from 'mongoose';
import moment from 'moment'
import { validateClient, validateClientData, validateClientResetPassword, validateForgotPasswordClient, validateLeaseProperty, validateRedTokenRequest, validateUpdateData, validateAddAc, validateClientPassword, validateClientBurnRedTokens, validateClientBurnSrTokens } from '../validations/client.validator';
import propertyDetailsModel from '../models/propertyDetailsModel';
import leasePropertyModel from '../models/leasePropertyDetail.Model';
import redTokenTransactionModel from '../models/redTokenTransaction.model';
import dummyModel from '../models/dummy.model';
import adminModel from '../models/admin.model';
import tokenModel from '../models/token.model';
import agreementModel from '../models/agreement.model';
import nftDetailModel from '../models/nftDetail.model';
import UploadedFileToAWS from '../utils/aws.s3.utils';
import fredNftModel from '../models/fredNft.model';
import { classicNameResolver } from 'typescript';
import superFredModel from '../models/superFred.model';
import tvtModel from '../models/tvt.model';
import { String } from 'aws-sdk/clients/batch';
import burnRedTokenModel from '../models/burnRedToken.model';
import burnSrToken from '../models/burnSrToken.model';
import burnSrTokenModel from '../models/burnSrToken.model';
import { ethers, ContractFactory } from 'ethers';
const redContratAbi = require("../Abi/red.json")
const srContratAbi = require("../Abi/SR.json")
const tvtContratAbi = require("../Abi/tvtNft.json")
//import { sendNotificationToAdmin } from '../configs/notification.config';
@Tags('Client')
@Route('api/client')
export default class ClientController extends Controller {
    req: Request;
    res: Response;
    userId: string
    constructor(req: Request, res: Response) {
        super();
        this.req = req;
        this.res = res;
        this.userId = req.body.user ? req.body.user.id : ''
    }
    /**
    * Register a client
    */
    @Post("/register")
    public async register(@Body() request: { name: string, email: string, userName: string, contact: string, countryCode: string, password: string, confirmPassword: string, referralCode: string, isKYCConfirmed?: string, device_type: string, device_token: string }): Promise<IResponse> {
        try {

            const { name, email, userName, contact, countryCode, password, confirmPassword, referralCode, isKYCConfirmed, device_type, device_token } = request;
            const userNameUpperCase = userName.toUpperCase();
            const validatedProfile = validateClientData({ name, email, userName: userNameUpperCase, countryCode, contact, password, confirmPassword, referralCode, isKYCConfirmed });
            if (validatedProfile.error) {
                throw new Error(validatedProfile.error.message)
            }
            const userEmail = await findOne(clientModel, { email });
            if (userEmail) {
                throw new Error(`Email ${email} is already exists`)
            }
            const userNumber = await findOne(clientModel, { contact });
            if (userNumber) {
                throw new Error(`Number ${contact} is already exists`)
            }
            const userNames = await findOne(clientModel, { userName });
            if (userNames) {
                throw new Error(`UserName ${userName} is already exists`)
            }
            if (password !== confirmPassword) {
                throw new Error(`Passwords do not match!`);
            }

            function generateRandomCode(length: any) {
                const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                let code = '';

                for (let i = 0; i < length; i++) {
                    const randomIndex = Math.floor(Math.random() * characters.length);
                    code += characters.charAt(randomIndex);
                }
                return code;
            }
            // Example: Generate a random referral code of length 6
            const myReferralCode = generateRandomCode(6);
            console.log(myReferralCode);

            if (!referralCode) {
                let hashed = await genHash(password);
                const otp = generateRandomOtp()
                //send a mail with otp 
                const html = await readHTMLFile(path.join(__dirname, '../', '../', 'src', 'template', 'otp_email.html'))
                const template = handlebar.compile(html)
                const [otp1, otp2, otp3, otp4] = otp.split('');
                const tempData = template({ otp1, otp2, otp3, otp4, email: email, firstName: name })
                await sendEmail(process.env.EMAIL_NOTIFICATION_ADDRESS, 'OTP for Reset Password', email, tempData)
                const saveResponse = await upsert(dummyModel, { name, email, userName: userNameUpperCase, countryCode, contact, password: hashed, referralCode, myReferralCode: myReferralCode, otp, status: "PENDING", isKYCConfirmed, device_type, device_token })
                delete saveResponse.password
                delete saveResponse.otp

                return {
                    data: { ...saveResponse.toObject() },
                    error: '',
                    message: 'OTP send successfully',
                    status: 200
                }
            }
            else {
                const res = await findAll(clientModel, {});
                const clientReferralCodes = res.map((item) => item.myReferralCode);

                const enteredReferralCode = referralCode;
                let isReferralCodeMatch = false;

                for (let i = 0; i < clientReferralCodes.length; i++) {
                    if (clientReferralCodes[i] === enteredReferralCode) {
                        isReferralCodeMatch = true;
                        break;
                    }
                }

                if (isReferralCodeMatch) {
                    console.log("refferal code matched ");
                    let hashed = await genHash(password);
                    const otp = generateRandomOtp()
                    //send a mail with otp 
                    const html = await readHTMLFile(path.join(__dirname, '../', '../', 'src', 'template', 'otp_email.html'))
                    const template = handlebar.compile(html)
                    const [otp1, otp2, otp3, otp4] = otp.split('');
                    const tempData = template({ otp1, otp2, otp3, otp4, email: email, firstName: name })
                    await sendEmail(process.env.EMAIL_NOTIFICATION_ADDRESS, 'OTP for Reset Password', email, tempData)
                    const saveResponse = await upsert(dummyModel, { name, email, userName: userNameUpperCase, countryCode, contact, password: hashed, referralCode, myReferralCode: myReferralCode, otp, status: "PENDING", isKYCConfirmed, device_type, device_token })
                    delete saveResponse.password
                    delete saveResponse.otp

                    async function findUserByReferralCode(referralCode: string) {
                        return findOne(clientModel, { myReferralCode: referralCode });
                    }

                    const referringUser = await findUserByReferralCode(referralCode);
                    const referringUserName = referringUser.userName;

                    return {
                        data: { ...saveResponse.toObject(), refferedByUserName: referringUserName },
                        error: '',
                        message: 'OTP send successfully',
                        status: 200
                    }

                } else {
                    return {
                        data: {},
                        error: 'Refferal code doesnot matched',
                        message: 'Refferal code doesnot matched',
                        status: 400
                    }
                }
            }
        }
        catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`)
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            }
        }
    }
    /**
     * Verify Otp during registration
     */
    @Post("/verifyotp")
    public async verifyotp(@Body() request: { otp: string, email: string }): Promise<IResponse> {
        try {
            const { otp, email } = request;
            const exists = await dummyModel.findOne({ email: email }).sort({ createdAt: -1 }).limit(1);
            if (exists.otp != otp) {
                throw new Error("OTP does not match");
            }
            const referralCode = exists.referralCode
            let referringUserName;
            if (referralCode) {
                async function findUserByReferralCode(referralCode: string) {
                    return findOne(clientModel, { myReferralCode: referralCode });
                }

                const referringUser = await findUserByReferralCode(referralCode);
                referringUserName = referringUser.userName;
            }
            var data = await upsert(clientModel, {
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
                device_token: exists.device_token,
                myReferralCode: exists.myReferralCode,
                referralUserName: referringUserName
            });
            delete data.password
            const token = await signToken(data._id, { access: 'client', purpose: 'reset' })
            return {
                data: { ...data.toObject(), token },
                error: "",
                message: "OTP verify Successfully",
                status: 200,
            };
        } catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`);
            return {
                data: null,
                error: err.message ? err.message : err,
                message: "",
                status: 400,
            };
        }
    }
    /**
     * Verify KYC
     */
    @Security("Bearer")
    @Post("/verifyKyc")
    public async verifyKyc(@Body() request: { kycCode: string }): Promise<IResponse> {
        try {
            const { kycCode } = request;
            let exists = await upsert(clientModel, { isKYCConfirmed: kycCode }, this.userId);
            return {
                data: { ...exists.toObject() },
                error: "",
                message: "Kyc completed successfully",
                status: 200,
            };
        } catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`);
            return {
                data: null,
                error: err.message ? err.message : err,
                message: "",
                status: 400,
            };
        }
    }
    /**
    * Get user login
    */
    @Post("/login")
    public async login(@Body() request: { email: string, password: string, device_type: string, device_token: string }): Promise<IResponse> {
        try {
            const { email, password, device_type, device_token } = request;
            const validatedUser = validateClient({ email, password });
            if (validatedUser.error) {
                throw new Error(validatedUser.error.message)
            }
            const exists = await findOne(clientModel, { email });
            if (!exists) {
                throw new Error('User doesn\'t exists!');
            }
            // check if blocked
            if (exists.isBlocked) {
                throw new Error('User is blocked');
            }
            const isValid = await verifyHash(password, exists.password);
            if (!isValid) {
                throw new Error('Password seems to be incorrect');
            }
            let response = await upsert(clientModel, { device_type: device_type, device_token: device_token }, exists._id);
            const token = await signToken(exists._id, { access: 'client', purpose: 'reset' })
            delete exists.password
            return {
                data: { ...response?.toObject(), token },
                error: '',
                message: 'Login successfully',
                status: 200
            }
        }
        catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`)
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            }
        }
    }
    /**
* Get user payload verified
*/
    @Post("/verify-payload")
    public async verifyPayload(@Body() request: { payload: string }): Promise<{
        userId?: string,
        email?: string,
        exp?: any,
        status: number,
        message?: string
    }> {
        try {
            const { payload } = request;
            if (!payload) {
                throw new Error("Invalid credentials");
            }

            const { userId } = JSON.parse(payload);
            const exist = await clientModel.findById(userId);
            if (!exist) {
                throw new Error('User doesn\'t exists!');
            }
            // check if blocked
            if (exist.isBlocked) {
                throw new Error('User is blocked');
            }
            return {
                userId: `${exist?._id}`,
                email: exist?.email,
                exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
                status: 200
            }
        }
        catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`)
            return {
                message: err.message ? err.message : err,
                status: 401
            }
        }
    }

    /**
    * Forgot password api endpoint
    */
    @Post("/forgotPassword")
    public async forgotPassword(@Body() request: { email: string }): Promise<IResponse> {
        try {

            const { email } = request;
            // Convert email to lowercase
            const lowerCaseEmail = email.toLowerCase();
            const validatedForgotPassword = validateForgotPasswordClient({ email: lowerCaseEmail });
            if (validatedForgotPassword.error) {
                throw new Error(validatedForgotPassword.error.message);
            }
            // Check if the user exists using the lowercase email
            const exists = await findOne(clientModel, { email: lowerCaseEmail });
            if (!exists) {
                throw new Error('Invalid Email');
            }
            const otp = generateRandomOtp();
            const existOtp = await findOne(otpModel, { email: exists.email });
            if (existOtp) {
                await upsert(otpModel, { otp, email: exists.email }, existOtp._id);
            } else {
                await upsert(otpModel, { otp, email: exists.email });
            }
            // Send a mail with otp 
            const html = await readHTMLFile(path.join(__dirname, '../', '../', 'src', 'template', 'otp_email.html'));
            const template = handlebar.compile(html);
            const [otp1, otp2, otp3, otp4] = otp.split('');
            const tempData = template({ otp1, otp2, otp3, otp4, email: exists.email, firstName: exists.name });
            await sendEmail(process.env.EMAIL_NOTIFICATION_ADDRESS, 'OTP for Reset Password', exists.email, tempData);
            return {
                data: {},
                error: '',
                message: 'Password reset OTP successfully sent to ' + exists.email,
                status: 200
            };
        } catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`);
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            };
        }
    }
    /**
    * Verify otp for user
    */
    @Put("/verifyOtp")
    public async verifyOtp(@Body() request: { email: string, otp: string }): Promise<IResponse> {
        try {
            const { email, otp } = request;
            const lowerCaseEmail = email.toLowerCase();
            // Check User Found or Not
            const existsOtp = await findOne(otpModel, { email: lowerCaseEmail })
            if (!existsOtp) {
                throw new Error('OTP not generated!!')
            }
            // check Otp
            if (otp != existsOtp.otp) {
                throw new Error('Wrong OTP Entered, please check your OTP!!')
            }
            else {
                await upsert(otpModel, { isActive: true }, existsOtp._id)
            }
            const exists = await findOne(clientModel, { email: lowerCaseEmail });
            const token = await signToken(exists._id, { access: 'client', purpose: 'reset' })
            return {
                data: { token },
                error: '',
                message: 'Otp verify successfully!!',
                status: 200
            }
        }
        catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`)
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            }
        }
    }
    /**
    * Forgot password api endpoint
    */
    @Security('Bearer')
    @Post("/resetPassword")
    public async resetPassword(@Body() request: { new_password: string }): Promise<IResponse> {
        try {
            const { new_password } = request;
            const validatedResetPassword = validateClientResetPassword({ new_password });
            if (validatedResetPassword.error) {
                throw new Error(validatedResetPassword.error.message)
            }
            const hashed = await genHash(new_password)
            const updated = await upsert(clientModel, { password: hashed }, this.userId)
            return {
                data: {},
                error: '',
                message: 'Password reset successfully!',
                status: 200
            }
        }
        catch (err: any) {
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            }
        }
    }
    /**
    * Get user info
    */
    @Security('Bearer')
    @Get("/me")
    public async me(): Promise<IResponse> {
        try {
            //   check for a valid id
            const getResponse = await getById(clientModel, this.userId);
            return {
                data: getResponse || {},
                error: '',
                message: 'Client info fetched Successfully',
                status: 200
            }
        }
        catch (err: any) {
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            }
        }
    }
    /**
     * update the user profile
     */
    @Security('Bearer')
    @Put('/updateProfile')
    public async updateProfile(
        @FormField() name?: string,
        @FormField() email?: string,
        @FormField() userName?: string,
        @FormField() contact?: string,
        @FormField() referralCode?: string,
        @FormField() walletAddress?: string,
        @FormField() countryCode?: string,
        @FormField() bridgeId?: string,
        @FormField() bridgeCustomerId?: string,
        @UploadedFile('profileImage') file?: Express.Multer.File
    ): Promise<IResponse> {
        try {
            const validatedProfile = validateUpdateData({ name, email, userName, contact, referralCode, walletAddress });
            if (validatedProfile.error) {
                throw new Error(validatedProfile.error.message);
            }
            const userData = await getById(clientModel, this.userId);
            if (!userData) {
                throw new Error(`User does not exist`);
            }
            const userNameUpperCase = userName ? userName.toUpperCase() : userName;
            let payload: { [k: string]: any } = {};
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
            if (walletAddress) {
                payload.walletAddress = walletAddress;
            }
            if (referralCode) {
                payload.referralCode = referralCode;
            }
            if (countryCode) {
                payload.countryCode = countryCode;
            }
            if (bridgeId) {
                payload.bridgeId = bridgeId;
            }
            if (bridgeCustomerId) {
                payload.bridgeCustomerId = bridgeCustomerId;
            }
            let propertyDocument;
            if (file) {
                propertyDocument = await UploadedFileToAWS(file?.originalname, file?.buffer, file?.mimetype.includes('image/png') ? "image/png" : "image/jpeg")
            }
            if (file) {
                payload.profileImage = propertyDocument;
            }
            let saveResponse = await upsert(clientModel, payload, userData._id);
            return {
                data: { ...saveResponse.toObject() },
                error: '',
                message: 'Update profile successfully',
                status: 200,
            };
        } catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`);
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400,
            };
        }
    }

    /**
    * Request for lease
    */
    @Security('Bearer')
    @Post("/leaseRequest")
    public async leaseRequest(@FormField() propertyName?: string, @FormField() propertyDescription?: string, @FormField() addressLine1?: string, @FormField() addressLine2?: string, @FormField() state?: string, @FormField() country?: string, @FormField() pincode?: string, @UploadedFile('propertyDocument') file?: Express.Multer.File): Promise<IResponse> {
        try {
            const ValidateLeaseProperty = validateLeaseProperty({ propertyName, propertyDescription, addressLine1, addressLine2, state, country, pincode });
            if (ValidateLeaseProperty.error) {
                throw new Error(ValidateLeaseProperty.error.message)
            }
            // check if client exists
            const propertyData = await findOne(leasePropertyModel, { propertyName });
            if (propertyData) {
                throw new Error(`Name ${propertyName} is already exists`)
            }
            let propertyDocument;
            if (file) {
                propertyDocument = await UploadedFileToAWS(file?.originalname, file?.buffer, file?.mimetype.includes('application/pdf') ? "application/pdf" : "application/pdf")
            }
            let saveResponse = await upsert(leasePropertyModel, { userId: this.userId, propertyName, propertyDescription, addressLine1, addressLine2, state, country, pincode, propertyDocument })
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
                data: { ...saveResponse.toObject() },
                error: '',
                message: 'User registered successfully',
                status: 200
            }
        }
        catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`)
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            }
        }
    }
    /**
 * Get User lease property request data
 */
    @Security('Bearer')
    @Get("/leasePropertyRequestData")
    public async leasePropertyRequestData(@Query('pageNumber') pageNumber: number, @Query('pageSize') pageSize: number): Promise<IResponse> {
        try {
            const totalCount = await leasePropertyModel.countDocuments({});
            const data = await leasePropertyModel.aggregate(
                [
                    {
                        $match: {
                            userId: mongoose.Types.ObjectId(this.userId)
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
                ]
            );
            return {
                data: { data, totalCount },
                error: '',
                message: 'Lease Property Request Data Fetached successfully!',
                status: 200
            };
        } catch (error) {
            return {
                data: null,
                error: 'Error occurred',
                message: 'Failed to Search',
                status: 404
            };
        }
    }
    /**
   * Get agreement Data
   */
    @Security('Bearer')
    @Get("/getAgreementData")
    public async getAgreementData(
        @Query('pageNumber') pageNumber: number,
        @Query('pageSize') pageSize: number): Promise<IResponse> {
        try {
            // const agreementId = this.userId;
            const agreementDetails = await agreementModel.aggregate([
                {
                    $match: { userId: mongoose.Types.ObjectId(this.userId) },
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
            }
        }
        catch (err: any) {
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            }
        }
    }
    /**
    * Buy Red Token
    */
    @Security('Bearer')
    @Get("/buyRedToken")
    public async buyRedToken(): Promise<IResponse> {
        try {
            const adminData = await findOne(adminModel, {});
            const conversionrate = adminData.conversionRate
            const sellPercentage = adminData.sellPercentage
            const adminWalletAddress = adminData.walletAddress
            const privatekey = adminData.privatekey
            const receivewalletaddress = adminData.receivewalletaddress
            const conversionRateForLoan = adminData.conversionRateForLoan
            return {
                data: { privatekey, receivewalletaddress, conversionrate, adminWalletAddress, sellPercentage, conversionRateForLoan },
                error: '',
                message: 'Admin wallet address fetch successfully!',
                status: 200
            };
        } catch (err: any) {
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            };
        }
    }
    /**
    *Get Booq conversion rate api
    */
    @Security('Bearer')
    @Get("/getBooqConversionRate")
    public async getBooqConversionRate(): Promise<IResponse> {
        try {
            const adminData = await findOne(adminModel, {});
            const conversionrate = adminData.conversionRateForLoan
            return {
                data: { conversionrate },
                error: '',
                message: 'Booq conversion rate fetch successfully!',
                status: 200
            };
        } catch (err: any) {
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            };
        }
    }
    /**
   * Request for Buying Red Token
   */
    @Security('Bearer')
    @Post("/requestRedToken")
    public async requestRedToken(@Body() request: { totalRedToken: string, hashId: string, usdc: string, transactionType: string, accountType: string, walletAddress: string }): Promise<IResponse> {
        try {
            const { totalRedToken, hashId, usdc, transactionType, accountType, walletAddress } = request;
            const validateRedToken = validateRedTokenRequest({ totalRedToken, hashId, usdc, transactionType, accountType });
            if (validateRedToken.error) {
                throw new Error(validateRedToken.error.message)
            }
            // check if client exists
            const propertyData = await findOne(redTokenTransactionModel, { hashId });
            if (propertyData) {
                throw new Error(`Name ${hashId} is already exists`)
            }
            const clientData = await findOne(clientModel, { _id: this.userId });
            let saveResponse = await upsert(redTokenTransactionModel, { senderId: clientData._id, senderUserName: clientData.userName, totalRedToken, hashId, usdc, transactionType, accountType, walletAddress })
            return {
                data: { ...saveResponse.toObject() },
                error: '',
                message: 'Red token request send successfully',
                status: 200
            }
        }
        catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`)
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            }
        }
    }
    /**
  * Request for Buying Red Token
  */
    @Security('Bearer')
    @Get("/redTokenTransactionsDetails")
    public async redTokenTransactionsDetails(
        @Query('pageNumber') pageNumber: number,
        @Query('pageSize') pageSize: number,
        @Query('transactionType') transactionType?: string

    ): Promise<IResponse> {
        try {
            let transactionTypeFilter: (string | null)[] = ['Solos Reward', null];

            if (transactionType === 'buy') {
                transactionTypeFilter.push('Sell RED');
            } else if (transactionType === 'sell') {
                transactionTypeFilter.push('Buy RED');
            }
            const query = {
                $or: [
                    { senderId: this.userId },
                    { receiverId: this.userId }
                ],
                transactionType: {
                    $nin: transactionTypeFilter
                }
            };

            const sendData = await getAll(redTokenTransactionModel, query, +pageNumber, +pageSize);

            const items = sendData.items.map(item => {
                if (item.transactionType !== "Buy RED" && item.transactionType !== "Sell RED") {
                    const transactionType = item.receiverId.toString() === this.userId.toString() ? 'Receive RED' : 'Send RED';
                    return {
                        ...item,
                        transactionType
                    };
                }
                return {
                    ...item,
                };
            });
            return {
                data: { items, pageNumber: sendData.pageNumber, pageSize: sendData.pageSize, totalItems: sendData.totalItems },
                error: '',
                message: 'Transactions details fetched Successfully',
                status: 200
            };
        } catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`);
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            };
        }
    }
    /**
 * Request for sell red token
 */
    @Security('Bearer')
    @Get("/usdcTransactionsDetails")
    public async usdcTransactionsDetails(
        @Query('pageNumber') pageNumber: number,
        @Query('pageSize') pageSize: number,
    ): Promise<IResponse> {
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
                            $nin: ['Solos Reward', null, 'Red Token', 'Buy RED']
                        }
                    }
                },
                {
                    $project: {
                        status: 1,
                        senderId: 1,
                        totalRedToken: 1,
                        hashId: 1,
                        hashId2: 1,
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

            const getRedTokenData = await getAggregation(redTokenTransactionModel, aggregate, +pageNumber, +pageSize);

            return {
                data: getRedTokenData,
                error: '',
                message: 'Transactions details fetched Successfully',
                status: 200
            };
        } catch (err: any) {
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            };
        }
    }

    /**
     * Request for usdc
     */
    @Security('Bearer')
    @Post("/sellRed")
    public async sellRed(@Body() request: { totalRedToken: string, hashId: string, usdc: string, transactionType: string, accountType: string, walletAddress: string, hashId2: string, }): Promise<IResponse> {
        try {
            const { totalRedToken, hashId, usdc, transactionType, accountType, walletAddress, hashId2 } = request;
            const validateRedToken = validateRedTokenRequest({ totalRedToken, hashId, usdc, transactionType, accountType });
            if (validateRedToken.error) {
                throw new Error(validateRedToken.error.message)
            }
            const clientData = await findOne(clientModel, { _id: this.userId });
            console.log(clientData)
            let saveResponse = await upsert(redTokenTransactionModel, { senderId: clientData._id, senderUsername: clientData.userName, totalRedToken, hashId, usdc, transactionType, accountType, walletAddress, hashId2 })
            return {
                data: { ...saveResponse.toObject() },
                error: '',
                message: 'Red Sell Successfully',
                status: 200
            }
        }
        catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`)
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            }
        }
    }

    /**
        * Get Wallet Data
        */
    @Security('Bearer')
    @Get("/walletData")
    public async walletData(@Query('accountType') accountType: string): Promise<IResponse> {
        try {
            const response = await findOne(clientModel, { _id: this.userId });
            let redToken: number;
            if (accountType == 'Primary') {
                redToken = +response.redToken;
            } else {
                redToken = +response.businessRedToken;
            }
            let soloReward: number;
            if (accountType == 'Primary') {
                soloReward = +response.solosReward;
            } else {
                soloReward = +response.businessSoloReward;
            }
            const adminData = await findOne(adminModel, {});
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
        } catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`);
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            };
        }
    }
    /**
    * Get Booking Amount
    */
    @Security('Bearer')
    @Get("/getBookingAmount")
    public async getBookingAmount(@Query('totalPropertyValue') totalPropertyValue: string): Promise<IResponse> {
        try {
            const adminData = await findOne(adminModel, {});
            const bookingPercentage = +adminData.bookingPercentage;
            const bookingPercentage2 = bookingPercentage / 100;
            const bookingAmount = +totalPropertyValue * +bookingPercentage2;
            return {
                data: { bookingAmount },
                error: '',
                message: 'Booking Amount Fetched Successfully',
                status: 200
            };
        } catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`);
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            };
        }
    }
    /**
     * Switch Account Api
     */
    @Security('Bearer')
    @Get("/switchAccount")
    public async switchAccount(@Query('accountType') accountType: string): Promise<IResponse> {
        try {
            const user = await findOne(clientModel, { _id: this.userId });
            if (!user) {
                return {
                    data: null,
                    error: 'User not found',
                    message: '',
                    status: 404
                };
            }
            let responseFields: { [key: string]: any } = {};
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
            } else if (accountType == 'business') {
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
        } catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`);
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 404
            };
        }
    }
    /**
    * Get User Possesion Data 
    */
    @Security('Bearer')
    @Get("/possesionListing")
    public async possesionListing(@Query('pageNumber') pageNumber: number, @Query('pageSize') pageSize: number): Promise<IResponse> {
        try {
            const totalCount = await agreementModel.countDocuments({
                userId: mongoose.Types.ObjectId(this.userId),
                status: { $in: ['APPROVED', 'DECLINED'] }
            });
            const data = await agreementModel.aggregate(
                [
                    {
                        $match: {
                            userId: mongoose.Types.ObjectId(this.userId),
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
                ]
            );

            return {
                data: { data, totalCount },
                error: '',
                message: 'Possession Data Listed Successfully',
                status: 200
            };
        } catch (error) {
            return {
                data: null,
                error: 'Error occurred',
                message: 'Failed to Search',
                status: 404
            };
        }
    }
    /**
  * Get agreement Data
  */
    @Security('Bearer')
    @Get("/possesionPropertyYouWant")
    public async possesionPropertyYouWant(
        @Query('propertyId') propertyId: string,
        @Query('pageNumber') pageNumber: number,
        @Query('pageSize') pageSize: number): Promise<IResponse> {
        try {
            // const agreementId = this.userId;
            const agreementDetails = await agreementModel.aggregate([
                {
                    $match: {
                        propertyId: mongoose.Types.ObjectId(propertyId),
                        userId: mongoose.Types.ObjectId(this.userId)

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
            }
        }
        catch (err: any) {
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            }
        }
    }
    /**
  * GET Property and Agreement Details
  */
    @Security('Bearer')
    @Get("/leasePropertyYouWant")
    public async leasePropertyYouWant(
        @Query('propertyId') propertyId: string
    ): Promise<IResponse> {
        try {
            const data = await propertyDetailsModel.aggregate([
                {
                    $match: {
                        _id: mongoose.Types.ObjectId(propertyId)
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
                data: data[0], // Assuming you expect a single property with its agreement details
                error: '',
                message: 'Property Details fetched Successfully',
                status: 200
            };
        } catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`);
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            };
        }
    }

    /**
    * Add Account
    */
    @Security('Bearer')
    @Post("/addAccount")
    public async addAccount(@Body() request: { accountType: string, businessEmail: string, businessUserName: string, businessContact: string, businessCountryCode: string }): Promise<IResponse> {
        try {
            const { accountType, businessEmail, businessUserName, businessContact, businessCountryCode } = request;
            const _id = this.userId;
            const validatedUser = validateAddAc({ accountType, businessEmail, businessUserName, businessContact, businessCountryCode });
            if (validatedUser.error) {
                throw new Error(validatedUser.error.message)
            }
            const account = await clientModel.findById(_id);
            if (!account) {
                throw new Error("Account Not Found");
            }
            if (account && account.isSecondaryAccountActive) {
                throw new Error("You Can't Add Third Account");
            }
            //check for already existing email for other user
            const checkEmail = await findOne(clientModel, {
                $or: [{ email: businessEmail }, { businessEmail: businessEmail }]
            });
            if (checkEmail && checkEmail._id.toString() !== _id.toString()) {
                throw new Error(`Email ${businessEmail} already exists`)
            }
            //check for already existing number for other user
            const checkContact = await findOne(clientModel, {
                $or: [{ contact: businessContact }, { businessContact: businessContact }]
            });
            if (checkContact && checkContact._id.toString() !== _id.toString()) {
                throw new Error(`Contact ${businessContact} already exists`)
            }
            //check for already existing username for other user
            const checkUserName = await findOne(clientModel, {
                $or: [{ userName: businessUserName }, { businessUserName: businessUserName }]
            });
            if (checkUserName && checkUserName._id.toString() !== _id.toString()) {
                throw new Error(`Username ${businessUserName} already exists`)
            }
            let saveResponse = await upsert(clientModel, { accountType, businessEmail, businessUserName, businessContact, businessCountryCode, isSecondaryAccountActive: true }, _id)
            return {
                data: { ...saveResponse.toObject() },
                error: '',
                message: 'Add Account successfully',
                status: 200
            }
        }
        catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`)
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            }
        }
    }
    /**
    * post contacts
    */
    @Security('Bearer')
    @Post('/postContacts')
    public async postContacts(@Body() request: {
        contacts: Array<string>,
        searchUsername?: string,
        pageNumber: number,
        pageSize: number
    }): Promise<IResponse> {
        try {
            const { contacts, searchUsername, pageNumber, pageSize } = request;
            const data = await clientModel.findOne({ _id: this.userId });
            const userContact = data.contact

            const contactsWithoutUserContact = contacts.filter(item => item !== userContact);
            const postData = contactsWithoutUserContact.map(item => item.replace(/[^0-9+]/g, ""))
            let payload: any = {}
            if (searchUsername) {
                payload.userName = { $regex: searchUsername, $options: "i" }
            }
            if (postData) {
                payload.contact = { $in: postData }
            }

            const responseData = await clientModel.aggregate([
                {
                    $match: payload
                },
                {
                    $skip: pageSize * (pageNumber - 1)
                },
                {
                    $limit: pageSize
                },
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        profileImage: 1,
                        walletAddress: 1,
                        contact: 1,
                        userName: 1,
                        countryCode: 1
                    }
                }
            ])

            const filteredArray = responseData.filter(obj => postData.includes(obj.contact) || postData.includes(obj.countryCode + obj.contact) || postData.includes("+" + obj.countryCode + obj.contact));
            console.log(filteredArray);


            return {
                data: { filteredArray },
                error: '',
                message: 'Contacts Received',
                status: 200
            };
        } catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`);
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            };
        }
    }
    /**
  * Search user is exist or not 
  */
    @Security('Bearer')
    @Put("/SearchUser")
    public async SearchUser(@Body() request: { userName: string }): Promise<IResponse> {
        try {
            const { userName } = request;
            const upperCaseUserName = userName.toLocaleUpperCase();
            // Check User Found or Not
            const existsUser = await findOne(clientModel, { userName: upperCaseUserName })
            if (!existsUser) {
                throw new Error('User not exist!!')
            }
            return {
                data: { existsUser },
                error: '',
                message: 'User exist!!',
                status: 200
            }
        }
        catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`)
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            }
        }
    }
    /**
    * Red token send to user in the app
    */
    @Security('Bearer')
    @Post("/sendRedToken")
    public async sendRedToken(@Body() request: { userName: string, redToken: string, accountType: string }): Promise<IResponse> {
        try {
            const { userName, redToken, accountType } = request;
            const senderData = await getById(clientModel, this.userId);
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
            const receiverData = await clientModel.findOne({
                $or: [{ userName: upperCaseUserName }, { businessUserName: upperCaseUserName }]
            });
            if (!receiverData) {
                throw new Error('Receiver user doesn\'t exist!');
            }
            const receiverField = (receiverData.userName === upperCaseUserName) ? 'redToken' : 'businessRedToken';
            const senderUpdatedRedToken = userRedToken - requestRedTokenValue;
            const receiverUpdatedRedToken = parseFloat(receiverData[receiverField]) + requestRedTokenValue;
            const saveResponse1 = await upsert(clientModel, { [clientField]: senderUpdatedRedToken }, this.userId);
            const saveResponse2 = await upsert(clientModel, { [receiverField]: receiverUpdatedRedToken }, receiverData._id);
            // Save transaction details
            const sender = await findOne(clientModel, { _id: this.userId });
            const transactionResponse = await upsert(redTokenTransactionModel, {
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
        } catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`);
            return {
                data: null,
                error: err.message ? err.message : 'An error occurred',
                message: '',
                status: 400
            };
        }
    }

    /**
    Logout 
    */
    @Security("Bearer")
    @Get("/logout")
    public async logout(): Promise<IResponse> {
        try {
            const authHeader = this.req.headers.authorization;
            await upsert(tokenModel, { token: authHeader });
            return {
                data: {},
                error: '',
                message: 'Logged Out Successfully',
                status: 200
            }
        }
        catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`)
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            }
        }
    }
    /**
    * Send email otp for Mpin 
    */
    @Security('Bearer')
    @Post('/sendMpinOtp')
    public async sendMpinOtp(@Body() request: { emailOtp: boolean }): Promise<IResponse> {
        try {
            const _id = this.userId;
            const exists = await findOne(clientModel, { _id });
            if (!exists) {
                throw new Error('User not found !')
            }
            const { emailOtp } = request;
            if (emailOtp) {
                const mpinEmailOtp = generateRandomOtp()
                const existOtp = await findOne(otpModel, { email: exists.email })
                if (existOtp) {
                    await upsert(otpModel, { mpinEmailOtp, email: exists.email }, existOtp._id)
                } else {
                    await upsert(otpModel, { mpinEmailOtp, email: exists.email })
                }
                //send a mail with otp 
                const html = await readHTMLFile(path.join(__dirname, '../', '../', 'src', 'template', 'mpin_email.html'))
                const template = handlebar.compile(html)
                const [otp1, otp2, otp3, otp4] = mpinEmailOtp.split('');
                const tempData = template({ otp1, otp2, otp3, otp4, email: exists.email, firstName: exists.name })
                await sendEmail(process.env.EMAIL_NOTIFICATION_ADDRESS, 'OTP for Mpin setup', exists.email, tempData)
            }
            const exist = await findOne(otpModel, { email: exists.email });
            const data = { emailOtp: exist.mpinEmailOtp };
            return {
                data: data,
                error: '',
                message: 'Otp Sent successfully',
                status: 200
            }
        }
        catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`)
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            }
        }
    }
    /**
    * send registration token for notifications
    */
    @Security("Bearer")
    @Post("/registrationToken")
    public async registrationTokens(@Body() request: { registrationToken: string }): Promise<IResponse> {
        try {
            const { registrationToken } = request;
            const user = await findOne(clientModel, { _id: this.userId });
            let tokens = user.registrationTokens;
            tokens.push(registrationToken);
            await upsert(clientModel, { registrationTokens: tokens }, {
                _id: this.userId
            });
            return {
                data: {},
                error: '',
                message: 'Registration Token saved successfully',
                status: 200
            }
        }
        catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`)
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            }
        }
    }
    /**
    * Create Mpin Api
    */
    @Security('Bearer')
    @Post('/createMpin')
    public async createMpin(@Body() request: { password?: string, mpin: string, isMpinUsedForTransactions?: boolean }): Promise<IResponse> {
        try {
            const _id = this.userId;
            const exists = await findOne(clientModel, { _id });
            if (!exists) {
                throw new Error('User not found !')
            }
            const { password, mpin, isMpinUsedForTransactions } = request;
            const isValid = await verifyHash(password ?? '', exists.password ?? '');
            if (!isValid) {
                throw new Error('Password seems to be incorrect');
            }
            else {
                let hashed = await genHash(mpin);
                await upsert(clientModel, { mpin: hashed, isMpinCreated: true, isMpinUsedForTransactions }, _id);
            }
            return {
                data: { "Mpin Created": "Success" },
                error: '',
                message: 'Mpin Created successfully',
                status: 200
            }
        }
        catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`)
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            }
        }
    }
    /**
  * Mpin, Email, FaceScan status update API
  */
    @Security('Bearer')
    @Post('/enableDisableSecurity')
    public async enableDisableSecurity(@Body() request: { value: boolean; type: string }): Promise<IResponse> {
        try {
            const { value, type } = request;
            const _id = this.userId;
            let updateField: Record<string, boolean> = {};
            let updateField2: Record<string, boolean> = {};
            let updateField3: Record<string, boolean> = {};
            let message: string = '';
            const toggledValue: boolean = !value;
            if (type === 'isMpinActive') {
                updateField = { isMpinActive: value };
                updateField2 = { isEmailOtpActive: toggledValue };
                updateField3 = { isFaceScanActive: toggledValue };
                message = 'Mpin status updated successfully';
            } else if (type === 'isEmailOtpActive') {
                updateField = { isEmailOtpActive: value };
                updateField2 = { isMpinActive: toggledValue };
                updateField3 = { isFaceScanActive: toggledValue };
                message = 'Email OTP status updated successfully';
            } else if (type === 'isFaceScanActive') {
                updateField = { isFaceScanActive: value };
                updateField2 = { isEmailOtpActive: toggledValue };
                updateField3 = { isMpinActive: toggledValue };
                message = 'Face scan status updated successfully';
            }
            await upsert(clientModel, updateField, _id);
            await upsert(clientModel, updateField2, _id);
            await upsert(clientModel, updateField3, _id);
            return {
                data: {},
                error: '',
                message,
                status: 200
            };
        } catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`);
            return {
                data: null,
                error: err.message ? err.message : err,
                message: 'Failed to update Mpin status',
                status: 400
            };
        }
    }

    /**
        * Create Mpin Api
        */
    @Security('Bearer')
    @Post('/verifyPassword')
    public async verifyPassword(@Body() request: { password?: string }): Promise<IResponse> {
        try {
            const _id = this.userId;
            const exists = await findOne(clientModel, { _id });
            const { password } = request;
            const isValid = await verifyHash(password ?? '', exists.password ?? '');
            if (!isValid) {
                throw new Error('Password seems to be incorrect');
            }
            return {
                data: "Success",
                error: '',
                message: 'Password Match Successfully',
                status: 200
            }
        }
        catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`)
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            }
        }
    }

    /**
   * Verification of mpin over usage
   */
    @Security('Bearer')
    @Post('/verifyMpin')
    public async verifyMpin(@Body() request: { mpin: string }): Promise<IResponse> {
        try {
            const { mpin } = request;
            const _id = this.userId;
            const exists = await findOne(clientModel, { _id });
            if (!exists) {
                throw new Error('User not found');
            }
            const isValid = await verifyHash(mpin, exists.mpin);
            if (!isValid) {
                throw new Error('Incorrect Mpin');
            }
            if (!exists.mpin) {
                throw new Error("Mpin not Generated")
            }
            return {
                data: { "Mpin": "Verified" },
                error: '',
                message: 'Mpin verified successfully',
                status: 200
            }
        }
        catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`)
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            }
        }
    }
    /**
    * Add/Update wallet address
    */
    @Security('Bearer')
    @Put('/updateWalletAddress')
    public async updateWalletAddress(@Body() request: { walletAddress: string }): Promise<IResponse> {
        try {
            const _id = this.userId;
            const exists = await findOne(clientModel, { _id });
            if (!exists) {
                throw new Error("User doesnot exist");
            }
            const { walletAddress } = request;
            let saveResponse = await upsert(clientModel, { walletAddress: walletAddress }, _id);
            const data = saveResponse.walletAddress;
            return {
                data: { data },
                error: '',
                message: 'Wallet Address Updated Successfully',
                status: 200
            }
        }
        catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`)
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            }
        }
    }
    /**
     * Get wallet address 
     */
    @Security('Bearer')
    @Get('/getWalletAddress')
    public async getWalletAddress(): Promise<IResponse> {
        try {
            const _id = this.userId;
            const exists = await findOne(clientModel, { _id });
            let walletAddress;
            if (exists) {
                walletAddress = exists.walletAddress;
            } else {
                throw new Error("User doesnot exist");
            }
            return {
                data: { walletAddress },
                error: '',
                message: 'Wallet Address fetched Successfully',
                status: 200
            }
        }
        catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`)
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            }
        }
    }
    @Security('Bearer')
    @Get("/getNftDataByUser")
    public async getNftDataByUser(
        @Query('pageNumber') pageNumber: number,
        @Query('pageSize') pageSize: number,
        @Query('filter') filter: string,
        @Query("sort") sort?: '0' | '1'
    ): Promise<IResponse> {
        try {
            let query: any = { isPaid: { $ne: true } };

            if (filter) {
                query.$or = [
                    { name: { $regex: filter, $options: 'i' } }
                ];
            }
            const data = await getAll(nftDetailModel, query, +pageNumber, +pageSize);

            if (sort === '0' || sort === '1') {
                const sortOrder = sort === '0' ? 1 : -1;
                data.items.sort((a: any, b: any) => {
                    return sortOrder * (a.price - b.price);
                });
            }


            return {
                data: data || {},
                error: '',
                message: 'All NFT Data fetched Successfully',
                status: 200
            };
        } catch (err: any) {
            logger.error(`${this.req.ip} ${err.stack}`);
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            };
        }
    }

    /**
     * This API terminates the lease agreement.
     */
    @Security('Bearer')
    @Put('/terminateLease')
    public async terminateLease(@Body() request: { agreementId: string, status: string }): Promise<IResponse> {
        try {
            const { agreementId, status } = request;
            const exists = await agreementModel.findOne({ _id: agreementId });
            if (!exists) {
                throw new Error("Agreement does not exist");
            }
            const saveResponse = await upsert(agreementModel, { status: status }, exists._id);
            const user = await findOne(clientModel, { _id: this.userId });
            const data2 = await findOne(adminModel, {});
            const transactionResponse = await upsert(redTokenTransactionModel, {
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
        } catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`);
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            };
        }
    }
    @Security('Bearer')
    @Put("/updateAllUsernamesToUppercase")
    public async updateAllUsernamesToUppercase(): Promise<IResponse> {
        try {
            // Retrieve all clients as an array
            const clientsResponse = await getAlls(clientModel, {});
            const clients = clientsResponse.items;

            if (Array.isArray(clients)) {
                for (const client of clients) {
                    if (client.userName) {
                        const uppercaseUserName = client.userName.toUpperCase();
                        const response = await upsert(clientModel, { userName: uppercaseUserName }, client._id)
                    }
                }
                return {
                    data: response,
                    error: '',
                    message: 'All usernames updated to uppercase successfully',
                    status: 200
                };
            } else {

                return {
                    data: null,
                    error: 'No clients found',
                    message: '',
                    status: 404
                };
            }
        } catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`);
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            };
        }
    }
    /**
  *solos reward send to user in the app
  */
    @Security('Bearer')
    @Post("/sendSolosRewardByUser")
    public async sendSolosRewardByUser(@Body() request: { userName: string, solosReward: string, accountType: string }): Promise<IResponse> {
        try {
            const { userName, solosReward, accountType } = request;

            const senderData = await getById(clientModel, this.userId);
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
            const receiverData = await clientModel.findOne({
                $or: [{ userName: userName }, { businessUserName: userName }]
            });
            if (!receiverData) {
                throw new Error('Receiver user doesn\'t exist!');
            }
            const receiverField = (receiverData.userName === userName) ? 'solosReward' : 'businessSolosReward';
            const senderUpdatedSolosReward = userSolosReward - requestSolosRewardValue;
            const receiverUpdatedSolosReward = parseFloat(receiverData[receiverField]) + requestSolosRewardValue;
            const saveResponse1 = await upsert(clientModel, { [clientField]: senderUpdatedSolosReward }, this.userId);

            const saveResponse2 = await upsert(clientModel, { [receiverField]: receiverUpdatedSolosReward }, receiverData._id);

            // Save transaction details
            const sender = await findOne(clientModel, { _id: this.userId });
            const transactionResponse = await upsert(redTokenTransactionModel, {
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
        } catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`);
            return {
                data: null,
                error: err.message ? err.message : 'An error occurred',
                message: '',
                status: 400
            };
        }
    }
    /**
* Get Solos Reward Transactions
*/
    @Security('Bearer')
    @Get("/getSolosRewardTransaction")
    public async getSolosRewardTransaction(@Query('pageNumber') pageNumber: number, @Query('pageSize') pageSize: number): Promise<IResponse> {
        try {
            const query = {
                $or: [
                    { senderId: this.userId },
                    { receiverId: this.userId }
                ],
                transactionType: 'Solos Reward'
            };
            const sendData = await getAll(redTokenTransactionModel, query, +pageNumber, +pageSize);
            const items = sendData.items.map(item => {
                if (item.transactionType2 !== "null") {
                    const transactionType2 = item.receiverId.toString() === this.userId.toString() ? 'Receive Solos' : 'Send Solos';
                    return {
                        ...item,
                        transactionType2
                    };
                }
                return {
                    ...item,
                };
            });
            return {
                data: { items, pageNumber: sendData.pageNumber, pageSize: sendData.pageSize, totalItems: sendData.totalItems },
                error: '',
                message: 'All Solos Reward Transaction Data Successfully',
                status: 200
            }
        } catch (err: any) {
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            }
        }
    }
    /**
* Get User Nft Data
*/
    @Security('Bearer')
    @Get("/getNftDetailsOfUsers")
    public async getNftDetailsOfUsers(): Promise<IResponse> {
        try {
            const query = {
                userId: mongoose.Types.ObjectId(this.userId),
                status: { $in: ['APPROVED', 'DECLINED'] }
            };
            const data = await getAll(nftDetailModel, query);
            return {
                data: data || {},
                error: '',
                message: 'User NFT Data fetched Successfully',
                status: 200
            };
        } catch (err: any) {
            logger.error(`${this.req.ip} ${err.stack}`);
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            };
        }
    }
    /**
    * Get User Fred Nft Data
    */
    @Security('Bearer')
    @Get("/getFredNftDetailsOfUsers")
    public async getFredNftDetailsOfUsers(): Promise<IResponse> {
        try {
            let query: any = { userId: mongoose.Types.ObjectId(this.userId) };
            const data = await getAll(fredNftModel, query);
            return {
                data: data || {},
                error: '',
                message: 'User NFT Data fetched Successfully',
                status: 200
            };
        } catch (err: any) {
            logger.error(`${this.req.ip} ${err.stack}`);
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            };
        }
    }
    /**
     * Update status of user possesion property
     */
    @Security('Bearer')
    @Put("/sellInMarketplace")
    public async sellInMarketplace(@Body() request: { agreementId: string }): Promise<IResponse> {
        try {
            const { agreementId } = request;
            const transferProperty = await upsert(agreementModel, { status: 'DECLINED' }, agreementId);

            return {
                data: transferProperty,
                error: '',
                message: 'Property transfer to marketplace',
                status: 200
            };
        } catch (err: any) {
            return {
                data: null,
                error: err.message ? err.message : err,
                message: 'Error',
                status: 400
            };
        }
    }
    /**
    * Get User For sell in marketplace
    */
    @Security('Bearer')
    @Get("/sellPropertyFromUsers")
    public async sellPropertyFromUsers(@Query('pageNumber') pageNumber: number, @Query('pageSize') pageSize: number, @Query("sort") sort?: '0' | '1'): Promise<IResponse> {
        try {
            const totalCount = await agreementModel.countDocuments({});
            const data = await agreementModel.aggregate(
                [
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
                ]
            );
            console.log(data);

            if (sort === '0' || sort === '1') {
                const sortOrder = sort === '0' ? 1 : -1
                data.sort((a: any, b: any) => {
                    return sortOrder * (a.propertyDetails.propertyDetails.price - b.propertyDetails.propertyDetails.price);
                });
            }

            return {
                data: { data, totalCount },
                error: '',
                message: 'MarketPlace Data Listed Successfully',
                status: 200
            };
        } catch (error) {
            return {
                data: null,
                error: 'Error occurred',
                message: 'Failed to Search',
                status: 404
            };
        }
    }
    /**
        * Update status of user Nft
        */
    @Security('Bearer')
    @Put("/sellNftInMarketplace")
    public async sellNftInMarketplace(@Body() request: { nftId: string; price: string; type: string, walletAddress: string }): Promise<IResponse> {
        try {
            const { nftId, price, type, walletAddress } = request;
            if (type === "nft") {
                const transferNft = await upsert(nftDetailModel, { status: 'DECLINED', price, walletAddress }, nftId);
                return {
                    data: transferNft,
                    error: '',
                    message: 'Nft transfer to marketplace',
                    status: 200
                };
            } else {
                const transferfred = await upsert(fredNftModel, { status: 'DECLINED', amount: price, walletAddress }, nftId);
                console.log(transferfred);

                return {
                    data: transferfred,
                    error: '',
                    message: 'Fred Nft transfer to marketplace',
                    status: 200
                };
            }
        } catch (err: any) {
            return {
                data: null,
                error: err.message ? err.message : err,
                message: 'Error',
                status: 400
            };
        }
    }
    /**
        * Get Nft Signer Address
        */
    @Security("Bearer")
    @Get("/getNftSignerAddress")
    public async getNftSignerAddress(@Query("contractAddress") contractAddress: number, @Query("tokenId") tokenId: number): Promise<IResponse> {
        try {
            const data = await findOne(nftDetailModel, { contractAddress, tokenId });
            return {
                data: data.signerAddress,
                error: "",
                message: "Signer address Fetch Successfully",
                status: 200,
            };
        } catch (err: any) {
            logger.error(`${this.req.ip} ${err.stack}`);
            return {
                data: null,
                error: err.message ? err.message : err,
                message: "",
                status: 400,
            };
        }
    }

    @Security("Bearer")
    @Get("/getNftDetailSellInMarketplace")
    public async getNftDetailSellInMarketplace(
        @Query("pageNumber") pageNumber: number,
        @Query("pageSize") pageSize: number,
        @Query("filter") filter?: string,
        @Query("sort") sort?: '0' | '1'
    ): Promise<IResponse> {
        try {
            let query: any = { status: 'DECLINED' };
            let admin = await adminModel.findOne({ _id: new mongoose.Types.ObjectId(this.userId) })
            if (!admin) {
                query.isBlocked = { $ne: true };
            }

            // Add filter based on name
            if (filter) {
                query.$or = [
                    { name: { $regex: filter, $options: 'i' } }
                ];
            }
            interface NftData {
                items: any[];
                pageNumber: number;
                pageSize: number;
                totalItems: number;
                sort?: any;
            }
            // Your existing logic for fetching data
            const data: NftData = await getAll(nftDetailModel, query, +pageNumber, +pageSize);

            if (sort === '0' || sort === '1') {
                const sortOrder = sort === '0' ? 1 : -1;
                data.items.sort((a: any, b: any) => {
                    return sortOrder * (a.price - b.price);
                });
            }
            return {
                data: data,
                error: "",
                message: "NFT data of marketpalce fetched Successfully",
                status: 200,
            };
        } catch (err: any) {
            logger.error(`${this.req.ip} ${err.stack}`);
            return {
                data: null,
                error: err.message ? err.message : err,
                message: "",
                status: 400,
            };
        }
    }

    /**
* Get  fredNft Data which sell in marketplace in user 
*/
    @Security('Bearer')
    @Get("/getFredNftDetailSellInMarketplace")
    public async getFredNftDetailSellInMarketplace(
        @Query('pageNumber') pageNumber: number,
        @Query('pageSize') pageSize: number,
        @Query('filter') filter: string,
        @Query("sort") sort?: '0' | '1'
    ): Promise<IResponse> {
        try {
            let query: any = { status: 'DECLINED' };
            let admin = await adminModel.findOne({ _id: new mongoose.Types.ObjectId(this.userId) })
            if (!admin) {
                query.isBlocked = { $ne: true };
            }
            if (filter) {
                query.$or = [
                    { fred_name: { $regex: filter, $options: 'i' } }
                ];
            }

            const data = await getAll(fredNftModel, query, +pageNumber, +pageSize);

            if (sort === '0' || sort === '1') {
                const sortOrder = sort === '0' ? 1 : -1;
                data.items.sort((a: any, b: any) => {
                    return sortOrder * (a.amount - b.amount);
                });
            }

            return {
                data: data,
                error: '',
                message: 'FredNFT data of marketplace fetched Successfully',
                status: 200
            };
        } catch (err: any) {
            logger.error(`${this.req.ip} ${err.stack}`);
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            };
        }
    }


    /**
   * Send OTP api for Verification
   */
    @Security('Bearer')
    @Get("/sendOtp")
    public async sendOtp(): Promise<IResponse> {
        try {
            // Check if the user exists using the lowercase email
            const exists = await findOne(clientModel, { _id: this.userId });
            const otp = generateRandomOtp();
            const existOtp = await findOne(otpModel, { email: exists.email });
            if (existOtp) {
                await upsert(otpModel, { otp, email: exists.email }, existOtp._id);
            } else {
                await upsert(otpModel, { otp, email: exists.email });
            }
            // Send a mail with otp 
            const html = await readHTMLFile(path.join(__dirname, '../', '../', 'src', 'template', 'otp_email.html'));
            const template = handlebar.compile(html);
            const [otp1, otp2, otp3, otp4] = otp.split('');
            const tempData = template({ otp1, otp2, otp3, otp4, email: exists.email, firstName: exists.name });
            await sendEmail(process.env.EMAIL_NOTIFICATION_ADDRESS, 'OTP for Reset Password', exists.email, tempData);
            return {
                data: {},
                error: '',
                message: 'OTP successfully sent to ' + exists.email,
                status: 200
            };
        } catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`);
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            };
        }
    }
    /**
   * Get Total Asset Price
   */
    @Security('Bearer')
    @Get("/totalAssets")
    public async totalAssets(
        @Query('pageNumber') pageNumber: number,
        @Query('pageSize') pageSize: number,
    ): Promise<IResponse> {
        try {
            const getResponse = await getById(clientModel, this.userId);
            const getResponse2 = await findOne(adminModel, {});

            let query: any = { userId: this.userId };

            const data2 = await getAll(superFredModel, query, +pageNumber, +pageSize);

            const totalPriceOfSuperFred = data2.items.reduce((sum, item) => {
                const price = item.price;
                const quantity = item.quantity;
                const totalPriceForItem = price * quantity;
                return sum + totalPriceForItem;
            }, 0);


            const frednft = await getAll(fredNftModel, query, +pageNumber, +pageSize);
            const frednftPrice = frednft.items.map((item) => +item.amount);
            const totalPriceOfFredNft = frednftPrice.reduce((sum, price) => sum + price, 0);

            const nft = await getAll(nftDetailModel, query, +pageNumber, +pageSize);
            const frednftPrice2 = nft.items.map((item) => item.price);
            const totalPriceOfNft = frednftPrice2.reduce((sum, price) => sum + price, 0);


            const tvt = await getAll(tvtModel, query, +pageNumber, +pageSize);

            // const totalPriceTvtNft = tvt.items.reduce(async (sum, item) => {
            //     let tvt = await tvtModel.findOne({contractAddress: item.contractAddress, status: "PENDING"})
            //     const price = tvt.tradePrice;
            //     const quantity = item.quantity;
            //     const totalPriceForItem = price * quantity;
            //     return sum + totalPriceForItem;
            // }, 0);

            let tvtItems = tvt.items;
            let totalTvtSum = 0;
            for (let index = 0; index < tvtItems.length; index++) {
                const element = tvtItems[index];
                let tvt = await tvtModel.findOne({ contractAddress: element.contractAddress, status: "PENDING" })
                if (tvt) {
                    if (element.quantity > 0) {
                        totalTvtSum = totalTvtSum + (tvt.tradePrice * element.quantity)
                    }
                }
            }


            const totalSum = totalTvtSum + totalPriceOfNft + totalPriceOfFredNft + totalPriceOfSuperFred;

            const totalSum2 = totalSum / getResponse2.conversionRate;
            return {
                data: {
                    totalPriceTvtNft: totalSum,
                    totalPriceOfNft: totalPriceOfNft,
                    totalPriceOfFredNft: totalPriceOfFredNft,
                    totalPriceOfSuperFred: totalPriceOfSuperFred,
                    totalSum: totalSum2,
                },
                error: '',
                message: 'All NFT Data fetched Successfully',
                status: 200
            };
        } catch (err: any) {
            logger.error(`${this.req.ip} ${err.stack}`);
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            };
        }
    }
    /**
  * Change password api of user
  */
    @Security('Bearer')
    @Post("/changePassword")
    public async changePassword(@Body() request: { oldPassword: string, newPassword: string }): Promise<IResponse> {
        try {
            const { oldPassword, newPassword } = request;
            const validatedResetPassword = validateClientPassword({ oldPassword, newPassword });
            if (validatedResetPassword.error) {
                throw new Error(validatedResetPassword.error.message)
            }
            const data = await getById(clientModel, this.userId)
            const isValid = await verifyHash(oldPassword, data.password);
            if (!isValid) {
                throw new Error('Password seems to be incorrect');
            }
            const hashed = await genHash(newPassword)
            const updated = await upsert(clientModel, { password: hashed }, this.userId)
            return {
                data: {},
                error: '',
                message: 'Password change successfully!',
                status: 200
            }
        }
        catch (err: any) {
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            }
        }
    }
    /**
* Save transation of burn red token 
*/
    @Security('Bearer')
    @Post("/saveTransactionOfBurnRedToken")
    public async saveTransactionOfBurnRedToken(@Body() request: { amount: string }): Promise<IResponse> {
        try {
            const { amount } = request;
            const validatedData = validateClientBurnRedTokens({ amount });
            if (validatedData.error) {
                throw new Error(validatedData.error.message)
            }
            const updated = await upsert(burnRedTokenModel, { amount, userId: this.userId },)
            return {
                data: { updated },
                error: '',
                message: 'Transaction Save Successfully',
                status: 200
            }
        }
        catch (err: any) {
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            }
        }
    }
    /**
* Get Transaction Burn RedToken
*/
    @Security('Bearer')
    @Get("/getTransactionOfBurnRedToken")
    public async getTransactionOfBurnRedToken(
        @Query('pageNumber') pageNumber: number,
        @Query('pageSize') pageSize: number,
    ): Promise<IResponse> {
        try {
            // Assuming findAll function supports pagination
            const data = await getAll(burnRedTokenModel, {}, +pageNumber, +pageSize);

            return {
                data: { data },
                error: '',
                message: 'Transaction fetch Successfully',
                status: 200
            };
        } catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`);
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            };
        }
    }

    /**
 * Save transation of burn SR token 
 */
    @Security('Bearer')
    @Post("/saveTransactionOfBurnSrToken")
    public async saveTransactionOfBurnSrToken(@Body() request: { amount: string }): Promise<IResponse> {
        try {
            const { amount } = request;
            const validatedData = validateClientBurnSrTokens({ amount });
            if (validatedData.error) {
                throw new Error(validatedData.error.message)
            }
            const updated = await upsert(burnSrTokenModel, { amount, userId: this.userId },)
            return {
                data: { updated },
                error: '',
                message: 'Transaction Save Successfully',
                status: 200
            }
        }
        catch (err: any) {
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            }
        }
    }
    /**
   * Get Transaction Burn SrToken
   */
    @Security('Bearer')
    @Get("/getTransactionOfBurnSrToken")
    public async getTransactionOfBurnSrToken(
        @Query('pageNumber') pageNumber: number,
        @Query('pageSize') pageSize: number,
    ): Promise<IResponse> {
        try {
            // Assuming findAll function supports pagination
            const data = await getAll(burnSrTokenModel, {}, +pageNumber, +pageSize);

            return {
                data: { data },
                error: '',
                message: 'Transaction fetch Successfully',
                status: 200
            };
        } catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`);
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            };
        }
    }
    /**
     * Get TVT transaction details
     */
    @Security('Bearer')
    @Get("/getTotalSoloAssets")
    public async getTotalSoloAssets(
        @Query('walletAddress') walletAddress: string,
        @Query('pageNumber') pageNumber: number,
        @Query('pageSize') pageSize: number,
    ): Promise<IResponse> {
        try {
            
            const data: Array<any> = [];
            const redBalance = await getTokenBalance("0xfe3d92de0f25b6e06fd1534a8324aa3563136c7b", redContratAbi, walletAddress);
            const redTokenData={
                contractAddress:'0xfe3d92de0f25b6e06fd1534a8324aa3563136c7b',
                categories:'Real Estate Dollar',
                symbol:'RED',
                balance:redBalance
            }
            const srBalance = await getTokenBalance("0xb7ed63316fa41a1eefd5e31a81ab3144fe51f4c4", srContratAbi,walletAddress);
            const srData={
                contractAddress:'0xb7ed63316fa41a1eefd5e31a81ab3144fe51f4c4',
                categories:'Solos Rewards',
                symbol:'SR',
                balance:srBalance
            }
            data.push(redTokenData,srData)
            const tvts = await tvtModel.find({});
            let tvtData = await Promise.all(tvts.map(async(tvt:any)=>{
                let balance = await getTokenBalance(tvt?.contractAddress,tvtContratAbi,walletAddress);
                return {...tvt?.toObject(),balance}
            }))
            data.push(...tvtData)
            return {
                data: data,
                error: '',
                message: 'Tvt Transaction Fetched Successfully',
                status: 200
            };
        } catch (error:any) {
            console.error(error);
            return {
                data: null,
                error: error?.message,
                message: '',
                status: 500
            };
        }
    }


}


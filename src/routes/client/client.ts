import express, { Request, Response } from 'express'
import ClientController from '../../controllers/client.controller'
import { authenticateBoth, authenticateClient } from '../../middlewares/auth.middleware'
import multerMiddleware from '../../middlewares/multer.middleware'
import { responseWithStatus } from '../../utils/response.util'
const router = express.Router()

router.post('/register', async (req: Request | any, res: Response) => {
    const { name, email, userName, countryCode, contact, password, confirmPassword, referralCode, isKYCConfirmed, device_type, device_token } = req.body;
    const controller = new ClientController(req, res)
    const response = await controller.register({ name, email, userName, countryCode, contact, password, confirmPassword, referralCode, isKYCConfirmed, device_type, device_token });
    const { status } = response;
    return responseWithStatus(res, status, response)
})

router.post('/verifyotp', async (req: Request | any, res: Response) => {
    const { otp, email } = req.body;
    const controller = new ClientController(req, res)
    const response = await controller.verifyotp({ otp, email });
    const { status } = response;
    return responseWithStatus(res, status, response)
})

router.post('/login', async (req: Request | any, res: Response) => {
    const { email, password, device_type, device_token } = req.body;
    const controller = new ClientController(req, res)
    const response = await controller.login({ email, password, device_type, device_token });
    const { status } = response;
    return responseWithStatus(res, status, response)
})

router.post('/verify-payload', async (req: Request | any, res: Response) => {
    const { payload } = req.body;
    const controller = new ClientController(req, res)
    const response = await controller.verifyPayload({ payload });
    const { status } = response;
    return responseWithStatus(res, status, response)
})

router.post('/forgotPassword', async (req: Request | any, res: Response) => {
    const { email } = req.body;
    const controller = new ClientController(req, res)
    const response = await controller.forgotPassword({ email });
    const { status } = response;
    return responseWithStatus(res, status, response)
})

router.put('/verifyOtp', async (req: Request | any, res: Response) => {
    const { email, otp } = req.body;
    const controller = new ClientController(req, res)
    const response = await controller.verifyOtp({ email, otp });
    const { status } = response;
    return responseWithStatus(res, status, response)
})

router.post('/verifyKyc', authenticateClient, async (req: Request | any, res: Response) => {
    const { kycCode } = req.body;
    const controller = new ClientController(req, res)
    const response = await controller.verifyKyc({ kycCode });
    const { status } = response;
    return responseWithStatus(res, status, response)
})


router.post('/resetPassword', authenticateClient, async (req: Request | any, res: Response) => {
    // check purpose field
    const { purpose } = req.body.user;
    if (!purpose || purpose !== 'reset') {
        return responseWithStatus(res, 400, {
            data: {},
            error: 'Invalid Token',
            message: '',
            status: 400
        })
    }
    const { new_password } = req.body;
    const controller = new ClientController(req, res)
    const response = await controller.resetPassword({ new_password });
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.get('/me', authenticateClient, async (req: Request | any, res: Response) => {
    const controller = new ClientController(req, res)
    const response = await controller.me();
    const { status } = response;
    return responseWithStatus(res, status, response)
})

router.post('/postContacts', authenticateClient, async (req: Request | any, res: Response) => {
    const { contacts, searchUsername, pageNumber, pageSize } = req.body;
    const controller = new ClientController(req, res)
    const response = await controller.postContacts({ contacts, searchUsername, pageNumber, pageSize });
    const { status } = response;
    return responseWithStatus(res, status, response)
})

router.put('/updateProfile', multerMiddleware.single('profileImage'), authenticateClient, async (req: Request | any, res: Response) => {
    const { name, email, userName, contact, referralCode, walletAddress, countryCode, bridgeId, bridgeCustomerId } = req.body;
    const controller = new ClientController(req, res)
    const response = await controller.updateProfile(name, email, userName, contact, referralCode, walletAddress, countryCode, bridgeId, bridgeCustomerId, req?.file,);
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.post('/leaseRequest', multerMiddleware.single('propertyDocument'), authenticateClient, async (req: Request | any, res: Response) => {
    const { propertyName, propertyDescription, addressLine1, addressLine2, state, country, pincode } = req.body;
    const controller = new ClientController(req, res)
    const response = await controller.leaseRequest(propertyName, propertyDescription, addressLine1, addressLine2, state, country, pincode, req?.file);
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.get('/leasePropertyRequestData', authenticateClient, async (req: Request | any, res: Response) => {
    const { pageNumber, pageSize } = req.query
    const controller = new ClientController(req, res)
    const response = await controller.leasePropertyRequestData(pageNumber, pageSize);
    return responseWithStatus(res, response.status, response)
});
router.get('/buyRedToken', authenticateBoth, async (req: Request | any, res: Response) => {
    const controller = new ClientController(req, res)
    const response = await controller.buyRedToken();
    return responseWithStatus(res, response.status, response)
});
router.get('/getBooqConversionRate', authenticateBoth, async (req: Request | any, res: Response) => {
    const controller = new ClientController(req, res)
    const response = await controller.getBooqConversionRate();
    return responseWithStatus(res, response.status, response)
});
router.post('/requestRedToken', authenticateClient, async (req: Request | any, res: Response) => {
    const { totalRedToken, hashId, usdc, transactionType, accountType, walletAddress } = req.body;
    const controller = new ClientController(req, res)
    const response = await controller.requestRedToken({ totalRedToken, hashId, usdc, transactionType, accountType, walletAddress });
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.get("/redTokenTransactionsDetails", authenticateClient, async (req: Request | any, res: Response) => {
    const { pageNumber, pageSize, transactionType } = req.query;
    const controller = new ClientController(req, res)
    const response = await controller.redTokenTransactionsDetails(pageNumber, pageSize, transactionType);
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.get("/usdcTransactionsDetails", authenticateBoth, async (req: Request | any, res: Response) => {
    const { pageNumber, pageSize } = req.query;
    const controller = new ClientController(req, res)
    const response = await controller.usdcTransactionsDetails(pageNumber, pageSize);
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.post('/sellRed', authenticateClient, async (req: Request | any, res: Response) => {
    const { totalRedToken, hashId, usdc, transactionType, accountType, walletAddress, hashId2 } = req.body;
    const controller = new ClientController(req, res)
    const response = await controller.sellRed({ totalRedToken, hashId, usdc, transactionType, accountType, walletAddress, hashId2 });
    const { status } = response;
    return responseWithStatus(res, status, response)
})

router.get('/walletData', authenticateClient, async (req: Request | any, res: Response) => {
    const { accountType } = req.query;
    const controller = new ClientController(req, res)
    const response = await controller.walletData(accountType);
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.get('/getBookingAmount', authenticateClient, async (req: Request | any, res: Response) => {
    const { totalPropertyValue } = req.query;
    const controller = new ClientController(req, res)
    const response = await controller.getBookingAmount(totalPropertyValue);
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.get('/possesionListing', authenticateClient, async (req: Request | any, res: Response) => {
    const { pageNumber, pageSize } = req.query;
    const controller = new ClientController(req, res)
    const response = await controller.possesionListing(pageNumber, pageSize);
    const { status } = response;
    return responseWithStatus(res, status, response)
});
router.get('/possesionPropertyYouWant', authenticateClient, async (req: Request | any, res: Response) => {
    let { propertyId, pageNumber, pageSize } = req.query;
    const controller = new ClientController(req, res)
    const response = await controller.possesionPropertyYouWant(propertyId, pageNumber, pageSize);
    const { status } = response;
    return responseWithStatus(res, status, response)
});

router.get('/getAgreementData', authenticateClient, async (req: Request | any, res: Response) => {
    const { pageNumber, pageSize } = req.query;
    const controller = new ClientController(req, res)
    const response = await controller.getAgreementData(pageNumber, pageSize);
    const { status } = response;
    return responseWithStatus(res, status, response)
});
router.get('/leasePropertyYouWant', authenticateClient, async (req: Request | any, res: Response) => {
    const { propertyId } = req.query;
    const controller = new ClientController(req, res)
    const response = await controller.leasePropertyYouWant(propertyId);
    const { status } = response;
    return responseWithStatus(res, status, response)
});

router.post('/addAccount', authenticateClient, async (req: Request | any, res: Response) => {
    const { accountType, businessEmail, businessUserName, businessContact, businessCountryCode } = req.body;
    const controller = new ClientController(req, res)
    const response = await controller.addAccount({ accountType, businessEmail, businessUserName, businessContact, businessCountryCode });
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.get('/switchAccount', authenticateClient, async (req: Request | any, res: Response) => {
    const { accountType } = req.query;
    const controller = new ClientController(req, res)
    const response = await controller.switchAccount(accountType);
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.put('/SearchUser', authenticateClient, async (req: Request | any, res: Response) => {
    const { userName } = req.body;
    const controller = new ClientController(req, res)
    const response = await controller.SearchUser({ userName });
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.post('/sendRedToken', authenticateClient, async (req: Request | any, res: Response) => {
    const { userName, redToken, accountType } = req.body;
    const controller = new ClientController(req, res)
    const response = await controller.sendRedToken({ userName, redToken, accountType });
    const { status } = response;
    return responseWithStatus(res, status, response)
})

router.post("/registrationToken", authenticateClient, async (req: Request | any, res: Response) => {
    const { registrationToken } = req.body;
    const controller = new ClientController(req, res)
    const response = await controller.registrationTokens({ registrationToken });
    const { status } = response;
    return responseWithStatus(res, status, response)
})

router.get("/logout", authenticateClient, async (req: Request | any, res: Response) => {
    const controller = new ClientController(req, res)
    const response = await controller.logout();
    const { status } = response;
    return responseWithStatus(res, status, response)
})

router.post('/createMpin', authenticateClient, async (req: Request | any, res: Response) => {
    const { password, mpin, isMpinUsedForTransactions } = req.body;
    const controller = new ClientController(req, res);
    const response = await controller.createMpin({ password, mpin, isMpinUsedForTransactions });
    const { status } = response;
    return responseWithStatus(res, status, response);
})
router.post('/enableDisableSecurity', authenticateClient, async (req: Request | any, res: Response) => {
    const { value, type } = req.body;
    const controller = new ClientController(req, res);
    const response = await controller.enableDisableSecurity({ type, value });
    const { status } = response;
    return responseWithStatus(res, status, response);
})
router.post('/verifyPassword', authenticateClient, async (req: Request | any, res: Response) => {
    const { password } = req.body;
    const controller = new ClientController(req, res);
    const response = await controller.verifyPassword({ password });
    const { status } = response;
    return responseWithStatus(res, status, response);
})
router.post('/verifyMpin', authenticateClient, async (req: Request | any, res: Response) => {
    const { mpin } = req.body;
    const controller = new ClientController(req, res);
    const response = await controller.verifyMpin({ mpin });
    const { status } = response;
    return responseWithStatus(res, status, response);
})


router.put('/updateWalletAddress', authenticateClient, async (req: Request | any, res: Response) => {
    const { walletAddress } = req.body;
    const controller = new ClientController(req, res);
    const response = await controller.updateWalletAddress({ walletAddress });
    const { status } = response;
    return responseWithStatus(res, status, response);
})

router.get('/getWalletAddress', authenticateClient, async (req: Request | any, res: Response) => {
    const controller = new ClientController(req, res)
    const response = await controller.getWalletAddress();
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.get('/getNftDataByUser', authenticateClient, async (req: Request | any, res: Response) => {
    const { pageNumber, pageSize, filter, sort } = req.query;
    const controller = new ClientController(req, res)
    const response = await controller.getNftDataByUser(pageNumber, pageSize, filter, sort);
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.put('/terminateLease', authenticateClient, async (req: Request | any, res: Response) => {
    const { agreementId, status } = req.body;
    const controller = new ClientController(req, res)
    const response = await controller.terminateLease({ agreementId, status });
    // const { status } = response;
    return responseWithStatus(res, response.status, response)
})
router.put('/updateAllUsernamesToUppercase', async (req: Request | any, res: Response) => {
    //const {} = req.body;
    const controller = new ClientController(req, res)
    const response = await controller.updateAllUsernamesToUppercase();
    // const { status } = response;
    return responseWithStatus(res, response.status, response)
})
router.post('/sendSolosRewardByUser', authenticateClient, async (req: Request | any, res: Response) => {
    const { userName, solosReward, accountType } = req.body;
    const controller = new ClientController(req, res)
    const response = await controller.sendSolosRewardByUser({ userName, solosReward, accountType });
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.get('/getSolosRewardTransaction', authenticateClient, async (req: Request | any, res: Response) => {
    const { pageNumber, pageSize, } = req.query;
    const controller = new ClientController(req, res)
    const response = await controller.getSolosRewardTransaction(pageNumber, pageSize,);
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.get('/getNftDetailsOfUsers', authenticateClient, async (req: Request | any, res: Response) => {
    //const { pageNumber, pageSize} = req.query;
    const controller = new ClientController(req, res)
    const response = await controller.getNftDetailsOfUsers();
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.get('/getFredNftDetailsOfUsers', authenticateClient, async (req: Request | any, res: Response) => {
    // const { pageNumber, pageSize} = req.query;
    const controller = new ClientController(req, res)
    const response = await controller.getFredNftDetailsOfUsers();
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.put('/sellInMarketplace', authenticateClient, async (req: Request | any, res: Response) => {
    const { agreementId } = req.body;
    const controller = new ClientController(req, res);
    const response = await controller.sellInMarketplace({ agreementId });
    const { status } = response;
    return responseWithStatus(res, status, response);
})
router.get('/sellPropertyFromUsers', authenticateClient, async (req: Request | any, res: Response) => {
    const { pageNumber, pageSize, sort } = req.query;
    const controller = new ClientController(req, res)
    const response = await controller.sellPropertyFromUsers(pageNumber, pageSize, sort);
    const { status } = response;
    return responseWithStatus(res, status, response)
});
router.put('/sellNftInMarketplace', authenticateClient, async (req: Request | any, res: Response) => {
    const { nftId, price, type, walletAddress } = req.body;
    const controller = new ClientController(req, res);
    const response = await controller.sellNftInMarketplace({ nftId, price, type, walletAddress });
    const { status } = response;
    return responseWithStatus(res, status, response);
})
router.get('/getNftSignerAddress', authenticateClient, async (req: Request | any, res: Response) => {
    const { contractAddress, tokenId } = req.query;
    const controller = new ClientController(req, res)
    const response = await controller.getNftSignerAddress(contractAddress, tokenId);
    const { status } = response;
    return responseWithStatus(res, status, response)
});
router.get('/getNftDetailSellInMarketplace', authenticateBoth, async (req: Request | any, res: Response) => {
    const { pageNumber, pageSize, filter, sort } = req.query;
    const controller = new ClientController(req, res)
    const response = await controller.getNftDetailSellInMarketplace(pageNumber, pageSize, filter, sort);
    const { status } = response;
    return responseWithStatus(res, status, response)
});
router.get('/getFredNftDetailSellInMarketplace', authenticateBoth, async (req: Request | any, res: Response) => {
    const { pageNumber, pageSize, filter, sort } = req.query;
    const controller = new ClientController(req, res)
    const response = await controller.getFredNftDetailSellInMarketplace(pageNumber, pageSize, filter, sort);
    const { status } = response;
    return responseWithStatus(res, status, response)
});
router.get('/sendOtp', authenticateClient, async (req: Request | any, res: Response) => {
    const controller = new ClientController(req, res)
    const response = await controller.sendOtp();
    const { status } = response;
    return responseWithStatus(res, status, response)
});
router.get('/totalAssets', authenticateClient, async (req: Request | any, res: Response) => {
    const { pageNumber, pageSize } = req.query;
    const controller = new ClientController(req, res)
    const response = await controller.totalAssets(pageNumber, pageSize);
    const { status } = response;
    return responseWithStatus(res, status, response)
});
router.post('/changePassword', authenticateClient, async (req: Request | any, res: Response) => {
    const { oldPassword, newPassword } = req.body;
    const controller = new ClientController(req, res)
    const response = await controller.changePassword({ oldPassword, newPassword });
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.post('/saveTransactionOfBurnRedToken', authenticateBoth, async (req: Request | any, res: Response) => {
    const { amount } = req.body;
    const controller = new ClientController(req, res)
    const response = await controller.saveTransactionOfBurnRedToken({ amount });
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.get('/getTransactionOfBurnRedToken', authenticateBoth, async (req: Request | any, res: Response) => {
    const { pageNumber, pageSize } = req.query;
    const controller = new ClientController(req, res)
    const response = await controller.getTransactionOfBurnRedToken(pageNumber, pageSize);
    const { status } = response;
    return responseWithStatus(res, status, response)
});
router.post('/saveTransactionOfBurnSrToken', authenticateBoth, async (req: Request | any, res: Response) => {
    const { amount } = req.body;
    const controller = new ClientController(req, res)
    const response = await controller.saveTransactionOfBurnSrToken({ amount });
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.get('/getTransactionOfBurnSrToken', authenticateBoth, async (req: Request | any, res: Response) => {
    const { pageNumber, pageSize } = req.query;
    const controller = new ClientController(req, res)
    const response = await controller.getTransactionOfBurnSrToken(pageNumber, pageSize);
    const { status } = response;
    return responseWithStatus(res, status, response)
});
router.get('/getTotalSoloAssets',authenticateBoth, async (req: Request | any, res: Response) => {
    const { walletAddress,pageNumber, pageSize } = req.query
    const controller = new ClientController(req, res)
    const response = await controller.getTotalSoloAssets(walletAddress,pageNumber, pageSize);
    return responseWithStatus(res, response.status, response)
});
module.exports = router

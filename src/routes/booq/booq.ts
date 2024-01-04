import express, { Request, Response } from 'express'
import BooqController from '../../controllers/booq.controller'
import { responseWithStatus } from '../../utils/response.util'
import { authenticateClient} from '../../middlewares/auth.middleware'
const router = express.Router()

router.post('/userLoginBooq', async (req: Request | any, res: Response) => {
    const { user_name, password } = req.body;
    const controller = new BooqController(req, res)
    const response = await controller.userLoginBooq({ user_name, password });
    const { status } = response;
    return responseWithStatus(res, status, response)
})

router.post('/searchUserInBooq', async (req: Request | any, res: Response) => {
    const { phone_number, access_token } = req.body;
    const controller = new BooqController(req, res)
    const response = await controller.searchUserInBooq({ phone_number, access_token });
    const { status } = response;
    return responseWithStatus(res, status, response)
})

router.post('/transferAmount', authenticateClient, async (req: Request | any, res: Response) => {
    const { userId, amount, redToken, access_token } = req.body;
    const controller = new BooqController(req, res)
    const response = await controller.transferAmount({ userId, amount, redToken, access_token });
    const { status } = response;
    return responseWithStatus(res, status, response)
})

router.get('/getTransferAmount', authenticateClient, async (req: Request | any, res: Response) => {
    const { pageNumber, pageSize } = req.query;
    const controller = new BooqController(req, res)
    const response = await controller.getTransferAmount(pageNumber, pageSize);
    const { status } = response;
    return responseWithStatus(res, status, response)
})

router.post('/getLoanAmount', authenticateClient, async (req: Request | any, res: Response) => {
    const { userId, amount, redToken, access_token } = req.body;
    const controller = new BooqController(req, res)
    const response = await controller.getLoanAmount({ userId, amount, redToken, access_token });
    const { status } = response;
    return responseWithStatus(res, status, response)
})

router.post('/redTokenLoanReturn', authenticateClient, async (req: Request | any, res: Response) => {
    const { userId, amount, redToken, access_token } = req.body;
    const controller = new BooqController(req, res)
    const response = await controller.redTokenLoanReturn({ userId, amount, redToken, access_token });
    const { status } = response;
    return responseWithStatus(res, status, response)
})

router.post('/loanAgainstFred', authenticateClient, async (req: Request | any, res: Response) => {
    const { userId, amount, token_id, nft_address, access_token, sender_wallet, receiver_wallet } = req.body;
    const controller = new BooqController(req, res)
    const response = await controller.loanAgainstFred({ userId, amount, token_id, nft_address, access_token, sender_wallet, receiver_wallet });
    const { status } = response;
    return responseWithStatus(res, status, response)
})

router.get('/lockedFredNft', authenticateClient, async (req: Request | any, res: Response) => {
    const controller = new BooqController(req, res)
    const response = await controller.lockedFredNft();
    const { status } = response;
    return responseWithStatus(res, status, response)
})

router.post('/fredNftLoanReturn', authenticateClient, async (req: Request | any, res: Response) => {
    const { userId, amount, token_id, nft_address, access_token, sender_wallet, receiver_wallet } = req.body;
    const controller = new BooqController(req, res)
    const response = await controller.fredNftLoanReturn({ userId, amount, token_id, nft_address, access_token, sender_wallet, receiver_wallet });
    const { status } = response;
    return responseWithStatus(res, status, response)
})

module.exports = router

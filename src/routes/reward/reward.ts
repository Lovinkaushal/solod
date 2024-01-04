import express, { Request, Response } from 'express'
import FredController from '../../controllers/fred.controller'
import { authenticateClient, authenticateAdmin, authenticateBoth } from '../../middlewares/auth.middleware'
import multerMiddleware from '../../middlewares/multer.middleware'
import { responseWithStatus } from '../../utils/response.util'
import superFredController from '../../controllers/superFred.controller'
import rewardController from '../../controllers/reward.controller'
const router = express.Router()

router.post('/sendreward', async (req: Request | any, res: Response) => {
    const { sender_id,receiver_id,amount } = req.body;
    const controller = new rewardController(req, res)
    const response = await controller.sendreward({sender_id,receiver_id,amount});
    const { status } = response;
    return responseWithStatus(res, status, response)
})



module.exports = router
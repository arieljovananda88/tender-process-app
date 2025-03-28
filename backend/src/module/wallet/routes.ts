import express from "express";
const router = express.Router()
import {walletController} from './internal/controller'

router.post('/', walletController.createWallet)

export const walletRouter = {
    router
};
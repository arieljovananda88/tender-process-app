import express from "express";
const router = express.Router()
import {authController} from './internal/controller'

router.get('/nonce', authController.getNonce)
router.post('/verify', authController.verifySignature)

export const authRouter = {
    router
};
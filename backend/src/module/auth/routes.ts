import express from "express";
const router = express.Router()
import {authController} from './internal/controller'

router.get('/nonce', authController.getNonce)
router.post('/verify', authController.verifySignature)
router.post('/register', authController.register)

export const authRouter = {
    router
};
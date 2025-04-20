import express from "express";
const router = express.Router()
import {authController} from './internal/controller'

router.get('/nonce', authController.getNonce)
router.post('/verify', authController.verifySignature)
router.post('/register', authController.register)
router.get('/is-registered', authController.isRegistered)

export const authRouter = {
    router
};
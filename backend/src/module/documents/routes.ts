import express from "express";
const router = express.Router()
import {uploadDocumentController} from './internal/upload-controllers'

router.post('/', uploadDocumentController.uploadDocument)
router.post('/signature', uploadDocumentController.uploadDocumentWithSignature)

export const uploadDocumentRouter = {
    router
};
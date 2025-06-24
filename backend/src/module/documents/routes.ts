import express from "express";
const router = express.Router()
import {uploadDocumentController} from './internal/upload-controllers'

router.post('/', uploadDocumentController.uploadDocument)
router.post('/info', uploadDocumentController.uploadInfoDocument)
router.post('/request-access', uploadDocumentController.requestAccess)

export const uploadDocumentRouter = {
    router
};
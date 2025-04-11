import express from "express";
const router = express.Router()
import {uploadDocumentController} from './internal/upload-controllers'

router.post('/', uploadDocumentController.uploadDocument)

export const uploadDocumentRouter = {
    router
};
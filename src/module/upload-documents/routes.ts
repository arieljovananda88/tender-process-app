import express from "express";
const ipfsRouter = express.Router()
import {uploadDocumentController} from './internal/controllers.js'

ipfsRouter.post('/', uploadDocumentController.uploadDocument)

export const uploadDocumentRouter = {
    ipfsRouter
};
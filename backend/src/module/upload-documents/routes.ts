import express from "express";
const ipfsRouter = express.Router()
import {uploadDocumentController} from './internal/controllers'

ipfsRouter.post('/', uploadDocumentController.uploadDocument)

export const uploadDocumentRouter = {
    ipfsRouter
};
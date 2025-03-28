import express from "express";
import dotenv from "dotenv";
dotenv.config();

const app = express()

import {uploadDocumentRouter} from '../module/upload-documents/routes'
import {walletRouter} from '../module/wallet/routes'

app.use(express.json())
app.use('/upload-document', uploadDocumentRouter.ipfsRouter)
app.use('/wallet', walletRouter.router)

// app.use(authenticateToken)

app.listen(process.env.PORT, () => {
  console.log(`Server is listening on port ${process.env.PORT}`)
})
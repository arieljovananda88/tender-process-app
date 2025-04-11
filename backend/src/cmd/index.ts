import express from "express";
import dotenv from "dotenv";
import cors from "cors";
dotenv.config();

const app = express()

import { uploadDocumentRouter } from '../module/documents/routes'
import { walletRouter } from '../module/wallet/routes'
import { authRouter } from "../module/auth/routes";

app.use(express.json())
app.use(cors())
app.use('/upload-document', uploadDocumentRouter.router)
app.use('/wallet', walletRouter.router)
app.use('/auth', authRouter.router)

// app.use(authenticateToken)

app.listen(process.env.PORT, () => {
  console.log(`Server is listening on port ${process.env.PORT}`)
})
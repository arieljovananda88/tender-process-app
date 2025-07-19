import express from "express";
import dotenv from "dotenv";
import cors from "cors";
dotenv.config();

const app = express()

import { uploadDocumentRouter } from '../../module/documents/routes'
import { authRouter } from "../../module/auth/routes";
import { tenderRouter } from "../../module/tender/routes";

app.use(express.json())
app.use(cors())
app.use('/document', uploadDocumentRouter.router)
app.use('/auth', authRouter.router)
app.use('/tender', tenderRouter.router)

// app.use(authenticateToken)

app.listen(process.env.PORT, () => {
  console.log(`Server is listening on port ${process.env.PORT}`)
})
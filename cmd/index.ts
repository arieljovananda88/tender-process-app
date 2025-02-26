const express = require('express')
require('dotenv').config()
const app = express()
import authenticateToken from "../middleware/middleware"
const healthCheckRouter = require('../module/health-check/routes')

app.use(express.json())
app.use('/generate-ipfs', healthCheckRouter)

app.use(authenticateToken)

app.listen(process.env.PORT, () => {
  console.log(`Server is listening on port ${process.env.PORT}`)
})
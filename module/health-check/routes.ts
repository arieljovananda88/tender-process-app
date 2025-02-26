const express = require('express')
const ipfsRouter = express.Router()
const healthCheckController = require('./internal/controllers')

ipfsRouter.get('/', healthCheckController.getHealthCheck)

module.exports = ipfsRouter
const database = require('./repository')

async function generateIpfs(req, res) {
  try {
    const healthCheck = await database.getFirstHealthCheck()
    res.json(healthCheck)
  } catch (error) {
    res.status(500).send('Internal Server Error')
  }
}

module.exports = {
  generateIpfs,
}
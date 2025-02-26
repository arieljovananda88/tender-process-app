const prisma = require('@prisma/client');
const { PrismaClient } = prisma;

const prismaClient = new PrismaClient();

async function getFirstHealthCheck() {
    try {
      const firstEntry = await prismaClient.healthCheck.findFirst();
      return firstEntry;
    } catch (error) {
      console.error('Error fetching the first entry:', error);
      throw error;
    }
  }
  
  module.exports = { getFirstHealthCheck };


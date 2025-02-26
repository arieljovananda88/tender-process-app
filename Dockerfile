# Use official Node.js image as base
FROM node:18.17.1

# Set the working directory
WORKDIR /app

# Set environment variables
ENV PORT=3000
ENV DATABASE_URL=postgres://postgres:root@34.101.220.96:5432/hansaidb
ENV AI_SERVICE=https://hans-ai-ml-620337868347.asia-southeast2.run.app
ENV JWT_SECRET=jancox

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    libatlas-base-dev \
    libblas-dev \
    liblapack-dev \
    libhdf5-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma migrate deploy
RUN npx prisma generate

# Copy rest of the project files
COPY . .

# Expose the port
EXPOSE 3000

# Command to start the application
CMD [ "npm", "run", "start"]

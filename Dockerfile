# Use Node 20 (matches your dependencies)
FROM node:20

# Set working directory
WORKDIR /app

# Copy package files first for caching
COPY package.json package-lock.json* ./

# Install dependencies using npm install (NOT npm ci)
RUN npm install

# Copy the rest of the project
COPY . .

# Expose Railway's default port
EXPOSE 3000

# Start server
CMD ["npm", "start"]

# Use latest Node.js image
FROM node:latest

# Set working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the application files
COPY . .

# Expose port 8000
EXPOSE 8000

# Start server
CMD ["npm", "start"]

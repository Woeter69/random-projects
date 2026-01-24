# Use the official Puppeteer image which includes Chrome
FROM ghcr.io/puppeteer/puppeteer:latest

# Switch to root to install dependencies and fix permissions
USER root

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --unsafe-perm=true

# Copy the rest of the application code
COPY . .

# Create the session directory and ensure pptruser owns everything
RUN mkdir -p /usr/src/app/.wwebjs_auth && \
    chown -R pptruser:pptruser /usr/src/app

# Switch back to the non-root user for security
USER pptruser

# Expose the port the app runs on
EXPOSE 49876

# Start the application
CMD [ "node", "index.js" ]
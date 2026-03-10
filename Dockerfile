# Base image to use
FROM node:20-alpine

# set a working directory
WORKDIR /src

# Copy across project configuration information
# Install application dependencies
COPY package*.json /src/

# Ask npm to install the dependencies
RUN npm install

# Copy across all our files
COPY . /src

# Expose our application port (3000)
EXPOSE 3000

# Start the application
CMD ["npm", "start"]

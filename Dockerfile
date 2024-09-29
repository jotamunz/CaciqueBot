# Use an official Node.js runtime as the base image
FROM node:18

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and yarn.lock (if available)
COPY package.json ./
COPY yarn.lock ./

# Install FFmpeg
RUN apt-get update && apt-get install -y ffmpeg

# Install project dependencies
RUN yarn install

# Copy the rest of the application code
COPY . .

# Expose the port your app runs on (if applicable)
# EXPOSE 3000

# Command to run the application
CMD ["yarn", "start"]

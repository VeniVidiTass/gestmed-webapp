FROM node:18-alpine

# Install curl for healthchecks
RUN apk add --no-cache curl

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

# Use PORT environment variable for dynamic port exposure
ARG PORT=3000
EXPOSE $PORT

CMD ["npm", "run", "dev"]

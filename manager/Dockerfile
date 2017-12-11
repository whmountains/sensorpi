FROM node:9.2

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json ./
COPY yarn.lock ./
RUN yarn install

# Bundle app source
COPY . .

# Build the web ui
RUN yarn build

ENV DEBUG=sensorpi-manager:*

EXPOSE 3000
CMD [ "yarn", "start" ]
FROM node:9.2

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json ./
COPY yarn.lock ./
RUN yarn install

# Bundle web ui
COPY ./src ./src
COPY ./public ./public
RUN yarn build

COPY . .

ENV DEBUG=sensorpi-manager:*

EXPOSE 3000
CMD [ "yarn", "start" ]
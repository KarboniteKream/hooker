FROM node:10.16.3-jessie-slim

RUN mkdir /app
WORKDIR /app
COPY . .
RUN yarn install

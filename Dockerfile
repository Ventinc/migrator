FROM node:12.6.0-alpine as build-deps

RUN apk update && apk upgrade && \
  apk add --update git && \
  apk add --update openssh && \
  apk add --update bash && \
  apk add --update wget && \
  npm i -g yarn

WORKDIR /usr/src/app

COPY package.json ./
# COPY yarn.lock ./
RUN yarn

COPY . .
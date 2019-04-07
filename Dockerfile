ARG NODE_VERSION=11.13.0-alpine

FROM node:${NODE_VERSION}
WORKDIR /htmlspitter
EXPOSE 8000
COPY package.json package-lock.json ./
RUN npm install
ENTRYPOINT npm run start
COPY . ./
RUN npm run build
ARG NODE_VERSION=12.0.0

FROM node:${NODE_VERSION}-alpine AS builder
WORKDIR /htmlspitter
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1
COPY package.json package-lock.json ./
RUN npm install
COPY . ./
RUN npm t
RUN npm run build

FROM node:${NODE_VERSION}-alpine
WORKDIR /htmlspitter
EXPOSE 8000
RUN echo @edge http://nl.alpinelinux.org/alpine/edge/community >> /etc/apk/repositories && \
    echo @edge http://nl.alpinelinux.org/alpine/edge/main >> /etc/apk/repositories && \
    apk add --update --progress \
    ca-certificates chromium@edge nss@edge freetype@edge harfbuzz@edge ttf-freefont@edge && \
    rm -rf /var/cache/* && \
    mkdir /var/cache/apk
RUN addgroup -S chromium && \
    adduser -S -g chromium chromium && \
    mkdir -p /home/chromium/Downloads && \
    chown -R chromium:chromium /home/chromium && \
    chown -R chromium:chromium /htmlspitter
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1 \
    CHROME_BIN=/usr/bin/chromium-browser \
    CHROME_PATH=/usr/lib/chromium/ \
    NODE_ENV=production
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=1 CMD [ "node", "./build/healthcheck.js" ]
ENTRYPOINT [ "node", "./build/main.js" ]
COPY package.json package-lock.json ./
RUN npm install --only=prod
COPY --from=builder /htmlspitter/build /htmlspitter/build
USER chromium
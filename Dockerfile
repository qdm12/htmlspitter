ARG NODE_VERSION=13.2

FROM node:${NODE_VERSION}-buster-slim AS builder
WORKDIR /htmlspitter
COPY package.json package-lock.json ./
RUN npm install
COPY . ./
RUN npm t
RUN npm run build

FROM node:${NODE_VERSION}-buster-slim
ARG GOOGLE_CHROME_BRANCH=beta
ARG VERSION
ARG BUILD_DATE
ARG VCS_REF
LABEL \
    org.opencontainers.image.authors="quentin.mcgaw@gmail.com" \
    org.opencontainers.image.created=$BUILD_DATE \
    org.opencontainers.image.version="$VERSION" \
    org.opencontainers.image.revision=$VCS_REF \
    org.opencontainers.image.url="https://github.com/qdm12/htmlspitter" \
    org.opencontainers.image.documentation="https://github.com/qdm12/htmlspitter/blob/master/README.md" \
    org.opencontainers.image.source="https://github.com/qdm12/htmlspitter" \
    org.opencontainers.image.title="HTMLSpitter" \
    org.opencontainers.image.description="Lightweight Docker image with NodeJS server to spit out HTML from loaded JS using Puppeteer and Chrome"
WORKDIR /htmlspitter
EXPOSE 8000
RUN apt-get -qq update && \
    apt-get -qq install -y --no-install-recommends gnupg2 wget && \
    wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - && \
    apt-get -qq remove -y wget gnupg2 && \
    sh -c 'echo "deb http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' && \
    apt-get -qq update && \
    apt-get -qq install -y --no-install-recommends google-chrome-${GOOGLE_CHROME_BRANCH} && \
    rm -rf /var/lib/apt/lists/*
RUN groupadd -r nonrootgroup && \
    useradd -r -g nonrootgroup -G audio,video nonrootuser && \
    mkdir -p /home/nonrootuser/Downloads && \
    chown -R nonrootuser:nonrootgroup /home/nonrootuser && \
    chown -R nonrootuser:nonrootgroup /htmlspitter
ENV CHROME_BIN=/usr/bin/google-chrome-${GOOGLE_CHROME_BRANCH} \
    NODE_ENV=production
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=1 CMD [ "node", "./healthcheck.js" ]
ENTRYPOINT [ "node", "./main.js" ]
COPY package.json package-lock.json ./
RUN npm install --only=prod
COPY --from=builder --chown=nonrootuser:nonrootgroup /htmlspitter/build /htmlspitter
USER nonrootuser
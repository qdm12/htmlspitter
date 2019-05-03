ARG NODE_VERSION=12.0.0

FROM node:${NODE_VERSION}-alpine AS builder
WORKDIR /htmlspitter
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1
COPY package.json package-lock.json ./
RUN npm install
COPY . ./
RUN npm t
RUN npm run build

FROM node:${NODE_VERSION}-slim
WORKDIR /htmlspitter
EXPOSE 8000
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - && \
    sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' && \
    apt-get update && \
    apt-get install -y google-chrome-unstable fonts-ipafont-gothic \
    fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst ttf-freefont \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*
RUN groupadd -r chromium && \
    useradd -r -g chromium -G audio,video chromium && \
    mkdir -p /home/chromium/Downloads && \
    chown -R chromium:chromium /home/chromium && \
    chown -R chromium:chromium /htmlspitter
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1 \
    CHROME_BIN=/usr/bin/google-chrome-unstable \
    NODE_ENV=production
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=1 CMD [ "node", "./healthcheck.js" ]
ENTRYPOINT [ "node", "./main.js" ]
COPY package.json package-lock.json ./
RUN npm install --only=prod
COPY --from=builder /htmlspitter/build /htmlspitter
USER chromium
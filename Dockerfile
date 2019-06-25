ARG NODE_VERSION=12.4.0

FROM node:${NODE_VERSION}-alpine AS builder
WORKDIR /htmlspitter
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1
COPY package.json package-lock.json ./
RUN npm install
COPY . ./
RUN npm t
RUN npm run build

FROM node:${NODE_VERSION}-slim
ARG GOOGLE_CHROME_UNSTABLE=yes
LABEL org.label-schema.schema-version="1.0.0-rc1" \
    maintainer="quentin.mcgaw@gmail.com" \
    org.label-schema.build-date=$BUILD_DATE \
    org.label-schema.vcs-ref=$VCS_REF \
    org.label-schema.vcs-url="https://github.com/qdm12/htmlspitter" \
    org.label-schema.url="https://github.com/qdm12/htmlspitter" \
    org.label-schema.vcs-description="NodeJS server to spit out HTML from loaded JS using Puppeteer" \
    org.label-schema.vcs-usage="https://github.com/qdm12/htmlspitter/blob/master/README.md#how-to-use" \
    org.label-schema.docker.cmd="docker run -d --init -p 8000:8000 qmcgaw/htmlspitter" \
    org.label-schema.docker.cmd.devel="docker run -it --rm --init -p 8000:8000 qmcgaw/htmlspitter" \
    org.label-schema.docker.params="See Github" \
    image-size="569MB" \
    ram-usage="100MB minimum" \
    cpu-usage="Medium to high"
WORKDIR /htmlspitter
EXPOSE 8000
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - && \
    sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' && \
    apt-get -qq update && \
    if [ "$GOOGLE_CHROME_UNSTABLE" = "yes" ]; then export CHROME_EXT=unstable; else export CHROME_EXT=stable; fi && \
    apt-get -qq install -y --no-install-recommends \
    google-chrome-${CHROME_EXT} fonts-ipafont-gothic \
    fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst ttf-freefont && \
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
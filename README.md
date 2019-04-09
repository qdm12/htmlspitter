# htmlspitter

Light Docker image with NodeJS server to spit out HTML from loaded JS using Puppeteer

[![htmlspitter](https://github.com/qdm12/htmlspitter/raw/master/title.png)](https://hub.docker.com/r/qmcgaw/htmlspitter)

[![Build Status](https://travis-ci.org/qdm12/htmlspitter.svg?branch=master)](https://travis-ci.org/qdm12/htmlspitter)
[![Docker Build Status](https://img.shields.io/docker/cloud/build/qmcgaw/htmlspitter.svg)](https://hub.docker.com/r/qmcgaw/htmlspitter)

[![GitHub last commit](https://img.shields.io/github/last-commit/qdm12/htmlspitter.svg)](https://github.com/qdm12/htmlspitter/issues)
[![GitHub commit activity](https://img.shields.io/github/commit-activity/y/qdm12/htmlspitter.svg)](https://github.com/qdm12/htmlspitter/issues)
[![GitHub issues](https://img.shields.io/github/issues/qdm12/htmlspitter.svg)](https://github.com/qdm12/htmlspitter/issues)

[![Docker Pulls](https://img.shields.io/docker/pulls/qmcgaw/htmlspitter.svg)](https://hub.docker.com/r/qmcgaw/htmlspitter)
[![Docker Stars](https://img.shields.io/docker/stars/qmcgaw/htmlspitter.svg)](https://hub.docker.com/r/qmcgaw/htmlspitter)
[![Docker Automated](https://img.shields.io/docker/cloud/automated/qmcgaw/htmlspitter.svg)](https://hub.docker.com/r/qmcgaw/htmlspitter)

[![Image size](https://images.microbadger.com/badges/image/qmcgaw/htmlspitter.svg)](https://microbadger.com/images/qmcgaw/htmlspitter)
[![Image version](https://images.microbadger.com/badges/version/qmcgaw/htmlspitter.svg)](https://microbadger.com/images/qmcgaw/htmlspitter)

[![Donate PayPal](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://paypal.me/qdm12)

| Image size | RAM usage | CPU usage |
| --- | --- | --- |
| 380MB | Depends | Depends |

Docker image is based on:

- [NodeJS Alpine](https://hub.docker.com/_/node/)
- [Chromium 72.0.3626.121-r0](https://pkgs.alpinelinux.org/package/v3.9/community/x86_64/chromium) with its dependencies `harfbuzz` and `nss`
- [Puppeteer 1.14](https://github.com/GoogleChrome/puppeteer/releases/tag/v1.14.0)

Program is written in Typescript

## Description

The server accepts HTTP requests with two URL parameters:
- `url` which is the URL to prerender into HTML
- `wait` which is the load event to wait for before stopping the prerendering. It is optional and can be:
    - `load` (wait for the `load` event)
    - `domcontentloaded` (wait for the `DOMContentLoaded` event)
    - `networkidle0` (**default**, wait until there is no network connections for at least 500 ms)
    - `networkidle2` (wait until there are less than 3 network connections for at least 500 ms)

An example of a request is `http://localhost:8000/?url=https://github.com/qdm12/htmlspitter`.

The server also has a built in memory cache holding HTML records obtained during the last hour.

## Run the server

### Using Docker

1. Download [chrome.json](chrome.json) to allow Chromium to be launched inside the container (Alpine)

    ```sh
    wget https://raw.githubusercontent.com/qdm12/htmlspitter/master/chrome.json
    ```

1. Pull, run and test the container

    ```sh
    docker run -d --name=htmlspitter --init --security-opt seccomp=$(pwd)/chrome.json -p 8000:8000 qmcgaw/htmlspitter
    # Try a request
    wget -qO- http://localhost:8000/?url=https://github.com/qdm12/htmlspitter
    # Check the logs
    docker logs htmlspitter
    ```

    You can also use [docker-compose.yml](docker-compose.yml).

### Using local NodeJS

1. Make sure you have a recent NodeJS and NPM installed
1. Clone the repository

    ```sh
    git clone https://github.com/qdm12/htmlspitter
    cd htmlspitter
    ```

1. Install all the dependencies

    ```sh
    npm i
    ```

1. Transcompile the Typescript code to Javascript

    ```sh
    npm run build
    ```

1. Launch the server

    ```sh
    npm run start
    ```

1. In another terminal, test it with

    ```sh
    wget -qO- http://localhost:8000/?url=https://github.com/qdm12/htmlspitter
    ```

## Development

### Setup

1. Make sure you have a recent NodeJS and NPM installed
1. Clone the repository

    ```sh
    git clone https://github.com/qdm12/htmlspitter
    cd htmlspitter
    ```

1. Install all the dependencies

    ```sh
    npm i
    ```

1. You can then:
    - Run the sever with hot reload

        ```sh
        npx nodemon
        ```

    - Run tests

        ```sh
        npm run tests
        ```

    - Build Docker

        ```sh
        docker build -t qmcgaw/htmlspitter .
        ```

### TODOs

- Graceful shutdown, see [this](https://hackernoon.com/graceful-shutdown-in-nodejs-2f8f59d1c357?gi=3ce24ce63c60)
- Docker Healthcheck
- Compression Gzip
- Unit testing
- Environment variables
    - Verbosity level
    - cache size
    - cache duration
    - cache
- Add colors, emojis
- Redis cache (compressed string)
- ReactJS GUI
- Static binary in Scratch Docker image
- Multiple threads, need for mutex for cache?
- ARM image with Travis CI

## Credits

- To [jessfraz](https://github.com/jessfraz) for [chrome.json](chrome.json)

## License

This repository is under an [MIT license](https://github.com/qdm12/htmlspitter/master/license)
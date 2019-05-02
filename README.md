# HTMLSpitter

**Not production ready**

Lightweight Docker image with NodeJS server to spit out HTML from loaded JS using Puppeteer and Chromium

[![htmlspitter](https://github.com/qdm12/htmlspitter/raw/master/title.png)](https://hub.docker.com/r/qmcgaw/htmlspitter)

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

- [node:alpine](https://hub.docker.com/_/node/)
- [Chromium 72.0.3626.121-r0](https://pkgs.alpinelinux.org/package/v3.9/community/x86_64/chromium) with its dependencies `harfbuzz` and `nss`
- [Puppeteer 1.14](https://github.com/GoogleChrome/puppeteer/releases/tag/v1.14.0)

Main program is written in Typescript and NodeJS

## Description

Runs a NodeJS Express server accepting HTTP requests with two URL parameters:
- `url` which is the URL to prerender into HTML
- `wait` which is the load event to wait for before stopping the prerendering. It is **optional** and can be:
    - `load` (wait for the `load` event)
    - `domcontentloaded` (wait for the `DOMContentLoaded` event)
    - `networkidle0` (**default**, wait until there is no network connections for at least 500 ms)
    - `networkidle2` (wait until there are less than 3 network connections for at least 500 ms)

An example of a request is `http://localhost:8000/?url=https://github.com/qdm12/htmlspitter`.

### How to use

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

### Using NodeJS

1. Ensure you have NodeJS, NPM and Git installed

    ```sh
    node -v
    npm -v
    git -v
    ```

1. Clone the repository

    ```sh
    git clone https://github.com/qdm12/htmlspitter
    cd htmlspitter
    ```

1. Install all the dependencies

    ```sh
    npm i
    ```

1. Transcompile the Typescript code to Javascript and run `build/main.js`

    ```sh
    npm run start
    ```

1. In another terminal, test it with

    ```sh
    wget -qO- http://localhost:8000/?url=https://github.com/qdm12/htmlspitter
    ```

### Environment variables

| Environment variable | Default | Possible values | Description |
| --- | --- | --- | --- |
| `PORT` | `8000` | `1024 to 65535` | Internal HTTP server listening port |
| `CHROME_BIN` | `Puppeteer-bundled` | any path or `Puppeteer-bundled` | Path to Chromium binary |
| `MAX_PAGES` | `10` | number `> 0` | Max number of pages per Chromium instance at any time |
| `MAX_HITS` | `300` | number `> 0` | Max number of pages opened per Chromium instance during its lifetime (before relaunch) |
| `MAX_AGE_UNUSED` | `60` | number `> 0` | Max age in seconds of inactivity before the browser is closed |
| `MAX_BROWSERS` | `10` | number `> 0` | Max number of Chromium instances at any time |
| `MAX_CACHE_SIZE` | `10` | number `> 0` | Max number of MB stored in the cache |
| `MAX_QUEUE_SIZE` | `100` | number `> 0` | Max size of queue of pages per Chromium instance |
| `LOG` | `normal` | `normal` or `json` | Format to use to print logs |

## Details

### Program

- A built-in local memory cache holds HTML content obtained the last hour and is limited in the size of characters it contains.
- A built-in pool of Chromium instances creates and removes Chromium instances according to the server load.
- Each Chromium instance has a limited number of pages so that if one page crashes Chromium, not all page loads are lost.
- As Chromium caches content, each instance is destroyed and re-created once it reaches a certain number of page loads.

### Docker

- [chrome.json](chrome.json) is required as Alpine is more restricted than Debian for example. Launching a Chromium process from the NodeJS entrypoint is impossible otherwise. I am opened to suggestions from more advised users on how to find an alternative solution
- The `--init` flag is added to prevent eventual zombie Chromium processes to exist when the container stops the main NodeJS program.
- A built in healthcheck is implemented by running `node build/healthcheck.js` against a running instance.

### Performance considerations

- Chromium is written in C++ and multi threaded so it scales well with more CPU cores
- The NodeJS program should not be the bottleneck as all the work is done by Chromium
- The bottleneck is the limit of pages per Chromium instance, and heavily depends on RAM
- You can scale up by having multiple machines running the program, behind a load balancer

## Development

### Setup

1. Ensure you have NodeJS, NPM and Git installed

    ```sh
    node -v
    npm -v
    git -v
    ```

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
    - Run the sever with hot reload (performs `npm run start` on each .ts change)

        ```sh
        npx nodemon
        ```

    - Build Docker

        ```sh
        docker build -t qmcgaw/htmlspitter .
        ```

### TODOs

- Limit cache in terms of MB
- Limit Chromium instances in terms of RAM
- Compression Gzip
- Sync same URL with Redis (not getting twice the same URL)
- Sync Cache with Postgresql or Redis depending on size
- Limit data size in Postgresql according to time created
- Unit testing
- ReactJS GUI
- Static binary in Scratch Docker image
- ARM image with Travis CI

## Credits

- Credits to [jessfraz](https://github.com/jessfraz) for [chrome.json](chrome.json)

## License

This repository is under an [MIT license](https://github.com/qdm12/htmlspitter/master/license)
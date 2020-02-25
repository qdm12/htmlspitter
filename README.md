# HTMLSpitter

*Lightweight Docker image with NodeJS server to spit out HTML from loaded JS using Puppeteer and Chrome*

[Medium story: HTML from the Javascript world](https://medium.com/@quentin.mcgaw/html-from-the-javascript-world-c536f88d51df)

[![htmlspitter](https://github.com/qdm12/htmlspitter/raw/master/title.png)](https://hub.docker.com/r/qmcgaw/htmlspitter)

[![Build Status](https://travis-ci.org/qdm12/htmlspitter.svg?branch=master)](https://travis-ci.org/qdm12/htmlspitter)
[![Docker Pulls](https://img.shields.io/docker/pulls/qmcgaw/htmlspitter.svg)](https://hub.docker.com/r/qmcgaw/htmlspitter)
[![Docker Stars](https://img.shields.io/docker/stars/qmcgaw/htmlspitter.svg)](https://hub.docker.com/r/qmcgaw/htmlspitter)
[![Image size](https://images.microbadger.com/badges/image/qmcgaw/htmlspitter.svg)](https://microbadger.com/images/qmcgaw/htmlspitter)
[![Image version](https://images.microbadger.com/badges/version/qmcgaw/htmlspitter.svg)](https://microbadger.com/images/qmcgaw/htmlspitter)

[![Join Slack channel](https://img.shields.io/badge/slack-@qdm12-yellow.svg?logo=slack)](https://join.slack.com/t/qdm12/shared_invite/enQtOTE0NjcxNTM1ODc5LTYyZmVlOTM3MGI4ZWU0YmJkMjUxNmQ4ODQ2OTAwYzMxMTlhY2Q1MWQyOWUyNjc2ODliNjFjMDUxNWNmNzk5MDk)
[![GitHub last commit](https://img.shields.io/github/last-commit/qdm12/htmlspitter.svg)](https://github.com/qdm12/htmlspitter/issues)
[![GitHub commit activity](https://img.shields.io/github/commit-activity/y/qdm12/htmlspitter.svg)](https://github.com/qdm12/htmlspitter/issues)
[![GitHub issues](https://img.shields.io/github/issues/qdm12/htmlspitter.svg)](https://github.com/qdm12/htmlspitter/issues)

| Image size | RAM usage |
| --- | --- |
| 558MB | 110MB+ |

<details><summary>Click to show base components</summary><p>

- [node:13.2-buster-slim](https://hub.docker.com/_/node/)
- [Google Chrome 79 Beta](https://www.ubuntuupdates.org/package/google_chrome/stable/main/base/google-chrome-beta)
- [Puppeteer v2.00](https://github.com/GoogleChrome/puppeteer/releases/tag/v2.0.0)

</p></details>

The program is written in NodeJS with Typescript, in the [src](src) directory.

## Description

Runs a NodeJS server accepting HTTP requests with two URL parameters:

- `url` which is the URL to prerender into HTML
- `wait` which is the **optional** load event to wait for before stopping the prerendering. It can be:
    - `load` (wait for the `load` event)
    - `domcontentloaded` (wait for the `DOMContentLoaded` event)
    - `networkidle0` (**default**, wait until there is no network connections for at least 500 ms)
    - `networkidle2` (wait until there are less than 3 network connections for at least 500 ms)

For example:

```
http://localhost:8000/?url=https://github.com/qdm12/htmlspitter
```

- The server scales up Chromium instances if needed
- It limits the number of opened pages per instance to prevent one page crashing all the other pages
- It has a 1 hour cache for loaded HTML
- It has a queue system for requests once the maximum number of pages/chromium instances is reached
- **Not compatible** with other architectures than amd64 as Chrome-Beta is only built for `amd64` for now and is required.

## Usage

1. Run the container

    ```sh
    docker run -it --rm --init -p 8000:8000 qmcgaw/htmlspitter
    ```

    You can also use [docker-compose.yml](https://github.com/qdm12/htmlspitter/blob/master/docker-compose.yml).

## Environment variables

| Name | Default | Possible values | Description |
| --- | --- | --- | --- |
| `MAX_PAGES` | `10` | `-1` or integer larger than `0` | Max number of pages per Chromium instance at any time, `-1` for no max |
| `MAX_HITS` | `300` | `-1` or  integer larger than `0` | Max number of pages opened per Chromium instance during its lifetime (before relaunch), `-1` for no max |
| `MAX_AGE_UNUSED` | `60` | `-1` or integer larger than `0` | Max age in seconds of inactivity before the browser is closed, `-1` for no max |
| `MAX_BROWSERS` | `10` | `-1` or integer larger than `0` | Max number of Chromium instances at any time, `-1` for no max |
| `MAX_CACHE_SIZE` | `10` | `-1` or integer larger than `0` | Max number of MB stored in the cache, `-1` for no max |
| `MAX_QUEUE_SIZE` | `100` | `-1` or integer larger than `0` | Max size of queue of pages per Chromium instance, `-1` for no max |
| `LOG` | `normal` | `normal` or `json` | Format to use to print logs |
| `TIMEOUT` | `15000`  | `-1` or integer larger than `0` | Timeout in ms to load a page, `-1` for no timeout |

## Troubleshooting

### Chrome fails to launch

If you obtain the error:

```json
{"error":"Error: Failed to launch chrome!\nFailed to move to new namespace: PID namespaces supported, Network namespace supported, but failed: errno = Operation not permitted\n\n\nTROUBLESHOOTING: https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md\n"}
```

Then you might need to use **seccomp** with the [chrome.json](https://github.com/qdm12/htmlspitter/blob/master/chrome.json) file of this repository:

```sh
wget https://raw.githubusercontent.com/qdm12/htmlspitter/master/chrome.json
docker run -it --rm --init --security-opt seccomp=$(pwd)/chrome.json -p 8000:8000 qmcgaw/htmlspitter
```

## Details

### Program

- A built-in local memory cache holds HTML content obtained the last hour and is limited in the size of characters it contains.
- A built-in pool of Chromium instances creates and removes Chromium instances according to the server load.
- Each Chromium instance has a limited number of pages so that if one page crashes Chromium, not all page loads are lost.
- As Chromium caches content, each instance is destroyed and re-created once it reaches a certain number of page loads.

### Docker

- [chrome.json](https://github.com/qdm12/htmlspitter/blob/master/chrome.json) may be required depending on your host OS.
- The `--init` flag is added to prevent eventual zombie Chromium processes to exist when the container stops the main NodeJS program.
- A built in healthcheck is implemented by running `node build/healthcheck.js` against a running instance.

### Performance considerations

- Chromium is written in C++ and multi threaded so it scales well with more CPU cores
- The NodeJS program should not be the bottleneck because all the work is done by Chromium
- The bottleneck will be CPU and especially RAM used by Chromium instance(s)
- You can **scale up** by having multiple machines running the program, behind a load balancer

## Development

- Either use the Docker container development image with Visual Studio Code and the remote development extension
- Or install Node and NPM on your machine

```sh
# Install all dependencies
npm i
# Transcompile the Typescript code to Javascript and run build/main.js with
npm run start
```

Test it with, for example:

```sh
wget -qO- http://localhost:8000/?url=https://github.com/qdm12/htmlspitter
```

You can also:

- Run tests

    ```sh
    npm t
    ```

- Run the sever with hot reload (performs `npm run start` on each .ts change)

    ```sh
    npx nodemon
    ```

- Build Docker

    ```sh
    docker build -t qmcgaw/htmlspitter .
    ```

    You can also specify the branch of Google Chrome from `beta` (default), `stable` and `unstable`

    ```sh
    docker build -t qmcgaw/htmlspitter --build-arg GOOGLE_CHROME_BRANCH=unstable
    ```

- There are two environment variables you might find useful:
    - `PORT` to set the HTTP server listening port
    - `CHROME_BIN` which is the path to the Chrome binary or `Puppeteer-bundled`

### TODOs

- [ ] Show Chrome version at start
- [ ] Fake user agents
- [ ] Prevent recursive calls to localhost
- [ ] Format JSON or raw HTML
- [ ] Limit Chromium instances in terms of RAM
- [ ] Compression Gzip
- [ ] Sync same URL with Redis (not getting twice the same URL)
- [ ] Sync Cache with Postgresql or Redis depending on size
- [ ] Limit data size in Postgresql according to time created
- [ ] Unit testing
- [ ] ReactJS GUI
- [ ] Static binary in Scratch Docker image

## Credits

- Credits to [jessfraz](https://github.com/jessfraz) for [chrome.json](chrome.json)
- The Google Chrome team
- The Puppeteer developers

## License

This repository is under an [MIT license](https://github.com/qdm12/htmlspitter/master/license)

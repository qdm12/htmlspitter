# htmlspitter

NodeJS server to spit out HTML from loaded JS using Puppeteer

## Description

The server accepts HTTP requests with two URL parameters:
- `url` which is the URL to prerender into HTML
- `wait` which is the load event to wait for before stopping the prerendering. It is optional and can be:
    - `load`
    - `domcontentloaded`
    - `networkidle0` (default)
    - `networkidle2`

An example of a request is `http://localhost:8000/?url=https://github.com/qdm12/htmlspitter`, which could be obtained with for example:

```sh
wget http://localhost:8000/?url=https://github.com/qdm12/htmlspitter
```

It uses headless chromium with Puppeteer to obtain Javascript processed HTML.
It also has a built in memory cache holding HTML records obtained during a one hour period.

## Run the server

### Using Docker

1. Download [chrome.json](chrome.json) to allow Chromium to be launched inside the container (Alpine)

    ```sh
    wget https://raw.githubusercontent.com/qdm12/htmlspitter/master/chrome.json
    ```

1. Pull, run and test the container

    ```sh
    docker run -d --name=htmlspitter --security-opt seccomp=$(pwd)/chrome.json -p 8000:8000 qmcgaw/htmlspitter
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

## TODOs

- [ ] Dev readme
    - [ ] Nodemon
- [ ] Unit testing and remove jest
- [ ] Docker Healthcheck
- [ ] Environment variables
    - Verbosity level
- [ ] Static binary in Scratch Docker image
- [ ] Redis cache (compressed string)
- [ ] Multiple threads, need for mutex for cache?

## Credits

- To [jessfraz](https://github.com/jessfraz) for [chrome.json](chrome.json)
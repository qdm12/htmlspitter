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

## Run the server

### Using Docker

1. Pull the Docker image and launch the container

    ```sh
    docker run -d --name=htmlspitter -p 8000:8000 qmcgaw/htmlspitter
    ```

1. Check Docker logs

    ```sh
    docker logs -f htmlspitter
    ```

    Press CTRL+C to quit

### Using NodeJS only

Follow these commands:

```sh
# Clone the repository
git clone https://github.com/qdm12/htmlspitter
# Go to the cloned repository directory
cd htmlspitter
# Make sure you have a recent NodeJS and NPM installed
# Install the dependencies
npm i
# Transcompile the Typescript code to Javascript
npm run build
# Launch the server
npm run start
```

## TODOs

- [ ] Nodemon
- [ ] Unit testing and remove jest
- [ ] Terminate browser on exit of program
- [ ] Docker Healthcheck
- [ ] Environment variables
    - Verbosity level
- [ ] Static binary in Scratch Docker image
- [ ] Redis cache (compressed string)
- [ ] Multiple threads, need for mutex for cache?
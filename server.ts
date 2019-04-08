import express from 'express';
import { spitHTML, initEndpointIfNeeded, initBrowser } from './loader';

const main = async () => {
    console.log("\n =========================================");
    console.log(" =========================================");
    console.log(" ============== HTMLSpitter ==============");
    console.log(" =========================================");
    console.log(" =========================================");
    console.log(" == by github.com/qdm12 - Quentin McGaw ==\n");
    try {
        await initBrowser();
    } catch (e) {
        console.error("Cannot initialize chrome endpoint: ", e);
        return;
    }
    app.listen(8000, () => console.log("Server listening on port 8000"));
}

const app = express();

app.get('/', async (req, res, next) => {
    try {
        await initEndpointIfNeeded();
    } catch(e) {
        console.error("Cannot initialize chrome endpoint: ", e);
        return res.status(403).send({
            "error": String(e)
        });
    }
    const url = req.query["url"];
    if (url === undefined) {
        return res.status(403).send({
            "error": "url parameter not provided"
        });
    }
    const wait = req.query["wait"];
    try {
        const html = await spitHTML(url, wait);
        return res.status(200).send({
            "html":html
        });
    } catch(e) {
        console.error(e);
        return res.status(403).send({
            "error": String(e)
        });
    }
});

main();

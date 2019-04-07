import express from 'express';
import { spitHTML, initEndpointIfNeeded } from './loader';

const app = express();

type formattingType = "json" | "raw";

app.get('/', async (req, res, next) => {
    let init = null;
    try {
        init = initEndpointIfNeeded();
    } catch(e) {
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
    await init;
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

app.listen(8000, () => console.log("Server listening on port 8000"));

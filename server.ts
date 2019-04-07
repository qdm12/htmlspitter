import express from 'express';
import { spitHTML, initEndpointIfNeeded } from './loader';

const app = express();

type formattingType = "json" | "raw";

app.get('/', async (req, res, next) => {
    const init = initEndpointIfNeeded();
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
        const message = String(e);
        return res.status(403).send({
            "error": message
        });
    }
});

app.listen(8000, () => console.log("Server listening on port 8000"));

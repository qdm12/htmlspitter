import fetch from "node-fetch";

const getHealthcheck = async () => {
    try {
        const res = await fetch("http://localhost:8000");
        if (res.status !== 200) {
            console.log("status code is " + res.status);
            process.exit(1);
        }
    } catch (e) {
        console.log(String(e));
        process.exit(1);
    }
}

getHealthcheck();
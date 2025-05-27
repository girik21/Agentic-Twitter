import express from "express";
import dotenv from "dotenv";
// import { geminiContentAgent } from "./agents/contentAgent/contentAgent.js";
import { geminiMarketingAgent } from "./agents/marketingAgent/marketingAgent.js";

dotenv.config();

const app = express();
const port = 3000

geminiMarketingAgent();


app.get('/', (req, res) => {
    res.send("Hello from app root directory");
})

app.listen(port, () => {
    console.log(`App started on this port http://localhost:${port}`)
})
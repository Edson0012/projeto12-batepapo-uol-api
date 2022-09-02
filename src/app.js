import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dontev from "dotenv";
dontev.config();
const app = express();
app.use(cors())
app.use(express.json())

const mongoCLient = new MongoClient(process.env.MONGO_URI);

let db;

MongoClient.connect().then(() => {
    db = mongoCLient.db('')
})
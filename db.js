const { MongoClient } = require("mongodb");
require('dotenv').config();
const uri =
  `mongodb+srv://root:${process.env.DATABASE_PASSWORD}@cluster0.tpdoheo.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);
let db = null;

async function initizeDB() {
    try {
        await client.connect();
        db = client.db("article");
    }
    catch (error) { 
        console.log(error);
    }
}

function getDB(){
    return db;
}

exports.initizeDB = initizeDB;
exports.db = getDB;

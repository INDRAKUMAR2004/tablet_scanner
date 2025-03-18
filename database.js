const { MongoClient } = require("mongodb");

const MONGO_URI = "mongodb://127.0.0.1:27017"; // Local MongoDB connection string
const client = new MongoClient(MONGO_URI);

async function connectDB() {
    try {
        await client.connect();
        console.log("✅ Connected to MongoDB");
    } catch (error) {
        console.error("❌ MongoDB Connection Error:", error);
    }
}

connectDB();

const db = client.db("tabletDB"); // Database name
const tabletsCollection = db.collection("tablets"); // Collection name

module.exports = { tabletsCollection };
 

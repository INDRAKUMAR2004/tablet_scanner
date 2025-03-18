require('dotenv').config(); // Load environment variables from .env
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const admin = require("firebase-admin");
const { v4: uuidv4 } = require("uuid");

// Initialize Express App
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

const mongoURI = process.env.MONGO_URI;

app.get('/', (req, res) => {
    res.send('🚀 Server is running!');
});

// Load Firebase Credentials from Environment Variables
console.log("FIREBASE_PROJECT_ID:", process.env.FIREBASE_PROJECT_ID);
console.log("FIREBASE_CLIENT_EMAIL:", process.env.FIREBASE_CLIENT_EMAIL);
console.log("FIREBASE_PRIVATE_KEY:", process.env.FIREBASE_PRIVATE_KEY ? "Loaded" : "Not Loaded");

try {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: process.env.FIREBASE_PRIVATE_KEY,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
    });
    console.log("✅ Firebase Admin Initialized");
} catch (error) {
    console.error("❌ Error initializing Firebase Admin:", error);
    process.exit(1);
}

// MongoDB Connection
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("✅ Connected to MongoDB"))
    .catch((error) => {
        console.error("❌ MongoDB Connection Error:", error);
        process.exit(1);
    });

// Define MongoDB Model for Tablets
const tabletSchema = new mongoose.Schema({
    name: String,
    primary_use: String,
    image_url: String
});
const Tablet = mongoose.model("tabletDatabase", tabletSchema);

const corsOptions = {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
};

app.use(cors(corsOptions));

// API Route to Fetch Tablet Details
app.post('/tabletDatabase', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ message: "Tablet name is required" });
        }

        // Use regex to perform a case-insensitive search for matching tablet names
        const tablet = await Tablet.findOne({ name: { $regex: new RegExp(name, "i") } });

        if (!tablet) {
            return res.status(404).json({ message: "Tablet not found" });
        }

        res.json({
            "Product Name": tablet.name,
            "primary_use": tablet.primary_use,
            "Image urls": tablet.image_url
        });

    } catch (error) {
        console.error("❌ Error fetching tablet details:", error);
        res.status(500).json({ message: "Error fetching tablet data", error });
    }
});

// API Route for Call Notification (Existing Logic)
const { RtcTokenBuilder, RtcRole } = require("agora-token");

// if (!process.env.FIREBASE_CREDENTIALS) {
//     throw new Error("FIREBASE_CREDENTIALS environment variable is not set");
// }

// admin.initializeApp({
//     credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_CREDENTIALS)),
// });

const APP_ID = "009118564c524e0aa0c2ffb6a7c7d857";
const APP_CERTIFICATE = "362d15d43eaa4e80b29da557853825cd";

function generateAgoraToken(channelName) {
    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    return RtcTokenBuilder.buildTokenWithUid(
        APP_ID,
        APP_CERTIFICATE,
        channelName,
        0,
        role,
        privilegeExpiredTs
    );
}

app.use(bodyParser.json());

let pendingRequests = {};

async function getDoctorsByLanguage(lang) {
    try {
        const doctors = [];
        const querySnapshot = await admin.firestore().collection('Doctor')
            .where('language', '==', lang)
            .get();

        querySnapshot.forEach(doc => {
            const doctorData = doc.data();
            if (doctorData.isActive && doctorData.fcmToken) {
                doctors.push({
                    id: doc.id,
                    name: doctorData.name,
                    fcmToken: doctorData.fcmToken,
                });
            }
        });

        return doctors;
    } catch (error) {
        console.error("🔥 Error fetching doctors:", error);
        return [];
    }
}

app.get("/request-doctor", (req, res) => {
    res.send("hoiiii");
});

app.post("/request-doctor", async (req, res) => {
    const { language } = req.body;

    if (!language) {
        return res.status(400).json({ error: "Language is required" });
    }

    const doctors = await getDoctorsByLanguage(language);
    res.json({ doctors });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

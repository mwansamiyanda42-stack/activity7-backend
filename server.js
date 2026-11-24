require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();

const origins = (process.env.CLIENT_ORIGINS || "")
    .split(",")
    .map(value => value.trim())
    .filter(Boolean);

app.use(cors({ origin: origins }));
app.use(express.json());

// HOME PAGE: API GUIDE
app.get("/", (req, res) => {
    res.send(`
        <h1>Campus Maintenance Requests API</h1>
        <p>Backend API for managing campus maintenance requests.</p>

        <h2>Available Routes</h2>
        <ul>
            <li>GET /health</li>
            <li>GET /api/records</li>
            <li>GET /api/records/:id</li>
            <li>POST /api/records</li>
            <li>PUT /api/records/:id</li>
            <li>DELETE /api/records/:id</li>
        </ul>

        <h2>Record Fields</h2>
        <p>title, category, description, status</p>
        <p>Allowed statuses: Pending, In progress, Completed</p>
    `);
});

// DATABASE HEALTH CHECK
app.get("/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");
        res.status(200).json({
            message: "Server and database are working."
        });
    } catch (error) {
        console.error(error);
        res.status(503).json({
            message: "Database connection failed."
        });
    }
});

// RECORD ROUTES
app.use("/api/records", require("./routes/records"));

// UNKNOWN ROUTES
app.use((req, res) => {
    res.status(404).json({
        message: "Route not found."
    });
});

// ERROR HANDLING
app.use((error, req, res, next) => {
    console.error(error);

    if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
        return res.status(400).json({
            message: "Invalid JSON format."
        });
    }

    res.status(500).json({
        message: "An unexpected server error occurred."
    });
});

// START SERVER
const port = process.env.PORT || 3000;

app.listen(port, "0.0.0.0", () => {
    console.log(`Server listening on port ${port}`);
});
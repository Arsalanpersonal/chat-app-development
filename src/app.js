import express from 'express';
import dotenv from "dotenv";
import cookieParser from "cookie-parser"
import cors from "cors";
import { server, app } from "./lib/socket.io.js";
import { connectDB } from './lib/db.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

// Common middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: [
        process.env.FRONTEND_URL || "http://localhost:5173",
        process.env.WEB_FRONTEND_URL,
        process.env.APP_FRONTEND_URL
    ],
    credentials: true,
}));

// Import the routes
import authRoute from './routes/authRoute.js';
import messageRoute from './routes/messageRoute.js';

// Register the routes
app.get('/', (req, res) => res.send("Server is running"));
app.use('/api/user', authRoute);
app.use('/api/message', messageRoute);

// Start server and connect to database
server.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`);
    connectDB();
});

export default app;
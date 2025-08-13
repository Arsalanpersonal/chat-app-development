import express from 'express';
import dotenv from "dotenv";
import cookieParser from "cookie-parser"
import cors from "cors";
import { server, app } from "./lib/socket.io.js";


import { connectDB } from './lib/db.js';

dotenv.config();
// const app = express();

const PORT = process.env.PORT;

// Common middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    // origin: "http://localhost:5173",
    credentials: true,

}));

// Import the authRoute
import authRoute from './routes/authRoute.js';
import messageRoute from './routes/messageRoute.js';

// Register the route with a leading slash
app.get('/', (req,res) => res.send("Server is running"));
app.use('/api/user', authRoute);
app.use('/api/message', messageRoute);

server.listen(PORT, () => {
    console.log(`Server running on ip: http://127.0.0.1:${PORT}`);
    connectDB();
});

module.exports = app; // Export the app for testing or further use
import { Server } from "socket.io";
import express from "express";
import http from "http";
import { decodeHash } from "./util/appHasher.js"; // Adjust the import path as necessary


const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: [
            process.env.WEB_FRONTEND_URL,

            process.env.APP_FRONTEND_URL || "http://localhost:5001",
            "http://localhost:3000", // Add localhost for development
            // "*" // Consider removing this in production
            process.env.APP_FRONTEND_URL
        ],
        credentials: true,
        methods: ["GET", "POST"]
    }

    // testing 233123
});

const userSocketMap = {}; //{userId: socket.id}

export function getUserSocketId(userId) {
    return userSocketMap[userId];
}

io.on("connection", (socket) => {
    console.log("A user connected with socket.io", socket.id);


    const hash = socket.handshake.query.user_token;
    const userId = decodeHash(hash)?.userId;


    if (userId && userId !== 'null' && userId !== 'undefined') {
        userSocketMap[userId] = socket.id;
        console.log(`User ${userId} connected with socket ${socket.id}`);
        console.log("Current online users:", Object.keys(userSocketMap));

        // Emit updated online users list to all clients
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    } else {
        console.log("User connected without userId");
    }

    // Handle sending messages
    socket.on("sendMessage", (data) => {
        console.log("Message received:", data);

        // Broadcast message to all connected clients except sender
        socket.broadcast.emit("newMessage", {
            message: data.message,
            sender: data.sender,
            timestamp: data.timestamp
        });

        console.log("Message broadcasted to all clients");
    });

    // Handle private messages (optional)
    socket.on("sendPrivateMessage", (data) => {
        const { recipientId, message, sender, timestamp } = data;
        const recipientSocketId = getUserSocketId(recipientId);

        if (recipientSocketId) {
            io.to(recipientSocketId).emit("newMessage", {
                message,
                sender,
                timestamp,
                isPrivate: true
            });
            console.log(`Private message sent from ${sender} to ${recipientId}`);
        } else {
            console.log(`User ${recipientId} is not online`);
            // You could store the message in database here for offline delivery
        }
    });

    // Handle user typing indicators (optional)
    socket.on("typing", (data) => {
        socket.broadcast.emit("userTyping", {
            userId: data.userId,
            isTyping: data.isTyping
        });
    });

    // Handle join room (for group chats - optional)
    socket.on("joinRoom", (roomId) => {
        socket.join(roomId);
        console.log(`User ${userId} joined room ${roomId}`);

        socket.to(roomId).emit("userJoined", {
            userId: userId,
            message: `User ${userId} joined the chat`
        });
    });

    // Handle leave room (optional)
    socket.on("leaveRoom", (roomId) => {
        socket.leave(roomId);
        console.log(`User ${userId} left room ${roomId}`);

        socket.to(roomId).emit("userLeft", {
            userId: userId,
            message: `User ${userId} left the chat`
        });
    });

    // Handle disconnect
    socket.on("disconnect", () => {
        console.log("A user disconnected with socket.io", socket.id);

        if (userId) {
            delete userSocketMap[userId];
            console.log(`User ${userId} disconnected`);
            console.log("Remaining online users:", Object.keys(userSocketMap));

            // Emit updated online users list to all remaining clients
            io.emit("getOnlineUsers", Object.keys(userSocketMap));
        }
    });

    // Handle reconnection
    socket.on("reconnect", () => {
        console.log("User reconnected:", userId);
        if (userId) {
            userSocketMap[userId] = socket.id;
            io.emit("getOnlineUsers", Object.keys(userSocketMap));
        }
    });
});

export { io, server, app };
import dotenv from "dotenv";
import http from "http";

import app from "./app.js";
import connectDB from "./config/db.js";

import { initializeSocket } from "./socket/socket.js";
import { registerSocketEvents } from "./socket/socket.events.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {

    try {

        await connectDB();

        const server = http.createServer(app);

        const io = initializeSocket(server);

        registerSocketEvents(io);

        server.listen(PORT, () => {

            console.log(`🚀 Server running on port ${PORT}`);

        });

    } catch (error) {

        console.error(error);

    }

};

startServer();
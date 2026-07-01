import { Server } from "socket.io";
import { socketAuth } from "./socket.auth.js"

let io;

export const initializeSocket = (server) => {

    ;

    io = new Server(server, {

        cors: {

            origin: process.env.CLIENT_URL,

            credentials: true

        }

    });

    io.use(socketAuth);

    return io;

};

export const getIO = () => {

    if (!io) {

        throw new Error("Socket.IO is not initialized");

    }

    return io;

};
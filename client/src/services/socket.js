import { io } from "socket.io-client";

let socket = null;

export const connectSocket = () => {

    if (socket) {

        return socket;

    }

    socket = io(import.meta.env.VITE_API_URL, {

        withCredentials: true,

        transports: ["websocket"]

    });

    return socket;

};

export const disconnectSocket = () => {

    if (socket) {

        socket.disconnect();

        socket = null;

    }

};

export const getSocket = () => socket;
import jwt from "jsonwebtoken";
import * as cookie from "cookie";
import User from "../models/User.js";

export const socketAuth = async (socket, next) => {

    try {

        const cookies = cookie.parse(
            socket.handshake.headers.cookie || ""
        );

        const token = cookies.token;

        if (!token) {

            return next(new Error("Authentication failed"));

        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const user = await User.findById(decoded.id);

        if (!user) {

            return next(new Error("User not found"));

        }

        socket.user = user;

        next();

    } catch (error) {

        console.error("Socket Auth Error:", error);
        return next(new Error("Authentication failed"));

    }

};
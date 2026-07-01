import { getIO } from "../socket/socket.js";

export const sendRealtimeNotification = (
    userId,
    notification
) => {

    const io = getIO();

    io.to(`user:${userId}`).emit(
        "notification",
        notification
    );

};
import Workspace from "../models/Workspace.js";
const onlineUsers = new Map();

export const registerSocketEvents = (io) => {

    io.on("connection", (socket) => {

        console.log(
            `🟢 ${socket.user.fullName} connected`
        );

        socket.join(`user:${socket.user._id}`);

        console.log(
            `${socket.user.fullName} joined personal room`
        );

        // User Online
        onlineUsers.set(
            socket.user._id.toString(),
            socket.id
        );

        io.emit(
            "online-users",
            Array.from(onlineUsers.keys())
        );

        // Join Workspace
        socket.on("join-workspace", async (workspaceId) => {

            try {

                const workspace = await Workspace.findById(workspaceId);

                if (!workspace) {

                    return socket.emit("socket-error", {

                        message: "Workspace not found"

                    });

                }

                const isMember = workspace.members.some(

                    member =>

                        member.toString() ===

                        socket.user._id.toString()

                );

                if (!isMember) {

                    return socket.emit("socket-error", {

                        message: "Access denied"

                    });

                }

                socket.join(`workspace:${workspaceId}`);

                socket.emit("joined-workspace", {

                    workspaceId

                });

                console.log(

                    `${socket.user.fullName} joined workspace ${workspace.name}`

                );

            } catch (error) {

                console.error(error);

            }

        });

        // Join Task Room
        socket.on("join-task", (taskId) => {

            socket.join(`task:${taskId}`);

            console.log(
                `${socket.user.fullName} joined task ${taskId}`
            );

        });

        // Leave Task Room
        socket.on("leave-task", (taskId) => {

            socket.leave(`task:${taskId}`);

            console.log(
                `${socket.user.fullName} left task ${taskId}`
            );

        });

        // Leave Workspace
        socket.on("leave-workspace", (workspaceId) => {

            socket.leave(`workspace:${workspaceId}`);

            socket.emit("left-workspace", {

                workspaceId

            });

        });
        // Disconnect
        socket.on("disconnect", () => {

            console.log(
                `🔴 ${socket.user.fullName} disconnected`
            );

            onlineUsers.delete(
                socket.user._id.toString()
            );

            io.emit(
                "online-users",
                Array.from(onlineUsers.keys())
            );

        });

    });

};
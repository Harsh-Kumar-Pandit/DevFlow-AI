import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import workspaceRoutes from "./routes/workspace.routes.js";
import projectRoutes from "./routes/project.routes.js";
import taskRoutes from "./routes/task.routes.js";
import commentRoutes from "./routes/comment.routes.js";
import activityRoutes from "./routes/activity.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import searchRoutes from "./routes/search.routes.js";
import calendarRoutes from "./routes/calendar.routes.js";
import aiRoutes from "./routes/ai.routes.js";

const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use(
    "/api/workspace",
    workspaceRoutes
);

app.use("/api/project", projectRoutes);
app.use("/api/task", taskRoutes);
app.use("/api/comment", commentRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/notification", notificationRoutes);
app.use("/api/upload", uploadRoutes);
app.use(
    "/api/dashboard",
    dashboardRoutes
);
app.use(
    "/api/search",
    searchRoutes
);
app.use(
    "/api/calendar",
    calendarRoutes
);
app.use("/api/ai", aiRoutes);

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Welcome to DevFlow AI Backend 🚀"
    })
})

export default app;
import mongoose from "mongoose";

const workspaceInvitationSchema = new mongoose.Schema(
    {
        workspace: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Workspace",
            required: true
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        status: {
            type: String,
            enum: ["Pending", "Accepted", "Declined"],
            default: "Pending"
        },
        expiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days expiry
        }
    },
    {
        timestamps: true
    }
);

const WorkspaceInvitation = mongoose.model(
    "WorkspaceInvitation",
    workspaceInvitationSchema
);

export default WorkspaceInvitation;

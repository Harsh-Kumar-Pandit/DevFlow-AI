import mongoose from "mongoose";

const joinRequestSchema = new mongoose.Schema(
    {

        workspace: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Workspace",
            required: true
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        status: {
            type: String,
            enum: ["Pending", "Accepted", "Rejected"],
            default: "Pending"
        }

    },
    {
        timestamps: true
    }
);

const JoinRequest = mongoose.model(
    "JoinRequest",
    joinRequestSchema
);

export default JoinRequest;
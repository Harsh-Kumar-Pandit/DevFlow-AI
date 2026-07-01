import mongoose from "mongoose";

const workspaceSchema = new mongoose.Schema(
    {

        name: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            default: ""
        },

        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],

        inviteCode: {
            type: String,
            required: true,
            unique: true
        },
        projects: [

            {

                type: mongoose.Schema.Types.ObjectId,

                ref: "Project"

            }

        ]

    },
    {
        timestamps: true
    }
);

const Workspace = mongoose.model(
    "Workspace",
    workspaceSchema
);

export default Workspace;
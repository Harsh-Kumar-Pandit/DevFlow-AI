import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true
        },

        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true
        },

        avatar: {
            type: String,
            default: ""
        },

        role: {
            type: String,
            enum: ["USER", "OWNER"],
            default: "USER"
        },

        workspaces: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Workspace"
            }
        ],

        isVerified: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

const User = mongoose.model("User", userSchema);

export default User;
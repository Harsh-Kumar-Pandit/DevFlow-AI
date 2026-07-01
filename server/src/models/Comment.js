import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(

    {

        task: {

            type: mongoose.Schema.Types.ObjectId,

            ref: "Task",

            required: true

        },

        user: {

            type: mongoose.Schema.Types.ObjectId,

            ref: "User",

            required: true

        },

        message: {

            type: String,

            required: true,

            trim: true

        }

    },

    {

        timestamps: true

    }

);

const Comment = mongoose.model(
    "Comment",
    commentSchema
);

export default Comment;
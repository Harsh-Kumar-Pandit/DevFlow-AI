import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(

    {

        title: {

            type: String,

            required: true,

            trim: true

        },

        description: {

            type: String,

            default: ""

        },

        project: {

            type: mongoose.Schema.Types.ObjectId,

            ref: "Project",

            required: true

        },

        workspace: {

            type: mongoose.Schema.Types.ObjectId,

            ref: "Workspace",

            required: true

        },

        assignedTo: {

            type: mongoose.Schema.Types.ObjectId,

            ref: "User",

            default: null

        },

        createdBy: {

            type: mongoose.Schema.Types.ObjectId,

            ref: "User",

            required: true

        },

        status: {

            type: String,

            enum: [

                "Todo",

                "In Progress",

                "Review",

                "Completed"

            ],

            default: "Todo"

        },

        priority: {

            type: String,

            enum: [

                "Low",

                "Medium",

                "High",

                "Critical"

            ],

            default: "Medium"

        },

        dueDate: {

            type: Date

        },

        labels: [

            {

                type: String

            }

        ],

        comments: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Comment"
            }
        ],

        attachments: [

            {

                url: {

                    type: String

                },

                publicId: {

                    type: String

                },

                fileName: {

                    type: String

                },

                uploadedBy: {

                    type: mongoose.Schema.Types.ObjectId,

                    ref: "User"

                },

                uploadedAt: {

                    type: Date,

                    default: Date.now

                }

            }

        ],

    },

    {

        timestamps: true

    }

);

const Task = mongoose.model(
    "Task",
    taskSchema
);

export default Task;
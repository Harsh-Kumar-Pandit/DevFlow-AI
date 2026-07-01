import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(

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

        workspace: {

            type: mongoose.Schema.Types.ObjectId,

            ref: "Workspace",

            required: true

        },

        createdBy: {

            type: mongoose.Schema.Types.ObjectId,

            ref: "User",

            required: true

        },
        tasks: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Task"
            }
        ],

    },

    {

        timestamps: true

    }

);

const Project = mongoose.model(
    "Project",
    projectSchema
);

export default Project;
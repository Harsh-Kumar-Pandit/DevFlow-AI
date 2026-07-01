import Activity from "../models/Activity.js";
import Project from "../models/Project.js";
import Task from "../models/Task.js";

export const getProjectActivities = async (req, res) => {

    try {

        const { projectId } = req.params;

        const project = await Project.findById(projectId)
            .populate("workspace");

        if (!project) {

            return res.status(404).json({
                success: false,
                message: "Project not found"
            });

        }

        const isMember = project.workspace.members.some(
            member =>
                member.toString() ===
                req.user._id.toString()
        );

        if (!isMember) {

            return res.status(403).json({
                success: false,
                message: "Access denied"
            });

        }

        const activities = await Activity.find({
            project: projectId
        })
            .populate("user", "fullName username")
            .populate("task", "title")
            .sort({ createdAt: -1 });

        return res.status(200).json({

            success: true,

            count: activities.length,

            activities

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Internal Server Error"

        });

    }

};

export const getTaskActivities = async (req, res) => {

    try {

        const { taskId } = req.params;

        const task = await Task.findById(taskId)
            .populate("workspace");

        if (!task) {

            return res.status(404).json({
                success: false,
                message: "Task not found"
            });

        }

        const isMember = task.workspace.members.some(
            member =>
                member.toString() ===
                req.user._id.toString()
        );

        if (!isMember) {

            return res.status(403).json({
                success: false,
                message: "Access denied"
            });

        }

        const activities = await Activity.find({
            task: taskId
        })
            .populate("user", "fullName username")
            .sort({ createdAt: -1 });

        return res.status(200).json({

            success: true,

            count: activities.length,

            activities

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Internal Server Error"

        });

    }

};
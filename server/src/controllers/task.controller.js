import Task from "../models/Task.js";
import Project from "../models/Project.js";
import Workspace from "../models/Workspace.js";

import { createActivity } from "../services/activity.service.js";
import { createNotification } from "../services/notification.service.js";
import { getIO } from "../socket/socket.js";

export const createTask = async (req, res) => {

    try {

        const {
            title,
            description,
            projectId,
            assignedTo,
            priority,
            dueDate,
            labels
        } = req.body;

        if (!title || !projectId) {

            return res.status(400).json({
                success: false,
                message: "Title and Project are required"
            });

        }

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

        const task = await Task.create({

            title,

            description,

            project: projectId,

            workspace: project.workspace._id,

            assignedTo: assignedTo || null,

            createdBy: req.user._id,

            priority: priority || "Medium",

            dueDate,

            labels: labels || []

        });

        await createActivity({
            workspace: project.workspace._id,
            project: project._id,
            task: task._id,
            user: req.user._id,
            action: "CREATE_TASK",
            description: `Created task "${task.title}"`
        });

        project.tasks.push(task._id);

        await project.save();

        if (
            assignedTo &&
            assignedTo.toString() !== req.user._id.toString()
        ) {

            await createNotification({

                recipient: assignedTo,

                sender: req.user._id,

                type: "TASK_CREATED",

                message: `${req.user.fullName} assigned you a new task "${task.title}".`,

                workspace: task.workspace,

                project: task.project,

                task: task._id

            });

        }

        return res.status(201).json({

            success: true,

            message: "Task created successfully",

            task

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Internal Server Error"

        });

    }

};

export const getProjectTasks = async (req, res) => {

    try {

        const { projectId } = req.params;

        const {

            search,

            status,

            priority,

            assignedTo,

            label,

            sort = "-createdAt",

            page = 1,

            limit = 10

        } = req.query;

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

        const filter = {

            project: projectId

        };

        if (search) {

            filter.title = {

                $regex: search,

                $options: "i"

            };

        }

        if (status) {

            filter.status = status;

        }

        if (priority) {

            filter.priority = priority;

        }

        if (assignedTo) {

            filter.assignedTo = assignedTo;

        }

        if (label) {

            filter.labels = label;

        }

        const pageNumber = Number(page);

        const limitNumber = Number(limit);

        const skip = (pageNumber - 1) * limitNumber;

        const totalTasks = await Task.countDocuments(filter);

        const tasks = await Task.find(filter)

            .populate(

                "assignedTo",

                "fullName username email"

            )

            .populate(

                "createdBy",

                "fullName username"

            )

            .sort(sort)

            .skip(skip)

            .limit(limitNumber);

        return res.status(200).json({

            success: true,

            page: pageNumber,

            limit: limitNumber,

            totalTasks,

            totalPages: Math.ceil(totalTasks / limitNumber),

            count: tasks.length,

            tasks

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Internal Server Error"

        });

    }

};

export const getTask = async (req, res) => {

    try {

        const { taskId } = req.params;

        const task = await Task.findById(taskId)
            .populate("project", "name workspace")
            .populate("assignedTo", "fullName username email")
            .populate("createdBy", "fullName username email");

        if (!task) {

            return res.status(404).json({
                success: false,
                message: "Task not found"
            });

        }

        const workspace = await Workspace.findById(
            task.workspace
        );

        const isMember = workspace.members.some(
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

        return res.status(200).json({

            success: true,

            task

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Internal Server Error"

        });

    }

};

export const updateTask = async (req, res) => {

    try {

        const { taskId } = req.params;

        const {

            title,

            description,

            assignedTo,

            priority,

            dueDate,

            labels

        } = req.body;

        const task = await Task.findById(taskId)
            .populate("workspace");

        const previousAssignee = task.assignedTo
            ? task.assignedTo.toString()
            : null;

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

        if (title) {

            task.title = title;

        }

        if (description !== undefined) {

            task.description = description;

        }

        if (assignedTo !== undefined) {

            task.assignedTo = assignedTo;

        }

        if (priority) {

            task.priority = priority;

        }

        if (dueDate !== undefined) {

            task.dueDate = dueDate;

        }

        if (labels !== undefined) {

            task.labels = labels;

        }

        await task.save();
        if (

            assignedTo &&

            assignedTo.toString() !== previousAssignee &&

            assignedTo.toString() !== req.user._id.toString()

        ) {

            await createNotification({

                recipient: assignedTo,

                sender: req.user._id,

                type: "TASK_ASSIGNED",

                message: `${req.user.fullName} assigned you the task "${task.title}".`,

                workspace: task.workspace._id,

                project: task.project,

                task: task._id

            });

        }

        await createActivity({
            workspace: task.workspace,
            project: task.project,
            task: task._id,
            user: req.user._id,
            action: "UPDATE_TASK",
            description: `Updated task "${task.title}"`
        });

        return res.status(200).json({

            success: true,

            message: "Task updated successfully",

            task

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Internal Server Error"

        });

    }

};

export const updateTaskStatus = async (req, res) => {

    try {

        const { taskId } = req.params;

        const { status } = req.body;

        const allowedStatus = [
            "Todo",
            "In Progress",
            "Review",
            "Completed"
        ];

        if (!allowedStatus.includes(status)) {

            return res.status(400).json({
                success: false,
                message: "Invalid task status"
            });

        }

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

        task.status = status;

        await task.save();

        const io = getIO();

        io.to(`workspace:${task.workspace._id.toString()}`).emit(

            "task-status-updated",

            {

                taskId: task._id,

                title: task.title,

                status: task.status,

                priority: task.priority,

                assignedTo: task.assignedTo,

                workspace: task.workspace,

                updatedBy: req.user.fullName

            }

        );

        await createActivity({
            workspace: task.workspace._id, project: task.project,
            task: task._id,
            user: req.user._id,
            action: "STATUS_CHANGED",
            description: `Changed status to "${status}"`
        });

        return res.status(200).json({

            success: true,

            message: "Task status updated successfully",

            task

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Internal Server Error"

        });

    }

};

export const deleteTask = async (req, res) => {

    try {

        const { taskId } = req.params;

        const task = await Task.findById(taskId);

        if (!task) {

            return res.status(404).json({
                success: false,
                message: "Task not found"
            });

        }

        const project = await Project.findById(task.project)
            .populate("workspace");

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

        project.tasks = project.tasks.filter(
            id =>
                id.toString() !== task._id.toString()
        );

        await project.save();

        await Task.findByIdAndDelete(taskId);

        await createActivity({
            workspace: task.workspace,
            project: task.project,
            task: task._id,
            user: req.user._id,
            action: "DELETE_TASK",
            description: `Deleted task "${task.title}"`
        });

        return res.status(200).json({

            success: true,

            message: "Task deleted successfully"

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Internal Server Error"

        });

    }

};

export const addAttachment = async (req, res) => {

    try {

        const { taskId } = req.params;

        const {

            url,

            publicId,

            fileName

        } = req.body;

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

        task.attachments.push({

            url,

            publicId,

            fileName,

            uploadedBy: req.user._id

        });

        await task.save();

        await createActivity({

            workspace: task.workspace._id,

            project: task.project,

            task: task._id,

            user: req.user._id,

            action: "UPLOAD_FILE",

            description: `Uploaded "${fileName}"`

        });

        return res.status(200).json({

            success: true,

            message: "Attachment added successfully",

            attachments: task.attachments

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Internal Server Error"

        });

    }

};

export const deleteAttachment = async (req, res) => {

    try {

        const {

            taskId,

            publicId

        } = req.params;

        const task = await Task.findById(taskId)
            .populate("workspace");

        if (!task) {

            return res.status(404).json({
                success: false,
                message: "Task not found"
            });

        }

        task.attachments = task.attachments.filter(

            file =>

                file.publicId !== publicId

        );

        await task.save();

        await createActivity({

            workspace: task.workspace._id,

            project: task.project,

            task: task._id,

            user: req.user._id,

            action: "DELETE_ATTACHMENT",

            description: "Deleted attachment"

        });

        return res.status(200).json({

            success: true,

            message: "Attachment removed"

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Internal Server Error"

        });

    }

};
import Project from "../models/Project.js";
import Workspace from "../models/Workspace.js";
import Task from "../models/Task.js";
import { createNotification } from "../services/notification.service.js";

export const createProject = async (req, res) => {

    try {

        const {
            name,
            description,
            workspaceId
        } = req.body;

        if (!name || !workspaceId) {

            return res.status(400).json({
                success: false,
                message: "Project name and Workspace are required"
            });

        }

        const workspace = await Workspace.findById(workspaceId);

        if (!workspace) {

            return res.status(404).json({
                success: false,
                message: "Workspace not found"
            });

        }

        if (
            workspace.owner.toString() !==
            req.user._id.toString()
        ) {

            return res.status(403).json({
                success: false,
                message: "Only the workspace owner can create projects"
            });

        }
        const project = await Project.create({

            name,

            description,

            workspace: workspaceId,

            createdBy: req.user._id

        });

        workspace.projects.push(project._id);

        await workspace.save();

        const notifications = workspace.members
            .filter(
                member =>
                    member.toString() !== req.user._id.toString()
            )
            .map(member =>
                createNotification({

                    recipient: member,

                    sender: req.user._id,

                    type: "PROJECT_CREATED",

                    message: `${req.user.fullName} created a new project "${project.name}".`,

                    workspace: workspace._id,

                    project: project._id

                })
            );

        await Promise.all(notifications);
        return res.status(201).json({

            success: true,

            message: "Project created successfully",

            project

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Internal Server Error"

        });

    }

};

export const getWorkspaceProjects = async (req, res) => {

    try {

        const { workspaceId } = req.params;

        const workspace = await Workspace.findById(workspaceId);

        if (!workspace) {
            return res.status(404).json({
                success: false,
                message: "Workspace not found"
            });
        }

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

        const projects = await Project.find({
            workspace: workspaceId
        })
            .populate("createdBy", "fullName email")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: projects.length,
            projects
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });

    }

};

export const getProject = async (req, res) => {

    try {

        const { projectId } = req.params;

        const project = await Project.findById(projectId)
            .populate("workspace", "name")
            .populate("createdBy", "fullName username email");

        if (!project) {

            return res.status(404).json({
                success: false,
                message: "Project not found"
            });

        }

        const workspace = await Workspace.findById(project.workspace._id);

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

            project

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Internal Server Error"

        });

    }

};

export const updateProject = async (req, res) => {

    try {

        const { projectId } = req.params;

        const { name, description } = req.body;

        const project = await Project.findById(projectId)
            .populate("workspace");

        if (!project) {

            return res.status(404).json({
                success: false,
                message: "Project not found"
            });

        }

        if (
            project.workspace.owner.toString() !==
            req.user._id.toString()
        ) {

            return res.status(403).json({
                success: false,
                message: "Only the workspace owner can update projects"
            });

        }

        if (name) {

            project.name = name;

        }

        if (description !== undefined) {

            project.description = description;

        }

        await project.save();

        return res.status(200).json({

            success: true,

            message: "Project updated successfully",

            project

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Internal Server Error"

        });

    }

};

export const deleteProject = async (req, res) => {

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

        if (
            !project.workspace.members.some(
                member =>
                    member.toString() ===
                    req.user._id.toString()
            )
        ) {

            return res.status(403).json({
                success: false,
                message: "Access denied"
            });

        }

        project.workspace.projects =
            project.workspace.projects.filter(

                id =>

                    id.toString() !==

                    project._id.toString()

            );

        await project.workspace.save();

        await Project.findByIdAndDelete(projectId);

        return res.status(200).json({

            success: true,

            message: "Project deleted successfully"

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Internal Server Error"

        });

    }

};

export const getProjectBoard = async (req, res) => {

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

        const tasks = await Task.find({

            project: projectId

        })

            .populate(

                "assignedTo",

                "fullName username email"

            )

            .sort({

                createdAt: -1

            });

        const board = {

            Todo: [],

            "In Progress": [],

            Review: [],

            Completed: []

        };

        tasks.forEach(task => {

            board[task.status].push(task);

        });

        return res.status(200).json({

            success: true,

            board

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Internal Server Error"

        });

    }

};
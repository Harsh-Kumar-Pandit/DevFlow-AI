import { askAI } from "../services/ai.service.js";

import {

    generateTaskDescriptionPrompt,

    suggestPriorityPrompt,

    breakTaskPrompt

} from "../prompts/task.prompts.js";

import Project from "../models/Project.js";
import Task from "../models/Task.js";

import {
    projectSummaryPrompt
} from "../prompts/project.prompts.js";
import Workspace from "../models/Workspace.js";
import Activity from "../models/Activity.js";

import {
    sprintSummaryPrompt
} from "../prompts/sprint.prompts.js";
import { workspaceChatPrompt } from "../prompts/chat.prompts.js";

export const generateTaskDescription = async (req, res) => {

    try {

        const { title } = req.body;

        if (!title) {

            return res.status(400).json({

                success: false,

                message: "Task title is required"

            });

        }

        const prompt = generateTaskDescriptionPrompt(title);

        const description = await askAI(prompt);

        return res.status(200).json({

            success: true,

            description

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Failed to generate task description"

        });

    }

};

export const suggestPriority = async (req, res) => {

    try {

        const {

            title,

            description

        } = req.body;

        if (!title || !description) {

            return res.status(400).json({

                success: false,

                message: "Task title and description are required"

            });

        }

        const prompt = suggestPriorityPrompt(title, description);

        const priority = await askAI(prompt);

        return res.status(200).json({

            success: true,

            priority: priority.trim().toLowerCase()

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Failed to suggest priority"

        });

    }

};

export const breakTaskIntoSubtasks = async (req, res) => {

    try {

        const { task } = req.body;

        if (!task) {

            return res.status(400).json({

                success: false,

                message: "Task is required"

            });

        }

        const prompt = breakTaskPrompt(task);

        const response = await askAI(prompt);

        const subtasks = response

            .split("\n")

            .map(item => item.trim())

            .filter(item => item.length > 0);

        return res.status(200).json({

            success: true,

            subtasks

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Failed to generate subtasks"

        });

    }
};

export const generateProjectSummary = async (req, res) => {

    try {

        const { projectId } = req.body;

        if (!projectId) {

            return res.status(400).json({

                success: false,

                message: "Project ID is required"

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

        const tasks = await Task.find({

            project: projectId

        })

            .populate(

                "assignedTo",

                "fullName"

            );

        const formattedTasks = tasks.map(task => {

            return `
Title: ${task.title}
Status: ${task.status}
Priority: ${task.priority}
Assigned To: ${task.assignedTo?.fullName || "Unassigned"}
Due Date: ${task.dueDate || "Not Set"}
`;

        }).join("\n");

        const prompt = projectSummaryPrompt(

            project,

            formattedTasks

        );

        const summary = await askAI(prompt);

        return res.status(200).json({

            success: true,

            summary

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Failed to generate project summary"

        });

    }

};

export const generateSprintSummary = async (req, res) => {

    try {

        const { workspaceId } = req.body;

        if (!workspaceId) {

            return res.status(400).json({

                success: false,

                message: "Workspace ID is required"

            });

        }

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

        });

        const tasks = await Task.find({

            workspace: workspaceId

        })
            .populate("assignedTo", "fullName");

        const activities = await Activity.find({

            workspace: workspaceId

        })
            .populate("user", "fullName")
            .sort({ createdAt: -1 })
            .limit(20);

        const formattedProjects = projects.map(project => `

Project: ${project.name}

Description: ${project.description || "No Description"}

`).join("\n");

        const formattedTasks = tasks.map(task => `

Task: ${task.title}

Status: ${task.status}

Priority: ${task.priority}

Assigned To: ${task.assignedTo?.fullName || "Unassigned"}

`).join("\n");

        const formattedActivities = activities.map(activity => `

${activity.user?.fullName}

${activity.action}

${activity.createdAt}

`).join("\n");

        const prompt = sprintSummaryPrompt(

            workspace,

            formattedProjects,

            formattedTasks,

            formattedActivities

        );

        const summary = await askAI(prompt);

        return res.status(200).json({

            success: true,

            summary

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Failed to generate sprint summary"

        });

    }

};

export const workspaceAIChat = async (req, res) => {

    try {

        const {

            workspaceId,

            question

        } = req.body;

        if (!workspaceId || !question) {

            return res.status(400).json({

                success: false,

                message: "Workspace ID and question are required"

            });

        }

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

        });

        const tasks = await Task.find({

            workspace: workspaceId

        }).populate(

            "assignedTo",

            "fullName"

        );

        const activities = await Activity.find({

            workspace: workspaceId

        })

            .populate(

                "user",

                "fullName"

            )

            .sort({

                createdAt: -1

            })

            .limit(20);

        const formattedProjects = projects.map(project =>

            `Project: ${project.name}`

        ).join("\n");

        const formattedTasks = tasks.map(task =>

            `Task: ${task.title}
Status: ${task.status}
Priority: ${task.priority}
Assigned: ${task.assignedTo?.fullName || "Unassigned"}`

        ).join("\n\n");

        const formattedActivities = activities.map(activity =>

            `${activity.user?.fullName}: ${activity.action}`

        ).join("\n");

        const prompt = workspaceChatPrompt(

            workspace,

            formattedProjects,

            formattedTasks,

            formattedActivities,

            question

        );

        const answer = await askAI(prompt);

        return res.status(200).json({

            success: true,

            answer

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "AI Chat Failed"

        });

    }

};
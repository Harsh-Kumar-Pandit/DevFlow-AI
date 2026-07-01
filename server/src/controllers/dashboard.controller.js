import Workspace from "../models/Workspace.js";
import Project from "../models/Project.js";
import Task from "../models/Task.js";
import Activity from "../models/Activity.js";

export const getWorkspaceDashboard = async (req, res) => {

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
        });

        const tasks = await Task.find({
            workspace: workspaceId
        }).populate(
            "assignedTo",
            "fullName email"
        );

        const totalProjects = projects.length;

        const totalMembers = workspace.members.length;

        const totalTasks = tasks.length;

        const todo = tasks.filter(
            task => task.status === "Todo"
        ).length;

        const inProgress = tasks.filter(
            task => task.status === "In Progress"
        ).length;

        const review = tasks.filter(
            task => task.status === "Review"
        ).length;

        const completed = tasks.filter(
            task => task.status === "Completed"
        ).length;

        const completionPercentage =

            totalTasks === 0

                ? 0

                : Math.round((completed / totalTasks) * 100);

        const today = new Date();

        const overdueTasks = tasks.filter(task =>

            task.dueDate &&

            task.status !== "Completed" &&

            task.dueDate < today

        ).length;

        const todayTasks = tasks.filter(task => {

            if (!task.dueDate) return false;

            return (

                task.dueDate.toDateString() ===

                today.toDateString()

            );

        }).length;

        const weekEnd = new Date();

        weekEnd.setDate(today.getDate() + 7);

        const tasksDueThisWeek = tasks.filter(task =>

            task.dueDate &&

            task.dueDate >= today &&

            task.dueDate <= weekEnd

        ).length;

        const priority = {

            Low: 0,

            Medium: 0,

            High: 0,

            Critical: 0

        };

        tasks.forEach(task => {

            if (priority.hasOwnProperty(task.priority)) {

                priority[task.priority]++;

            }

        });

        const workloadMap = {};

        tasks.forEach(task => {

            if (!task.assignedTo) return;

            const id = task.assignedTo._id.toString();

            if (!workloadMap[id]) {

                workloadMap[id] = {

                    userId: id,

                    fullName: task.assignedTo.fullName,

                    email: task.assignedTo.email,

                    totalTasks: 0

                };

            }

            workloadMap[id].totalTasks++;

        });

        const memberWorkload = Object.values(workloadMap);

        const recentActivity = await Activity.find({

            workspace: workspaceId

        })
            .populate(
                "user",
                "fullName"
            )
            .sort({
                createdAt: -1
            })
            .limit(10);

        const dashboard = {

            totalProjects,

            totalMembers,

            totalTasks,

            todo,

            inProgress,

            review,

            completed,

            completionPercentage,

            overdueTasks,

            todayTasks,

            tasksDueThisWeek,

            priority,

            memberWorkload,

            recentActivity

        };

        return res.status(200).json({

            success: true,

            dashboard

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Internal Server Error"

        });

    }

};
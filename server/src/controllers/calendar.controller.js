import Project from "../models/Project.js";
import Task from "../models/Task.js";

export const getProjectCalendar = async (req, res) => {

    try {

        const { projectId } = req.params;

        const { month, year } = req.query;

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

        if (month && year) {

            const startDate = new Date(year, month - 1, 1);

            const endDate = new Date(year, month, 1);

            filter.dueDate = {

                $gte: startDate,

                $lt: endDate

            };

        }

        const tasks = await Task.find(filter)

            .populate(

                "assignedTo",

                "fullName username email"

            )

            .sort({

                dueDate: 1

            });

        return res.status(200).json({

            success: true,

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
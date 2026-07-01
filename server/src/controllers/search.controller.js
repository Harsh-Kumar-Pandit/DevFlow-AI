import Task from "../models/Task.js";

export const searchTasks = async (req, res) => {

    try {

        const {
            keyword,
            status,
            priority,
            assignedTo,
            label
        } = req.query;

        let filter = {};

        if (keyword) {

            filter.title = {

                $regex: keyword,

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

        const tasks = await Task.find(filter)
            .populate(
                "assignedTo",
                "fullName username"
            )
            .sort({
                createdAt: -1
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
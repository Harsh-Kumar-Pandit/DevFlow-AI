import Comment from "../models/Comment.js";
import Task from "../models/Task.js";
import { createActivity } from "../services/activity.service.js";
import { getIO } from "../socket/socket.js";

export const addComment = async (req, res) => {

    try {

        const {

            taskId,

            message

        } = req.body;

        if (!taskId || !message) {

            return res.status(400).json({

                success: false,

                message: "Task and message are required"

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

        const comment = await Comment.create({

            task: taskId,

            user: req.user._id,

            message

        });

        await createActivity({
            workspace: task.workspace,
            project: task.project,
            task: task._id,
            user: req.user._id,
            action: "COMMENT",
            description: "Added a comment"
        });

        task.comments.push(comment._id);

        await task.save();

        const populatedComment = await Comment.findById(comment._id)
            .populate(
                "user",
                "fullName username email"
            );

        const io = getIO();

        io.to(`task:${task._id.toString()}`).emit(

            "comment-added",

            populatedComment

        );

        return res.status(201).json({

            success: true,

            message: "Comment added successfully",

            comment

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Internal Server Error"

        });

    }

};

export const getTaskComments = async (req, res) => {

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

        const comments = await Comment.find({
            task: taskId
        })
            .populate(
                "user",
                "fullName username email"
            )
            .sort({
                createdAt: 1
            });

        return res.status(200).json({

            success: true,

            count: comments.length,

            comments

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Internal Server Error"

        });

    }

};

export const updateComment = async (req, res) => {

    try {

        const { commentId } = req.params;

        const { message } = req.body;

        const comment = await Comment.findById(commentId);

        if (!comment) {

            return res.status(404).json({
                success: false,
                message: "Comment not found"
            });

        }

        if (
            comment.user.toString() !==
            req.user._id.toString()
        ) {

            return res.status(403).json({
                success: false,
                message: "Only the comment owner can update it"
            });

        }

        comment.message = message;

        await comment.save();

        const io = getIO();

        io.to(`task:${comment.task.toString()}`).emit(

            "comment-updated",

            comment

        );

        return res.status(200).json({

            success: true,

            message: "Comment updated successfully",

            comment

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Internal Server Error"

        });

    }

};

export const deleteComment = async (req, res) => {

    try {

        const { commentId } = req.params;

        const comment = await Comment.findById(commentId);

        if (!comment) {

            return res.status(404).json({
                success: false,
                message: "Comment not found"
            });

        }

        if (
            comment.user.toString() !==
            req.user._id.toString()
        ) {

            return res.status(403).json({
                success: false,
                message: "Only the comment owner can delete it"
            });

        }

        await Task.findByIdAndUpdate(
            comment.task,
            {
                $pull: {
                    comments: comment._id
                }
            }
        );

        const io = getIO();

        io.to(`task:${comment.task.toString()}`).emit(

            "comment-deleted",

            {

                commentId

            }

        );

        await Comment.findByIdAndDelete(commentId);

        return res.status(200).json({

            success: true,

            message: "Comment deleted successfully"

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Internal Server Error"

        });

    }

};
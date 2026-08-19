import Workspace from "../models/Workspace.js";
import crypto from "crypto";
import JoinRequest from "../models/JoinRequest.js";
import User from "../models/User.js";
import { createNotification } from "../services/notification.service.js";
import WorkspaceMember from "../models/WorkspaceMember.js";
import { getIO } from "../socket/socket.js";

export const createWorkspace = async (req, res) => {

    try {

        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Workspace name is required"
            });
        }

        const inviteCode = crypto
            .randomBytes(4)
            .toString("hex")
            .toUpperCase();

        const workspace = await Workspace.create({

            name,

            description,

            owner: req.user._id,

            members: [req.user._id],

            inviteCode

        });

        req.user.workspaces.push(workspace._id);
        await req.user.save();

        return res.status(201).json({

            success: true,

            message: "Workspace Created Successfully",

            workspace

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Internal Server Error"

        });

    }

};

export const getMyWorkspaces = async (req, res) => {
    try {
        const workspaces = await Workspace.find({
            members: req.user._id
        })
            .select("name description inviteCode owner members createdAt")
            .populate("owner", "fullName email")
            .populate("members", "fullName email username");

        if (workspaces.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No workspaces found",
                count: 0,
                workspaces: []
            });
        }

        return res.status(200).json({
            success: true,
            message: "Workspaces fetched successfully",
            count: workspaces.length,
            workspaces
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });

    }

};

export const joinWorkspace = async (req, res) => {
    try {

        const { inviteCode } = req.body;

        if (!inviteCode) {
            return res.status(400).json({
                success: false,
                message: "Invite code is required"
            });
        }

        const workspace = await Workspace.findOne({ inviteCode });

        if (!workspace) {
            return res.status(404).json({
                success: false,
                message: "Workspace not found"
            });
        }

        const alreadyMember = workspace.members.some(
            member => member.toString() === req.user._id.toString()
        );

        if (alreadyMember) {
            return res.status(400).json({
                success: false,
                message: "You are already a member of this workspace"
            });
        }

        const request = await JoinRequest.findOne({
            workspace: workspace._id,
            user: req.user._id,
            status: "Pending"
        });

        if (request) {
            return res.status(400).json({
                success: false,
                message: "Join request already sent"
            });
        }

        await JoinRequest.create({
            workspace: workspace._id,
            user: req.user._id
        });

        return res.status(201).json({
            success: true,
            message: "Join request sent successfully"
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });

    }

};

export const getJoinRequests = async (req, res) => {
    try {

        const { workspaceId } = req.params;

        const workspace = await Workspace.findById(workspaceId);

        if (!workspace) {
            return res.status(404).json({
                success: false,
                message: "Workspace not found"
            });
        }

        if (
            workspace.owner.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        const requests = await JoinRequest.find({
            workspace: workspaceId,
            status: "Pending"
        })
            .populate("user", "fullName username email")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: requests.length,
            requests
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });

    }
};

export const acceptJoinRequest = async (req, res) => {
    try {
        const { requestId } = req.params;

        const joinRequest = await JoinRequest.findById(requestId)
            .populate("workspace")
            .populate("user");

        if (!joinRequest) {
            console.error(`Accept join request failed: Request ${requestId} not found.`);
            return res.status(404).json({
                success: false,
                message: "Join request not found"
            });
        }

        const workspace = joinRequest.workspace;
        const requestingUser = joinRequest.user;

        if (!workspace) {
            console.error(`Accept join request failed: Workspace associated with request ${requestId} not found.`);
            return res.status(404).json({
                success: false,
                message: "Workspace not found"
            });
        }

        // Verify current user is workspace owner
        if (workspace.owner.toString() !== req.user._id.toString()) {
            console.error(`Accept join request unauthorized: User ${req.user._id} is not owner of workspace ${workspace._id}.`);
            return res.status(403).json({
                success: false,
                message: "Access denied: Unauthorized"
            });
        }

        // Prevent duplicate memberships on Workspace model
        const alreadyMember = workspace.members.some(
            member => member.toString() === requestingUser._id.toString()
        );

        if (alreadyMember) {
            console.warn(`User ${requestingUser._id} is already a member of workspace ${workspace._id}.`);
            return res.status(400).json({
                success: false,
                message: "Already a member"
            });
        }

        // Add the user to the WorkspaceMember collection/table
        const existingMember = await WorkspaceMember.findOne({
            workspace: workspace._id,
            user: requestingUser._id
        });

        if (existingMember) {
            console.warn(`WorkspaceMember entry already exists for workspace ${workspace._id} and user ${requestingUser._id}.`);
        } else {
            await WorkspaceMember.create({
                workspace: workspace._id,
                user: requestingUser._id,
                role: "Member"
            });
            console.log(`Created WorkspaceMember entry for user ${requestingUser._id} in workspace ${workspace._id}.`);
        }

        // Add user to workspace members array (keep it in sync)
        workspace.members.push(requestingUser._id);
        await workspace.save();

        // Add workspace to user workspaces
        if (!requestingUser.workspaces.includes(workspace._id)) {
            requestingUser.workspaces.push(workspace._id);
            await requestingUser.save();
        }

        // Create notification
        await createNotification({
            recipient: requestingUser._id,
            sender: req.user._id,
            type: "JOIN_REQUEST_ACCEPTED",
            message: `Your request to join "${workspace.name}" has been accepted.`,
            workspace: workspace._id
        });

        // Delete join request
        await JoinRequest.findByIdAndDelete(requestId);
        console.log(`Deleted join request ${requestId}.`);

        // Populate updated workspace
        const updatedWorkspace = await Workspace.findById(workspace._id)
            .populate("owner", "fullName username email")
            .populate("members", "fullName username email");

        // Broadcast MEMBER_JOINED via Socket.IO
        try {
            const io = getIO();
            const payload = {
                workspaceId: workspace._id.toString(),
                userId: requestingUser._id.toString(),
                member: {
                    _id: requestingUser._id,
                    fullName: requestingUser.fullName,
                    email: requestingUser.email,
                    username: requestingUser.username
                },
                workspace: updatedWorkspace
            };
            io.to(`workspace:${workspace._id}`).emit("MEMBER_JOINED", payload);
            io.to(`user:${requestingUser._id}`).emit("MEMBER_JOINED", payload);
            console.log(`Socket broadcast MEMBER_JOINED for workspace ${workspace._id} and user ${requestingUser._id}`);
        } catch (socketErr) {
            console.error("Socket broadcast for MEMBER_JOINED failed:", socketErr);
        }

        return res.status(200).json({
            success: true,
            message: "Member added successfully",
            workspace: updatedWorkspace
        });

    } catch (error) {
        console.error("Error in acceptJoinRequest:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

export const rejectJoinRequest = async (req, res) => {
    try {
        const { requestId } = req.params;

        const joinRequest = await JoinRequest.findById(requestId)
            .populate("workspace")
            .populate("user");

        if (!joinRequest) {
            console.error(`Reject join request failed: Request ${requestId} not found.`);
            return res.status(404).json({
                success: false,
                message: "Join request not found"
            });
        }

        const workspace = joinRequest.workspace;
        const requestingUser = joinRequest.user;

        if (!workspace) {
            console.error(`Reject join request failed: Workspace associated with request ${requestId} not found.`);
            return res.status(404).json({
                success: false,
                message: "Workspace not found"
            });
        }

        // Verify current user is workspace owner
        if (workspace.owner.toString() !== req.user._id.toString()) {
            console.error(`Reject join request unauthorized: User ${req.user._id} is not owner of workspace ${workspace._id}.`);
            return res.status(403).json({
                success: false,
                message: "Access denied: Unauthorized"
            });
        }

        await JoinRequest.findByIdAndDelete(requestId);
        console.log(`Rejected and deleted join request ${requestId} for user ${requestingUser?._id}`);

        // Broadcast MEMBER_REJECTED via Socket.IO
        try {
            const io = getIO();
            const payload = {
                workspaceId: workspace._id.toString(),
                userId: requestingUser?._id?.toString()
            };
            io.to(`workspace:${workspace._id}`).emit("MEMBER_REJECTED", payload);
            if (requestingUser) {
                io.to(`user:${requestingUser._id}`).emit("MEMBER_REJECTED", payload);
            }
            console.log(`Socket broadcast MEMBER_REJECTED for workspace ${workspace._id} and user ${requestingUser?._id}`);
        } catch (socketErr) {
            console.error("Socket broadcast for MEMBER_REJECTED failed:", socketErr);
        }

        return res.status(200).json({
            success: true,
            message: "Join request rejected successfully"
        });

    } catch (error) {
        console.error("Error in rejectJoinRequest:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

export const removeMember = async (req, res) => {
    try {

        const { workspaceId, userId } = req.params;

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
                message: "Access denied"
            });
        }

        if (
            workspace.owner.toString() === userId
        ) {
            return res.status(400).json({
                success: false,
                message: "Owner cannot be removed"
            });
        }

        const memberExists = workspace.members.some(
            member => member.toString() === userId
        );

        if (!memberExists) {
            return res.status(404).json({
                success: false,
                message: "Member not found"
            });
        }

        workspace.members = workspace.members.filter(
            member => member.toString() !== userId
        );

        await workspace.save();

        const user = await User.findById(userId);

        if (user) {

            user.workspaces = user.workspaces.filter(
                id => id.toString() !== workspaceId
            );

            await user.save();
        }

        return res.status(200).json({
            success: true,
            message: "Member removed successfully"
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });

    }
};

export const leaveWorkspace = async (req, res) => {
    try {

        const { workspaceId } = req.params;

        const workspace = await Workspace.findById(workspaceId);

        if (!workspace) {
            return res.status(404).json({
                success: false,
                message: "Workspace not found"
            });
        }

        if (
            workspace.owner.toString() ===
            req.user._id.toString()
        ) {
            return res.status(400).json({
                success: false,
                message: "Workspace owner cannot leave. Delete the workspace or transfer ownership."
            });
        }

        const isMember = workspace.members.some(
            member =>
                member.toString() === req.user._id.toString()
        );

        if (!isMember) {
            return res.status(404).json({
                success: false,
                message: "You are not a member of this workspace"
            });
        }

        workspace.members = workspace.members.filter(
            member =>
                member.toString() !== req.user._id.toString()
        );

        await workspace.save();

        req.user.workspaces = req.user.workspaces.filter(
            id => id.toString() !== workspaceId
        );

        await req.user.save();

        return res.status(200).json({
            success: true,
            message: "You have left the workspace successfully"
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });

    }
};

export const deleteWorkspace = async (req, res) => {

    try {

        const { workspaceId } = req.params;

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
                message: "Access denied"
            });

        }

        await JoinRequest.deleteMany({
            workspace: workspaceId
        });

        await User.updateMany(

            {
                workspaces: workspaceId
            },

            {
                $pull: {
                    workspaces: workspaceId
                }
            }

        );

        await Workspace.findByIdAndDelete(workspaceId);

        return res.status(200).json({

            success: true,

            message: "Workspace deleted successfully"

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Internal Server Error"

        });

    }

};
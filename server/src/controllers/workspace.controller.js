import Workspace from "../models/Workspace.js";
import crypto from "crypto";
import JoinRequest from "../models/JoinRequest.js";
import User from "../models/User.js";
import { createNotification } from "../services/notification.service.js";

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
            .select("name description inviteCode owner createdAt")
            .populate("owner", "fullName email");

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
            return res.status(404).json({
                success: false,
                message: "Join request not found"
            });
        }

        if (
            joinRequest.workspace.owner.toString() !==
            req.user._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        const alreadyMember = joinRequest.workspace.members.some(
            member =>
                member.toString() ===
                joinRequest.user._id.toString()
        );

        if (alreadyMember) {
            return res.status(400).json({
                success: false,
                message: "User is already a member"
            });
        }

        // Add user to workspace
        joinRequest.workspace.members.push(joinRequest.user._id);
        await joinRequest.workspace.save();

        // Add workspace to user
        joinRequest.user.workspaces.push(joinRequest.workspace._id);
        await joinRequest.user.save();

        await createNotification({

            recipient: joinRequest.user._id,

            sender: req.user._id,

            type: "JOIN_REQUEST_ACCEPTED",

            message: `Your request to join "${joinRequest.workspace.name}" has been accepted.`,

            workspace: joinRequest.workspace._id

        });

        // Delete join request
        await JoinRequest.findByIdAndDelete(requestId);

        return res.status(200).json({
            success: true,
            message: "Member added successfully"
        });

    } catch (error) {

        console.error(error);

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
            .populate("workspace");

        if (!joinRequest) {
            return res.status(404).json({
                success: false,
                message: "Join request not found"
            });
        }

        if (
            joinRequest.workspace.owner.toString() !==
            req.user._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        await JoinRequest.findByIdAndDelete(requestId);

        return res.status(200).json({
            success: true,
            message: "Join request rejected successfully"
        });

    } catch (error) {

        console.error(error);

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
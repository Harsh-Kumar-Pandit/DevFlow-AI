import WorkspaceInvitation from "../models/WorkspaceInvitation.js";
import Workspace from "../models/Workspace.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { createNotification } from "../services/notification.service.js";

// POST /workspace/:workspaceId/invite
export const inviteMember = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const { receiverId } = req.body;

        if (!receiverId) {
            return res.status(400).json({
                success: false,
                message: "Receiver user ID is required"
            });
        }

        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({
                success: false,
                message: "Workspace not found"
            });
        }

        // Only Owner can invite
        if (workspace.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Only the workspace owner can invite members"
            });
        }

        // Check if receiver exists
        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Check if user is already a member
        if (workspace.members.some(m => m.toString() === receiverId.toString())) {
            return res.status(400).json({
                success: false,
                message: "User is already a member of this workspace"
            });
        }

        // Check if invitation is already pending
        const existingInvitation = await WorkspaceInvitation.findOne({
            workspace: workspaceId,
            receiver: receiverId,
            status: "Pending"
        });

        if (existingInvitation) {
            return res.status(400).json({
                success: false,
                message: "An invitation is already pending for this user"
            });
        }

        // Create pending invitation
        const invitation = await WorkspaceInvitation.create({
            workspace: workspaceId,
            sender: req.user._id,
            receiver: receiverId,
            status: "Pending"
        });

        // Send real-time notification
        await createNotification({
            recipient: receiverId,
            sender: req.user._id,
            type: "WORKSPACE_INVITATION",
            message: `${req.user.fullName} invited you to join Workspace ${workspace.name}`,
            workspace: workspaceId,
            invitation: invitation._id
        });

        return res.status(201).json({
            success: true,
            message: "Invitation sent successfully",
            invitation
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

// POST /invitations/:id/accept
export const acceptInvitation = async (req, res) => {
    try {
        const { id } = req.params;

        const invitation = await WorkspaceInvitation.findById(id);
        if (!invitation) {
            return res.status(404).json({
                success: false,
                message: "Invitation not found"
            });
        }

        if (invitation.status !== "Pending") {
            return res.status(400).json({
                success: false,
                message: `Invitation has already been ${invitation.status.toLowerCase()}`
            });
        }

        // Verify that the current user is the receiver
        if (invitation.receiver.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized to accept this invitation"
            });
        }

        invitation.status = "Accepted";
        await invitation.save();

        // Add user to workspace members
        const workspace = await Workspace.findById(invitation.workspace);
        if (workspace) {
            if (!workspace.members.some(m => m.toString() === invitation.receiver.toString())) {
                workspace.members.push(invitation.receiver);
                await workspace.save();
            }
        }

        // Update receiver's workspaces array
        const user = await User.findById(invitation.receiver);
        if (user) {
            if (!user.workspaces.some(w => w.toString() === invitation.workspace.toString())) {
                user.workspaces.push(invitation.workspace);
                await user.save();
            }
        }

        // Send acceptance notification to sender
        if (workspace) {
            await createNotification({
                recipient: invitation.sender,
                sender: invitation.receiver,
                type: "JOIN_ACCEPTED",
                message: `${user.fullName} accepted your invitation to join ${workspace.name}`,
                workspace: workspace._id
            });
        }

        // Dismiss the workspace invitation notifications for this receiver and workspace
        await Notification.deleteMany({
            recipient: req.user._id,
            workspace: invitation.workspace,
            type: "WORKSPACE_INVITATION"
        });

        return res.status(200).json({
            success: true,
            message: "Invitation accepted successfully"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

// POST /invitations/:id/decline
export const declineInvitation = async (req, res) => {
    try {
        const { id } = req.params;

        const invitation = await WorkspaceInvitation.findById(id);
        if (!invitation) {
            return res.status(404).json({
                success: false,
                message: "Invitation not found"
            });
        }

        if (invitation.status !== "Pending") {
            return res.status(400).json({
                success: false,
                message: `Invitation has already been ${invitation.status.toLowerCase()}`
            });
        }

        // Verify that the current user is the receiver
        if (invitation.receiver.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized to decline this invitation"
            });
        }

        // Remove invitation
        await invitation.deleteOne();

        // Dismiss notification
        await Notification.deleteMany({
            recipient: req.user._id,
            workspace: invitation.workspace,
            type: "WORKSPACE_INVITATION"
        });

        return res.status(200).json({
            success: true,
            message: "Invitation declined successfully"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

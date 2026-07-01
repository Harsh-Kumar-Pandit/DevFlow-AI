import Notification from "../models/Notification.js";
import { sendRealtimeNotification } from "./socketNotification.service.js";

export const createNotification = async ({
    recipient,
    sender,
    type,
    message,
    workspace = null,
    project = null,
    task = null
}) => {

    const notification = await Notification.create({

        recipient,

        sender,

        type,

        message,

        workspace,

        project,

        task

    });

    sendRealtimeNotification(

        recipient,

        notification

    );

    return notification;

};
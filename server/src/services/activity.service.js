import Activity from "../models/Activity.js";

export const createActivity = async ({
    workspace,
    project,
    task = null,
    user,
    action,
    description
}) => {

    return await Activity.create({
        workspace,
        project,
        task,
        user,
        action,
        description
    });

};
import mongoose from "mongoose";
import dotenv from "dotenv";
import Workspace from "./src/models/Workspace.js";
import User from "./src/models/User.js";
import JoinRequest from "./src/models/JoinRequest.js";
import WorkspaceMember from "./src/models/WorkspaceMember.js";

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        const workspaces = await Workspace.find().populate("owner", "fullName email").populate("members", "fullName email");
        console.log("--- WORKSPACES ---");
        for (const w of workspaces) {
            console.log(`Workspace: ${w.name} (${w._id})`);
            console.log(`  Owner: ${w.owner?.fullName} (${w.owner?.email})`);
            console.log(`  Invite Code: ${w.inviteCode}`);
            console.log(`  Members Count: ${w.members?.length}`);
            w.members?.forEach(m => {
                console.log(`    - ${m.fullName} (${m.email})`);
            });
        }

        const joinRequests = await JoinRequest.find().populate("workspace", "name").populate("user", "fullName email");
        console.log("--- JOIN REQUESTS ---");
        for (const jr of joinRequests) {
            console.log(`Request ID: ${jr._id} [Status: ${jr.status}]`);
            console.log(`  Workspace: ${jr.workspace?.name} (${jr.workspace?._id})`);
            console.log(`  User: ${jr.user?.fullName} (${jr.user?.email})`);
        }

        const members = await WorkspaceMember.find().populate("workspace", "name").populate("user", "fullName email");
        console.log("--- WORKSPACE MEMBERS ---");
        for (const m of members) {
            console.log(`Member: ${m.user?.fullName} in ${m.workspace?.name} [Role: ${m.role}]`);
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

run();

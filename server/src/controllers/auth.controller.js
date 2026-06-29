import User from "../models/User.js";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken.js";

export const registerUser = async (req, res) => {
    try {

        const { fullName, username, email, password } = req.body;

        if (!fullName || !username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        const existingUser = await User.findOne({
            $or: [
                { email },
                { username }
            ]
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email or Username already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            fullName,
            username,
            email,
            password: hashedPassword
        });

        const token = generateToken(user._id);

        res.cookie("token", token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(201).json({
            success: true,
            message: "Registration Successful",
            data: {
                id: user._id,
                fullName: user.fullName,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });

    }
};
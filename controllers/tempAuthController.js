const AuthModel = require('../models/authModel');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();


async function register(req, res) {
    try {
        const { email, password, first_name, last_name, phone_number } = req.body;
        if (!email || !password || !first_name || !last_name) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const existingUser = await AuthModel.findUserByEmail(normalizedEmail);

        if (existingUser) {
            return res.status(400).json({ error: "User already exists" });
        }

        await AuthModel.createUser({
            email: normalizedEmail,
            password,
            first_name,
            last_name,
            phone_number
        });

        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

async function login(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await AuthModel.findUserByEmail(email);
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign(
            {
                UserID: user.UserID,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                role: user.role || 'user'
            },
            process.env.JWT_SECRET_KEY,
            { expiresIn: "24h" }
        );

        res.status(200).json({
            message: "Login successful",
            token: token,
            user: {
                UserID: user.UserID,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                role: user.role || 'user',
                FullName: `${user.first_name} ${user.last_name}`.trim()
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

async function forgotPassword(req, res) {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: "Email required" });

        const user = await AuthModel.findUserByEmail(email);
        if (!user) return res.status(400).json({ error: "User not found" });

        const token = jwt.sign({ email }, process.env.RESET_SECRET, { expiresIn: "1h" });
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

        res.json({
            message: "Password reset link generated",
            resetUrl: resetUrl
        });
    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

async function resetPassword(req, res) {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!password) return res.status(400).json({ error: "Password required" });

        const payload = jwt.verify(token, process.env.RESET_SECRET);
        await AuthModel.updateUserPassword(payload.email, password);

        res.json({ message: "Password has been reset successfully" });
    } catch (error) {
        console.error("Reset password error:", error);
        if (error.name === 'TokenExpiredError') {
            return res.status(400).json({ error: "Token has expired" });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(400).json({ error: "Invalid token" });
        }
        res.status(500).json({ error: "Internal server error" });
    }
}


module.exports = { register, login, forgotPassword, resetPassword };
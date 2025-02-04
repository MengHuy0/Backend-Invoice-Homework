const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./models/user')

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

try {
    mongoose.connect(process.env.CONNECTION_STRING,
        { family: 4 }
    );
    console.log("Database connected successfully");
    app.listen(PORT, (err) => {
        if (err) console.log("Error in server setup");
        console.log("Server listening on Port http://localhost:" + PORT);
    });
}
catch (err) {
    console.log("Error in connecting to database", err);
}

app.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "User already exists" });
        if (!username || !password) {
            res.status(400).send("Please Enter Username and Password")
            return;
        }
        if (password.length < 8) {
            res.status(400).send("password must be at least 8 characters")
            return;
        }
        // Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();

        // Generate JWT Token
        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({ message: "User registered successfully", token })

    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
});

// **User Login Route**
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // **Check if user exists**
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        // **Compare Passwords**
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // **Generate JWT Token**
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // **Send Response**
        return res.status(200).json({
            message: "Login successful",
            user: { id: user._id, username: user.username, email: user.email }
        });
    }
    catch (error) {
        console.error("Error in login:", error);
        return res.status(500).json({ message: "Internal server error", error });
    }
});
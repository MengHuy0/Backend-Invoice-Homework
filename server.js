const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

// Middleware
app.use(cors());
app.use(bodyParser.json());



// mongoose.connect('mongodb://localhost:27017/invoiceapp', {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
// });

// const User = mongoose.model("User", new mongoose.Schema({
//     username: String,
//     email: String,
//     password: String
// }));

// Register endpoint
app.post("/register", async (req, res) => {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).send("User already exists");
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();
    res.status(201).send("User registered successfully");
});

// Login endpoint
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(400).send("Invalid credentials");
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).send("Invalid credentials");
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, "your-secret-key", { expiresIn: "1h" });
    res.json({ token });
});

// Add a new invoice
app.post('/invoices', async (req, res) => {
    const { invoiceId, customer, date, items, total } = req.body;

    const newInvoice = new Invoice({
        invoiceId,
        customer,
        date,
        items,
        total,
    });

    try {
        await newInvoice.save();
        res.status(201).json(newInvoice);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});






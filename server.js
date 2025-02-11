require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./models/user');
const Customer = require('./models/customer.js');
const Inventory = require('./models/inventory.js');
const Invoice = require('./models/invoice.js');
const ShopProfile = require('./models/shopProfile'); 
const authMiddleware = require('./middleware/authMiddleware.js');
const axios = require('axios')

// const shopProfileRoutes = require('./routes/shopProfile.routes.js');
// const invoiceRoutes = require('./routes/invoiceRoutes.js');
// const customerRoutes = require('./routes/customerRoutes.js');
// const inventoryRoutes = require('./routes/inventoryRoutes.js');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use('/api/shop-profile', shopProfileRoutes);
// app.use('/api/invoices', invoiceRoutes);
// app.use('/api/customers', customerRoutes);
// app.use('/api/inventory', inventoryRoutes);
// Database Connection
mongoose.connect(process.env.CONNECTION_STRING, { family: 4 })
    .then(() => {
        console.log("Database connected successfully");
        app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
    })
    .catch(err => console.error("Error in connecting to database", err));
// **User Registration**
app.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validation
        if (!username || !email || !password) return res.status(400).json({ message: "All fields are required" });
        if (password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters" });

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "User already exists" });

        // Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();

        // Generate JWT Token
        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({ message: "User registered successfully", token });

    } catch (error) {
        console.error("Error in registration:", error);
        res.status(500).json({ message: "Internal server error", error });
    }
});
// **User Login Route**
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "User not found" });

        // Compare Passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        // Generate JWT Token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
        // Send Response
        return res.status(200).json({
            message: "Login successful",
            token,
            user: { id: user._id, username: user.username, email: user.email }
        });

    } catch (error) {
        console.error("Error in login:", error);
        return res.status(500).json({ message: "Internal server error", error });
    }
});
// **Protected Route**
app.get('/protected', authMiddleware, (req, res) => {
    res.json({ message: "You have accessed a protected route", user: req.user });
});

//////////////////////////////////////////////////////////////////////////////////////

// ✅ Fetch all customers
app.get('/api/customers', async (req, res) => {
    try {
        const customers = await Customer.find();
        res.json(customers);
    } catch (error) {
        console.error("Error fetching customers:", error);
        res.status(500).json({ error: "Error fetching customers" });
    }
});

// ✅ Create a new customer
app.post('/api/customers', async (req, res) => {
    try {
        const customer = new Customer(req.body);
        await customer.save();
        res.status(201).json(customer);
    } catch (error) {
        console.error("Error creating customer:", error);
        res.status(500).json({ error: "Error creating customer" });
    }
});

// ✅ Fetch inventory items
app.get('/api/inventory', async (req, res) => {
    try {
        const items = await Inventory.find();
        res.json(items);
    } catch (error) {
        console.error("Error fetching inventory:", error);
        res.status(500).json({ error: "Error fetching inventory" });
    }
});

// ✅ Add a new inventory item
app.post('/api/inventory', async (req, res) => {
    try {
        const item = new Inventory(req.body);
        await item.save();
        res.status(201).json(item);
    } catch (error) {
        console.error("Error adding inventory item:", error);
        res.status(500).json({ error: "Error adding inventory item" });
    }
});

// ✅ Fetch all invoices (with populated customer details)
app.get('/api/invoices',  async (req, res) => {
    try {
        const invoices = await Invoice.find().populate('customer');
        res.json(invoices);
    } catch (error) {
        console.error("Error fetching invoices:", error);
        res.status(500).json({ error: "Error fetching invoices" });
    }
});

// ✅ Create a new invoice
app.post('/api/invoices', async (req, res) => {
    try {
        console.log(req.body);
        const invoice = new Invoice(req.body);
        await invoice.save();
        res.status(201).json(invoice);
        
    } catch (error) {
        console.error("Error creating invoice:", error);
        res.status(500).json({ error: "Error creating invoice" });
    }
    
});

// ✅ Fetch shop profile
app.get('/api/shop-profile', async (req, res) => {
    try {
        const profile = await ShopProfile.findOne();
        res.json(profile || {});
    } catch (error) {
        console.error("Error fetching shop profile:", error);
        res.status(500).json({ error: "Error fetching shop profile" });
    }
});

// ✅ Create or update shop profile
app.post('/api/shop-profile', async (req, res) => {
    try {
        const { shopName, shopPhone, logoUrl } = req.body;
        let profile = await ShopProfile.findOne();

        if (profile) {
            profile.shopName = shopName;
            profile.shopPhone = shopPhone;
            profile.logoUrl = logoUrl;
        } else {
            profile = new ShopProfile({ shopName, shopPhone, logoUrl });
        }

        await profile.save();
        res.json({ message: "Shop profile updated", profile });
    } catch (error) {
        console.error("Error updating shop profile:", error);
        res.status(500).json({ error: "Error updating shop profile" });
    }
});

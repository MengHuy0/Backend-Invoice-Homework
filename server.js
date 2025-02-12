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
        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '24h' });

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
app.put('/api/customers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone } = req.body;

        const updatedCustomer = await Customer.findByIdAndUpdate(
            id,
            { name, email, phone },
            { new: true } // Return the updated document
        );

        if (!updatedCustomer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        res.json(updatedCustomer);
    } catch (error) {
        res.status(500).json({ message: 'Error updating customer', error });
    }
});

// Backend API to delete a customer
app.delete('/api/customers/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const deletedCustomer = await Customer.findByIdAndDelete(id);

        if (!deletedCustomer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting customer', error });
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
// API to edit an inventory item
app.put('/api/inventory/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price } = req.body;

        const updatedItem = await Inventory.findByIdAndUpdate(
            id,
            { name, price },
            { new: true } // Return the updated document
        );

        if (!updatedItem) {
            return res.status(404).json({ message: 'Item not found' });
        }

        res.json(updatedItem);
    } catch (error) {
        res.status(500).json({ message: 'Error updating item', error });
    }
});

// API to delete an inventory item
app.delete('/api/inventory/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const deletedItem = await Inventory.findByIdAndDelete(id);

        if (!deletedItem) {
            return res.status(404).json({ message: 'Item not found' });
        }

        res.json({ message: 'Item deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting item', error });
    }
});

// ✅ Fetch all invoices (with populated customer details)
app.get('/api/invoices',  async (req, res) => {
    try {
        const invoices = await Invoice.find();
        res.json(invoices);
    } catch (error) {
        console.error("Error fetching invoices:", error);
        res.status(500).json({ error: "Error fetching invoices" });
    }
});

// ✅ Create a new invoice
app.post('/api/invoices', async (req, res) => {
    try {
        // Fetch the last invoice to generate the next invoice ID
        const lastInvoice = await Invoice.findOne().sort({ invoiceId: -1 }); // Get the last invoice
        let nextInvoiceId = 'INV00001'; // Default invoice ID if no invoices exist

        if (lastInvoice) {
            const lastIdNumber = parseInt(lastInvoice.invoiceId.replace('INV', ''), 10);
            nextInvoiceId = `INV${String(lastIdNumber + 1).padStart(5, '0')}`; // Increment and format
        }

        // Add the generated invoice ID to the request body
        const invoiceData = {
            ...req.body,
            invoiceId: nextInvoiceId, // Use the generated invoice ID
        };

        // Save the invoice to the database
        const newInvoice = await Invoice.create(invoiceData);

        res.status(201).json(newInvoice);
    } catch (error) {
        res.status(500).json({ message: 'Error creating invoice', error });
    }
});
app.put('/api/invoices/:invoiceId', async (req, res) => {
    const { invoiceId } = req.params;
    const { paymentStatus } = req.body;

    try {
        // Find the invoice by invoiceId and update the payment status
        const invoice = await Invoice.findOneAndUpdate(
            { invoiceId: invoiceId },
            { paymentStatus: paymentStatus },
            { new: true }  // Return the updated document
        );

        if (!invoice) {
            return res.status(404).send('Invoice not found');
        }

        res.status(200).json(invoice);  // Send back the updated invoice
    } catch (error) {
        res.status(500).send('Error updating the invoice');
    }
});
app.put('/api/invoices/:id/paid', async (req, res) => {
    try {
        const { id } = req.params;

        const updatedInvoice = await Invoice.findByIdAndUpdate(
            id,
            { paymentStatus: 'Paid' },
            { new: true } // Return the updated document
        );

        if (!updatedInvoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        res.json(updatedInvoice);
    } catch (error) {
        res.status(500).json({ message: 'Error marking invoice as paid', error });
    }
});
app.get('/api/get-next-invoice-id', async (req, res) => {
    try {
        const lastInvoice = await Invoice.findOne().sort({ invoiceId: -1 }).limit(1); // Find the most recent invoice
        let nextInvoiceId = lastInvoice ? parseInt(lastInvoice.invoiceId.replace('INV', '')) + 1 : 1;
        nextInvoiceId = `INV${String(nextInvoiceId).padStart(5, '0')}`; // Format as INV00001, INV00002, etc.
        res.json({ nextInvoiceId });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get the next invoice ID' });
    }
});
app.post('/api/save-invoice', async (req, res) => {
    try {
        const { invoiceId, customer, date, items, total, paymentStatus } = req.body;

        const newInvoice = new Invoice({
            invoiceId,
            customer,
            date,
            items,
            total,
            paymentStatus
        });

        await newInvoice.save();
        res.json({ message: 'Invoice saved successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save invoice' });
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

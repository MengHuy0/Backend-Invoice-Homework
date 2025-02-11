const express = require('express');
const router = express.Router();
const Customer = require('../models/customer.js');

router.get('/api/customers', async (req, res) => {
    const customers = await Customer.find();
    res.json(customers);
});

router.post('/api/customers', async (req, res) => {
    const customer = new Customer(req.body);
    await customer.save();
    res.status(201).json(customer);
});

module.exports = router;

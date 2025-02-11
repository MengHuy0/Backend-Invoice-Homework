const express = require('express');
const router = express.Router();
const Invoice = require('../models/invoice.js');

router.get('/api/invoices', async (req, res) => {
    const invoices = await Invoice.find().populate('customer');
    res.json(invoices);
});

router.post('/api/invoices', async (req, res) => {
    const invoice = new Invoice(req.body);
    await invoice.save();
    res.status(201).json(invoice);
});

module.exports = router;

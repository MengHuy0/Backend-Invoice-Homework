const express = require('express');
const router = express.Router();
const Inventory = require('../models/inventory.js');

router.get('/api/inventory', async (req, res) => {
    const items = await Inventory.find();
    res.json(items);
});

router.post('/api/inventory', async (req, res) => {
    const item = new Inventory(req.body);
    await item.save();
    res.status(201).json(item);
});

module.exports = router;
const express = require('express');
const router = express.Router();
const ShopProfile = require('../models/shopProfile.js');

// Get Shop Profile
router.get('/api/shop-profile', async (req, res) => {
    try {
        const profile = await ShopProfile.findOne();
        res.json(profile || {});
    } catch (error) {
        res.status(500).json({ error: 'Error fetching shop profile' });
    }
});

// Create or Update Shop Profile
router.post('/api/shop-profile', async (req, res) => {
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
        res.json({ message: 'Shop profile updated', profile });
    } catch (error) {
        res.status(500).json({ error: 'Error updating shop profile' });
    }
});

module.exports = router;

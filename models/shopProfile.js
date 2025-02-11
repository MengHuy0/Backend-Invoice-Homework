const mongoose = require('mongoose');

const ShopProfileSchema = new mongoose.Schema({
    shopName: {
        type: String,
        required: true,
        trim: true
    },
    shopPhone: {
        type: String,
        required: true,
        trim: true
    },
    shopLogo: {
        type: String, // Store the image URL or base64 string
        default: ''
    }
}, { timestamps: true });

const ShopProfile = mongoose.model('ShopProfile', ShopProfileSchema);

module.exports = ShopProfile;
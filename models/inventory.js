const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
    name: String,
    price: Number
});
const Inventory = mongoose.model('Inventory', InventorySchema);
module.exports = Inventory;
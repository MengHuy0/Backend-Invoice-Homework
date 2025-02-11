const mongoose = require('mongoose');
const CustomerSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String
});
const Customer = mongoose.model('Customer', CustomerSchema);
module.exports = Customer;
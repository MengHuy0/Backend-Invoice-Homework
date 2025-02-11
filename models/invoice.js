const mongoose = require('mongoose');
const InvoiceSchema = new mongoose.Schema({
    invoiceId: String,
    customer: String,
    date: String,
    items: [{ name: String, quantity: Number, price: Number, total: Number }],
    grandTotal: Number,
    paymentStatus: { type: String, enum: ['Pending', 'Paid'], default: 'Pending' }
});

const Invoice = mongoose.model('Invoice', InvoiceSchema);
module.exports = Invoice;

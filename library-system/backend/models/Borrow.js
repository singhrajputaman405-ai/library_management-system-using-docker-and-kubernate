const mongoose = require('mongoose');

const borrowSchema = new mongoose.Schema({
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
  issueDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  returnDate: Date,
  fineAmount: { type: Number, default: 0 },
  finePaid: { type: Boolean, default: false }
});

module.exports = mongoose.model('Borrow', borrowSchema);
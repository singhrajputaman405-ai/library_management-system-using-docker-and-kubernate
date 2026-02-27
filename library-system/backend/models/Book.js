const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  isbn: { type: String, unique: true, sparse: true },
  year: Number,
  totalCopies: { type: Number, default: 1, min: 0 },
  availableCopies: { type: Number, default: 1, min: 0 }
});

module.exports = mongoose.model('Book', bookSchema);
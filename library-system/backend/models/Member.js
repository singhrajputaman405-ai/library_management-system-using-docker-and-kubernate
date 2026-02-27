const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  studentId: { type: String, required: true, unique: true },
  email: String,
  phone: String,
  joinDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Member', memberSchema);
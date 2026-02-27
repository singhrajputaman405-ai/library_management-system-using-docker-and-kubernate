const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const Book = require('./models/Book');
const Member = require('./models/Member');
const Borrow = require('./models/Borrow');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/library';

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// ========== BOOK ROUTES ==========
// (unchanged from previous, but we'll keep for completeness)
app.get('/api/books', async (req, res) => {
  try {
    const books = await Book.find().sort({ title: 1 });
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/books', async (req, res) => {
  try {
    const { title, author, isbn, year, totalCopies } = req.body;
    const availableCopies = totalCopies || 1;
    const newBook = new Book({ title, author, isbn, year, totalCopies, availableCopies });
    await newBook.save();
    res.status(201).json(newBook);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/books/:id', async (req, res) => {
  try {
    const { title, author, isbn, year, totalCopies } = req.body;
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });

    const diff = totalCopies - book.totalCopies;
    const newAvailable = book.availableCopies + diff;
    if (newAvailable < 0) {
      return res.status(400).json({ error: 'Not enough copies to reduce total that much' });
    }

    book.title = title || book.title;
    book.author = author || book.author;
    book.isbn = isbn || book.isbn;
    book.year = year || book.year;
    book.totalCopies = totalCopies || book.totalCopies;
    book.availableCopies = newAvailable;

    await book.save();
    res.json(book);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/books/:id', async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    await Borrow.deleteMany({ book: req.params.id });
    res.json({ message: 'Book deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== MEMBER ROUTES ==========
app.get('/api/members', async (req, res) => {
  try {
    const members = await Member.find().sort({ name: 1 });
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/members', async (req, res) => {
  try {
    const { name, studentId, email, phone } = req.body;
    const newMember = new Member({ name, studentId, email, phone });
    await newMember.save();
    res.status(201).json(newMember);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/members/:id', async (req, res) => {
  try {
    const { name, studentId, email, phone } = req.body;
    const member = await Member.findByIdAndUpdate(
      req.params.id,
      { name, studentId, email, phone },
      { new: true, runValidators: true }
    );
    if (!member) return res.status(404).json({ error: 'Member not found' });
    res.json(member);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/members/:id', async (req, res) => {
  try {
    const member = await Member.findByIdAndDelete(req.params.id);
    if (!member) return res.status(404).json({ error: 'Member not found' });
    // Optionally delete or update borrow records
    await Borrow.updateMany({ member: req.params.id }, { $set: { member: null } });
    res.json({ message: 'Member deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== BORROW ROUTES ==========
app.get('/api/borrows', async (req, res) => {
  try {
    const { bookId, memberId, returned } = req.query;
    const filter = {};
    if (bookId) filter.book = bookId;
    if (memberId) filter.member = memberId;
    if (returned !== undefined) filter.returned = returned === 'true';

    const borrows = await Borrow.find(filter)
      .populate('book')
      .populate('member')
      .sort({ issueDate: -1 });
    res.json(borrows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Borrow a book
app.post('/api/books/:id/borrow', async (req, res) => {
  try {
    const { memberId, dueDate } = req.body;
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    if (book.availableCopies <= 0) {
      return res.status(400).json({ error: 'No available copies' });
    }

    const member = await Member.findById(memberId);
    if (!member) return res.status(404).json({ error: 'Member not found' });

    const borrow = new Borrow({
      book: book._id,
      member: member._id,
      dueDate: new Date(dueDate)
    });
    await borrow.save();

    book.availableCopies -= 1;
    await book.save();

    res.status(201).json(borrow);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Return a book (with fine calculation)
app.post('/api/borrows/:id/return', async (req, res) => {
  try {
    const borrow = await Borrow.findById(req.params.id).populate('book').populate('member');
    if (!borrow) return res.status(404).json({ error: 'Borrow record not found' });
    if (borrow.returnDate) {
      return res.status(400).json({ error: 'Book already returned' });
    }

    const returnDate = new Date();
    borrow.returnDate = returnDate;

    // Calculate fine if overdue
    const dueDate = new Date(borrow.dueDate);
    if (returnDate > dueDate) {
      const daysOverdue = Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24));
      const finePerDay = 0.50; // $0.50 per day
      borrow.fineAmount = daysOverdue * finePerDay;
    }

    await borrow.save();

    // Increment available copies
    const book = await Book.findById(borrow.book._id);
    book.availableCopies += 1;
    await book.save();

    res.json(borrow);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Pay fine
app.post('/api/borrows/:id/pay-fine', async (req, res) => {
  try {
    const borrow = await Borrow.findById(req.params.id);
    if (!borrow) return res.status(404).json({ error: 'Borrow record not found' });
    if (borrow.finePaid) {
      return res.status(400).json({ error: 'Fine already paid' });
    }
    borrow.finePaid = true;
    await borrow.save();
    res.json(borrow);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
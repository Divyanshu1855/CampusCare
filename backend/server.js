require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Complaint = require('./models/Complaint');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campuscare';

app.use(cors());
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'CampusCare API' });
});

app.get('/api/complaints', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status && req.query.status !== 'All') filter.status = req.query.status;
    if (req.query.category && req.query.category !== 'All') filter.category = req.query.category;
    const complaints = await Complaint.find(filter).sort({ createdAt: -1 }).limit(200);
    res.json(complaints);
  } catch (err) { next(err); }
});

app.post('/api/complaints', async (req, res, next) => {
  try {
    const { title, description, category, studentName, studentId } = req.body;
    if (![title, description, category, studentName, studentId].every(v => typeof v === 'string' && v.trim())) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    if (title.trim().length > 120 || description.trim().length > 2000) {
      return res.status(400).json({ message: 'Title or description is too long.' });
    }
    const allowedCategories = ['Classroom', 'Computer Lab', 'Wi-Fi', 'Cleanliness', 'Library', 'Other'];
    if (!allowedCategories.includes(category)) {
      return res.status(400).json({ message: 'Choose a valid category.' });
    }
    const complaint = await Complaint.create({
      title: title.trim(), description: description.trim(), category,
      studentName: studentName.trim(), studentId: studentId.trim()
    });
    res.status(201).json(complaint);
  } catch (err) { next(err); }
});

app.patch('/api/complaints/:id', async (req, res, next) => {
  try {
    const updates = {};
    if (req.body.status !== undefined) {
      if (!['Pending', 'In Progress', 'Resolved'].includes(req.body.status)) {
        return res.status(400).json({ message: 'Invalid status.' });
      }
      updates.status = req.body.status;
    }
    if (req.body.priority !== undefined) {
      if (!['Low', 'Medium', 'High'].includes(req.body.priority)) {
        return res.status(400).json({ message: 'Invalid priority.' });
      }
      updates.priority = req.body.priority;
    }
    if (!Object.keys(updates).length) return res.status(400).json({ message: 'No valid updates supplied.' });
    const complaint = await Complaint.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });
    res.json(complaint);
  } catch (err) { next(err); }
});

app.delete('/api/complaints/:id', async (req, res, next) => {
  try {
    const complaint = await Complaint.findByIdAndDelete(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });
    res.json({ message: 'Complaint deleted.' });
  } catch (err) { next(err); }
});

app.use((err, _req, res, _next) => {
  console.error(err.message);
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid complaint ID.' });
  res.status(500).json({ message: 'Server error. Check backend logs.' });
});

async function start() {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  console.log('Connected to MongoDB');
  app.listen(PORT, '0.0.0.0', () => console.log(`CampusCare API listening on ${PORT}`));
}

if (require.main === module) {
  start().catch(err => { console.error('Could not start API:', err.message); process.exit(1); });
}
module.exports = app;

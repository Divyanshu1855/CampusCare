const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, required: true, trim: true, maxlength: 2000 },
  category: { type: String, required: true, enum: ['Classroom', 'Computer Lab', 'Wi-Fi', 'Cleanliness', 'Library', 'Other'] },
  studentName: { type: String, required: true, trim: true, maxlength: 100 },
  studentId: { type: String, required: true, trim: true, maxlength: 50 },
  status: { type: String, enum: ['Pending', 'In Progress', 'Resolved'], default: 'Pending' },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' }
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);

const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  duration_minutes: { type: Number, default: 30 },
  price: { type: Number, default: 0 },
  doctor_id: { type: Number, required: true },
  is_active: { type: Boolean, default: true },
  is_external_bookable: { type: Boolean, default: false }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Service', ServiceSchema);

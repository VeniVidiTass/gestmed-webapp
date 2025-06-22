const mongoose = require('mongoose');

function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const AppointmentSchema = new mongoose.Schema({
  patient_id: { type: Number, required: true },
  doctor_id: { type: Number, required: true },
  service_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  code: { type: String, unique: true },
  appointment_date: { type: Date, required: true },
  status: { type: String, default: 'scheduled' },
  notes: { type: String, default: '' }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

AppointmentSchema.pre('save', function(next) {
  if (!this.code) {
    this.code = generateCode();
  }
  next();
});

module.exports = mongoose.model('Appointment', AppointmentSchema);

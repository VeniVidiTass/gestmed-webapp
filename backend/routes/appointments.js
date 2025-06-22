const express = require('express');
const router = express.Router();

// initialize mongo connection
require('../config/mongo');

const Service = require('../models/Service');
const Appointment = require('../models/Appointment');

// --- Services Endpoints ---
router.get('/services', async (req, res) => {
  try {
    const filter = {};
    if (req.query.doctor_id) filter.doctor_id = Number(req.query.doctor_id);
    if (req.query.is_active !== undefined) filter.is_active = req.query.is_active === 'true' || req.query.is_active === true;
    if (req.query.is_external !== undefined) filter.is_external_bookable = req.query.is_external === 'true' || req.query.is_external === true;

    let query = Service.find(filter);

    const sortBy = req.query.sortBy;
    const sortOrder = req.query.sortOrder === 'DESC' ? -1 : 1;
    if (sortBy) {
      query = query.sort({ [sortBy]: sortOrder });
    } else {
      query = query.sort({ doctor_id: 1, name: 1 });
    }

    const services = await query.exec();
    res.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/services/doctor/:doctor_id', async (req, res) => {
  try {
    const filter = { doctor_id: Number(req.params.doctor_id) };
    if (req.query.is_active !== undefined) filter.is_active = req.query.is_active === 'true';
    const services = await Service.find(filter).sort({ name: 1 });
    res.json(services);
  } catch (error) {
    console.error('Error fetching services by doctor:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/services/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ error: 'Service not found' });
    res.json(service);
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/services', async (req, res) => {
  try {
    const service = await Service.create(req.body);
    res.status(201).json(service);
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/services/:id', async (req, res) => {
  try {
    const updated = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Service not found' });
    res.json(updated);
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/services/:id', async (req, res) => {
  try {
    const used = await Appointment.exists({ service_id: req.params.id });
    if (used) return res.status(400).json({ error: 'Cannot delete service: it is used in existing appointments' });
    const result = await Service.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ error: 'Service not found' });
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Appointments Endpoints ---
router.get('/', async (req, res) => {
  try {
    const { date, doctor_id, patient_id, service_id } = req.query;
    const filter = {};
    if (doctor_id) filter.doctor_id = Number(doctor_id);
    if (patient_id) filter.patient_id = Number(patient_id);
    if (service_id) filter.service_id = service_id;

    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      filter.appointment_date = { $gte: start, $lt: end };
    }

    const appointments = await Appointment.find(filter)
      .populate('service_id')
      .sort({ appointment_date: 1 });
    res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id).populate('service_id');
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });
    res.json(appt);
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { patient_id, doctor_id, service_id, appointment_date, notes, status } = req.body;
    if (!patient_id || !doctor_id || !service_id || !appointment_date) {
      return res.status(400).json({ error: 'Patient ID, Doctor ID, Service ID and appointment date are required' });
    }

    const service = await Service.findById(service_id);
    if (!service || service.doctor_id !== Number(doctor_id)) {
      return res.status(400).json({ error: 'Service not found or not available for this doctor' });
    }

    const appt = await Appointment.create({ patient_id, doctor_id, service_id, appointment_date, notes, status });
    res.status(201).json(appt);
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Appointment not found' });
    res.json(updated);
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Appointment.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Appointment not found' });
    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status is required' });

    const allowedStatuses = ['scheduled', 'in_progress', 'completed', 'cancelled'];
    if (!allowedStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const updated = await Appointment.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!updated) return res.status(404).json({ error: 'Appointment not found' });
    res.json(updated);
  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/doctor/:doctor_id/busy-slots', async (req, res) => {
  try {
    const { doctor_id } = req.params;
    const { date, start_date, end_date } = req.query;

    const filter = { doctor_id: Number(doctor_id), status: { $in: ['scheduled', 'in_progress'] } };
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      filter.appointment_date = { $gte: start, $lt: end };
    } else if (start_date && end_date) {
      filter.appointment_date = { $gte: new Date(start_date), $lte: new Date(end_date) };
    } else {
      filter.appointment_date = { $gte: new Date() };
    }

    const appointments = await Appointment.find(filter).sort({ appointment_date: 1 });
    const busySlots = appointments.map(a => ({
      start_time: a.appointment_date,
      end_time: new Date(a.appointment_date.getTime() + 30 * 60000)
    }));
    res.json(busySlots);
  } catch (error) {
    console.error('Error fetching doctor busy slots:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

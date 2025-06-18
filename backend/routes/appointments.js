const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET /appointments - Get all appointments
router.get('/', async (req, res) => {
  try {
    const { date, doctor_id, patient_id } = req.query;
    let query = `
      SELECT a.*
      FROM appointments a
      WHERE 1=1
    `;
    let params = [];
    let paramCount = 0;

    if (date) {
      paramCount++;
      query += ` AND DATE(a.appointment_date) = $${paramCount}`;
      params.push(date);
    }

    if (doctor_id) {
      paramCount++;
      query += ` AND a.doctor_id = $${paramCount}`;
      params.push(doctor_id);
    }

    if (patient_id) {
      paramCount++;
      query += ` AND a.patient_id = $${paramCount}`;
      params.push(patient_id);
    }

    query += ' ORDER BY a.appointment_date ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /appointments/:id - Get a specific appointment
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT a.*
      FROM appointments a
      WHERE a.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /appointments - Create a new appointment
router.post('/', async (req, res) => {
  try {
    const { patient_id, doctor_id, appointment_date, notes, status } = req.body;

    console.log('Received appointment creation request:', { patient_id, doctor_id, appointment_date, notes, status });

    if (!patient_id || !doctor_id || !appointment_date) {
      console.log('Validation failed: missing required fields');
      return res.status(400).json({ error: 'Patient ID, Doctor ID and appointment date are required' });
    }

    // Il codice viene generato automaticamente dal trigger del database
    const result = await pool.query(
      'INSERT INTO appointments (patient_id, doctor_id, appointment_date, notes, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [patient_id, doctor_id, appointment_date, notes || '', status || 'scheduled']
    );

    console.log('Appointment created successfully:', result.rows[0]);

    //TODO aggiungere la logica per inviare email e sms di conferma

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// PUT /appointments/:id - Update an appointment
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { patient_id, doctor_id, appointment_date, notes, status } = req.body;

    const result = await pool.query(
      'UPDATE appointments SET patient_id = $1, doctor_id = $2, appointment_date = $3, notes = $4, status = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *',
      [patient_id, doctor_id, appointment_date, notes, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    //TODO aggiungere la logica per inviare email e sms di conferma aggiornamento

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /appointments/:id - Delete an appointment
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM appointments WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    //TODO aggiungere la logica per inviare email e sms di conferma cancellazione

    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /appointments/:id/status - Update appointment status
router.put('/:id/status', async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const allowedStatuses = ['scheduled', 'in_progress', 'completed', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const query = `
      UPDATE appointments 
      SET status = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2 
      RETURNING *
    `;

    const result = await pool.query(query, [status, appointmentId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

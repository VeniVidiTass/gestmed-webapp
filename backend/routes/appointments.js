const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET /api/appointments - Get all appointments
router.get('/', async (req, res) => {
  try {
    const { date, doctor_id, patient_id } = req.query;
    let query = `
      SELECT 
        a.*,
        p.name as patient_name,
        p.phone as patient_phone,
        d.name as doctor_name,
        d.specialization as doctor_specialization
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN doctors d ON a.doctor_id = d.id
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

// GET /api/appointments/:id - Get a specific appointment
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        a.*,
        p.name as patient_name,
        p.phone as patient_phone,
        p.email as patient_email,
        d.name as doctor_name,
        d.specialization as doctor_specialization
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN doctors d ON a.doctor_id = d.id
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

// POST /api/appointments - Create a new appointment
router.post('/', async (req, res) => {
  try {
    const { patient_id, doctor_id, appointment_date, notes, status } = req.body;

    const result = await pool.query(
      'INSERT INTO appointments (patient_id, doctor_id, appointment_date, notes, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [patient_id, doctor_id, appointment_date, notes || '', status || 'scheduled']
    );

    //TODO aggiungere la logica per inviare email e sms di conferma

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/appointments/:id - Update an appointment
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

// DELETE /api/appointments/:id - Delete an appointment
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

module.exports = router;

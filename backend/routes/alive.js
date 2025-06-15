const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET /api/alive - Get all active appointments (scheduled or in_progress)
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        a.*,
        p.name as patient_name,
        p.phone as patient_phone,
        d.name as doctor_name,
        d.specialization as doctor_specialization
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN doctors d ON a.doctor_id = d.id
      WHERE a.status IN ('scheduled', 'in_progress')
      ORDER BY a.appointment_date ASC
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching active appointments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/alive/:id/logs - Get logs for a specific appointment
router.get('/:id/logs', async (req, res) => {
  try {
    const appointmentId = req.params.id;
    
    const query = `
      SELECT * FROM appointment_logs 
      WHERE appointment_id = $1 
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query, [appointmentId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching appointment logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/alive/:id/logs - Add a new log to an appointment
router.post('/:id/logs', async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const query = `
      INSERT INTO appointment_logs (appointment_id, title, description, created_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const result = await pool.query(query, [appointmentId, title, description]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating appointment log:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/alive/:id/status - Update appointment status
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

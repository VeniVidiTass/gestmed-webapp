const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET /alive - Get all active appointments (scheduled or in_progress)
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

// GET /alive/:id/logs - Get logs for a specific appointment by ID
router.get('/:id/logs', async (req, res) => {
  try {
    const appointmentId = req.params.id;

    const query = `
      SELECT * FROM alive_logs 
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

// GET /alive/code/:code/logs - Get logs for a specific appointment by code
router.get('/code/:code/logs', async (req, res) => {
  try {
    const appointmentCode = req.params.code;

    const query = `
      SELECT * FROM alive_logs 
      WHERE code = $1 
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query, [appointmentCode]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching appointment logs by code:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /alive/:id/logs - Add a new log to an appointment
router.post('/:id/logs', async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const { title, description, code } = req.body;

    console.log('Received log request:', { appointmentId, title, description });

    if (!title || !description) {
      console.log('Validation failed: missing title or description');
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const query = `
      INSERT INTO alive_logs (appointment_id, code, title, description, created_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    console.log('Executing query with params:', [appointmentId, code, title, description]);
    const result = await pool.query(query, [appointmentId, code, title, description]);

    console.log('Log created successfully:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating appointment log:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

module.exports = router;

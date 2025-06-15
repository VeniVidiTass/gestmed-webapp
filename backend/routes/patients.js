const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET /api/patients - Get all patients
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM patients';
    let params = [];

    if (search) {
      query += ' WHERE name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/patients/:id - Get a specific patient
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM patients WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/patients - Create a new patient
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, date_of_birth, address, medical_history } = req.body;

    const result = await pool.query(
      'INSERT INTO patients (name, email, phone, date_of_birth, address, medical_history) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, email, phone, date_of_birth, address, medical_history || '']
    );
    
    //TODO add sending email notification to patient

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating patient:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/patients/:id - Update a patient
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, date_of_birth, address, medical_history } = req.body;

    const result = await pool.query(
      'UPDATE patients SET name = $1, email = $2, phone = $3, date_of_birth = $4, address = $5, medical_history = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *',
      [name, email, phone, date_of_birth, address, medical_history, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating patient:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/patients/:id - Delete a patient
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM patients WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    console.error('Error deleting patient:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

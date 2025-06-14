const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET /api/doctors - Get all doctors
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM doctors';
    let params = [];

    if (search) {
      query += ' WHERE name ILIKE $1 OR specialization ILIKE $1 OR email ILIKE $1';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/doctors/:id - Get a specific doctor
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM doctors WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching doctor:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/doctors - Create a new doctor
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, specialization, availability, license_number } = req.body;
    
    const result = await pool.query(
      'INSERT INTO doctors (name, email, phone, specialization, availability, license_number) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, email, phone, specialization, availability || '{}', license_number]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating doctor:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/doctors/:id - Update a doctor
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, specialization, availability, license_number } = req.body;
    
    const result = await pool.query(
      'UPDATE doctors SET name = $1, email = $2, phone = $3, specialization = $4, availability = $5, license_number = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *',
      [name, email, phone, specialization, availability, license_number, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating doctor:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/doctors/:id - Delete a doctor
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM doctors WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    
    res.json({ message: 'Doctor deleted successfully' });
  } catch (error) {
    console.error('Error deleting doctor:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

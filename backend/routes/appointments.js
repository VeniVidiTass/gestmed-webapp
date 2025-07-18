const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET /appointments/services - Get all services
router.get('/services', async (req, res) => {
  try {
    const { doctor_id, is_active, is_external, sortBy, sortOrder } = req.query;
    
    let query = 'SELECT * FROM services WHERE 1=1';
    let params = [];
    let paramCount = 0;

    if (doctor_id) {
      paramCount++;
      query += ` AND doctor_id = $${paramCount}`;
      params.push(doctor_id);
    }

    if (is_active !== undefined) {
      paramCount++;
      query += ` AND is_active = $${paramCount}`;
      params.push(is_active === 'true' || is_active === true);
    }

    if (is_external !== undefined) {
      paramCount++;
      query += ` AND is_external_bookable = $${paramCount}`;
      params.push(is_external === 'true' || is_external === true);
    }

    // Gestione dell'ordinamento
    const validSortColumns = ['name', 'doctor_id', 'price', 'duration_minutes', 'created_at'];
    const validSortOrders = ['ASC', 'DESC'];
    
    let orderByClause = ' ORDER BY doctor_id, name';
    if (sortBy && validSortColumns.includes(sortBy)) {
      const order = sortOrder && validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC';
      orderByClause = ` ORDER BY ${sortBy} ${order}`;
    }
    
    query += orderByClause;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /appointments/services/doctor/:doctor_id - Get services by doctor
router.get('/services/doctor/:doctor_id', async (req, res) => {
  try {
    const { doctor_id } = req.params;
    const { is_active } = req.query;

    let query = 'SELECT * FROM services WHERE doctor_id = $1';
    let params = [doctor_id];

    if (is_active !== undefined) {
      query += ' AND is_active = $2';
      params.push(is_active === 'true');
    }

    query += ' ORDER BY name';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching services by doctor:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /appointments/services/:id - Get a specific service
router.get('/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM services WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /appointments/services - Create a new service
router.post('/services', async (req, res) => {
  try {
    const { name, description, duration_minutes, price, doctor_id, is_external_bookable } = req.body;

    if (!name || !doctor_id) {
      return res.status(400).json({ error: 'Name and Doctor ID are required' });
    }

    const result = await pool.query(
      'INSERT INTO services (name, description, duration_minutes, price, doctor_id, is_external_bookable) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, description || '', duration_minutes || 30, price || 0.00, doctor_id, is_external_bookable || false]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /appointments/services/:id - Update a service
router.put('/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, duration_minutes, price, is_active, is_external_bookable } = req.body;

    const result = await pool.query(
      'UPDATE services SET name = $1, description = $2, duration_minutes = $3, price = $4, is_active = $5, is_external_bookable = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *',
      [name, description, duration_minutes, price, is_active, is_external_bookable, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /appointments/services/:id - Delete a service
router.delete('/services/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if service is used in appointments
    const appointmentCheck = await pool.query('SELECT COUNT(*) FROM appointments WHERE service_id = $1', [id]);

    if (parseInt(appointmentCheck.rows[0].count) > 0) {
      return res.status(400).json({ error: 'Cannot delete service: it is used in existing appointments' });
    }

    const result = await pool.query('DELETE FROM services WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /appointments - Get all appointments with services
router.get('/', async (req, res) => {
  try {
    const { date, doctor_id, patient_id, service_id, patient_email, patient_codice_fiscale, code } = req.query;
    let query = `
      SELECT a.*, s.name as service_name, s.description as service_description, 
             s.duration_minutes, s.price
      FROM appointments a
      JOIN services s ON a.service_id = s.id
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

    if (service_id) {
      paramCount++;
      query += ` AND a.service_id = $${paramCount}`;
      params.push(service_id);
    }

    if (patient_email) {
      paramCount++;
      query += ` AND LOWER(a.patient_email) = LOWER($${paramCount})`;
      params.push(patient_email);
    }

    if (patient_codice_fiscale) {
      paramCount++;
      query += ` AND UPPER(a.patient_codice_fiscale) = UPPER($${paramCount})`;
      params.push(patient_codice_fiscale);
    }

    if (code) {
      paramCount++;
      query += ` AND UPPER(a.code) = UPPER($${paramCount})`;
      params.push(code);
    }

    query += ' ORDER BY a.appointment_date ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /appointments/:id - Get a specific appointment with service details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT a.*, s.name as service_name, s.description as service_description, 
             s.duration_minutes, s.price
      FROM appointments a
      JOIN services s ON a.service_id = s.id
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
    const { 
      patient_id, 
      patient_full_name, 
      patient_email, 
      patient_codice_fiscale, 
      patient_phone,
      doctor_id, 
      service_id, 
      appointment_date, 
      notes, 
      status 
    } = req.body;

    console.log('Received appointment creation request:', { 
      patient_id, 
      patient_full_name, 
      patient_email, 
      patient_codice_fiscale, 
      patient_phone, 
      doctor_id, 
      service_id, 
      appointment_date, 
      notes, 
      status 
    });

    // Validazione campi obbligatori
    if (!patient_full_name || !doctor_id || !service_id || !appointment_date) {
      console.log('Validation failed: missing required fields');
      return res.status(400).json({ 
        error: 'Nome completo paziente, Doctor ID, Service ID e data appuntamento sono obbligatori' 
      });
    }

    // Verifica che il servizio esista e appartenga al dottore specificato
    const serviceCheck = await pool.query(
      'SELECT id FROM services WHERE id = $1 AND doctor_id = $2 AND is_active = true',
      [service_id, doctor_id]
    );

    if (serviceCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Service not found or not available for this doctor' });
    }

    // Il codice viene generato automaticamente dal trigger del database
    const result = await pool.query(
      'INSERT INTO appointments (patient_id, patient_full_name, patient_email, patient_codice_fiscale, patient_phone, doctor_id, service_id, appointment_date, notes, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [patient_id, patient_full_name, patient_email, patient_codice_fiscale, patient_phone, doctor_id, service_id, appointment_date, notes || '', status || 'scheduled']
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
    const { 
      patient_id, 
      patient_full_name, 
      patient_email, 
      patient_codice_fiscale, 
      patient_phone,
      doctor_id, 
      service_id, 
      appointment_date, 
      notes, 
      status 
    } = req.body;

    // Verifica che il servizio esista e appartenga al dottore specificato se forniti
    if (service_id && doctor_id) {
      const serviceCheck = await pool.query(
        'SELECT id FROM services WHERE id = $1 AND doctor_id = $2 AND is_active = true',
        [service_id, doctor_id]
      );

      if (serviceCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Service not found or not available for this doctor' });
      }
    }

    const result = await pool.query(
      'UPDATE appointments SET patient_id = $1, patient_full_name = $2, patient_email = $3, patient_codice_fiscale = $4, patient_phone = $5, doctor_id = $6, service_id = $7, appointment_date = $8, notes = $9, status = $10, updated_at = CURRENT_TIMESTAMP WHERE id = $11 RETURNING *',
      [patient_id, patient_full_name, patient_email, patient_codice_fiscale, patient_phone, doctor_id, service_id, appointment_date, notes, status, id]
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

// GET /appointments/doctor/:doctor_id/busy-slots - Get busy time slots for a doctor
router.get('/doctor/:doctor_id/busy-slots', async (req, res) => {
  try {
    const { doctor_id } = req.params;
    const { date, start_date, end_date } = req.query; 
    let query = `
      SELECT 
        a.appointment_date,
        a.appointment_date + INTERVAL '1 minute' * 30 AS end_time
      FROM appointments a
      WHERE a.doctor_id = $1 
        AND a.status IN ('scheduled', 'in_progress')
    `;

    let params = [doctor_id];
    let paramCount = 1;

    // Filtro per data specifica
    if (date) {
      paramCount++;
      query += ` AND DATE(a.appointment_date) = $${paramCount}`;
      params.push(date);
    }
    // Filtro per range di date
    else if (start_date && end_date) {
      paramCount++;
      query += ` AND DATE(a.appointment_date) >= $${paramCount}`;
      params.push(start_date);

      paramCount++;
      query += ` AND DATE(a.appointment_date) <= $${paramCount}`;
      params.push(end_date);
    }
    // Se non specificato, mostra solo gli appuntamenti futuri
    else {
      query += ` AND a.appointment_date >= CURRENT_TIMESTAMP`;
    }

    query += ' ORDER BY a.appointment_date ASC';

    const result = await pool.query(query, params);    // Formatta i risultati per renderli più utili
    const busySlots = result.rows.map(row => ({
      start_time: row.appointment_date,
      end_time: row.end_time
    }));

    res.json(busySlots);
  } catch (error) {
    console.error('Error fetching doctor busy slots:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

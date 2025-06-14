const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET /api/dashboard - Get dashboard statistics
router.get('/', async (req, res) => {
  try {
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    // Get total patients count
    const patientsResult = await pool.query('SELECT COUNT(*) as total FROM patients');
    const totalPatients = parseInt(patientsResult.rows[0].total);

    // Get total doctors count
    const doctorsResult = await pool.query('SELECT COUNT(*) as total FROM doctors');
    const totalDoctors = parseInt(doctorsResult.rows[0].total);

    // Get today's appointments count
    const todayAppointmentsResult = await pool.query(
      'SELECT COUNT(*) as total FROM appointments WHERE DATE(appointment_date) = $1',
      [today]
    );
    const todayAppointments = parseInt(todayAppointmentsResult.rows[0].total);    // Get pending appointments count
    const pendingAppointmentsResult = await pool.query(
      "SELECT COUNT(*) as total FROM appointments WHERE status = 'pending'"
    );
    const pendingAppointments = parseInt(pendingAppointmentsResult.rows[0].total);

    // Get recent appointments (next 5)
    const recentAppointmentsResult = await pool.query(`
      SELECT 
        a.*,
        p.name as patient_name,
        d.name as doctor_name,
        d.specialization as doctor_specialization
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN doctors d ON a.doctor_id = d.id
      WHERE a.appointment_date >= CURRENT_TIMESTAMP
      ORDER BY a.appointment_date ASC
      LIMIT 5
    `);

    // Get appointment status distribution
    const statusResult = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM appointments 
      WHERE DATE(appointment_date) >= CURRENT_DATE
      GROUP BY status
    `);    const dashboardData = {
      totalPatients,
      totalDoctors,
      todayAppointments,
      pendingAppointments,
      recentAppointments: recentAppointmentsResult.rows,
      statistics: {
        appointmentsByStatus: statusResult.rows.reduce((acc, row) => {
          acc[row.status] = parseInt(row.count);
          return acc;
        }, {})
      }
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

db = db.getSiblingDB('gestmed_appointments_db');

db.createUser({
  user: 'gestmed_user',
  pwd: 'gestmed_password',
  roles: [{ role: 'readWrite', db: 'gestmed_appointments_db' }]
});

const services = [
  { _id: ObjectId('650000000000000000000001'), name: 'Visita Cardiologica', description: 'Controllo cardiologico completo con ECG', duration_minutes: 45, price: 120.00, doctor_id: 1, is_external_bookable: true },
  { _id: ObjectId('650000000000000000000002'), name: 'Ecocardiogramma', description: 'Ecografia del cuore per valutazione funzionale', duration_minutes: 30, price: 80.00, doctor_id: 1, is_external_bookable: false },
  { _id: ObjectId('650000000000000000000003'), name: 'Visita Pediatrica', description: 'Controllo generale dello sviluppo del bambino', duration_minutes: 30, price: 80.00, doctor_id: 2, is_external_bookable: true }
];

db.services.insertMany(services);

db.appointments.insertMany([
  { patient_id: 1, doctor_id: 1, service_id: services[0]._id, appointment_date: new Date('2025-06-15T10:00:00Z'), status: 'in_progress', notes: 'Controllo cardiologico di routine', code: 'AHUSX001' },
  { patient_id: 2, doctor_id: 2, service_id: services[2]._id, appointment_date: new Date('2025-06-15T14:30:00Z'), status: 'in_progress', notes: 'Visita pediatrica per controllo crescita', code: 'QRWTE002' }
]);

-- Create user if not exists (this will run as the postgres superuser)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'gestmed_user') THEN
        CREATE USER gestmed_user WITH ENCRYPTED PASSWORD 'gestmed_password';
    END IF;
END
$$;

-- Grant privileges to the user
GRANT ALL PRIVILEGES ON DATABASE gestmed TO gestmed_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO gestmed_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO gestmed_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO gestmed_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO gestmed_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO gestmed_user;

-- Create patients table
CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    address TEXT,
    medical_history TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create doctors table
CREATE TABLE IF NOT EXISTS doctors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    specialization VARCHAR(255) NOT NULL,
    license_number VARCHAR(100) UNIQUE NOT NULL,
    availability JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
    appointment_date TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create appointment logs table
CREATE TABLE IF NOT EXISTS appointment_logs (
    id SERIAL PRIMARY KEY,
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) DEFAULT 'Admin User'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointment_logs_appointment ON appointment_logs(appointment_id);
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);
CREATE INDEX IF NOT EXISTS idx_doctors_email ON doctors(email);

-- Insert sample data
INSERT INTO patients (name, email, phone, date_of_birth, address, medical_history) VALUES
('Mario Rossi', 'mario.rossi@email.com', '+39 123 456 7890', '1980-05-15', 'Via Roma 123, Milano', 'Nessuna allergia nota'),
('Laura Bianchi', 'laura.bianchi@email.com', '+39 098 765 4321', '1975-08-22', 'Via Garibaldi 45, Roma', 'Allergia ai pollini'),
('Giuseppe Verdi', 'giuseppe.verdi@email.com', '+39 111 222 3333', '1990-12-10', 'Corso Italia 67, Napoli', 'Diabete tipo 2'),
('Anna Ferrari', 'anna.ferrari@email.com', '+39 444 555 6666', '1985-03-18', 'Via Dante 89, Torino', 'Ipertensione'),
('Francesco Conti', 'francesco.conti@email.com', '+39 777 888 9999', '1970-11-05', 'Via Manzoni 12, Firenze', 'Nessuna patologia nota');

INSERT INTO doctors (name, email, phone, specialization, license_number, availability) VALUES
('Dr. Andrea Santini', 'andrea.santini@gestmed.com', '+39 333 111 2222', 'Cardiologia', 'LIC001234', '{"monday": "09:00-17:00", "tuesday": "09:00-17:00", "wednesday": "09:00-17:00", "thursday": "09:00-17:00", "friday": "09:00-15:00"}'),
('Dr.ssa Elena Ricci', 'elena.ricci@gestmed.com', '+39 333 222 3333', 'Pediatria', 'LIC002345', '{"monday": "08:00-16:00", "tuesday": "08:00-16:00", "wednesday": "08:00-16:00", "thursday": "08:00-16:00", "friday": "08:00-14:00"}'),
('Dr. Marco Lombardi', 'marco.lombardi@gestmed.com', '+39 333 333 4444', 'Ortopedia', 'LIC003456', '{"monday": "10:00-18:00", "tuesday": "10:00-18:00", "wednesday": "10:00-18:00", "thursday": "10:00-18:00", "friday": "10:00-16:00"}'),
('Dr.ssa Sofia Greco', 'sofia.greco@gestmed.com', '+39 333 444 5555', 'Dermatologia', 'LIC004567', '{"monday": "09:00-17:00", "tuesday": "09:00-17:00", "wednesday": "09:00-17:00", "thursday": "09:00-17:00", "friday": "09:00-15:00"}'),
('Dr. Luca Romano', 'luca.romano@gestmed.com', '+39 333 555 6666', 'Medicina Generale', 'LIC005678', '{"monday": "08:00-18:00", "tuesday": "08:00-18:00", "wednesday": "08:00-18:00", "thursday": "08:00-18:00", "friday": "08:00-16:00"}');

INSERT INTO appointments (patient_id, doctor_id, appointment_date, status, notes) VALUES
(1, 1, '2025-06-15 10:00:00', 'in_progress', 'Controllo cardiologico di routine'),
(2, 2, '2025-06-15 14:30:00', 'in_progress', 'Visita pediatrica per controllo crescita'),
(3, 5, '2025-06-16 09:15:00', 'scheduled', 'Controllo diabete e terapia'),
(4, 1, '2025-06-16 11:00:00', 'scheduled', 'Controllo pressione arteriosa'),
(5, 3, '2025-06-17 15:30:00', 'scheduled', 'Consulto ortopedico per dolore al ginocchio'),
(1, 5, '2025-06-18 16:00:00', 'scheduled', 'Visita generale di controllo'),
(2, 4, '2025-06-19 10:30:00', 'scheduled', 'Controllo dermatologico'),
(3, 1, '2025-06-20 08:45:00', 'scheduled', 'Follow-up cardiologico');

-- Insert sample appointment logs
INSERT INTO appointment_logs (appointment_id, title, description, created_at) VALUES
(1, 'Inizio visita', 'Paziente arrivato in orario. Pressione arteriosa rilevata: 120/80 mmHg', '2025-06-15 10:05:00'),
(1, 'ECG eseguito', 'Elettrocardiogramma eseguito con risultati nella norma', '2025-06-15 10:15:00'),
(2, 'Controllo peso e altezza', 'Peso: 25 kg, Altezza: 120 cm. Crescita regolare', '2025-06-15 14:35:00'),
(2, 'Vaccinazioni', 'Controllo calendario vaccinale - tutto in regola', '2025-06-15 14:45:00');

-- Grant permissions to the gestmed_user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO gestmed_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO gestmed_user;

-- Create user if not exists (this will run as the postgres superuser)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'gestmed_user') THEN
        CREATE USER gestmed_user WITH ENCRYPTED PASSWORD 'gestmed_password';
    END IF;
END
$$;

-- Grant privileges to the user
GRANT ALL PRIVILEGES ON DATABASE gestmed_appointments_db TO gestmed_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO gestmed_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO gestmed_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO gestmed_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO gestmed_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO gestmed_user;

-- Create services table
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INTEGER DEFAULT 30,
    price DECIMAL(10,2) DEFAULT 0.00,
    doctor_id INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL,
    doctor_id INTEGER NOT NULL,
    service_id INTEGER NOT NULL,
    code VARCHAR(8) NOT NULL UNIQUE,
    appointment_date TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_service ON appointments(service_id);
CREATE INDEX IF NOT EXISTS idx_services_doctor ON services(doctor_id);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active);

-- Funzione per generare un codice alfanumerico casuale
CREATE OR REPLACE FUNCTION generate_appointment_code() RETURNS VARCHAR(8) AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result VARCHAR(8) := '';
    i INTEGER;
BEGIN
    FOR i IN 1..8 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger function per generare automaticamente il codice
CREATE OR REPLACE FUNCTION set_appointment_code() RETURNS TRIGGER AS $$
DECLARE
    new_code VARCHAR(8);
    attempts INTEGER := 0;
    max_attempts INTEGER := 100;
BEGIN
    -- Genera un nuovo codice solo se non è già presente
    IF NEW.code IS NULL OR NEW.code = '' THEN
        LOOP
            new_code := generate_appointment_code();
            attempts := attempts + 1;
            
            -- Verifica che il codice sia univoco
            IF NOT EXISTS (SELECT 1 FROM appointments WHERE code = new_code) THEN
                NEW.code := new_code;
                EXIT;
            END IF;
            
            -- Evita loop infiniti
            IF attempts >= max_attempts THEN
                RAISE EXCEPTION 'Impossibile generare un codice univoco dopo % tentativi', max_attempts;
            END IF;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Applica il trigger per la generazione automatica del codice
DROP TRIGGER IF EXISTS appointment_code_trigger ON appointments;
CREATE TRIGGER appointment_code_trigger
    BEFORE INSERT ON appointments
    FOR EACH ROW EXECUTE FUNCTION set_appointment_code();

-- Insert sample services data
INSERT INTO services (name, description, duration_minutes, price, doctor_id) VALUES
-- Cardiologo (doctor_id = 1)
('Visita Cardiologica', 'Controllo cardiologico completo con ECG', 45, 120.00, 1),
('Ecocardiogramma', 'Ecografia del cuore per valutazione funzionale', 30, 80.00, 1),
('Controllo Pressione', 'Monitoraggio pressione arteriosa e terapia', 20, 40.00, 1),
('Follow-up Cardiologico', 'Controllo di routine per pazienti in terapia', 30, 60.00, 1),

-- Pediatra (doctor_id = 2)
('Visita Pediatrica', 'Controllo generale dello sviluppo del bambino', 30, 80.00, 2),
('Controllo Crescita', 'Valutazione peso, altezza e sviluppo', 20, 50.00, 2),
('Vaccinazioni', 'Somministrazione vaccini pediatrici', 15, 30.00, 2),
('Consulto Pediatrico', 'Consulenza per problemi specifici', 25, 70.00, 2),

-- Ortopedico (doctor_id = 3)
('Visita Ortopedica', 'Valutazione problemi muscolo-scheletrici', 40, 100.00, 3),
('Infiltrazione', 'Iniezione terapeutica articolare', 20, 150.00, 3),
('Controllo Post-Operatorio', 'Follow-up dopo intervento chirurgico', 30, 80.00, 3),
('Consulto Traumatologico', 'Valutazione traumi e lesioni', 35, 90.00, 3),

-- Dermatologo (doctor_id = 4)
('Visita Dermatologica', 'Controllo della pelle e nei', 30, 90.00, 4),
('Mappatura Nei', 'Controllo dermatoscopico completo', 45, 120.00, 4),
('Biopsia Cutanea', 'Prelievo tissutale per diagnosi', 25, 180.00, 4),
('Crioterapia', 'Trattamento con azoto liquido', 15, 60.00, 4),

-- Medico Generale (doctor_id = 5)
('Visita Generale', 'Controllo medico di routine', 30, 60.00, 5),
('Controllo Diabete', 'Monitoraggio glicemia e terapia', 25, 50.00, 5),
('Certificato Medico', 'Rilascio certificazioni mediche', 15, 25.00, 5),
('Prescrizione Farmaci', 'Rinnovo prescrizioni croniche', 10, 20.00, 5);

-- Insert sample data (i codici verranno generati automaticamente)
INSERT INTO appointments (patient_id, doctor_id, service_id, appointment_date, status, notes, code) VALUES
(1, 1, 1, '2025-06-15 10:00:00', 'in_progress', 'Controllo cardiologico di routine', 'AHUSX001'),
(2, 2, 5, '2025-06-15 14:30:00', 'in_progress', 'Visita pediatrica per controllo crescita', 'QRWTE002'),
(3, 5, 18, '2025-06-16 09:15:00', 'scheduled', 'Controllo diabete e terapia', 'MNBVC003'),
(4, 1, 3, '2025-06-16 11:00:00', 'scheduled', 'Controllo pressione arteriosa', 'ZXCVB004'),
(5, 3, 9, '2025-06-17 15:30:00', 'scheduled', 'Consulto ortopedico per dolore al ginocchio', 'POIUY005'),
(1, 5, 17, '2025-06-18 16:00:00', 'scheduled', 'Visita generale di controllo', 'LKJHG006'),
(2, 4, 13, '2025-06-19 10:30:00', 'scheduled', 'Controllo dermatologico', 'FDSAQ007'),
(3, 1, 4, '2025-06-20 08:45:00', 'scheduled', 'Follow-up cardiologico', 'WERTYU08');

-- Grant permissions to the gestmed_user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO gestmed_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO gestmed_user;

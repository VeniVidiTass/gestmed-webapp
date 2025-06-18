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

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL,
    doctor_id INTEGER NOT NULL,
    code VARCHAR(8) NOT NULL UNIQUE,
    appointment_date TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);

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

-- Insert sample data (i codici verranno generati automaticamente)
INSERT INTO appointments (patient_id, doctor_id, appointment_date, status, notes, code) VALUES
(1, 1, '2025-06-15 10:00:00', 'in_progress', 'Controllo cardiologico di routine', 'AHUSX001'),
(2, 2, '2025-06-15 14:30:00', 'in_progress', 'Visita pediatrica per controllo crescita', 'QRWTE002'),
(3, 5, '2025-06-16 09:15:00', 'scheduled', 'Controllo diabete e terapia', 'MNBVC003'),
(4, 1, '2025-06-16 11:00:00', 'scheduled', 'Controllo pressione arteriosa', 'ZXCVB004'),
(5, 3, '2025-06-17 15:30:00', 'scheduled', 'Consulto ortopedico per dolore al ginocchio', 'POIUY005'),
(1, 5, '2025-06-18 16:00:00', 'scheduled', 'Visita generale di controllo', 'LKJHG006'),
(2, 4, '2025-06-19 10:30:00', 'scheduled', 'Controllo dermatologico', 'FDSAQ007'),
(3, 1, '2025-06-20 08:45:00', 'scheduled', 'Follow-up cardiologico', 'WERTYU08');

-- Grant permissions to the gestmed_user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO gestmed_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO gestmed_user;

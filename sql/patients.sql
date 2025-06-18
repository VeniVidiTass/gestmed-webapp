-- Create user if not exists (this will run as the postgres superuser)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'gestmed_user') THEN
        CREATE USER gestmed_user WITH ENCRYPTED PASSWORD 'gestmed_password';
    END IF;
END
$$;

-- Grant privileges to the user
GRANT ALL PRIVILEGES ON DATABASE gestmed_patients_db TO gestmed_user;
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

-- create indexes for patients table
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);

-- Insert sample data
INSERT INTO patients (name, email, phone, date_of_birth, address, medical_history) VALUES
('Mario Rossi', 'mario.rossi@email.com', '+39 123 456 7890', '1980-05-15', 'Via Roma 123, Milano', 'Nessuna allergia nota'),
('Laura Bianchi', 'laura.bianchi@email.com', '+39 098 765 4321', '1975-08-22', 'Via Garibaldi 45, Roma', 'Allergia ai pollini'),
('Giuseppe Verdi', 'giuseppe.verdi@email.com', '+39 111 222 3333', '1990-12-10', 'Corso Italia 67, Napoli', 'Diabete tipo 2'),
('Anna Ferrari', 'anna.ferrari@email.com', '+39 444 555 6666', '1985-03-18', 'Via Dante 89, Torino', 'Ipertensione'),
('Francesco Conti', 'francesco.conti@email.com', '+39 777 888 9999', '1970-11-05', 'Via Manzoni 12, Firenze', 'Nessuna patologia nota');


-- Grant permissions to the gestmed_user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO gestmed_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO gestmed_user;

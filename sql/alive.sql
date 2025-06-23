-- Create user if not exists (this will run as the postgres superuser)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'gestmed_user') THEN
        CREATE USER gestmed_user WITH ENCRYPTED PASSWORD 'gestmed_password';
    END IF;
END
$$;

-- Grant privileges to the user
GRANT ALL PRIVILEGES ON DATABASE gestmed_alive_db TO gestmed_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO gestmed_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO gestmed_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO gestmed_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO gestmed_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO gestmed_user;

-- Create appointment logs table
CREATE TABLE IF NOT EXISTS alive_logs (
    id SERIAL PRIMARY KEY,
    appointment_id CHAR(24) NOT NULL,
    code VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_alive_logs_appointment ON alive_logs(appointment_id);
CREATE INDEX IF NOT EXISTS idx_alive_logs_code ON alive_logs(code);

-- Funzione per notificare i cambiamenti di dati
CREATE OR REPLACE FUNCTION notify_data_change() 
RETURNS TRIGGER AS $$
DECLARE
    notification_data JSON;
BEGIN
    -- Gestisce INSERT, UPDATE e DELETE
    IF TG_OP = 'DELETE' THEN
        notification_data := json_build_object(
            'table', TG_TABLE_NAME,
            'action', TG_OP,
            'data', row_to_json(OLD),
            'code', OLD.code
        );
        PERFORM pg_notify('data_changes', notification_data::text);
        RETURN OLD;
    ELSE
        notification_data := json_build_object(
            'table', TG_TABLE_NAME,
            'action', TG_OP,
            'data', row_to_json(NEW),
            'code', NEW.code
        );
        PERFORM pg_notify('data_changes', notification_data::text);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Applica il trigger alla tabella alive_logs per tutte le operazioni
DROP TRIGGER IF EXISTS alive_logs_notify_trigger ON alive_logs;
CREATE TRIGGER alive_logs_notify_trigger
    AFTER INSERT OR UPDATE OR DELETE ON alive_logs
    FOR EACH ROW EXECUTE PROCEDURE notify_data_change();

-- Insert sample data
INSERT INTO alive_logs (appointment_id, code, title, description, created_at) VALUES
(1, 'AHUSX001', 'Inizio visita', 'Paziente arrivato in orario. Pressione arteriosa rilevata: 120/80 mmHg', '2025-06-15 10:05:00'),
(1, 'AHUSX001', 'ECG eseguito', 'Elettrocardiogramma eseguito con risultati nella norma', '2025-06-15 10:15:00'),
(2, 'QRWTE002', 'Controllo peso e altezza', 'Peso: 25 kg, Altezza: 120 cm. Crescita regolare', '2025-06-15 14:35:00'),
(2, 'QRWTE002', 'Vaccinazioni', 'Controllo calendario vaccinale - tutto in regola', '2025-06-15 14:45:00');

-- Grant permissions to the gestmed_user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO gestmed_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO gestmed_user;

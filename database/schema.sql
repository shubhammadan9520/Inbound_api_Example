DROP TABLE IF EXISTS mappings CASCADE;
DROP TABLE IF EXISTS client_person CASCADE;
DROP TABLE IF EXISTS internal_person CASCADE;

-- Create mappings table
CREATE TABLE IF NOT EXISTS mappings (
    id SERIAL PRIMARY KEY,
    client_id VARCHAR(255) NOT NULL,
    internal_field VARCHAR(255) NOT NULL,
    client_field VARCHAR(255) NOT NULL,
    direction VARCHAR(50) NOT NULL CHECK (direction IN ('both', 'inbound', 'outbound')),
    transform VARCHAR(255),
    UNIQUE(client_id, internal_field, client_field)
);

-- Create client_person table with multiple fields
CREATE TABLE IF NOT EXISTS client_person (
    id SERIAL PRIMARY KEY,
    client_id VARCHAR(255) NOT NULL,
    personname VARCHAR(255) NOT NULL,
    age INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create internal_person table with mapped fields
CREATE TABLE IF NOT EXISTS internal_person (
    id SERIAL PRIMARY KEY,
    client_id VARCHAR(255) NOT NULL,
    person_name VARCHAR(255) NOT NULL,
    age INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data into client_person for testing
INSERT INTO client_person (client_id, personname, age) VALUES ('client1', 'John Doe', 30);
INSERT INTO client_person (client_id, personname, age) VALUES ('client2', 'Jane Smith', 25);
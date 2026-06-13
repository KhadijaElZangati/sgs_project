ALTER TABLE users ADD COLUMN IF NOT EXISTS subject VARCHAR(50);

CREATE TABLE IF NOT EXISTS teacher_assignments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(50) NOT NULL,
    niveau VARCHAR(10) NOT NULL,
    classe VARCHAR(50) NOT NULL,
    UNIQUE(user_id, niveau, classe)
);

CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(50) NOT NULL,
    niveau VARCHAR(10) NOT NULL,
    classe VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT,
    file_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exercises (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(50) NOT NULL,
    niveau VARCHAR(10) NOT NULL,
    classe VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT,
    file_url VARCHAR(255),
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

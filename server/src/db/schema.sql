-- Create database if not exists and use it
CREATE DATABASE IF NOT EXISTS roxiler_challenge;
USE roxiler_challenge;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(60) NOT NULL CHECK (CHAR_LENGTH(name) >= 20),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    address VARCHAR(400) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'user', 'owner')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Refresh Tokens Table (For secure JWT rotation and revocation)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    ip VARCHAR(45) NOT NULL,
    user_agent VARCHAR(500) NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Index for token lookup performance
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);

-- 3. Ratings Table
CREATE TABLE IF NOT EXISTS ratings (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    store_id VARCHAR(36) NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_text VARCHAR(400),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Index for store rating lookups
CREATE INDEX idx_ratings_store_id ON ratings(store_id);

-- Seed default Admin user (email: Admin@gmail.com, password: Admin@123)
INSERT INTO users (id, name, email, password, address, role)
VALUES (
    'da67c9c0-992a-4a2c-905b-8e50bc781111',
    'System Administrator Account',
    'Admin@gmail.com',
    '$2b$12$2wUYd4tfnmyYc9ssKIfl3eoBfwd8IZRUP9KZUjat5.XPYgKwlJf7W',
    'Roxiler Office, System Server Room',
    'admin'
)
ON DUPLICATE KEY UPDATE id=id;

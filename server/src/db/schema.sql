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

-- Seed 5 Stores (email: store1-5@gmail.com, password: Admin@123)
INSERT INTO users (id, name, email, password, address, role)
VALUES 
(
    'da67c9c0-992a-4a2c-905b-8e50bc782222',
    'Roxiler Electronics Store Hub',
    'store1@gmail.com',
    '$2b$12$2wUYd4tfnmyYc9ssKIfl3eoBfwd8IZRUP9KZUjat5.XPYgKwlJf7W',
    '101 Tech Gadget Avenue, Tech Hub District',
    'owner'
),
(
    'da67c9c0-992a-4a2c-905b-8e50bc783333',
    'Roxiler Fashion Boutique Hub',
    'store2@gmail.com',
    '$2b$12$2wUYd4tfnmyYc9ssKIfl3eoBfwd8IZRUP9KZUjat5.XPYgKwlJf7W',
    '202 Style Boulevard, Fashion Plaza',
    'owner'
),
(
    'da67c9c0-992a-4a2c-905b-8e50bc784444',
    'Roxiler Organic Groceries Market',
    'store3@gmail.com',
    '$2b$12$2wUYd4tfnmyYc9ssKIfl3eoBfwd8IZRUP9KZUjat5.XPYgKwlJf7W',
    '303 Green Valley Road, Farm Fresh District',
    'owner'
),
(
    'da67c9c0-992a-4a2c-905b-8e50bc787777',
    'Roxiler Home & Living Decor Outlet',
    'store4@gmail.com',
    '$2b$12$2wUYd4tfnmyYc9ssKIfl3eoBfwd8IZRUP9KZUjat5.XPYgKwlJf7W',
    '404 Cozy Nest Boulevard, Interior Hub',
    'owner'
),
(
    'da67c9c0-992a-4a2c-905b-8e50bc788888',
    'Roxiler Fitness & Sports Center',
    'store5@gmail.com',
    '$2b$12$2wUYd4tfnmyYc9ssKIfl3eoBfwd8IZRUP9KZUjat5.XPYgKwlJf7W',
    '505 Active Lifestyle Road, Sports Complex',
    'owner'
)
ON DUPLICATE KEY UPDATE id=id;

-- Seed 5 Normal Users (email: user1-5@gmail.com, password: Admin@123)
INSERT INTO users (id, name, email, password, address, role)
VALUES 
(
    'da67c9c0-992a-4a2c-905b-8e50bc785555',
    'Johnathan Doe Customer Account',
    'user1@gmail.com',
    '$2b$12$2wUYd4tfnmyYc9ssKIfl3eoBfwd8IZRUP9KZUjat5.XPYgKwlJf7W',
    '303 Customer Lane, Residential Block A',
    'user'
),
(
    'da67c9c0-992a-4a2c-905b-8e50bc786666',
    'Jane Smith Customer Account',
    'user2@gmail.com',
    '$2b$12$2wUYd4tfnmyYc9ssKIfl3eoBfwd8IZRUP9KZUjat5.XPYgKwlJf7W',
    '404 Shopper Road, Residential Block B',
    'user'
),
(
    'da67c9c0-992a-4a2c-905b-8e50bc789999',
    'Robert Johnson Customer Account',
    'user3@gmail.com',
    '$2b$12$2wUYd4tfnmyYc9ssKIfl3eoBfwd8IZRUP9KZUjat5.XPYgKwlJf7W',
    '505 Buyer Street, Residential Block C',
    'user'
),
(
    'da67c9c0-992a-4a2c-905b-8e50bc78aaaa',
    'Emily Williams Customer Account',
    'user4@gmail.com',
    '$2b$12$2wUYd4tfnmyYc9ssKIfl3eoBfwd8IZRUP9KZUjat5.XPYgKwlJf7W',
    '606 Retail Way, Residential Block D',
    'user'
),
(
    'da67c9c0-992a-4a2c-905b-8e50bc78bbbb',
    'Michael Brown Customer Account',
    'user5@gmail.com',
    '$2b$12$2wUYd4tfnmyYc9ssKIfl3eoBfwd8IZRUP9KZUjat5.XPYgKwlJf7W',
    '707 Plaza Boulevard, Residential Block E',
    'user'
)
ON DUPLICATE KEY UPDATE id=id;

-- Seed Some Initial Ratings & Reviews
INSERT INTO ratings (id, user_id, store_id, rating, review_text)
VALUES 
(
    'e081c7e9-4ea0-4c74-9519-7e3f4a331111',
    'da67c9c0-992a-4a2c-905b-8e50bc785555', -- user1
    'da67c9c0-992a-4a2c-905b-8e50bc782222', -- store1
    5,
    'Excellent customer service! The store manager helped me pick the best hardware components. Highly recommended!'
),
(
    'e081c7e9-4ea0-4c74-9519-7e3f4a332222',
    'da67c9c0-992a-4a2c-905b-8e50bc786666', -- user2
    'da67c9c0-992a-4a2c-905b-8e50bc782222', -- store1
    3,
    'Decent items but shipping took longer than expected.'
),
(
    'e081c7e9-4ea0-4c74-9519-7e3f4a333333',
    'da67c9c0-992a-4a2c-905b-8e50bc785555', -- user1
    'da67c9c0-992a-4a2c-905b-8e50bc783333', -- store2
    4,
    'Fantastic clothing selection! Clean store layout and very polite staff.'
),
(
    'e081c7e9-4ea0-4c74-9519-7e3f4a334444',
    'da67c9c0-992a-4a2c-905b-8e50bc789999', -- user3
    'da67c9c0-992a-4a2c-905b-8e50bc783333', -- store2
    5,
    'Exceptional service and beautiful collection!'
)
ON DUPLICATE KEY UPDATE id=id;

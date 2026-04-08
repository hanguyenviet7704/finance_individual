-- V3__add_password_hash.sql
ALTER TABLE accounts
    ADD COLUMN password_hash VARCHAR(255) NOT NULL DEFAULT '' AFTER role;

-- Set password for existing demo accounts
-- FIN0000000000001 (customer) -> password123
-- FIN0000000000002 (admin)    -> admin123
UPDATE accounts
SET password_hash = '$2b$10$rt/K0BUF3HnyBWrCk9krsOB1AvSnHiykTrnWz1ZpON.pF2BQ7XYkG'
WHERE account_number = 'FIN0000000000001';

UPDATE accounts
SET password_hash = '$2b$10$Km1wejzASSEUcq9fw4G2cudYiJA1S5wDdr4ni7amM5eqzulgSAcji'
WHERE account_number = 'FIN0000000000002';

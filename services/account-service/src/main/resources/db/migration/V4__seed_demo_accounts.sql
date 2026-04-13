-- V4__seed_demo_accounts.sql
-- Demo accounts for development/testing
-- FIN0000000000001 (customer) -> password123
-- FIN0000000000002 (admin)    -> admin123

INSERT INTO accounts (
    id, user_id, account_number, account_type,
    balance, available_balance, currency, status,
    daily_limit, daily_used, kyc_status, role,
    full_name, email, phone, password_hash,
    created_at, updated_at, version
) VALUES
(
    'aaaaaaaa-0000-0000-0000-000000000001',
    'bbbbbbbb-0000-0000-0000-000000000001',
    'FIN0000000000001', 'CHECKING',
    10000000.00, 10000000.00, 'VND', 'ACTIVE',
    50000000.00, 0.00, 'VERIFIED', 'CUSTOMER',
    'Nguyen Van A', 'customer@demo.com', '0901234567',
    '$2b$10$rt/K0BUF3HnyBWrCk9krsOB1AvSnHiykTrnWz1ZpON.pF2BQ7XYkG',
    NOW(6), NOW(6), 0
),
(
    'aaaaaaaa-0000-0000-0000-000000000002',
    'bbbbbbbb-0000-0000-0000-000000000002',
    'FIN0000000000002', 'CHECKING',
    50000000.00, 50000000.00, 'VND', 'ACTIVE',
    100000000.00, 0.00, 'VERIFIED', 'ADMIN',
    'Admin User', 'admin@demo.com', '0987654321',
    '$2b$10$Km1wejzASSEUcq9fw4G2cudYiJA1S5wDdr4ni7amM5eqzulgSAcji',
    NOW(6), NOW(6), 0
);

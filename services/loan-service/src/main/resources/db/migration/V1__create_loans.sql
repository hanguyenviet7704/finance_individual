CREATE TABLE IF NOT EXISTS loans (
    id                CHAR(36)       NOT NULL PRIMARY KEY,
    loan_code         VARCHAR(30)    NOT NULL,
    user_id           CHAR(36)       NOT NULL,
    account_id        CHAR(36)       NOT NULL,
    status            VARCHAR(30)    NOT NULL DEFAULT 'PENDING',
    loan_type         VARCHAR(30)    NOT NULL,
    requested_amount  DECIMAL(18,2)  NOT NULL,
    approved_amount   DECIMAL(18,2),
    disbursed_amount  DECIMAL(18,2)  NOT NULL DEFAULT 0.00,
    outstanding_amount DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    interest_rate     DECIMAL(5,2),
    term_months       INT,
    purpose           VARCHAR(200),
    credit_score      INT,
    credit_grade      VARCHAR(5),
    mongo_doc_id      VARCHAR(50),
    approved_by       CHAR(36),
    approved_at       DATETIME(6),
    disbursed_at      DATETIME(6),
    due_date          DATE,
    created_at        DATETIME(6),
    updated_at        DATETIME(6),
    version           INT            NOT NULL DEFAULT 0,
    CONSTRAINT uk_loans_code UNIQUE (loan_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_loans_user   ON loans (user_id);
CREATE INDEX idx_loans_status ON loans (status);

CREATE TABLE IF NOT EXISTS transactions (
    id               CHAR(36)       NOT NULL PRIMARY KEY,
    reference_no     VARCHAR(30)    NOT NULL,
    from_account_id  CHAR(36)       NOT NULL,
    to_account_id    CHAR(36)       NOT NULL,
    amount           DECIMAL(18,2)  NOT NULL,
    fee              DECIMAL(18,2)  NOT NULL DEFAULT 0.00,
    currency         CHAR(3)        NOT NULL DEFAULT 'VND',
    type             VARCHAR(30)    NOT NULL,
    status           VARCHAR(20)    NOT NULL DEFAULT 'PENDING',
    description      TEXT,
    metadata         TEXT,
    idempotency_key  CHAR(36),
    fraud_score      DECIMAL(5,2),
    fraud_decision   VARCHAR(20),
    initiated_by     CHAR(36)       NOT NULL,
    ip_address       VARCHAR(45),
    device_id        VARCHAR(255),
    otp_verified     TINYINT(1)     NOT NULL DEFAULT 0,
    completed_at     DATETIME(6),
    created_at       DATETIME(6),
    updated_at       DATETIME(6),
    version          INT            NOT NULL DEFAULT 0,
    CONSTRAINT uk_transactions_ref         UNIQUE (reference_no),
    CONSTRAINT uk_transactions_idempotency UNIQUE (idempotency_key),
    CONSTRAINT chk_tx_type   CHECK (type IN ('TRANSFER','TOPUP','WITHDRAW','PAYMENT','REFUND')),
    CONSTRAINT chk_tx_status CHECK (status IN ('PENDING','PROCESSING','COMPLETED','FAILED','CANCELLED','REVERSED')),
    CONSTRAINT chk_tx_amount CHECK (amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_tx_from_account ON transactions (from_account_id, created_at);
CREATE INDEX idx_tx_to_account   ON transactions (to_account_id, created_at);
CREATE INDEX idx_tx_status       ON transactions (status);
CREATE INDEX idx_tx_reference    ON transactions (reference_no);

CREATE TABLE IF NOT EXISTS fraud_history (
    id               CHAR(36)       NOT NULL PRIMARY KEY,
    transaction_id   CHAR(36)       NOT NULL,
    user_id          CHAR(36)       NOT NULL,
    amount           DECIMAL(18,2),
    rule_score       DECIMAL(5,2),
    total_score      DECIMAL(5,2),
    decision         VARCHAR(20)    NOT NULL,
    triggered_rules  TEXT,
    ip_address       VARCHAR(45),
    device_id        VARCHAR(255),
    created_at       DATETIME(6),
    CONSTRAINT chk_fraud_decision CHECK (decision IN ('ALLOW','REVIEW','BLOCK'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_fraud_user ON fraud_history (user_id, created_at);
CREATE INDEX idx_fraud_tx   ON fraud_history (transaction_id);
CREATE INDEX idx_fraud_dec  ON fraud_history (decision, created_at);

-- V1__create_accounts.sql
CREATE TABLE IF NOT EXISTS accounts (
    id               CHAR(36)       NOT NULL PRIMARY KEY,
    user_id          CHAR(36)       NOT NULL,
    account_number   VARCHAR(20)    NOT NULL,
    account_type     VARCHAR(20)    NOT NULL,
    balance          DECIMAL(18,2)  NOT NULL DEFAULT 0.00,
    available_balance DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    currency         CHAR(3)        NOT NULL DEFAULT 'VND',
    status           VARCHAR(20)    NOT NULL DEFAULT 'ACTIVE',
    daily_limit      DECIMAL(18,2)  NOT NULL DEFAULT 50000000.00,
    daily_used       DECIMAL(18,2)  NOT NULL DEFAULT 0.00,
    kyc_status       VARCHAR(20)    NOT NULL DEFAULT 'PENDING',
    full_name        VARCHAR(100)   NOT NULL,
    email            VARCHAR(100),
    phone            VARCHAR(20),
    created_at       DATETIME(6),
    updated_at       DATETIME(6),
    version          INT            NOT NULL DEFAULT 0,
    CONSTRAINT uk_accounts_user_id       UNIQUE (user_id),
    CONSTRAINT uk_accounts_number        UNIQUE (account_number),
    CONSTRAINT chk_accounts_type         CHECK (account_type IN ('SAVING','CHECKING','LOAN')),
    CONSTRAINT chk_accounts_status       CHECK (status IN ('ACTIVE','FROZEN','CLOSED')),
    CONSTRAINT chk_accounts_kyc          CHECK (kyc_status IN ('PENDING','SUBMITTED','VERIFIED','REJECTED')),
    CONSTRAINT chk_accounts_balance      CHECK (balance >= 0),
    CONSTRAINT chk_accounts_avail        CHECK (available_balance >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_accounts_user_id ON accounts (user_id);
CREATE INDEX idx_accounts_number  ON accounts (account_number);
CREATE INDEX idx_accounts_status  ON accounts (status);

CREATE TABLE IF NOT EXISTS kyc_documents (
    id               CHAR(36)       NOT NULL PRIMARY KEY,
    account_id       CHAR(36)       NOT NULL,
    document_type    VARCHAR(30)    NOT NULL,
    file_path        VARCHAR(500)   NOT NULL,
    status           VARCHAR(20)    NOT NULL DEFAULT 'PENDING',
    rejection_reason TEXT,
    reviewed_by      CHAR(36),
    reviewed_at      DATETIME(6),
    created_at       DATETIME(6),
    CONSTRAINT fk_kyc_account FOREIGN KEY (account_id) REFERENCES accounts(id),
    CONSTRAINT chk_kyc_type   CHECK (document_type IN ('CCCD','PASSPORT','INCOME_PROOF','COLLATERAL')),
    CONSTRAINT chk_kyc_status CHECK (status IN ('PENDING','SUBMITTED','VERIFIED','REJECTED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_kyc_account_id ON kyc_documents (account_id);

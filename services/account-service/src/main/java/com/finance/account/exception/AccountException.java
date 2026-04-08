package com.finance.account.exception;

import org.springframework.http.HttpStatus;

public class AccountException extends RuntimeException {

    private final HttpStatus status;
    private final String code;

    public AccountException(String message, HttpStatus status, String code) {
        super(message);
        this.status = status;
        this.code = code;
    }

    public HttpStatus getStatus() { return status; }
    public String getCode() { return code; }

    public static AccountException notFound(String accountId) {
        return new AccountException("Account not found: " + accountId,
            HttpStatus.NOT_FOUND, "ACCOUNT_NOT_FOUND");
    }

    public static AccountException alreadyExists(String userId) {
        return new AccountException("Account already exists for user: " + userId,
            HttpStatus.CONFLICT, "ACCOUNT_ALREADY_EXISTS");
    }

    public static AccountException frozen(String accountId) {
        return new AccountException("Account is frozen: " + accountId,
            HttpStatus.FORBIDDEN, "ACCOUNT_FROZEN");
    }

    public static AccountException insufficientBalance() {
        return new AccountException("Insufficient balance",
            HttpStatus.UNPROCESSABLE_ENTITY, "INSUFFICIENT_BALANCE");
    }

    public static AccountException dailyLimitExceeded() {
        return new AccountException("Daily transaction limit exceeded",
            HttpStatus.UNPROCESSABLE_ENTITY, "DAILY_LIMIT_EXCEEDED");
    }
}

package com.finance.loan.exception;

import org.springframework.http.HttpStatus;

public class LoanException extends RuntimeException {
    private final HttpStatus status;
    private final String code;

    public LoanException(String message, HttpStatus status, String code) {
        super(message);
        this.status = status;
        this.code = code;
    }

    public HttpStatus getStatus() { return status; }
    public String getCode() { return code; }

    public static LoanException notFound(String id) {
        return new LoanException("Loan not found: " + id, HttpStatus.NOT_FOUND, "LOAN_NOT_FOUND");
    }
}

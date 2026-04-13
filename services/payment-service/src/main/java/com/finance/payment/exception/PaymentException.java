package com.finance.payment.exception;

import org.springframework.http.HttpStatus;

public class PaymentException extends RuntimeException {
    private final HttpStatus status;
    private final String code;

    public PaymentException(String message, HttpStatus status, String code) {
        super(message);
        this.status = status;
        this.code = code;
    }

    public HttpStatus getStatus() { return status; }
    public String getCode() { return code; }

    public static PaymentException notFound(String id) {
        return new PaymentException("Transaction not found: " + id, HttpStatus.NOT_FOUND, "TRANSACTION_NOT_FOUND");
    }
}

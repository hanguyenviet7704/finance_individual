package com.finance.loan.dto;

import com.finance.loan.domain.mysql.Loan;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Schema(description = "Request nộp đơn xin vay")
public class ApplyLoanRequest {

    @NotNull
    @Schema(description = "Loại vay", example = "PERSONAL", allowableValues = {"PERSONAL", "VEHICLE", "MORTGAGE", "BUSINESS", "EDUCATION"})
    private Loan.LoanType loanType;

    @NotNull
    @DecimalMin(value = "1000000", message = "Minimum loan amount is 1,000,000 VND")
    @Schema(description = "Số tiền vay (VND)", example = "100000000", minimum = "1000000")
    private BigDecimal amount;

    @NotNull
    @Min(value = 3, message = "Minimum term is 3 months")
    @Max(value = 360, message = "Maximum term is 360 months")
    @Schema(description = "Thời hạn vay (tháng)", example = "24", minimum = "3", maximum = "360")
    private Integer termMonths;

    @Schema(description = "Mục đích vay", example = "Mua xe ô tô")
    private String purpose;
}

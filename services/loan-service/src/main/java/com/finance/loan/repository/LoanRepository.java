package com.finance.loan.repository;

import com.finance.loan.domain.mysql.Loan;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LoanRepository extends JpaRepository<Loan, UUID> {
    Page<Loan> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);
    List<Loan> findByUserIdAndStatus(UUID userId, Loan.LoanStatus status);
    boolean existsByLoanCode(String loanCode);
}

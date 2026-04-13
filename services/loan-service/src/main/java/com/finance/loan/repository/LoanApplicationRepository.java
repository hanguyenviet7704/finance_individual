package com.finance.loan.repository;

import com.finance.loan.domain.mongo.LoanApplication;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LoanApplicationRepository extends MongoRepository<LoanApplication, String> {
    Optional<LoanApplication> findByLoanId(String loanId);
    Optional<LoanApplication> findByLoanCode(String loanCode);
}

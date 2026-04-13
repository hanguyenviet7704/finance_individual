package com.finance.fraud.repository;

import com.finance.fraud.domain.FraudHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface FraudHistoryRepository extends JpaRepository<FraudHistory, UUID> {
    Page<FraudHistory> findByUserId(UUID userId, Pageable pageable);
    Page<FraudHistory> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);
    Optional<FraudHistory> findByTransactionId(UUID transactionId);
    long countByUserIdAndDecision(UUID userId, FraudHistory.FraudDecision decision);
}

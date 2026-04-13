package com.finance.report.repository;

import com.finance.report.domain.mongo.TransactionReadModel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TransactionReadModelRepository extends MongoRepository<TransactionReadModel, String> {

    Page<TransactionReadModel> findByAccountIdAndTransactionDateBetweenOrderByTransactionDateDesc(
        String accountId, LocalDateTime from, LocalDateTime to, Pageable pageable);

    @Query("{ 'accountId': ?0, 'transactionDate': { $gte: ?1, $lte: ?2 } }")
    List<TransactionReadModel> findForStatement(String accountId, LocalDateTime from, LocalDateTime to);

    @Query(value = "{ 'accountId': ?0, 'direction': 'DEBIT', 'transactionDate': { $gte: ?1, $lte: ?2 } }",
           fields = "{ 'amount': 1, 'type': 1 }")
    List<TransactionReadModel> findDebitsForSummary(String accountId, LocalDateTime from, LocalDateTime to);
}

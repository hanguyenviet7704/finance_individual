package com.finance.report.service;

import com.finance.report.domain.mongo.TransactionReadModel;
import com.finance.report.repository.TransactionReadModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReportService {

    private final TransactionReadModelRepository readModelRepository;

    // Kafka Consumer: build read model từ payment events (CQRS pattern)
    @KafkaListener(topics = "payment.completed", groupId = "report-service-cqrs")
    public void buildReadModel(Map<String, Object> event) {
        try {
            Map<String, Object> payload = (Map<String, Object>) event.get("payload");
            if (payload == null) return;

            String transactionId = (String) payload.get("transactionId");
            String fromAccountId = (String) payload.get("fromAccountId");
            String toAccountId   = (String) payload.get("toAccountId");
            BigDecimal amount    = new BigDecimal(payload.get("amount").toString());
            String referenceNo   = (String) payload.get("referenceNo");
            String category      = (String) payload.get("category");
            String type          = (String) payload.get("type");
            if (type == null) type = "TRANSFER";

            // Tạo 2 entries: DEBIT cho fromAccount và CREDIT cho toAccount
            TransactionReadModel debit = TransactionReadModel.builder()
                .transactionId(transactionId)
                .accountId(fromAccountId)
                .direction("DEBIT")
                .referenceNo(referenceNo)
                .amount(amount)
                .currency("VND")
                .type(type)
                .category(category)
                .status("COMPLETED")
                .counterpartyAccountId(toAccountId)
                .transactionDate(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .build();

            TransactionReadModel credit = TransactionReadModel.builder()
                .transactionId(transactionId)
                .accountId(toAccountId)
                .direction("CREDIT")
                .referenceNo(referenceNo)
                .amount(amount)
                .currency("VND")
                .type(type)
                .category(category)
                .status("COMPLETED")
                .counterpartyAccountId(fromAccountId)
                .transactionDate(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .build();

            readModelRepository.saveAll(List.of(debit, credit));
            log.info("Read model built for transaction: {}", transactionId);

        } catch (Exception e) {
            log.error("Error building read model: {}", e.getMessage(), e);
        }
    }

    public Page<TransactionReadModel> getStatement(String accountId,
            LocalDateTime from, LocalDateTime to, Pageable pageable) {
        return readModelRepository
            .findByAccountIdAndTransactionDateBetweenOrderByTransactionDateDesc(
                accountId, from, to, pageable);
    }

    public Map<String, Object> getMonthlySummary(String accountId, int year, int month) {
        LocalDateTime from = LocalDateTime.of(year, month, 1, 0, 0);
        LocalDateTime to   = from.plusMonths(1);

        List<TransactionReadModel> transactions = readModelRepository
            .findForStatement(accountId, from, to);

        BigDecimal totalDebit  = transactions.stream()
            .filter(t -> "DEBIT".equals(t.getDirection()))
            .map(TransactionReadModel::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalCredit = transactions.stream()
            .filter(t -> "CREDIT".equals(t.getDirection()))
            .map(TransactionReadModel::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        return Map.of(
            "accountId", accountId,
            "year", year,
            "month", month,
            "totalDebit",  totalDebit,
            "totalCredit", totalCredit,
            "netChange",   totalCredit.subtract(totalDebit),
            "transactionCount", transactions.size()
        );
    }
}

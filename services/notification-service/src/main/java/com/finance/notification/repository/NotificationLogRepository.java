package com.finance.notification.repository;

import com.finance.notification.domain.NotificationLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationLogRepository extends MongoRepository<NotificationLog, String> {
    Page<NotificationLog> findByUserId(String userId, Pageable pageable);
    Page<NotificationLog> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);
    List<NotificationLog> findByTransactionId(String transactionId);
    Page<NotificationLog> findByTransactionId(String transactionId, Pageable pageable);
    Page<NotificationLog> findByStatus(NotificationLog.NotificationStatus status, Pageable pageable);
    Page<NotificationLog> findByChannel(String channel, Pageable pageable);
    List<NotificationLog> findByStatusIn(List<NotificationLog.NotificationStatus> statuses);
}

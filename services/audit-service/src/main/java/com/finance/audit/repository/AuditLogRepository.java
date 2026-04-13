package com.finance.audit.repository;

import com.finance.audit.domain.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface AuditLogRepository extends MongoRepository<AuditLog, String> {

    Page<AuditLog> findAllByOrderByTimestampDesc(Pageable pageable);

    Page<AuditLog> findByActorIdOrderByTimestampDesc(String actorId, Pageable pageable);

    Page<AuditLog> findByResourceIdOrderByTimestampDesc(String resourceId, Pageable pageable);

    Page<AuditLog> findByServiceNameAndTimestampBetweenOrderByTimestampDesc(
        String serviceName, LocalDateTime from, LocalDateTime to, Pageable pageable);

    @Query("{ 'action': ?0, 'timestamp': { $gte: ?1, $lte: ?2 } }")
    Page<AuditLog> findByActionAndTimestampBetween(
        String action, LocalDateTime from, LocalDateTime to, Pageable pageable);
}

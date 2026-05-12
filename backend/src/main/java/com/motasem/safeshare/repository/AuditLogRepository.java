package com.motasem.safeshare.repository;

import com.motasem.safeshare.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Integer> {
    // Fetch logs for a specific group, newest first
    List<AuditLog> findAllByGroupIdOrderByTimestampDesc(Integer groupId);
    // Fetch the 5 most recent global actions across specific groups
    java.util.List<AuditLog> findTop5ByGroupIdInOrderByTimestampDesc(java.util.Collection<Integer> groupIds);

    void deleteAllByGroupId(Integer groupId);
}
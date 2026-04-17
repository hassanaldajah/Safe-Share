package com.motasem.safeshare.services;

import com.motasem.safeshare.model.AuditLog;
import com.motasem.safeshare.model.GroupEntity;
import com.motasem.safeshare.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public void logEvent(GroupEntity group, String actorName, String action, String targetName, String severity) {
        AuditLog log = AuditLog.builder()
                .group(group)
                .actorName(actorName)
                .action(action)
                .targetName(targetName)
                .severity(severity)
                .timestamp(LocalDateTime.now())
                .build();

        auditLogRepository.save(log);
    }
}
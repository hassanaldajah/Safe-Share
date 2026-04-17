package com.motasem.safeshare.controller;

import com.motasem.safeshare.model.User;
import com.motasem.safeshare.repository.AuditLogRepository;
import com.motasem.safeshare.repository.GroupMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/activity")
@RequiredArgsConstructor
public class ActivityController {

    private final AuditLogRepository auditLogRepository;
    private final GroupMemberRepository groupMemberRepository;

    @GetMapping("/recent")
    public ResponseEntity<?> getRecentActivity(@AuthenticationPrincipal User currentUser) {
        // 1. Find all groups this user belongs to
        List<Integer> myGroupIds = groupMemberRepository.findAllByUser(currentUser)
                .stream()
                .map(member -> member.getGroup().getId())
                .toList();

        if (myGroupIds.isEmpty()) {
            return ResponseEntity.ok(List.of()); // Return empty list if no groups
        }

        // 2. Fetch the 5 most recent logs across those groups
        var recentLogs = auditLogRepository.findTop5ByGroupIdInOrderByTimestampDesc(myGroupIds);

        // 3. Format it beautifully for React
        var responseList = recentLogs.stream().map(log -> {

            // Calculate "Time Ago"
            long minutes = Duration.between(log.getTimestamp(), LocalDateTime.now()).toMinutes();
            String timeAgo = minutes < 60 ? minutes + " min ago" :
                    minutes < 1440 ? (minutes / 60) + " hours ago" :
                            (minutes / 1440) + " days ago";

            return Map.of(
                    "id", log.getId().toString(),
                    "user", log.getActorName(),
                    "action", log.getAction().toLowerCase(), // e.g., "created", "shared"
                    "target", log.getTargetName(),
                    "timeAgo", timeAgo
            );
        }).toList();

        return ResponseEntity.ok(responseList);
    }
}
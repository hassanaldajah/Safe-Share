package com.motasem.safeshare.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "group_id")
    private GroupEntity group;

    private String actorName;   // The person who did the action (e.g., "Alex Rivera")
    private String action;      // The verb (e.g., "UPLOADED", "DOWNLOADED", "JOINED")
    private String targetName;  // What was affected (e.g., "Project.pdf" or "Marketing Team")
    private String severity;    // "info", "warn", or "critical"

    private LocalDateTime timestamp;
}
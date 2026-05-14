package com.motasem.safeshare.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "backup_jobs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BackupJob {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    
    private String type; // e.g. "full", "incremental"
    
    private String status; // e.g. "completed", "in-progress", "failed"
    
    private LocalDateTime startTime;
    
    private LocalDateTime endTime;
    
    private String size;
    
    private Integer filesCount;
    
    private Boolean includesTrash;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
}

package com.motasem.safeshare.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "file_shares")
public class FileShare {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // The file being shared
    @ManyToOne
    @JoinColumn(name = "file_id", nullable = false)
    private FileEntity file;

    // The user who is receiving the file
    @ManyToOne
    @JoinColumn(name = "shared_with_user_id", nullable = false)
    private User sharedWith;

    // The AES key, re-encrypted with the RECEIVER'S Public RSA Key
    @Column(columnDefinition = "TEXT", nullable = false)
    private String receiverEncryptedKey;

    // Optional expiration tracking (matching your React UI!)
    private LocalDateTime expiresAt;
    private Integer maxDownloads;
    private Integer currentDownloads;

    @Column(nullable = false, updatable = false)
    private LocalDateTime sharedAt;

    @PrePersist
    protected void onCreate() {
        this.sharedAt = LocalDateTime.now();
        if (this.currentDownloads == null) {
            this.currentDownloads = 0;
        }
    }
}
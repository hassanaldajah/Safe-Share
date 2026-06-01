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
@Table(name = "secure_files")
public class FileEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private String originalName;

    @Column(nullable = false)
    private String fileType; // e.g., "document", "image", "video"

    private Long sizeBytes;

    private Boolean compressed;

    private String virusScanStatus; // "clean", "infected"

    // --- ZERO-KNOWLEDGE CRYPTOGRAPHY DATA ---

    @Column(nullable = false, columnDefinition = "TEXT")
    private String encryptedFileKey; // The AES lock, safely locked inside the User's RSA Public Key

    @Column(nullable = false)
    private String iv; // The Initialization Vector used by the frontend for AES-GCM

    // --- STORAGE ---

    @Column(nullable = false)
    private String filePath; // The path where we save the scrambled bytes on the server's hard drive
    
    @ManyToOne
    @JoinColumn(name = "group_id")
    private GroupEntity group; // If null, it's a private file. If set, it's a group file.

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "folder_id")
    private FolderEntity parentFolder;

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false; // Soft delete flag

    @Builder.Default
    private Boolean isBackup = false; // Deduplication backup flag

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User owner; // Links the file securely to the user who uploaded it

    @Column(nullable = false, updatable = false)
    private LocalDateTime uploadedAt;

    @Column(name = "max_downloads")
    private Integer maxDownloads;

    @Column(name = "current_downloads")
    private Integer currentDownloads = 0;

    @Column(name = "max_views")
    private Integer maxViews;

    @Column(name = "current_views")
    private Integer currentViews = 0;

    @PrePersist
    protected void onCreate() {
        uploadedAt = LocalDateTime.now();
    }

    @OneToMany(mappedBy = "file", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<FileVersion> versions;

    @OneToMany(mappedBy = "file", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<FileShare> shares;
}
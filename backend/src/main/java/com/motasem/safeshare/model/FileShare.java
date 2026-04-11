package com.motasem.safeshare.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class FileShare {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "file_id", nullable = false)
    private FileEntity file; // The file being shared

    @ManyToOne
    @JoinColumn(name = "shared_with_id", nullable = false)
    private User sharedWith; // The recipient (found via searchTag)

    @Column(columnDefinition = "TEXT", nullable = false)
    private String encryptedKey; // The AES key encrypted with the recipient's Public Key

    @Column(nullable = false)
    private String sharedBy; // The searchTag of the person who shared it
    @Column(nullable = true)
    private Integer maxViews;

    @Column(nullable = true)
    private Integer maxDownloads;

    @Column(nullable = false)
    private Boolean canReshare = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private User owner;
}
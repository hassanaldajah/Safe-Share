package com.motasem.safeshare.controller;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class FileResponse {
    private Integer id;
    private String name;
    private String fileType;
    private Long sizeBytes;
    private Boolean compressed;
    private String virusScan;
    private LocalDateTime uploadedAt;

    // We send these back so React can decrypt the file later!
    private String encryptedFileKey;
    private String iv;
    private Integer folderId;
}